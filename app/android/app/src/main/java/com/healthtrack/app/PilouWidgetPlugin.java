package com.healthtrack.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Le widget de Pilou vu de l'app (src/companion/world/widgetSync.js) : `update` garde l'état du jour (ce qui reste,
 * ce qui est prévu, lever et coucher, nom) et redessine le widget ; `takeOpen` dit si le widget a été touché.
 */
@CapacitorPlugin(name = "PilouWidget")
public class PilouWidgetPlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        JSObject state = call.getObject("state", new JSObject());
        PilouWidget.prefs(getContext()).edit().putString("state", state.toString()).apply();
        PilouWidget.refresh(getContext());
        call.resolve();
    }

    @PluginMethod
    public void takeOpen(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("open", PilouWidget.takeOpen(getContext()));
        call.resolve(ret);
    }
}
