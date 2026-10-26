package com.healthtrack.app;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Rappel de la portion du jour (src/services/fodmapReminder.js) : `schedule` { items: [{ at, title, body }] } remplace
 * les rappels prévus, `requestNotifications` demande l'autorisation (Android 13+), `takeOpen` dit si la notification a
 * été touchée depuis la dernière fois.
 */
@CapacitorPlugin(name = "PortionReminder")
public class PortionReminderPlugin extends Plugin {

    private static final int MAX_ITEMS = 3;

    @PluginMethod
    public void schedule(PluginCall call) {
        JSArray input = call.getArray("items", new JSArray());
        JSONArray items = new JSONArray();
        for (int i = 0; i < input.length() && items.length() < MAX_ITEMS; i++) {
            JSONObject o = input.optJSONObject(i);
            if (o == null || o.optLong("at", 0) <= 0 || o.optString("title", "").isEmpty()) continue;
            items.put(o);
        }
        PortionReminder.save(getContext(), items);
        JSObject ret = new JSObject();
        ret.put("count", items.length());
        ret.put("notifications", PortionReminder.notificationsOn(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void requestNotifications(PluginCall call) {
        JSObject ret = new JSObject();
        Activity activity = getActivity();
        boolean needed = Build.VERSION.SDK_INT >= 33
                && getContext().checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED;
        if (needed && activity != null) activity.requestPermissions(new String[] {Manifest.permission.POST_NOTIFICATIONS}, 7415);
        ret.put("asked", needed && activity != null);
        ret.put("notifications", PortionReminder.notificationsOn(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void takeOpen(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("open", PortionReminder.takeOpen(getContext()));
        call.resolve(ret);
    }
}
