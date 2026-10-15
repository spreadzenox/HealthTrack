package com.healthtrack.app;

import android.companion.AssociationInfo;
import android.companion.AssociationRequest;
import android.companion.BluetoothDeviceFilter;
import android.companion.CompanionDeviceManager;
import android.content.Context;
import android.content.IntentSender;
import android.content.SharedPreferences;
import android.net.MacAddress;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

/**
 * Montre « appareil compagnon » d'Android (src/services/watchPresence.js, idée I72) : HealthTrack est prévenu
 * quand la montre déjà appairée se reconnecte au téléphone, même app en arrière-plan, sans scan ni sondage.
 * - associate : boîte système « Autoriser HealthTrack à gérer … ? » (un geste), puis suivi de présence ;
 * - status : associations de HealthTrack et dernière présence vue (WatchPresenceService) ;
 * - événement « watchPresence » vers le JS quand l'app est vivante (même en arrière-plan).
 * Android 13+ (API 33) seulement. Rien d'autre n'est gardé côté natif que des horodatages.
 */
@CapacitorPlugin(name = "Companion")
public class CompanionPlugin extends Plugin {

    static final String PREFS = "healthtrack_companion";
    private static final int REQUEST_ASSOCIATE = 4242;
    private static CompanionPlugin active;

    @Override
    public void load() {
        active = this;
    }

    @Override
    protected void handleOnDestroy() {
        if (active == this) active = null;
    }

    /** Une page de l'app tourne (le JS gère alors la montre). */
    static boolean isAppAlive() {
        return active != null;
    }

    private static boolean supported() {
        return Build.VERSION.SDK_INT >= 33;
    }

    private CompanionDeviceManager manager() {
        return (CompanionDeviceManager) getContext().getSystemService(Context.COMPANION_DEVICE_SERVICE);
    }

    /** Appelé par WatchPresenceService : garde l'horodatage et prévient le JS s'il tourne (rend true dans ce cas). */
    static boolean recordPresence(Context context, String event, int associationId) {
        long now = System.currentTimeMillis();
        SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        SharedPreferences.Editor e = p.edit().putLong("lastAt", now).putString("lastEvent", event).putInt("lastAssociation", associationId);
        if ("appeared".equals(event)) e.putInt("appearedCount", p.getInt("appearedCount", 0) + 1);
        e.apply();
        CompanionPlugin plugin = active;
        if (plugin != null) {
            JSObject data = new JSObject();
            data.put("event", event);
            data.put("at", now);
            data.put("associationId", associationId);
            plugin.notifyListeners("watchPresence", data);
            return true;
        }
        return false;
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("supported", supported());
        SharedPreferences p = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (p.contains("lastAt")) {
            JSObject last = new JSObject();
            last.put("at", p.getLong("lastAt", 0));
            last.put("event", p.getString("lastEvent", null));
            last.put("appearedCount", p.getInt("appearedCount", 0));
            ret.put("last", last);
        }
        JSArray list = new JSArray();
        if (supported()) {
            CompanionDeviceManager m = manager();
            if (m != null) {
                List<AssociationInfo> mine = m.getMyAssociations();
                for (AssociationInfo a : mine) {
                    JSObject o = new JSObject();
                    o.put("id", a.getId());
                    MacAddress mac = a.getDeviceMacAddress();
                    o.put("deviceId", mac == null ? null : mac.toString().toUpperCase());
                    CharSequence name = a.getDisplayName();
                    o.put("name", name == null ? null : name.toString());
                    list.put(o);
                }
            }
        }
        ret.put("associations", list);
        call.resolve(ret);
    }

    /** Association de la montre appairée (adresse connue) : un geste dans la boîte Android, puis suivi de présence. */
    @PluginMethod
    public void associate(PluginCall call) {
        String address = call.getString("deviceId");
        if (!supported()) {
            call.reject("Android 13 ou plus requis");
            return;
        }
        if (address == null || !address.matches("[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){5}")) {
            call.reject("Adresse de montre invalide");
            return;
        }
        CompanionDeviceManager m = manager();
        if (m == null) {
            call.reject("Appareils compagnons non pris en charge");
            return;
        }
        for (AssociationInfo a : m.getMyAssociations()) {
            MacAddress mac = a.getDeviceMacAddress();
            if (mac != null && mac.toString().equalsIgnoreCase(address)) {
                observe(m, address);
                JSObject ret = new JSObject();
                ret.put("associated", true);
                ret.put("id", a.getId());
                call.resolve(ret);
                return;
            }
        }
        BluetoothDeviceFilter filter = new BluetoothDeviceFilter.Builder().setAddress(address.toUpperCase()).build();
        AssociationRequest request = new AssociationRequest.Builder().addDeviceFilter(filter).setSingleDevice(true).build();
        m.associate(request, getContext().getMainExecutor(), new CompanionDeviceManager.Callback() {
            @Override
            public void onAssociationPending(IntentSender sender) {
                try {
                    getActivity().startIntentSenderForResult(sender, REQUEST_ASSOCIATE, null, 0, 0, 0);
                } catch (IntentSender.SendIntentException e) {
                    finish(call, null, "Boîte Android introuvable");
                }
            }

            @Override
            public void onAssociationCreated(AssociationInfo info) {
                observe(m, address);
                finish(call, info, null);
            }

            @Override
            public void onFailure(CharSequence error) {
                finish(call, null, error == null ? "Association refusée" : error.toString());
            }
        });
    }

    private void finish(PluginCall call, AssociationInfo info, String error) {
        if (error != null) {
            call.reject(error);
            return;
        }
        JSObject ret = new JSObject();
        ret.put("associated", true);
        ret.put("id", info.getId());
        call.resolve(ret);
        JSObject data = new JSObject();
        data.put("id", info.getId());
        notifyListeners("companionAssociated", data);
    }

    @SuppressWarnings("deprecation")
    private void observe(CompanionDeviceManager m, String address) {
        try {
            // Bluetooth classique : la montre « apparaît » quand elle se connecte au téléphone (EVENT_BT_CONNECTED).
            m.startObservingDevicePresence(address.toUpperCase());
        } catch (Exception e) {
            // association retirée entre-temps : status le montrera
        }
    }

    /** Retire l'association (le suivi de présence s'arrête ; l'appairage Bluetooth reste). */
    @PluginMethod
    public void disassociate(PluginCall call) {
        Integer id = call.getInt("id");
        if (!supported() || id == null) {
            call.reject("Association inconnue");
            return;
        }
        try {
            manager().disassociate(id);
            call.resolve();
        } catch (Exception e) {
            call.reject("Association inconnue");
        }
    }
}
