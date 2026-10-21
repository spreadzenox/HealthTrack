package com.healthtrack.app;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.healthtrack.app.update.UpdateFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;

/**
 * Mise à jour en un clic (signalement du 20/10 19:05 : « bloqué sur Téléchargement… »). L'ancien chemin chargeait
 * l'APK entier (33,6 Mo depuis la v180) en mémoire, le passait en base64 au WebView puis le renvoyait au natif pour
 * l'écrire : aucune progression, aucun délai, et sur 4G il pouvait ne jamais aboutir. Ici le téléchargement est
 * confié au DownloadManager d'Android : il suit les redirections GitHub, reprend après une coupure réseau, continue
 * app en arrière-plan avec sa notification de progression, et le JS lit l'avancement (octets reçus / totaux) par
 * {@link #status}. Puis {@link #install} vérifie le fichier (taille, empreinte SHA-256 de la release, paquet et
 * version) avant d'ouvrir l'installateur. Rien d'autre que l'APK public de la release ne transite.
 */
@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {

    private static final String PREFS = "app_update";
    private static final String KEY_ID = "downloadId";
    private static final String KEY_VERSION = "version";
    private static final String KEY_SIZE = "size";
    private static final String KEY_DIGEST = "digest";
    private static final String KEY_FILE = "file";

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private DownloadManager dm() {
        return (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
    }

    private File updatesDir() {
        return getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
    }

    @PluginMethod
    public void canInstall(PluginCall call) {
        JSObject ret = new JSObject();
        boolean granted = Build.VERSION.SDK_INT < 26 || getContext().getPackageManager().canRequestPackageInstalls();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void openInstallSettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("Réglage introuvable : " + e.getMessage());
        }
    }

    /** Démarre (ou redémarre) le téléchargement. { url, version, size, digest } → { id }. */
    @PluginMethod
    public void start(PluginCall call) {
        String url = call.getString("url");
        String version = call.getString("version", "");
        if (url == null || !url.startsWith("https://")) {
            call.reject("Adresse de mise à jour invalide");
            return;
        }
        try {
            DownloadManager dm = dm();
            long previous = prefs().getLong(KEY_ID, -1);
            if (previous >= 0) dm.remove(previous);
            File dir = updatesDir();
            if (dir == null) {
                call.reject("Stockage indisponible pour enregistrer la mise à jour");
                return;
            }
            String fileName = "HealthTrack-update-" + version.replaceAll("[^0-9A-Za-z.]", "") + ".apk";
            File[] olds = dir.listFiles();
            if (olds != null) for (File f : olds) if (f.getName().endsWith(".apk")) f.delete();

            DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url))
                    .setTitle("Mise à jour " + getContext().getString(R.string.app_name) + " " + version)
                    .setDescription("Téléchargement de la nouvelle version")
                    .setMimeType("application/vnd.android.package-archive")
                    .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
                    .setAllowedOverMetered(true)
                    .setAllowedOverRoaming(true)
                    .setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, fileName);
            long id = dm.enqueue(req);
            prefs().edit()
                    .putLong(KEY_ID, id)
                    .putString(KEY_VERSION, version)
                    .putLong(KEY_SIZE, call.getLong("size", -1L))
                    .putString(KEY_DIGEST, call.getString("digest"))
                    .putString(KEY_FILE, new File(dir, fileName).getAbsolutePath())
                    .apply();
            JSObject ret = new JSObject();
            ret.put("id", id);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Impossible de lancer le téléchargement : " + e.getMessage());
        }
    }

    /** Avancement du téléchargement en cours (mémorisé : survit à un redémarrage du WebView). */
    @PluginMethod
    public void status(PluginCall call) {
        JSObject ret = new JSObject();
        long id = prefs().getLong(KEY_ID, -1);
        ret.put("version", prefs().getString(KEY_VERSION, null));
        if (id < 0) {
            ret.put("state", "none");
            call.resolve(ret);
            return;
        }
        ret.put("id", id);
        try (Cursor c = dm().query(new DownloadManager.Query().setFilterById(id))) {
            if (c == null || !c.moveToFirst()) {
                ret.put("state", "none");
                call.resolve(ret);
                return;
            }
            int status = c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
            ret.put("state", UpdateFile.stateName(status));
            ret.put("downloaded", c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)));
            long total = c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
            if (total <= 0) total = prefs().getLong(KEY_SIZE, -1);
            ret.put("total", total);
            ret.put("reason", c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON)));
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("État du téléchargement illisible : " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        long id = prefs().getLong(KEY_ID, -1);
        if (id >= 0) dm().remove(id);
        prefs().edit().clear().apply();
        call.resolve();
    }

    /**
     * Vérifie le fichier puis ouvre l'installateur. { ok: true } quand l'installateur est ouvert ; sinon
     * { ok: false, error, detail } (error : missing, empty, size_mismatch, sha_mismatch, not_apk, wrong_package,
     * older, no_permission, exception).
     */
    @PluginMethod
    public void install(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("ok", false);
        String path = prefs().getString(KEY_FILE, null);
        File apk = path == null ? null : new File(path);
        if (apk == null || !apk.isFile()) {
            ret.put("error", "missing");
            call.resolve(ret);
            return;
        }
        try {
            String expectedSha = UpdateFile.expectedSha256(prefs().getString(KEY_DIGEST, null));
            String actualSha = null;
            if (expectedSha != null) {
                try (InputStream in = new FileInputStream(apk)) {
                    actualSha = UpdateFile.sha256Hex(in);
                }
            }
            String bad = UpdateFile.verify(apk.length(), prefs().getLong(KEY_SIZE, -1), actualSha, expectedSha);
            if (bad != null) {
                ret.put("error", bad);
                ret.put("detail", apk.length() + " octets");
                call.resolve(ret);
                return;
            }
            PackageManager pm = getContext().getPackageManager();
            PackageInfo archive = pm.getPackageArchiveInfo(apk.getAbsolutePath(), 0);
            if (archive == null) {
                ret.put("error", "not_apk");
                call.resolve(ret);
                return;
            }
            if (!getContext().getPackageName().equals(archive.packageName)) {
                ret.put("error", "wrong_package");
                ret.put("detail", archive.packageName);
                call.resolve(ret);
                return;
            }
            PackageInfo current = pm.getPackageInfo(getContext().getPackageName(), 0);
            long newCode = Build.VERSION.SDK_INT >= 28 ? archive.getLongVersionCode() : archive.versionCode;
            long curCode = Build.VERSION.SDK_INT >= 28 ? current.getLongVersionCode() : current.versionCode;
            ret.put("versionCode", newCode);
            ret.put("installedVersionCode", curCode);
            // versionCode = numéro du run depuis la v191 (1 avant) : seule une rétrogradation est refusée par Android.
            if (newCode < curCode) {
                ret.put("error", "older");
                call.resolve(ret);
                return;
            }
            if (Build.VERSION.SDK_INT >= 26 && !pm.canRequestPackageInstalls()) {
                ret.put("error", "no_permission");
                call.resolve(ret);
                return;
            }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apk);
            Intent i = new Intent(Intent.ACTION_VIEW)
                    .setDataAndType(uri, "application/vnd.android.package-archive")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            ret.put("ok", true);
            call.resolve(ret);
        } catch (Exception e) {
            ret.put("error", "exception");
            ret.put("detail", String.valueOf(e.getMessage()));
            call.resolve(ret);
        }
    }
}
