package com.healthtrack.app;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.healthtrack.app.gut.GutEvening;
import com.healthtrack.app.huawei.CaptureInbox;

import java.util.ArrayList;
import java.util.List;

/**
 * Bilan du ventre du soir (src/services/gutEvening.js, GutEveningNotice) : `configure` reçoit l'état effectif (choix
 * de la personne et carte ventre), l'heure apprise et le jour du dernier bilan, et reprogramme l'alarme ; `list` /
 * `remove` vident la boîte des bilans donnés depuis la notification ; `status` sert à l'affichage (jamais un bilan).
 */
@CapacitorPlugin(name = "GutEvening")
public class GutEveningPlugin extends Plugin {

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(status(getContext()));
    }

    static JSObject status(Context context) {
        SharedPreferences p = GutEveningNotice.prefs(context);
        JSObject ret = new JSObject();
        ret.put("enabled", p.getBoolean("enabled", false));
        ret.put("minuteOfDay", p.getInt("minuteOfDay", GutEvening.DEFAULT_MINUTE));
        ret.put("nextAt", p.getLong("nextAt", 0));
        ret.put("notifications", EveningNoteNotice.notificationsOn(context));
        ret.put("pending", GutEveningNotice.inbox(context).count());
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
        SharedPreferences p = GutEveningNotice.prefs(context);
        SharedPreferences.Editor e = p.edit();
        Boolean enabled = call.getBoolean("enabled");
        if (enabled != null) e.putBoolean("enabled", enabled);
        Integer minute = call.getInt("minuteOfDay");
        if (minute != null) e.putInt("minuteOfDay", GutEvening.clampMinute(minute));
        String noteDay = call.getString("noteDay");
        String known = p.getString("noteDay", null);
        // le plus récent des deux : un bilan donné depuis la notification n'est peut-être pas encore importé
        if (noteDay != null && noteDay.matches("\\d{4}-\\d{2}-\\d{2}") && (known == null || noteDay.compareTo(known) > 0))
            e.putString("noteDay", noteDay);
        e.apply();
        GutEveningNotice.arm(context);
        if (Boolean.FALSE.equals(enabled)) GutEveningNotice.cancel(context);
        call.resolve(status(context));
    }

    @PluginMethod
    public void list(PluginCall call) {
        JSArray items = new JSArray();
        for (CaptureInbox.Item item : GutEveningNotice.inbox(getContext()).list()) {
            JSObject o = new JSObject();
            o.put("name", item.name);
            o.put("json", item.json);
            items.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("notes", items);
        call.resolve(ret);
    }

    /** Retire les bilans importés : { names: [...] } → { removed }. */
    @PluginMethod
    public void remove(PluginCall call) {
        List<String> names = new ArrayList<>();
        try {
            JSArray arr = call.getArray("names");
            for (int i = 0; arr != null && i < arr.length(); i++) names.add(arr.getString(i));
        } catch (Exception e) {
            call.reject("noms de bilans invalides");
            return;
        }
        JSObject ret = new JSObject();
        ret.put("removed", GutEveningNotice.inbox(getContext()).remove(names));
        call.resolve(ret);
    }

    /** Android 13+ : demande l'autorisation des notifications ; rend { asked, notifications }. */
    @PluginMethod
    public void requestNotifications(PluginCall call) {
        call.resolve(EveningNotePlugin.requestNotifications(getActivity(), getContext()));
    }
}
