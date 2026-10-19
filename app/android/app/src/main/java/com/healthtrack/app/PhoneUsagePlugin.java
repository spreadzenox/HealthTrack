package com.healthtrack.app;

import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Process;
import android.provider.Settings;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Temps d'écran et sommeil estimé par le téléphone (src/services/phoneUsage.js).
 *
 * Lit les événements « écran allumé / éteint / déverrouillé » du journal d'utilisation d'Android
 * (UsageStatsManager) et, pour le temps par catégorie d'app (src/services/phoneApps.js, I116), quelle
 * app passe au premier plan ou en arrière-plan, avec son nom et sa catégorie déclarée. Jamais le
 * contenu des apps ; rien ne quitte le téléphone. Nécessite l'accès aux données d'utilisation, accordé
 * par l'utilisateur dans les réglages Android.
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

    /**
     * Apps au premier plan : `{ t, e: 'fg' | 'bg', p }` et `{ t, e: 'off' }` (écran éteint), plus
     * `apps: { paquet: { label, category } }` une fois par paquet (`category` = ApplicationInfo.category,
     * −1 si non déclarée). HealthTrack, le lanceur et l'interface système sont ignorés.
     */
    @PluginMethod
    public void queryAppEvents(PluginCall call) {
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

        Context ctx = getContext();
        PackageManager pm = ctx.getPackageManager();
        Set<String> ignored = ignoredPackages(ctx, pm);
        UsageStatsManager usm = (UsageStatsManager) ctx.getSystemService(Context.USAGE_STATS_SERVICE);
        JSArray events = new JSArray();
        JSObject apps = new JSObject();
        Set<String> seen = new HashSet<>();
        UsageEvents usage = usm.queryEvents(start, end);
        UsageEvents.Event ev = new UsageEvents.Event();
        while (usage != null && usage.hasNextEvent()) {
            usage.getNextEvent(ev);
            int type = ev.getEventType();
            String kind = null;
            if (type == UsageEvents.Event.ACTIVITY_RESUMED) {
                kind = "fg";
            } else if (type == UsageEvents.Event.ACTIVITY_PAUSED
                    || (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && type == UsageEvents.Event.ACTIVITY_STOPPED)) {
                kind = "bg";
            } else if (type == UsageEvents.Event.SCREEN_NON_INTERACTIVE) {
                kind = "off";
            }
            if (kind == null) continue;
            JSObject o = new JSObject();
            o.put("t", ev.getTimeStamp());
            o.put("e", kind);
            if (!"off".equals(kind)) {
                String pkg = ev.getPackageName();
                if (pkg == null || ignored.contains(pkg)) continue;
                o.put("p", pkg);
                if (seen.add(pkg)) apps.put(pkg, describeApp(pm, pkg));
            }
            events.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("events", events);
        ret.put("apps", apps);
        ret.put("start", start);
        ret.put("end", end);
        call.resolve(ret);
    }

    /** HealthTrack, lanceurs (écran d'accueil) et interface système : ce ne sont pas des apps « utilisées ». */
    private Set<String> ignoredPackages(Context ctx, PackageManager pm) {
        Set<String> out = new HashSet<>();
        out.add(ctx.getPackageName());
        out.add("com.android.systemui");
        Intent home = new Intent(Intent.ACTION_MAIN);
        home.addCategory(Intent.CATEGORY_HOME);
        try {
            List<ResolveInfo> launchers = pm.queryIntentActivities(home, 0);
            for (ResolveInfo ri : launchers) {
                if (ri.activityInfo != null) out.add(ri.activityInfo.packageName);
            }
        } catch (Exception ignoredError) {
            // Liste des lanceurs indisponible : ils seront comptés dans « autres apps ».
        }
        return out;
    }

    private JSObject describeApp(PackageManager pm, String pkg) {
        JSObject info = new JSObject();
        try {
            ApplicationInfo ai = pm.getApplicationInfo(pkg, 0);
            info.put("label", String.valueOf(pm.getApplicationLabel(ai)));
            info.put("category", Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ? ai.category : -1);
        } catch (Exception e) {
            // App désinstallée depuis ou invisible : le nom du paquet suffit.
            info.put("category", -1);
        }
        return info;
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
