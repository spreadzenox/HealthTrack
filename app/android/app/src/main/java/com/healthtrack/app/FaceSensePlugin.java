package com.healthtrack.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.os.SystemClock;
import android.provider.Settings;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.healthtrack.app.face.FaceSchedule;
import com.healthtrack.app.huawei.CaptureInbox;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Interrupteur et diagnostic de la « Lecture du visage » (src/services/faceSense.js, FaceSenseService) : le service
 * caméra ne peut être démarré que d'ici, app ouverte. `list` / `remove` vident la boîte des rafales (scores seuls)
 * comme WatchCapturePlugin le fait pour la montre. `status` ne rend jamais un score : seulement des compteurs, des
 * temps et des raisons, pour le diagnostic exportable.
 *
 * Variante play (BuildConfig.FACE_UNLOCK faux, journal/PLAY-CONFORMITE.md option B) : pas de service caméra (retiré
 * du manifeste play), ni relance, ni exemption de batterie. « Activer » ne fait que noter l'accord ; la lecture a lieu
 * à l'ouverture de l'app (`readNow`, app à l'écran) et au bouton « Tester », par FaceOneShot.
 *
 * Variante play avec l'interrupteur de build faceUnlockPlay (FACE_UNLOCK vrai, FACE_KEEPALIVE faux, POL-1) : en plus,
 * `start({ unlock: true })` démarre le service au déverrouillage (préférence « unlock », distincte de l'accord
 * « enabled » de la lecture à l'ouverture, qui reste le secours) ; `stopUnlock` ou « Arrêter » de la notification
 * ne coupent que lui. Jamais de relance horaire ni au démarrage, ni d'exemption de batterie.
 */
@CapacitorPlugin(name = "FaceSense", permissions = {@Permission(alias = "camera", strings = {Manifest.permission.CAMERA})})
public class FaceSensePlugin extends Plugin {

    /** Lectures de la variante play, une à la fois, hors du fil de la WebView. */
    private final ExecutorService oneShot = Executors.newSingleThreadExecutor();

    @Override
    protected void handleOnDestroy() {
        oneShot.shutdown();
    }

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(status(getContext()));
    }

    static JSObject status(Context context) {
        SharedPreferences p = FaceSenseService.prefs(context);
        JSObject ret = new JSObject();
        ret.put("models", FaceModels.available(context.getAssets()));
        // Modèle valence / éveil : téléchargé une fois sur le téléphone (FaceAffectModel), jamais dans l'APK.
        ret.put("affectModel", FaceAffectModel.available(context));
        // Second modèle du duo (MobileFaceNet, 8 Mo, I126).
        ret.put("affectModel2", FaceAffectModel.available(context, FaceAffectModel.MBF));
        ret.put("affectDownloading", FaceAffectModel.isDownloading());
        ret.put("running", FaceSenseService.isRunning());
        // « unlock » : service au déverrouillage (sideload) ; « app_open » : lecture à l'ouverture de l'app (play).
        ret.put("mode", BuildConfig.FACE_KEEPALIVE ? "unlock" : "app_open");
        ret.put("enabled", p.getBoolean("enabled", false));
        // Variante play : lecture au déverrouillage proposée en plus (interrupteur de build) et son état.
        ret.put("unlockAvailable", BuildConfig.FACE_UNLOCK && !BuildConfig.FACE_KEEPALIVE);
        ret.put("unlock", p.getBoolean(FaceSenseService.UNLOCK_PREF, false));
        ret.put("permission", FaceSenseService.hasCameraPermission(context));
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        ret.put("batteryExempt", pm != null && pm.isIgnoringBatteryOptimizations(context.getPackageName()));
        ret.put("sdk", Build.VERSION.SDK_INT);
        ret.put("release", Build.VERSION.RELEASE);
        ret.put("manufacturer", Build.MANUFACTURER);
        ret.put("model", Build.MODEL);
        ret.put("pending", FaceSenseService.inbox(context).count());
        JSObject counts = new JSObject();
        JSObject rejected = new JSObject();
        for (Map.Entry<String, ?> e : p.getAll().entrySet()) {
            Object v = e.getValue();
            String k = e.getKey();
            if (k.startsWith("n_") && v instanceof Integer) counts.put(k.substring(2), v);
            else if (k.startsWith("r_") && v instanceof Integer) rejected.put(k.substring(2), v);
            else if (v instanceof String || v instanceof Integer || v instanceof Long || v instanceof Boolean) {
                if (!k.equals("enabled") && !k.equals(FaceSenseService.UNLOCK_PREF)) ret.put(k, v);
            }
        }
        ret.put("outcomes", counts);
        ret.put("rejected", rejected);
        ret.put("battery", FaceSenseService.batteryPercent(context));
        // « foreground » = accès caméra seulement app à l'écran ; « allow » = accordé en permanence (Shizuku / ADB).
        ret.put("cameraOp", FaceSenseService.cameraOpMode(context));
        // Repères pour dire pourquoi le service activé ne tourne plus (faceStopCause) : mise à jour, redémarrage, ou
        // ni l'un ni l'autre (mise en veille de One UI…).
        ret.put("bootAt", System.currentTimeMillis() - SystemClock.elapsedRealtime());
        try {
            ret.put("lastUpdateAt", context.getPackageManager().getPackageInfo(context.getPackageName(), 0).lastUpdateTime);
        } catch (PackageManager.NameNotFoundException ignored) {
            // impossible pour notre propre paquet
        }
        // Activée avant la notification « Reprendre » (I88 ②) : la vérification horaire est programmée ici.
        if (BuildConfig.FACE_KEEPALIVE && p.getBoolean("enabled", false)) FaceResumeJob.ensureScheduled(context);
        return ret;
    }

    /**
     * Démarre le service (demande d'abord l'accès à la caméra si besoin) : { started, permission }. `restart` :
     * l'arrête d'abord, pour qu'il reparte app à l'écran et retrouve l'accès caméra en arrière-plan (Android 11+
     * ne le donne qu'à un service caméra démarré pendant que l'app est visible). `unlock` (variante play avec
     * l'interrupteur) : démarre aussi le service au déverrouillage ; sans lui, seul l'accord est noté.
     */
    @PluginMethod
    public void start(PluginCall call) {
        if (BuildConfig.FACE_UNLOCK && Boolean.TRUE.equals(call.getBoolean("restart", false)) && FaceSenseService.isRunning()) {
            getContext().stopService(new Intent(getContext(), FaceSenseService.class));
        }
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "cameraGranted");
            return;
        }
        startService(call, FaceSenseService.ACTION_START);
    }

    @PermissionCallback
    private void cameraGranted(PluginCall call) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            JSObject ret = new JSObject();
            ret.put("started", false);
            ret.put("permission", false);
            call.resolve(ret);
            return;
        }
        startService(call, FaceSenseService.ACTION_START);
    }

    /**
     * Télécharge le modèle valence / éveil s'il manque (16 Mo, une fois, vérifié par SHA-256) : { ready, downloading }.
     * Appelé app ouverte par la carte quand la lecture du visage est activée ; le service le prend à la rafale suivante.
     */
    @PluginMethod
    public void prepareAffect(PluginCall call) {
        boolean started = FaceAffectModel.ensure(getContext());
        JSObject ret = new JSObject();
        ret.put("ready", FaceAffectModel.available(getContext()));
        ret.put("duo", FaceAffectModel.allAvailable(getContext()));
        ret.put("downloading", started || FaceAffectModel.isDownloading());
        call.resolve(ret);
    }

    /** Une rafale tout de suite, pour le diagnostic (déclencheur « manual », jamais compté pour l'humeur). */
    @PluginMethod
    public void test(PluginCall call) {
        if (!BuildConfig.FACE_UNLOCK || (!BuildConfig.FACE_KEEPALIVE && !FaceSenseService.isRunning())) {
            readOnce(call, FaceSchedule.TRIGGER_MANUAL);
            return;
        }
        if (!FaceSenseService.isRunning()) {
            call.reject("Lecture du visage arrêtée");
            return;
        }
        startService(call, FaceSenseService.ACTION_TEST);
    }

    /**
     * Variante play : une lecture maintenant, app à l'écran (déclencheur « app_open », une par demi-heure au plus,
     * FaceSchedule) : { outcome }. Sans effet si la lecture n'est pas activée ; refusé en sideload (le service s'en
     * charge au déverrouillage).
     */
    @PluginMethod
    public void readNow(PluginCall call) {
        if (BuildConfig.FACE_KEEPALIVE) {
            call.reject("Lecture au déverrouillage dans cette version");
            return;
        }
        String skip = !FaceSenseService.prefs(getContext()).getBoolean("enabled", false) ? "skip:off"
                // Le service lit déjà au déverrouillage : pas de seconde lecture à l'ouverture.
                : FaceSenseService.isRunning() ? "skip:unlock" : null;
        if (skip != null) {
            JSObject ret = new JSObject();
            ret.put("outcome", skip);
            call.resolve(ret);
            return;
        }
        readOnce(call, FaceSchedule.TRIGGER_APP_OPEN);
    }

    private void readOnce(PluginCall call, String trigger) {
        Context context = getContext();
        oneShot.execute(() -> {
            JSObject ret = new JSObject();
            try {
                ret.put("outcome", FaceOneShot.run(context, trigger));
            } catch (RuntimeException e) {
                ret.put("outcome", "error");
                ret.put("error", e.getClass().getSimpleName());
            }
            call.resolve(ret);
        });
    }

    private void startService(PluginCall call, String action) {
        JSObject ret = new JSObject();
        ret.put("permission", true);
        boolean service = BuildConfig.FACE_KEEPALIVE
                || (BuildConfig.FACE_UNLOCK && Boolean.TRUE.equals(call.getBoolean("unlock", false)));
        if (!service) {
            // Variante play : pas de service, l'accord est noté et la lecture se fera à l'ouverture de l'app.
            FaceSenseService.prefs(getContext()).edit().putBoolean("enabled", true).apply();
            ret.put("started", true);
            call.resolve(ret);
            return;
        }
        try {
            // Appelé depuis la WebView : l'app est à l'écran.
            Intent intent = new Intent(getContext(), FaceSenseService.class).setAction(action)
                    .putExtra(FaceSenseService.EXTRA_ORIGIN, FaceSenseService.ORIGIN_APP);
            ContextCompat.startForegroundService(getContext(), intent);
            FaceSenseService.prefs(getContext()).edit().putBoolean("enabled", true).apply();
            if (BuildConfig.FACE_KEEPALIVE) FaceResumeJob.ensureScheduled(getContext());
            ret.put("started", true);
        } catch (RuntimeException e) {
            ret.put("started", false);
            ret.put("error", e.getClass().getSimpleName());
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        FaceSenseService.prefs(getContext()).edit().putBoolean("enabled", false)
                .putBoolean(FaceSenseService.UNLOCK_PREF, false).apply();
        if (BuildConfig.FACE_UNLOCK) getContext().stopService(new Intent(getContext(), FaceSenseService.class));
        if (BuildConfig.FACE_KEEPALIVE) {
            FaceResumeJob.cancel(getContext());
            FaceResumeNotice.cancel(getContext());
        }
        call.resolve();
    }

    /** Variante play : coupe la seule lecture au déverrouillage ; la lecture à l'ouverture de l'app reste. */
    @PluginMethod
    public void stopUnlock(PluginCall call) {
        FaceSenseService.prefs(getContext()).edit().putBoolean(FaceSenseService.UNLOCK_PREF, false).apply();
        if (BuildConfig.FACE_UNLOCK && !BuildConfig.FACE_KEEPALIVE) {
            getContext().stopService(new Intent(getContext(), FaceSenseService.class));
        }
        call.resolve();
    }

    /** Ouvre la boîte d'Android « Autoriser l'activité en arrière-plan » (sortie de l'optimisation de batterie). */
    @PluginMethod
    public void requestBatteryExemption(PluginCall call) {
        if (!BuildConfig.FACE_KEEPALIVE) {
            // Variante play : REQUEST_IGNORE_BATTERY_OPTIMIZATIONS retirée du manifeste (règles Play).
            call.reject("Indisponible dans cette version");
            return;
        }
        try {
            Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (RuntimeException e) {
            call.reject("Réglage indisponible");
        }
    }

    /**
     * Ouvre « Applis jamais en veille » de One UI (Samsung Device Care, liste à cocher de type 2) : { opened: 'samsung' }.
     * Ailleurs, ou si One UI ne l'expose pas, la page de l'app dans les réglages Android : { opened: 'app_details' }.
     */
    @PluginMethod
    public void openNeverSleep(PluginCall call) {
        Context ctx = getContext();
        JSObject ret = new JSObject();
        Intent samsung = new Intent("com.samsung.android.sm.ACTION_OPEN_CHECKABLE_LISTACTIVITY")
                .setPackage("com.samsung.android.lool").putExtra("activity_type", 2)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            if ("samsung".equalsIgnoreCase(Build.MANUFACTURER) && samsung.resolveActivity(ctx.getPackageManager()) != null) {
                ctx.startActivity(samsung);
                ret.put("opened", "samsung");
                call.resolve(ret);
                return;
            }
        } catch (RuntimeException ignored) {
            // liste Samsung refusée : repli ci-dessous
        }
        try {
            ctx.startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    Uri.parse("package:" + ctx.getPackageName())).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            ret.put("opened", "app_details");
            call.resolve(ret);
        } catch (RuntimeException e) {
            call.reject("Réglage indisponible");
        }
    }

    /** { bursts: [{ name, json }] }, de la plus ancienne à la plus récente. */
    @PluginMethod
    public void list(PluginCall call) {
        JSArray items = new JSArray();
        for (CaptureInbox.Item item : FaceSenseService.inbox(getContext()).list()) {
            JSObject o = new JSObject();
            o.put("name", item.name);
            o.put("json", item.json);
            items.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("bursts", items);
        call.resolve(ret);
    }

    /** Retire les rafales importées : { names: [...] } → { removed }. */
    @PluginMethod
    public void remove(PluginCall call) {
        List<String> names = new ArrayList<>();
        try {
            JSArray arr = call.getArray("names");
            for (int i = 0; arr != null && i < arr.length(); i++) names.add(arr.getString(i));
        } catch (Exception e) {
            call.reject("noms de rafales invalides");
            return;
        }
        JSObject ret = new JSObject();
        ret.put("removed", FaceSenseService.inbox(getContext()).remove(names));
        call.resolve(ret);
    }
}
