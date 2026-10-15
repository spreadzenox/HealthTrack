package com.healthtrack.app;

import android.companion.AssociationInfo;
import android.companion.CompanionDeviceManager;
import android.companion.CompanionDeviceService;
import android.companion.DevicePresenceEvent;
import android.content.Context;
import android.net.MacAddress;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

/**
 * Lié par Android tant que la montre associée (CompanionPlugin) est connectée au téléphone : garde l'heure de
 * sa dernière apparition et prévient le JS, qui relit la montre (src/services/watchPresence.js). Si aucune page
 * de l'app ne tourne (app tuée), le client Java relit la montre lui-même (BackgroundWatchSync, §9.1 e).
 */
@RequiresApi(api = 33)
public class WatchPresenceService extends CompanionDeviceService {

    @Override
    @SuppressWarnings("deprecation")
    public void onDeviceAppeared(@NonNull AssociationInfo info) {
        appeared(info.getId(), info.getDeviceMacAddress());
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onDeviceDisappeared(@NonNull AssociationInfo info) {
        CompanionPlugin.recordPresence(this, "disappeared", info.getId());
    }

    /** Android 16 (API 36) : même information, par type d'événement. */
    @Override
    public void onDevicePresenceEvent(@NonNull DevicePresenceEvent event) {
        int type = event.getEvent();
        boolean appeared = type == DevicePresenceEvent.EVENT_BT_CONNECTED || type == DevicePresenceEvent.EVENT_BLE_APPEARED;
        boolean gone = type == DevicePresenceEvent.EVENT_BT_DISCONNECTED || type == DevicePresenceEvent.EVENT_BLE_DISAPPEARED;
        if (appeared) appeared(event.getAssociationId(), null);
        else if (gone) CompanionPlugin.recordPresence(this, "disappeared", event.getAssociationId());
    }

    private void appeared(int associationId, MacAddress mac) {
        boolean appAlive = CompanionPlugin.recordPresence(this, "appeared", associationId);
        if (mac == null) mac = addressOf(associationId);
        if (mac != null) BackgroundWatchSync.maybeStart(this, mac.toString(), appAlive);
    }

    private MacAddress addressOf(int associationId) {
        try {
            CompanionDeviceManager m = (CompanionDeviceManager) getSystemService(Context.COMPANION_DEVICE_SERVICE);
            if (m == null) return null;
            for (AssociationInfo a : m.getMyAssociations()) if (a.getId() == associationId) return a.getDeviceMacAddress();
        } catch (RuntimeException ignored) {
            // association retirée entre-temps
        }
        return null;
    }
}
