package com.healthtrack.app;

import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Process;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Temps d'écran et sommeil estimé par le téléphone (src/services/phoneUsage.js).
 *
 * Lit seulement les événements « écran allumé / éteint / déverrouillé » du journal d'utilisation
 * d'Android (UsageStatsManager) : aucun nom d'app, rien ne quitte le téléphone. Nécessite l'accès
 * aux données d'utilisation, accordé par l'utilisateur dans les réglages Android.
 */
@CapacitorPlugin(name = "PhoneUsage")
public class PhoneUsagePlugin extends Plugin {

    private static final long MAX_RANGE_MS = 31L * 24 * 3600 * 1000;

    @PluginMethod
    public void checkAccess(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", hasUsageAccess());
        ret.put("supported", Build.VERSION.SDK_INT >= Build.VERSION_CODES.P);
        call.resolve(ret);
    }

    @PluginMethod
    public void openAccessSettings(PluginCall call) {
        Context ctx = getContext();
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        // Android 10+ ouvre directement la page de l'app quand le paquet est fourni.
        intent.setData(Uri.parse("package:" + ctx.getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            ctx.startActivity(intent);
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(fallback);
            } catch (Exception e2) {
                call.reject("Réglage introuvable sur ce téléphone");
                return;
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void queryScreenEvents(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            call.reject("Android 9 ou plus récent requis");
            return;
        }
        if (!hasUsageAccess()) {
            call.reject("Accès aux données d'utilisation non accordé", "NO_ACCESS");
            return;
        }
        long now = System.currentTimeMillis();
        long end = call.getData().optLong("end", now);
        long start = call.getData().optLong("start", end - 10L * 24 * 3600 * 1000);
        if (end - start > MAX_RANGE_MS) start = end - MAX_RANGE_MS;

        UsageStatsManager usm = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
        JSArray events = new JSArray();
        UsageEvents usage = usm.queryEvents(start, end);
        UsageEvents.Event ev = new UsageEvents.Event();
        while (usage != null && usage.hasNextEvent()) {
            usage.getNextEvent(ev);
            String kind = null;
            switch (ev.getEventType()) {
                case UsageEvents.Event.SCREEN_INTERACTIVE:
                    kind = "on";
                    break;
                case UsageEvents.Event.SCREEN_NON_INTERACTIVE:
                    kind = "off";
                    break;
                case UsageEvents.Event.KEYGUARD_HIDDEN:
                    kind = "unlock";
                    break;
                default:
                    break;
            }
            if (kind == null) continue;
            JSObject o = new JSObject();
            o.put("t", ev.getTimeStamp());
            o.put("e", kind);
            events.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("events", events);
        ret.put("start", start);
        ret.put("end", end);
        call.resolve(ret);
    }

    private boolean hasUsageAccess() {
        Context ctx = getContext();
        AppOpsManager appOps = (AppOpsManager) ctx.getSystemService(Context.APP_OPS_SERVICE);
        int mode;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            mode = appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.getPackageName());
        } else {
            mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.getPackageName());
        }
        if (mode == AppOpsManager.MODE_DEFAULT) {
            return ctx.checkCallingOrSelfPermission(android.Manifest.permission.PACKAGE_USAGE_STATS)
                    == android.content.pm.PackageManager.PERMISSION_GRANTED;
        }
        return mode == AppOpsManager.MODE_ALLOWED;
    }
}
