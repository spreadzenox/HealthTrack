package com.healthtrack.app;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.os.ParcelUuid;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Set;
import java.util.UUID;

/**
 * Bluetooth « classique » (RFCOMM) pour les montres qui ne parlent pas en BLE GATT, comme les
 * Huawei Watch GT 3 → GT 7 (src/devices/huawei/classicTransport.js). Une seule connexion à la fois.
 * Les octets passent en hexadécimal ; rien n'est gardé côté natif. L'autorisation « Appareils à
 * proximité » (BLUETOOTH_CONNECT) est demandée par la couche BLE avant tout appel.
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
                startReader(s.getInputStream());
                call.resolve();
            } catch (SecurityException e) {
                call.reject("Autorisation « Appareils à proximité » manquante");
            } catch (Exception e) {
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

    private void startReader(InputStream in) {
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
