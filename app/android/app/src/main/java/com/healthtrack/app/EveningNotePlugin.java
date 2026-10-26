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
import com.healthtrack.app.huawei.CaptureInbox;
import com.healthtrack.app.mood.EveningNote;

import java.util.ArrayList;
import java.util.List;

/**
 * « Note du soir d'un geste » (src/services/eveningNote.js, EveningNoteNotice) : `configure` reçoit l'interrupteur,
 * l'heure apprise et le jour de la dernière note de l'historique, et reprogramme l'alarme ; `list` / `remove` vident
 * la boîte des notes données depuis la notification ; `status` sert au diagnostic (compteurs, raisons, jamais une
 * note).
 */
@CapacitorPlugin(name = "EveningNote")
public class EveningNotePlugin extends Plugin {

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(status(getContext()));
    }

    static JSObject status(Context context) {
        SharedPreferences p = EveningNoteNotice.prefs(context);
        JSObject ret = new JSObject();
        ret.put("enabled", p.getBoolean("enabled", false));
        ret.put("minuteOfDay", p.getInt("minuteOfDay", EveningNote.DEFAULT_MINUTE));
        ret.put("nextAt", p.getLong("nextAt", 0));
        ret.put("notifications", EveningNoteNotice.notificationsOn(context));
        ret.put("pending", EveningNoteNotice.inbox(context).count());
        ret.put("asked", p.getInt("asked", 0));
        ret.put("answers", p.getInt("answers", 0));
        ret.put("askedDay", p.getString("askedDay", null));
        ret.put("noteDay", p.getString("noteDay", null));
        ret.put("check", p.getString("check", null));
        ret.put("checkAt", p.getLong("checkAt", 0));
        ret.put("lastError", p.getString("lastError", null));
        return ret;
    }

    /** { enabled, minuteOfDay, noteDay } → reprogramme l'alarme ; rend le nouvel état. */
    @PluginMethod
    public void configure(PluginCall call) {
        Context context = getContext();
        SharedPreferences p = EveningNoteNotice.prefs(context);
        SharedPreferences.Editor e = p.edit();
        Boolean enabled = call.getBoolean("enabled");
        if (enabled != null) e.putBoolean("enabled", enabled);
        Integer minute = call.getInt("minuteOfDay");
        if (minute != null) e.putInt("minuteOfDay", EveningNote.clampMinute(minute));
        String noteDay = call.getString("noteDay");
        String known = p.getString("noteDay", null);
        // le plus récent des deux : une note donnée depuis la notification n'est peut-être pas encore importée
        if (noteDay != null && noteDay.matches("\\d{4}-\\d{2}-\\d{2}") && (known == null || noteDay.compareTo(known) > 0))
            e.putString("noteDay", noteDay);
        e.apply();
        EveningNoteNotice.arm(context);
        if (Boolean.FALSE.equals(enabled)) EveningNoteNotice.cancel(context);
        call.resolve(status(context));
    }

    @PluginMethod
    public void list(PluginCall call) {
        JSArray items = new JSArray();
        for (CaptureInbox.Item item : EveningNoteNotice.inbox(getContext()).list()) {
            JSObject o = new JSObject();
            o.put("name", item.name);
            o.put("json", item.json);
            items.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("notes", items);
        call.resolve(ret);
    }

    /** Retire les notes importées : { names: [...] } → { removed }. */
    @PluginMethod
    public void remove(PluginCall call) {
        List<String> names = new ArrayList<>();
        try {
            JSArray arr = call.getArray("names");
            for (int i = 0; arr != null && i < arr.length(); i++) names.add(arr.getString(i));
        } catch (Exception e) {
            call.reject("noms de notes invalides");
            return;
        }
        JSObject ret = new JSObject();
        ret.put("removed", EveningNoteNotice.inbox(getContext()).remove(names));
        call.resolve(ret);
    }

    /** Android 13+ : demande l'autorisation des notifications ; rend { asked, notifications }. */
    @PluginMethod
    public void requestNotifications(PluginCall call) {
        call.resolve(requestNotifications(getActivity(), getContext()));
    }

    /** Partagé avec le bilan du ventre du soir (GutEveningPlugin). */
    static JSObject requestNotifications(Activity activity, Context context) {
        JSObject ret = new JSObject();
        boolean needed = Build.VERSION.SDK_INT >= 33
                && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED;
        if (needed && activity != null) activity.requestPermissions(new String[] {Manifest.permission.POST_NOTIFICATIONS}, 7313);
        ret.put("asked", needed && activity != null);
        ret.put("notifications", EveningNoteNotice.notificationsOn(context));
        return ret;
    }
}
