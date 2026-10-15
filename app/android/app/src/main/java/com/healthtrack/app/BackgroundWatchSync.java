package com.healthtrack.app;

import android.Manifest;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import com.healthtrack.app.huawei.BackgroundSync;
import com.healthtrack.app.huawei.WatchVault;

import java.security.SecureRandom;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Relecture de la montre app tuée (huawei.md §9.1 e) : lancée par WatchPresenceService quand la montre se
 * reconnecte et qu'aucune page de l'app ne tourne (sinon le JS s'en charge). Clé lue dans le coffre
 * (WatchVaultPlugin), connexion RFCOMM, lectures, capture déposée pour l'import à l'ouverture
 * (WatchCapturePlugin). Règles et état : BackgroundSync. Une clé refusée est retirée du coffre.
 */
final class BackgroundWatchSync {

    static final String PREFS = "healthtrack_watch_background";
    private static final String TAG = "HealthTrackWatch";
    private static final long CONNECT_TIMEOUT_MS = 15_000;
    private static final long REQUEST_TIMEOUT_MS = 12_000;
    private static final AtomicBoolean busy = new AtomicBoolean(false);

    private BackgroundWatchSync() {
    }

    static boolean isBusy() {
        return busy.get();
    }

    static BackgroundSync.State load(Context context, String address) {
        SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        BackgroundSync.State s = new BackgroundSync.State();
        if (address == null || !address.equalsIgnoreCase(p.getString("address", ""))) return s;
        s.lastUntil = p.getLong("lastUntil", 0);
        s.lastAttemptAt = p.getLong("lastAttemptAt", 0);
        s.lastSuccessAt = p.getLong("lastSuccessAt", 0);
        s.failures = p.getInt("failures", 0);
        s.paused = p.getBoolean("paused", false);
        s.outcome = p.getString("outcome", null);
        s.battery = p.getInt("battery", -1);
        return s;
    }

    static void save(Context context, String address, BackgroundSync.State s) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putString("address", address.toUpperCase())
                .putLong("lastUntil", s.lastUntil)
                .putLong("lastAttemptAt", s.lastAttemptAt)
                .putLong("lastSuccessAt", s.lastSuccessAt)
                .putInt("failures", s.failures)
                .putBoolean("paused", s.paused)
                .putString("outcome", s.outcome)
                .putInt("battery", s.battery)
                .apply();
    }

    private static void note(Context context, String decision) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putString("lastDecision", decision).putLong("lastDecisionAt", System.currentTimeMillis()).apply();
    }

    private static boolean canConnect(Context context) {
        return Build.VERSION.SDK_INT < 31
                || context.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
    }

    /** Relit la montre `address` si c'est dû ; rend la décision (run, app, busy, paused, no_key, recent, no_permission). */
    static String maybeStart(Context context, String address, boolean appAlive) {
        Context app = context.getApplicationContext();
        String addr = WatchVault.normalizeAddress(address);
        if (addr == null) return "no_watch";
        if (!canConnect(app)) {
            note(app, "no_permission");
            return "no_permission";
        }
        BackgroundSync.State state = load(app, addr);
        WatchVault.Credentials creds = appAlive || state.paused ? null : WatchVaultPlugin.read(app, addr);
        String decision = BackgroundSync.decide(state, System.currentTimeMillis(), appAlive, busy.get(), appAlive || creds != null);
        note(app, decision);
        if (!"run".equals(decision) || !busy.compareAndSet(false, true)) return decision;
        new Thread(() -> {
            try {
                BluetoothManager bm = (BluetoothManager) app.getSystemService(Context.BLUETOOTH_SERVICE);
                long now = System.currentTimeMillis();
                BackgroundSync.Result r = BackgroundSync.run(state,
                        () -> RfcommTransport.open(bm == null ? null : bm.getAdapter(), addr, CONNECT_TIMEOUT_MS),
                        addr, creds.name, creds.authId, creds.authToken,
                        WatchCapturePlugin.inbox(app)::put, now, now, new SecureRandom(), REQUEST_TIMEOUT_MS);
                save(app, addr, state);
                if ("key_rejected".equals(r.outcome)) WatchVaultPlugin.forget(app, addr);
                Log.i(TAG, "relecture en arrière-plan : " + r.outcome);
            } catch (RuntimeException e) {
                Log.w(TAG, "relecture en arrière-plan interrompue", e);
            } finally {
                busy.set(false);
            }
        }, "huawei-background-sync").start();
        return decision;
    }

    /** Reprise recopiée par le JS après une synchro (en direct ou importée). */
    static void shareFromApp(Context context, String address, long until, long atMs) {
        String addr = WatchVault.normalizeAddress(address);
        if (addr == null) return;
        BackgroundSync.State s = load(context, addr);
        BackgroundSync.shareFromApp(s, until, atMs);
        save(context, addr, s);
    }
}
