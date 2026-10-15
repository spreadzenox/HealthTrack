package com.healthtrack.app;

import android.companion.AssociationInfo;
import android.companion.CompanionDeviceManager;
import android.companion.CompanionDeviceService;
import android.companion.DevicePresenceEvent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.MacAddress;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.healthtrack.app.huawei.BackgroundSync;

/**
 * Lié par Android tant que la montre associée (CompanionPlugin) est connectée au téléphone : garde l'heure de
 * sa dernière apparition et prévient le JS (src/services/watchPresence.js), qui relit la montre si l'app est à
 * l'écran. Sinon (app tuée ou en arrière-plan), le client Java relit la montre lui-même (BackgroundWatchSync,
 * §9.1 e, g). Tant qu'il est lié, il relit aussi au déverrouillage du téléphone (§9.1 f : le lien Bluetooth peut
 * rester ouvert des heures sans nouvelle « apparition »), toujours avec la règle des 30 min.
 */
@RequiresApi(api = 33)
public class WatchPresenceService extends CompanionDeviceService {

    // ACTION_USER_PRESENT n'est pas livré aux récepteurs du manifeste : récepteur dynamique, vivant avec le service.
    private final BroadcastReceiver unlock = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String address = BackgroundWatchSync.knownAddress(context);
            if (address != null) {
                BackgroundWatchSync.maybeStart(context, address, CompanionPlugin.isAppInForeground(),
                        BackgroundSync.TRIGGER_UNLOCK, null);
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        registerReceiver(unlock, new IntentFilter(Intent.ACTION_USER_PRESENT), Context.RECEIVER_NOT_EXPORTED);
    }

    @Override
    public void onDestroy() {
        try {
            unregisterReceiver(unlock);
        } catch (IllegalArgumentException ignored) {
            // déjà retiré
        }
        super.onDestroy();
    }

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
        CompanionPlugin.recordPresence(this, "appeared", associationId);
        if (mac == null) mac = addressOf(associationId);
        if (mac != null) BackgroundWatchSync.maybeStart(this, mac.toString(), CompanionPlugin.isAppInForeground());
        if (BackgroundWatchSync.knownAddress(this) != null) WatchSyncJob.ensureScheduled(this);
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
