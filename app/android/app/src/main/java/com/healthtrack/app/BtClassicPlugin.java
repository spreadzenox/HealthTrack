package com.healthtrack.app;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelUuid;
import android.provider.Settings;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.healthtrack.app.huawei.LinkLock;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Bluetooth « classique » (RFCOMM) pour les montres qui ne parlent pas en BLE GATT, comme les
 * Huawei Watch GT 3 → GT 7 (src/devices/huawei/transports.js). Une seule connexion à la fois.
 * Les octets passent en hexadécimal ; rien n'est gardé côté natif. L'autorisation « Appareils à
 * proximité » (BLUETOOTH_SCAN / BLUETOOTH_CONNECT) est demandée par la couche BLE avant tout appel.
 * Assistant d'appairage (src/devices/huawei/setup.js) : recherche classique, demande de liaison
 * Android (l'utilisateur confirme dans la boîte système), ouverture des réglages Bluetooth.
 */
@CapacitorPlugin(name = "BtClassic")
public class BtClassicPlugin extends Plugin {

    private BluetoothSocket socket;
    private OutputStream out;
    private Thread reader;

    private BluetoothAdapter adapter() {
        BluetoothManager m = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        return m == null ? null : m.getAdapter();
    }

    /** Appareils appairés au téléphone, avec leur type (1 classique, 2 BLE, 3 double) et leurs services SDP connus. */
    @PluginMethod
    public void listBonded(PluginCall call) {
        BluetoothAdapter a = adapter();
        if (a == null) {
            call.reject("Bluetooth absent");
            return;
        }
        try {
            JSArray list = new JSArray();
            Set<BluetoothDevice> bonded = a.getBondedDevices();
            if (bonded != null) {
                for (BluetoothDevice d : bonded) {
                    JSObject o = new JSObject();
                    o.put("deviceId", d.getAddress());
                    o.put("name", d.getName());
                    o.put("type", d.getType());
                    JSArray uuids = new JSArray();
                    ParcelUuid[] ids = d.getUuids();
                    if (ids != null) for (ParcelUuid u : ids) uuids.put(u.toString());
                    o.put("uuids", uuids);
                    list.put(o);
                }
            }
            JSObject ret = new JSObject();
            ret.put("devices", list);
            call.resolve(ret);
        } catch (SecurityException e) {
            call.reject("Autorisation « Appareils à proximité » manquante");
        }
    }

    /** Recherche Bluetooth classique (≈ 12 s) : appareils visibles, avec leur nom et leur signal. */
    @PluginMethod
    public void discover(PluginCall call) {
        BluetoothAdapter a = adapter();
        if (a == null) {
            call.reject("Bluetooth absent");
            return;
        }
        int timeoutMs = call.getInt("timeoutMs", 12000);
        Map<String, JSObject> found = new LinkedHashMap<>();
        Handler main = new Handler(Looper.getMainLooper());
        final boolean[] done = {false};
        final BroadcastReceiver[] holder = new BroadcastReceiver[1];
        Runnable finish = () -> {
            if (done[0]) return;
            done[0] = true;
            try {
                a.cancelDiscovery();
            } catch (SecurityException ignored) {
                // autorisation retirée entre-temps
            }
            try {
                getContext().unregisterReceiver(holder[0]);
            } catch (IllegalArgumentException ignored) {
                // déjà désinscrit
            }
            JSArray list = new JSArray();
            for (JSObject o : found.values()) list.put(o);
            JSObject ret = new JSObject();
            ret.put("devices", list);
            call.resolve(ret);
        };
        holder[0] = new BroadcastReceiver() {
            @Override
            public void onReceive(Context ctx, Intent intent) {
                if (BluetoothDevice.ACTION_FOUND.equals(intent.getAction())) {
                    BluetoothDevice d = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                    if (d == null) return;
                    try {
                        JSObject o = new JSObject();
                        o.put("deviceId", d.getAddress());
                        o.put("name", d.getName());
                        o.put("type", d.getType());
                        o.put("bonded", d.getBondState() == BluetoothDevice.BOND_BONDED);
                        short rssi = intent.getShortExtra(BluetoothDevice.EXTRA_RSSI, Short.MIN_VALUE);
                        if (rssi != Short.MIN_VALUE) o.put("rssi", (int) rssi);
                        found.put(d.getAddress(), o);
                    } catch (SecurityException ignored) {
                        // nom illisible sans autorisation
                    }
                } else if (BluetoothAdapter.ACTION_DISCOVERY_FINISHED.equals(intent.getAction())) {
                    main.post(finish);
                }
            }
        };
        IntentFilter filter = new IntentFilter(BluetoothDevice.ACTION_FOUND);
        filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
        ContextCompat.registerReceiver(getContext(), holder[0], filter, ContextCompat.RECEIVER_EXPORTED);
        try {
            a.cancelDiscovery();
            if (!a.startDiscovery()) {
                done[0] = true;
                getContext().unregisterReceiver(holder[0]);
                call.reject("Recherche Bluetooth impossible (Bluetooth éteint ?)");
                return;
            }
        } catch (SecurityException e) {
            done[0] = true;
            getContext().unregisterReceiver(holder[0]);
            call.reject("Autorisation « Appareils à proximité » manquante");
            return;
        }
        main.postDelayed(finish, timeoutMs);
    }

    /**
     * Demande de liaison Android (createBond) : Android affiche sa boîte de confirmation. Résout avec
     * l'état final : « bonded » (appairée) ou « none » (refusée / expirée).
     */
    @PluginMethod
    public void pair(PluginCall call) {
        String id = call.getString("deviceId");
        int timeoutMs = call.getInt("timeoutMs", 60000);
        BluetoothAdapter a = adapter();
        if (a == null || id == null) {
            call.reject("Paramètres manquants ou Bluetooth absent");
            return;
        }
        Handler main = new Handler(Looper.getMainLooper());
        final boolean[] done = {false};
        final BroadcastReceiver[] holder = new BroadcastReceiver[1];
        final java.util.function.Consumer<String> finish = (state) -> {
            if (done[0]) return;
            done[0] = true;
            try {
                getContext().unregisterReceiver(holder[0]);
            } catch (IllegalArgumentException ignored) {
                // déjà désinscrit
            }
            JSObject ret = new JSObject();
            ret.put("state", state);
            call.resolve(ret);
        };
        holder[0] = new BroadcastReceiver() {
            @Override
            public void onReceive(Context ctx, Intent intent) {
                BluetoothDevice d = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                if (d == null || !id.equalsIgnoreCase(d.getAddress())) return;
                int state = intent.getIntExtra(BluetoothDevice.EXTRA_BOND_STATE, BluetoothDevice.ERROR);
                if (state == BluetoothDevice.BOND_BONDED) main.post(() -> finish.accept("bonded"));
                else if (state == BluetoothDevice.BOND_NONE) main.post(() -> finish.accept("none"));
            }
        };
        ContextCompat.registerReceiver(getContext(), holder[0], new IntentFilter(BluetoothDevice.ACTION_BOND_STATE_CHANGED), ContextCompat.RECEIVER_EXPORTED);
        try {
            a.cancelDiscovery();
            BluetoothDevice device = a.getRemoteDevice(id);
            if (device.getBondState() == BluetoothDevice.BOND_BONDED) {
                finish.accept("bonded");
                return;
            }
            if (!device.createBond()) {
                finish.accept("none");
                return;
            }
        } catch (SecurityException e) {
            done[0] = true;
            getContext().unregisterReceiver(holder[0]);
            call.reject("Autorisation « Appareils à proximité » manquante");
            return;
        } catch (IllegalArgumentException e) {
            done[0] = true;
            getContext().unregisterReceiver(holder[0]);
            call.reject("Adresse Bluetooth invalide");
            return;
        }
        main.postDelayed(() -> finish.accept("none"), timeoutMs);
    }

    /** Réglages Bluetooth d'Android (oublier un ancien appairage, appairer à la main). */
    @PluginMethod
    public void openBluetoothSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_BLUETOOTH_SETTINGS);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String id = call.getString("deviceId");
        String uuid = call.getString("uuid");
        int timeoutMs = call.getInt("timeoutMs", 15000);
        BluetoothAdapter a = adapter();
        if (a == null || id == null || uuid == null) {
            call.reject("Paramètres manquants ou Bluetooth absent");
            return;
        }
        closeQuietly();
        // Liaison partagée avec la relecture d'arrière-plan (§9.1 g) : jamais deux connexions à la montre.
        if (!LinkLock.SHARED.tryAcquire(LinkLock.APP)) {
            call.reject("Montre occupée : relecture en arrière-plan en cours", "busy");
            return;
        }
        new Thread(() -> {
            BluetoothSocket s = null;
            try {
                a.cancelDiscovery();
                BluetoothDevice device = a.getRemoteDevice(id);
                s = device.createRfcommSocketToServiceRecord(UUID.fromString(uuid));
                final BluetoothSocket pending = s;
                Thread watchdog = new Thread(() -> {
                    try {
                        Thread.sleep(timeoutMs);
                        if (!pending.isConnected()) pending.close();
                    } catch (Exception ignored) {
                        // fin normale
                    }
                });
                watchdog.start();
                s.connect();
                watchdog.interrupt();
                synchronized (this) {
                    socket = s;
                    out = s.getOutputStream();
                }
                startReader(s, s.getInputStream());
                call.resolve();
            } catch (SecurityException e) {
                LinkLock.SHARED.release(LinkLock.APP);
                call.reject("Autorisation « Appareils à proximité » manquante");
            } catch (Exception e) {
                LinkLock.SHARED.release(LinkLock.APP);
                if (s != null) {
                    try {
                        s.close();
                    } catch (IOException ignored) {
                        // déjà fermé
                    }
                }
                call.reject("Connexion RFCOMM impossible : " + e.getMessage());
            }
        }).start();
    }

    private void startReader(BluetoothSocket s, InputStream in) {
        reader = new Thread(() -> {
            byte[] buf = new byte[2048];
            try {
                int n;
                while ((n = in.read(buf)) > 0) {
                    JSObject o = new JSObject();
                    o.put("value", toHex(buf, n));
                    notifyListeners("data", o);
                }
            } catch (IOException ignored) {
                // socket fermé
            }
            synchronized (this) {
                // coupure par la montre : la liaison est rendue (sauf si une nouvelle connexion l'a déjà reprise)
                if (socket == s) {
                    socket = null;
                    out = null;
                    LinkLock.SHARED.release(LinkLock.APP);
                }
            }
            notifyListeners("disconnected", new JSObject());
        });
        reader.start();
    }

    @PluginMethod
    public void write(PluginCall call) {
        String hex = call.getString("value", "");
        try {
            OutputStream o;
            synchronized (this) {
                o = out;
            }
            if (o == null) {
                call.reject("Pas de connexion");
                return;
            }
            o.write(fromHex(hex));
            o.flush();
            call.resolve();
        } catch (Exception e) {
            call.reject("Écriture impossible : " + e.getMessage());
        }
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        closeQuietly();
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        closeQuietly();
    }

    private synchronized void closeQuietly() {
        if (socket != null) {
            try {
                socket.close();
            } catch (IOException ignored) {
                // déjà fermé
            }
        }
        socket = null;
        out = null;
        LinkLock.SHARED.release(LinkLock.APP);
    }

    private static String toHex(byte[] b, int n) {
        StringBuilder sb = new StringBuilder(n * 2);
        for (int i = 0; i < n; i++) sb.append(String.format("%02x", b[i] & 0xff));
        return sb.toString();
    }

    private static byte[] fromHex(String s) {
        String h = s.replaceAll("[^0-9a-fA-F]", "");
        byte[] b = new byte[h.length() / 2];
        for (int i = 0; i < b.length; i++) b[i] = (byte) Integer.parseInt(h.substring(i * 2, i * 2 + 2), 16);
        return b;
    }
}
