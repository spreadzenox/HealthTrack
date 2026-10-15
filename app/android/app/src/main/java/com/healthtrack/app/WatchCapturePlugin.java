package com.healthtrack.app;

import android.content.Context;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.healthtrack.app.huawei.CaptureInbox;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * Captures du client Java « synchro seule » (src/services/watchCaptures.js, huawei.md §9.1 d) : réponses brutes
 * de la montre lues app tuée, gardées dans le stockage privé de l'app jusqu'à ce que le JS les importe à
 * l'ouverture (`list`) puis les retire (`remove`, seulement après une écriture réussie).
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
}
