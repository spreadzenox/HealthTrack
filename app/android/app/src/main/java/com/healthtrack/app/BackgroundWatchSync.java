package com.healthtrack.app;

import android.Manifest;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import com.healthtrack.app.huawei.BackgroundSync;
import com.healthtrack.app.huawei.LinkLock;
import com.healthtrack.app.huawei.WatchVault;

import java.security.SecureRandom;

/**
 * Relecture de la montre app tuée ou en arrière-plan (huawei.md §9.1 e, f, g) : lancée par WatchPresenceService
 * quand la montre se reconnecte ou que le téléphone est déverrouillé pendant qu'elle est là, et par WatchSyncJob
 * (filet ~2 h), quand l'app n'est pas à l'écran (sinon le JS s'en charge). La liaison est partagée avec la page
 * (LinkLock) : jamais deux connexions à la fois. Clé lue dans le coffre
 * (WatchVaultPlugin), connexion RFCOMM, lectures, capture déposée pour l'import à l'ouverture
 * (WatchCapturePlugin). Règles et état : BackgroundSync. Une clé refusée est retirée du coffre.
 */
final class BackgroundWatchSync {

    static final String PREFS = "healthtrack_watch_background";
    private static final String TAG = "HealthTrackWatch";
    private static final long CONNECT_TIMEOUT_MS = 15_000;
    private static final long REQUEST_TIMEOUT_MS = 12_000;

    private BackgroundWatchSync() {
    }

    /** Une relecture native est en cours (la liaison est à elle). */
    static boolean isBusy() {
        return LinkLock.NATIVE.equals(LinkLock.SHARED.holder());
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

    private static void note(Context context, String decision, String trigger) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putString("lastDecision", decision).putString("lastTrigger", trigger)
                .putLong("lastDecisionAt", System.currentTimeMillis()).apply();
    }

    /** Montre connue de la relecture (recopiée par le JS après sa première synchro), sinon null. */
    static String knownAddress(Context context) {
        String a = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("address", null);
        return WatchVault.normalizeAddress(a);
    }

    /** Présence d'après le dernier événement du service compagnon (UNKNOWN sans association). */
    static int presence(Context context) {
        return BackgroundSync.presenceOf(
                context.getSharedPreferences(CompanionPlugin.PREFS, Context.MODE_PRIVATE).getString("lastEvent", null));
    }

    private static boolean canConnect(Context context) {
        return Build.VERSION.SDK_INT < 31
                || context.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
    }

    /** Relit la montre `address` si c'est dû ; rend la décision (run, app, busy, paused, no_key, recent, absent, no_permission). */
    static String maybeStart(Context context, String address, boolean appForeground) {
        return maybeStart(context, address, appForeground, BackgroundSync.TRIGGER_PRESENCE, null);
    }

    /** Idem pour un déclencheur donné ; `onDone` (facultatif) n'est appelé qu'à la fin d'une relecture lancée (« run »). */
    static String maybeStart(Context context, String address, boolean appForeground, String trigger, Runnable onDone) {
        Context app = context.getApplicationContext();
        String addr = WatchVault.normalizeAddress(address);
        String decision = addr == null ? "no_watch" : !canConnect(app) ? "no_permission" : null;
        if (decision != null) {
            if (addr != null) note(app, decision, trigger);
            return decision;
        }
        BackgroundSync.State state = load(app, addr);
        WatchVault.Credentials creds = appForeground || state.paused ? null : WatchVaultPlugin.read(app, addr);
        decision = BackgroundSync.decide(trigger, state, System.currentTimeMillis(), appForeground,
                LinkLock.SHARED.holder() != null, appForeground || creds != null, presence(app));
        if ("run".equals(decision) && !LinkLock.SHARED.tryAcquire(LinkLock.NATIVE)) decision = "busy";
        note(app, decision, trigger);
        if (!"run".equals(decision)) return decision;
        new Thread(() -> {
            try {
                BluetoothManager bm = (BluetoothManager) app.getSystemService(Context.BLUETOOTH_SERVICE);
                long now = System.currentTimeMillis();
                BackgroundSync.Result r = BackgroundSync.run(state,
                        () -> RfcommTransport.open(bm == null ? null : bm.getAdapter(), addr, CONNECT_TIMEOUT_MS),
                        addr, creds.name, creds.authId, creds.authToken,
                        WatchCapturePlugin.inbox(app)::put, now, now, new SecureRandom(), REQUEST_TIMEOUT_MS);
                save(app, addr, state);
                if ("key_rejected".equals(r.outcome)) {
                    WatchVaultPlugin.forget(app, addr);
                    WatchNotifications.keyRejected(app, creds.name);
                }
                Log.i(TAG, "relecture en arrière-plan (" + trigger + ") : " + r.outcome);
            } catch (RuntimeException e) {
                Log.w(TAG, "relecture en arrière-plan interrompue", e);
            } finally {
                LinkLock.SHARED.release(LinkLock.NATIVE);
                if (onDone != null) onDone.run();
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
        WatchSyncJob.ensureScheduled(context);
    }
}
