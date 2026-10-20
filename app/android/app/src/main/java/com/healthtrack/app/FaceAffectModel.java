package com.healthtrack.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.SystemClock;

import com.healthtrack.app.face.FaceAffect;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Le modèle valence / éveil HSEmotion `enet_b0_8_va_mtl` (consigne du 19/10 au soir, étape 2 ; choix, licence et
 * alternatives : journal/BIEN-ETRE-AUTO.md §« Modèle valence / éveil »). Ses poids, publiés en ONNX par leurs auteurs
 * dans un dépôt Apache-2.0, ont été appris sur AffectNet (licence de recherche) : par prudence l'APK ne les contient
 * pas. Le téléphone les télécharge une fois (16 Mo), app ouverte, depuis le dépôt officiel, et ne les garde que si
 * leur SHA-256 est exactement celui attendu. Le téléchargement n'envoie rien : une simple requête GET d'un fichier
 * public, sans en-tête ni donnée de l'utilisateur. Rangés hors sauvegarde Android (getNoBackupFilesDir).
 */
public final class FaceAffectModel {

    static final String NAME = "enet_b0_8_va_mtl.onnx";
    static final String SHA256 = "c43e056ad388d4a8dc911832b8291435b2af537f967e5870ebd731574ec7e812";
    static final long BYTES = 16049834L;
    /** Dépôt actuel des auteurs (EmotiEffLib), puis l'ancien (face-emotion-recognition), même fichier. */
    static final String[] URLS = {
        "https://raw.githubusercontent.com/sb-ai-lab/EmotiEffLib/main/models/affectnet_emotions/onnx/" + NAME,
        "https://raw.githubusercontent.com/av-savchenko/face-emotion-recognition/main/models/affectnet_emotions/onnx/" + NAME,
    };
    static final long[] SHAPE = {1, 3, FaceAffect.SIZE, FaceAffect.SIZE};

    private static final AtomicBoolean downloading = new AtomicBoolean(false);

    private FaceAffectModel() {}

    static File file(Context context) {
        return new File(new File(context.getNoBackupFilesDir(), "face"), NAME);
    }

    /** Vrai si le fichier est là et a la bonne taille (l'empreinte est vérifiée une fois, au téléchargement). */
    static boolean available(Context context) {
        File f = file(context);
        return f.isFile() && f.length() == BYTES;
    }

    static boolean isDownloading() {
        return downloading.get();
    }

    static OnnxModel open(Context context) throws Exception {
        return new OnnxModel(file(context).getAbsolutePath(), SHAPE);
    }

    /**
     * Télécharge le modèle sur un fil à part s'il manque (un seul téléchargement à la fois). L'état est écrit dans
     * les préférences du service (affectState = downloading / ready / error, affectError), lues par le diagnostic.
     * @return vrai si un téléchargement a été lancé
     */
    static boolean ensure(Context context) {
        Context app = context.getApplicationContext();
        if (available(app) || !downloading.compareAndSet(false, true)) return false;
        SharedPreferences p = FaceSenseService.prefs(app);
        p.edit().putString("affectState", "downloading").remove("affectError").apply();
        new Thread(() -> {
            long t0 = SystemClock.elapsedRealtime();
            String error = null;
            try {
                download(app);
            } catch (Exception e) {
                error = e.getClass().getSimpleName() + ": " + e.getMessage();
            } finally {
                downloading.set(false);
            }
            SharedPreferences.Editor e = p.edit().putLong("affectStateAt", System.currentTimeMillis());
            if (error == null) {
                e.putString("affectState", "ready").remove("affectError")
                        .putLong("affectDownloadMs", SystemClock.elapsedRealtime() - t0);
            } else {
                e.putString("affectState", "error").putString("affectError", error)
                        .putInt("affectDownloadErrors", p.getInt("affectDownloadErrors", 0) + 1);
            }
            e.apply();
        }, "face-affect-download").start();
        return true;
    }

    private static void download(Context context) throws IOException, NoSuchAlgorithmException {
        File target = file(context);
        File dir = target.getParentFile();
        if (dir != null && !dir.isDirectory() && !dir.mkdirs()) throw new IOException("dossier " + dir);
        IOException last = null;
        for (String url : URLS) {
            File part = new File(dir, NAME + ".part");
            try {
                String got = fetch(url, part);
                if (!SHA256.equals(got)) throw new IOException("empreinte inattendue " + got.substring(0, 12));
                if (!part.renameTo(target)) throw new IOException("renommage impossible");
                return;
            } catch (IOException e) {
                last = e;
            } finally {
                if (part.exists() && !part.delete()) part.deleteOnExit();
            }
        }
        throw last != null ? last : new IOException("aucune source");
    }

    /** Écrit le fichier et rend son SHA-256 (hexadécimal) ; refuse tout ce qui dépasse la taille attendue. */
    private static String fetch(String url, File out) throws IOException, NoSuchAlgorithmException {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(20000);
        c.setReadTimeout(30000);
        c.setInstanceFollowRedirects(true);
        try {
            int code = c.getResponseCode();
            if (code != 200) throw new IOException("HTTP " + code);
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            long total = 0;
            try (InputStream in = c.getInputStream(); FileOutputStream fo = new FileOutputStream(out)) {
                byte[] buf = new byte[65536];
                for (int n; (n = in.read(buf)) > 0; ) {
                    total += n;
                    if (total > BYTES) throw new IOException("fichier trop gros");
                    md.update(buf, 0, n);
                    fo.write(buf, 0, n);
                }
            }
            StringBuilder hex = new StringBuilder(64);
            for (byte b : md.digest()) hex.append(String.format("%02x", b));
            return hex.toString();
        } finally {
            c.disconnect();
        }
    }
}
