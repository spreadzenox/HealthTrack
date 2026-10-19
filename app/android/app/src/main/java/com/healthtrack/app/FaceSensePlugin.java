package com.healthtrack.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
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
import com.healthtrack.app.huawei.CaptureInbox;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Interrupteur et diagnostic de la « Lecture du visage » (src/services/faceSense.js, FaceSenseService) : le service
 * caméra ne peut être démarré que d'ici, app ouverte. `list` / `remove` vident la boîte des rafales (scores seuls)
 * comme WatchCapturePlugin le fait pour la montre. `status` ne rend jamais un score : seulement des compteurs, des
 * temps et des raisons, pour le diagnostic exportable.
 */
@CapacitorPlugin(name = "FaceSense", permissions = {@Permission(alias = "camera", strings = {Manifest.permission.CAMERA})})
public class FaceSensePlugin extends Plugin {

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(status(getContext()));
    }

    static JSObject status(Context context) {
        SharedPreferences p = FaceSenseService.prefs(context);
        JSObject ret = new JSObject();
        ret.put("models", FaceModels.available(context.getAssets()));
        ret.put("running", FaceSenseService.isRunning());
        ret.put("enabled", p.getBoolean("enabled", false));
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
                if (!k.equals("enabled")) ret.put(k, v);
            }
        }
        ret.put("outcomes", counts);
        ret.put("rejected", rejected);
        ret.put("battery", FaceSenseService.batteryPercent(context));
        // Activée avant la notification « Reprendre » (I88 ②) : la vérification horaire est programmée ici.
        if (p.getBoolean("enabled", false)) FaceResumeJob.ensureScheduled(context);
        return ret;
    }

    /** Démarre le service (demande d'abord l'accès à la caméra si besoin) : { started, permission }. */
    @PluginMethod
    public void start(PluginCall call) {
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

    /** Une rafale tout de suite, pour le diagnostic (déclencheur « manual », jamais compté pour l'humeur). */
    @PluginMethod
    public void test(PluginCall call) {
        if (!FaceSenseService.isRunning()) {
            call.reject("Lecture du visage arrêtée");
            return;
        }
        startService(call, FaceSenseService.ACTION_TEST);
    }

    private void startService(PluginCall call, String action) {
        JSObject ret = new JSObject();
        ret.put("permission", true);
        try {
            Intent intent = new Intent(getContext(), FaceSenseService.class).setAction(action);
            ContextCompat.startForegroundService(getContext(), intent);
            FaceSenseService.prefs(getContext()).edit().putBoolean("enabled", true).apply();
            FaceResumeJob.ensureScheduled(getContext());
            ret.put("started", true);
        } catch (RuntimeException e) {
            ret.put("started", false);
            ret.put("error", e.getClass().getSimpleName());
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        FaceSenseService.prefs(getContext()).edit().putBoolean("enabled", false).apply();
        getContext().stopService(new Intent(getContext(), FaceSenseService.class));
        FaceResumeJob.cancel(getContext());
        FaceResumeNotice.cancel(getContext());
        call.resolve();
    }

    /** Ouvre la boîte d'Android « Autoriser l'activité en arrière-plan » (sortie de l'optimisation de batterie). */
    @PluginMethod
    public void requestBatteryExemption(PluginCall call) {
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
