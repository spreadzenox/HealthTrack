package com.healthtrack.app;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Rappel de fin d'essai, variante play (src/services/trialReminder.js) : `schedule` { at, title, body, url } remplace le
 * rappel prévu, `cancel` l'annule, `requestNotifications` demande l'autorisation des notifications (Android 13+).
 */
@CapacitorPlugin(name = "TrialReminder")
public class TrialReminderPlugin extends Plugin {

    @PluginMethod
    public void schedule(PluginCall call) {
        Double at = call.getDouble("at");
        String title = call.getString("title");
        if (at == null || at <= 0 || title == null) {
            call.reject("at et title sont requis");
            return;
        }
        TrialReminder.save(getContext(), at.longValue(), title, call.getString("body", ""), call.getString("url"));
        TrialReminder.arm(getContext());
        JSObject ret = new JSObject();
        ret.put("notifications", TrialReminder.notificationsOn(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        TrialReminder.clear(getContext());
        call.resolve();
    }

    @PluginMethod
    public void requestNotifications(PluginCall call) {
        JSObject ret = new JSObject();
        Activity activity = getActivity();
        boolean needed = Build.VERSION.SDK_INT >= 33
                && getContext().checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED;
        if (needed && activity != null) activity.requestPermissions(new String[] {Manifest.permission.POST_NOTIFICATIONS}, 7414);
        ret.put("asked", needed && activity != null);
        ret.put("notifications", TrialReminder.notificationsOn(getContext()));
        call.resolve(ret);
    }
}
