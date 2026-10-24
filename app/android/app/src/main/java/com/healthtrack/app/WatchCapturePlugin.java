package com.healthtrack.app;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.healthtrack.app.huawei.BackgroundSync;
import com.healthtrack.app.huawei.CaptureInbox;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * Captures du client Java « synchro seule » (src/services/watchCaptures.js, huawei.md §9.1 d) : réponses brutes
 * de la montre lues app tuée, gardées dans le stockage privé de l'app jusqu'à ce que le JS les importe à
 * l'ouverture (`list`) puis les retire (`remove`, seulement après une écriture réussie). `background` dit où en
 * est la relecture app tuée (BackgroundWatchSync) ; `shareResume` lui recopie la reprise après chaque synchro du JS.
 */
@CapacitorPlugin(name = "WatchCapture")
public class WatchCapturePlugin extends Plugin {

    static CaptureInbox inbox(Context context) {
        return new CaptureInbox(new File(context.getFilesDir(), "watch-captures"));
    }

    /** { captures: [{ name, json }] }, de la plus ancienne à la plus récente. */
    @PluginMethod
    public void list(PluginCall call) {
        JSArray items = new JSArray();
        for (CaptureInbox.Item item : inbox(getContext()).list()) {
            JSObject o = new JSObject();
            o.put("name", item.name);
            o.put("json", item.json);
            items.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("captures", items);
        call.resolve(ret);
    }

    /** Retire les captures importées : { names: [...] } → { removed }. */
    @PluginMethod
    public void remove(PluginCall call) {
        List<String> names = new ArrayList<>();
        try {
            JSArray arr = call.getArray("names");
            for (int i = 0; arr != null && i < arr.length(); i++) names.add(arr.getString(i));
        } catch (Exception e) {
            call.reject("noms de captures invalides");
            return;
        }
        JSObject ret = new JSObject();
        ret.put("removed", inbox(getContext()).remove(names));
        call.resolve(ret);
    }

    /** État de la relecture app tuée pour la montre `deviceId` (jamais de clé). */
    @PluginMethod
    public void background(PluginCall call) {
        String address = call.getString("deviceId");
        BackgroundSync.State s = BackgroundWatchSync.load(getContext(), address);
        SharedPreferences p = getContext().getSharedPreferences(BackgroundWatchSync.PREFS, Context.MODE_PRIVATE);
        JSObject ret = new JSObject();
        ret.put("busy", BackgroundWatchSync.isBusy());
        ret.put("lastUntil", s.lastUntil);
        ret.put("lastAttemptAt", s.lastAttemptAt);
        ret.put("lastSuccessAt", s.lastSuccessAt);
        ret.put("failures", s.failures);
        ret.put("paused", s.paused);
        ret.put("outcome", s.outcome);
        ret.put("battery", s.battery);
        ret.put("lastDecision", p.getString("lastDecision", null));
        ret.put("lastDecisionAt", p.getLong("lastDecisionAt", 0));
        ret.put("lastTrigger", p.getString("lastTrigger", null));
        ret.put("periodic", WatchSyncJob.isScheduled(getContext()));
        call.resolve(ret);
    }

    /** Reprise de la synchro faite par le JS : { deviceId, until, at, sleepFileUntil?, stressFileUntil?, sleepBedTime? } (ms). */
    @PluginMethod
    public void shareResume(PluginCall call) {
        String address = call.getString("deviceId");
        Long until = call.getLong("until");
        Long at = call.getLong("at");
        if (address == null || until == null || at == null) {
            call.reject("reprise invalide");
            return;
        }
        BackgroundWatchSync.shareFromApp(getContext(), address, until, at,
                call.getLong("sleepFileUntil", 0L), call.getLong("stressFileUntil", 0L), call.getBoolean("sleepBedTime", null));
        call.resolve();
    }

    /** Android 13+ : demande l'autorisation des notifications (« synchro en pause », WatchNotifications). */
    @PluginMethod
    public void requestNotifications(PluginCall call) {
        JSObject ret = new JSObject();
        Activity activity = getActivity();
        boolean needed = Build.VERSION.SDK_INT >= 33
                && getContext().checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED;
        if (needed && activity != null) activity.requestPermissions(new String[] {Manifest.permission.POST_NOTIFICATIONS}, 7303);
        ret.put("asked", needed && activity != null);
        call.resolve(ret);
    }
}
