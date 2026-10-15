package com.healthtrack.app;

import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;

import com.healthtrack.app.huawei.WatchLink;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.UUID;

/**
 * Socket Bluetooth classique (RFCOMM) vers une montre Huawei pour le client Java « synchro seule »
 * (journal/protocoles/huawei.md §1 et §9.1) : même service et même délai de connexion que
 * BtClassicPlugin.connect, sans passer par le JS. Toujours fermé après usage (PR GB 6367).
 */
public final class RfcommTransport implements WatchLink.Transport {

    /** Service SDP des montres Huawei GT 3 → GT 7 (§1). */
    public static final UUID HUAWEI_RFCOMM = UUID.fromString("82ff3820-8411-400c-b85a-55bdb32cf060");

    private final BluetoothSocket socket;
    private final InputStream in;
    private final OutputStream out;

    private RfcommTransport(BluetoothSocket socket) throws IOException {
        this.socket = socket;
        this.in = socket.getInputStream();
        this.out = socket.getOutputStream();
    }

    /** Connexion à la montre appairée `address` ; abandon après `timeoutMs`. Exige BLUETOOTH_CONNECT. */
    @SuppressLint("MissingPermission")
    public static RfcommTransport open(BluetoothAdapter adapter, String address, long timeoutMs) throws IOException {
        if (adapter == null || !adapter.isEnabled()) throw new IOException("Bluetooth éteint ou absent");
        adapter.cancelDiscovery();
        BluetoothDevice device = adapter.getRemoteDevice(address);
        BluetoothSocket s = device.createRfcommSocketToServiceRecord(HUAWEI_RFCOMM);
        Thread watchdog = new Thread(() -> {
            try {
                Thread.sleep(timeoutMs);
                if (!s.isConnected()) s.close();
            } catch (InterruptedException | IOException ignored) {
                // connexion établie ou socket déjà fermé
            }
        }, "huawei-rfcomm-watchdog");
        watchdog.start();
        try {
            s.connect();
        } catch (IOException e) {
            try {
                s.close();
            } catch (IOException ignored) {
                // déjà fermé
            }
            throw new IOException("Connexion RFCOMM impossible : " + e.getMessage(), e);
        } finally {
            watchdog.interrupt();
        }
        return new RfcommTransport(s);
    }

    @Override
    public void write(byte[] bytes) throws IOException {
        out.write(bytes);
        out.flush();
    }

    @Override
    public int read(byte[] buffer) throws IOException {
        return in.read(buffer);
    }

    @Override
    public void close() throws IOException {
        socket.close();
    }
}
