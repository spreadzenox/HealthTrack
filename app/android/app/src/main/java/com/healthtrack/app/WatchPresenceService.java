package com.healthtrack.app;

import android.companion.AssociationInfo;
import android.companion.CompanionDeviceService;
import android.companion.DevicePresenceEvent;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

/**
 * Lié par Android tant que la montre associée (CompanionPlugin) est connectée au téléphone : garde
 * l'heure de sa dernière apparition et prévient le JS, qui relit la montre (src/services/watchPresence.js).
 * Aucune connexion ici : le protocole reste en JS tant que le client Java « synchro seule » n'existe pas.
 */
@RequiresApi(api = 33)
public class WatchPresenceService extends CompanionDeviceService {

    @Override
    @SuppressWarnings("deprecation")
    public void onDeviceAppeared(@NonNull AssociationInfo info) {
        CompanionPlugin.recordPresence(this, "appeared", info.getId());
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
        if (appeared || gone) CompanionPlugin.recordPresence(this, appeared ? "appeared" : "disappeared", event.getAssociationId());
    }
}
