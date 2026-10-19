package com.healthtrack.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.AppOpsManager;
import android.app.KeyguardManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.media.AudioManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.SystemClock;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

import com.healthtrack.app.face.FaceIndices;
import com.healthtrack.app.face.FacePipeline;
import com.healthtrack.app.face.FaceRecord;
import com.healthtrack.app.face.FaceSchedule;
import com.healthtrack.app.face.UnlockWatch;
import com.healthtrack.app.huawei.CaptureInbox;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * « Lecture du visage » (journal/IDEES.md I88, protocoles/visage.md §8) : service de premier plan de type
 * caméra, démarré seulement depuis l'app ouverte (interrupteur de la carte, FaceSensePlugin). Tant qu'il vit, il
 * écoute le déverrouillage : 3 images de la caméra frontale en basse résolution, analysées sur le téléphone
 * (FacePipeline + LiteRT), puis oubliées ; seuls les indices de la rafale sont déposés dans une boîte privée
 * (`face-bursts/`) que le JS importera. Déverrouillage repéré par UnlockWatch (diffusion, sinon interrogation du
 * verrou après l'allumage). Écran éteint, il ne fait rien. START_NOT_STICKY : Android ne permet pas
 * de relancer un service caméra depuis l'arrière-plan ; si le service est tué, l'app le voit et propose de le
 * relancer, et FaceResumeJob / FaceResumeReceiver postent une notification « Reprendre » (FaceResumeNotice). Le diagnostic (compteurs, temps, raisons des sauts et des rejets) vit dans les préférences
 * `face_sense`, sans aucun score.
 */
public class FaceSenseService extends Service {

    static final String ACTION_START = "com.healthtrack.app.face.START";
    static final String ACTION_STOP = "com.healthtrack.app.face.STOP";
    static final String ACTION_TEST = "com.healthtrack.app.face.TEST";
    static final String PREFS = "face_sense";
    static final String CHANNEL = "face_sense";
    static final int NOTIFICATION_ID = 7310;
    static final int FRAMES = 3;
    static final int INBOX_MAX = 3000;
    /** Le déverrouillage joue son animation : on laisse le visage se poser face à l'écran. */
    static final long UNLOCK_DELAY_MS = 1200;
    /** Qui a demandé le démarrage : l'app à l'écran (accès caméra « pendant l'utilisation » acquis) ou non. */
    static final String EXTRA_ORIGIN = "origin";
    static final String ORIGIN_APP = "app";
    static final String ORIGIN_BACKGROUND = "background";
    /** Dernières tentatives gardées pour le diagnostic (heure, source, résultat ou erreur exacte). */
    static final int ATTEMPTS_KEPT = 12;

    private static volatile boolean running;

    private HandlerThread thread;
    private Handler handler;
    private FaceModels models;
    private FacePipeline pipeline;
    /** Lu et modifié seulement sur le fil du service (récepteur et interrogations y sont livrés). */
    private final UnlockWatch watch = new UnlockWatch();

    private final BroadcastReceiver screen = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            Handler h = handler;
            if (h == null) return;
            String action = intent.getAction();
            long now = SystemClock.elapsedRealtime();
            if (Intent.ACTION_SCREEN_ON.equals(action)) {
                count("dayScreenOns", "lastScreenOnAt");
                String source = watch.onScreenOn(now, keyguardLocked());
                if (source != null) unlocked(source, now);
                else h.postDelayed(poll, UnlockWatch.POLL_EVERY_MS);
            } else if (Intent.ACTION_USER_PRESENT.equals(action)) {
                count("dayPresents", "lastPresentAt");
                String source = watch.onUserPresent(now);
                if (source != null) unlocked(source, now);
            } else if (Intent.ACTION_SCREEN_OFF.equals(action)) {
                watch.onScreenOff();
                h.removeCallbacksAndMessages(null);
            }
        }
    };

    /** Secours si ACTION_USER_PRESENT n'arrive pas : l'écran de verrouillage a-t-il disparu ? */
    private final Runnable poll = new Runnable() {
        @Override
        public void run() {
            Handler h = handler;
            if (h == null || !watch.polling()) return;
            long now = SystemClock.elapsedRealtime();
            String source = watch.onPoll(now, keyguardLocked());
            if (source != null) unlocked(source, now);
            else if (watch.polling()) h.postDelayed(this, UnlockWatch.POLL_EVERY_MS);
        }
    };

    static boolean isRunning() {
        return running;
    }

    static File inboxDir(Context context) {
        return new File(context.getFilesDir(), "face-bursts");
    }

    static CaptureInbox inbox(Context context) {
        return new CaptureInbox(inboxDir(context), INBOX_MAX);
    }

    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static boolean hasCameraPermission(Context context) {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        thread = new HandlerThread("face-sense");
        thread.start();
        handler = new Handler(thread.getLooper());
        IntentFilter filter = new IntentFilter(Intent.ACTION_USER_PRESENT);
        filter.addAction(Intent.ACTION_SCREEN_ON);
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        // Ces diffusions ne sont pas livrées aux récepteurs du manifeste : récepteur dynamique, recréé avec le
        // service à chaque démarrage. EXPORTED et non NOT_EXPORTED : ACTION_USER_PRESENT est envoyée par l'écran
        // de verrouillage (SystemUI, pas l'uid système), qu'un récepteur « non exporté » ne reçoit pas — d'où aucun
        // déverrouillage vu sur le Galaxy A56 (signalement du 19/10 15:05). Ce sont des diffusions protégées : aucune
        // autre app ne peut les envoyer. Livrées sur le fil du service, comme les interrogations du verrou.
        ContextCompat.registerReceiver(this, screen, filter, null, handler, ContextCompat.RECEIVER_EXPORTED);
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null && pm.isInteractive()) {
            // Démarré écran allumé (depuis l'app) : on part de l'état réel du verrou.
            handler.post(() -> {
                if (!keyguardLocked()) watch.onScreenOn(SystemClock.elapsedRealtime(), false);
            });
        }
    }

    private boolean keyguardLocked() {
        KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
        return km != null && km.isKeyguardLocked();
    }

    /** Un déverrouillage repéré (UnlockWatch) : compté par source, puis une rafale une fois l'animation passée. */
    private void unlocked(String source, long unlockAt) {
        count("dayUnlock_" + source, null);
        prefs(this).edit().putLong("lastUnlockAt", System.currentTimeMillis()).putString("lastUnlockSource", source).apply();
        Handler h = handler;
        if (h != null) h.postDelayed(() -> burst(FaceSchedule.TRIGGER_UNLOCK, source, unlockAt, false), UNLOCK_DELAY_MS);
    }

    /** +1 à un compteur du jour (remis à zéro à minuit), et l'heure de l'événement si `atKey`. */
    private void count(String key, String atKey) {
        SharedPreferences p = prefs(this);
        long now = System.currentTimeMillis();
        rollDay(p, now);
        SharedPreferences.Editor e = p.edit().putInt(key, p.getInt(key, 0) + 1);
        if (atKey != null) e.putLong(atKey, now);
        e.apply();
    }

    /** Nouveau jour : les compteurs « day… » repartent de zéro. */
    private static void rollDay(SharedPreferences p, long now) {
        String day = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).format(new Date(now));
        if (day.equals(p.getString("day", null))) return;
        SharedPreferences.Editor e = p.edit().putString("day", day);
        for (String k : p.getAll().keySet()) if (k.startsWith("day") && !k.equals("day")) e.remove(k);
        e.putInt("dayUnlocks", 0).putInt("dayBursts", 0).putInt("dayFaces", 0).apply();
    }

    /** Mode d'accès caméra accordé par Android (appops) : allow, foreground, ignore, deny, default ; null si inconnu. */
    static String cameraOpMode(Context context) {
        if (Build.VERSION.SDK_INT < 29) return null;
        AppOpsManager ops = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
        if (ops == null) return null;
        try {
            int mode = ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_CAMERA, android.os.Process.myUid(), context.getPackageName());
            switch (mode) {
                case AppOpsManager.MODE_ALLOWED: return "allow";
                case AppOpsManager.MODE_FOREGROUND: return "foreground";
                case AppOpsManager.MODE_IGNORED: return "ignore";
                case AppOpsManager.MODE_ERRORED: return "deny";
                case AppOpsManager.MODE_DEFAULT: return "default";
                default: return String.valueOf(mode);
            }
        } catch (RuntimeException e) {
            return null;
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();
        if (ACTION_STOP.equals(action)) {
            prefs(this).edit().putBoolean("enabled", false).apply();
            FaceResumeNotice.cancel(this);
            FaceResumeJob.cancel(this);
            stopSelf();
            return START_NOT_STICKY;
        }
        if (!hasCameraPermission(this)) {
            note("lastError", "no_permission");
            stopSelf();
            return START_NOT_STICKY;
        }
        try {
            int type = Build.VERSION.SDK_INT >= 30 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA : 0;
            ServiceCompat.startForeground(this, NOTIFICATION_ID, notification(), type);
        } catch (RuntimeException e) {
            // Android 12+ : démarrage refusé hors de l'app ouverte ; Android 14+ : permission caméra retirée.
            note("lastError", "start_refused:" + e.getClass().getSimpleName());
            stopSelf();
            return START_NOT_STICKY;
        }
        FaceResumeNotice.cancel(this);
        if (!running) {
            running = true;
            String origin = intent == null ? null : intent.getStringExtra(EXTRA_ORIGIN);
            SharedPreferences p = prefs(this);
            p.edit().putBoolean("enabled", true).putLong("startedAt", System.currentTimeMillis())
                    .putInt("startBattery", batteryPercent(this)).remove("lastError")
                    .putString("startOrigin", ORIGIN_APP.equals(origin) ? ORIGIN_APP : ORIGIN_BACKGROUND)
                    .putString("startAction", action == null ? "sticky" : action.substring(action.lastIndexOf('.') + 1))
                    .putInt("starts", p.getInt("starts", 0) + 1).apply();
        }
        if (ACTION_TEST.equals(action)) handler.post(() -> burst(FaceSchedule.TRIGGER_MANUAL, "test", 0, false));
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        running = false;
        prefs(this).edit().putLong("stoppedAt", System.currentTimeMillis()).apply();
        try {
            unregisterReceiver(screen);
        } catch (IllegalArgumentException ignored) {
            // déjà retiré
        }
        Handler h = handler;
        handler = null;
        if (h != null) {
            h.removeCallbacksAndMessages(null);
            h.post(this::closeModels);
        }
        if (thread != null) thread.quitSafely();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    /**
     * Une rafale, sur le fil du service (jamais deux à la fois). `retry` : 2e essai du même déverrouillage
     * (FaceSchedule.shouldRetry, I118), qui ne compte ni comme un nouveau déverrouillage ni comme une nouvelle
     * rafale du jour, et n'est pas soumis à l'intervalle minimal posé par le 1er essai.
     */
    private void burst(String trigger, String source, long unlockAt, boolean retry) {
        SharedPreferences p = prefs(this);
        long now = System.currentTimeMillis();
        rollDay(p, now);
        int today = p.getInt("dayBursts", 0);
        boolean unlock = FaceSchedule.TRIGGER_UNLOCK.equals(trigger);
        if (unlock && !retry) p.edit().putInt("dayUnlocks", p.getInt("dayUnlocks", 0) + 1).apply();
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        String skip = FaceSchedule.decide(trigger, now, retry ? 0 : p.getLong("lastBurstAt", 0), today,
                pm == null || pm.isInteractive(), inCall(), thermal(pm));
        if (skip == null && !hasCameraPermission(this)) skip = "no_permission";
        if (skip == null && !ensurePipeline()) skip = "no_models";
        if (skip != null) {
            outcome(trigger, source, retry, "skip:" + skip, null, now);
            return;
        }
        FaceCamera.Capture cap = FaceCamera.capture(this, FRAMES);
        if (cap.error != null) {
            outcome(trigger, source, retry, "camera:" + cap.error, cap.detail, now);
            return;
        }
        long t0 = SystemClock.elapsedRealtime();
        List<String> rejections = new ArrayList<>();
        FaceIndices.Burst result;
        try {
            result = pipeline.burst(cap.images, cap.width, cap.height, rejections);
        } catch (RuntimeException e) {
            outcome(trigger, source, retry, "inference_error", e.getClass().getSimpleName(), now);
            return;
        } finally {
            cap.images.clear(); // images oubliées dès l'inférence faite
        }
        long inferenceMs = SystemClock.elapsedRealtime() - t0;
        String json = FaceRecord.json(now, trigger, FRAMES, result, rejections, cap.openMs, inferenceMs);
        try {
            inbox(this).put(json, now);
        } catch (Exception e) {
            outcome(trigger, source, retry, "store_error", e.getClass().getSimpleName(), now);
            return;
        }
        SharedPreferences.Editor e = p.edit();
        if (unlock && !retry) e.putLong("lastBurstAt", now).putInt("dayBursts", today + 1);
        if (retry) e.putInt("retries", p.getInt("retries", 0) + 1);
        if (retry && result != null) e.putInt("retryFaces", p.getInt("retryFaces", 0) + 1);
        if (unlock && result != null) e.putInt("dayFaces", p.getInt("dayFaces", 0) + 1);
        e.putLong("sumCameraMs", p.getLong("sumCameraMs", 0) + cap.openMs)
                .putLong("sumInferenceMs", p.getLong("sumInferenceMs", 0) + inferenceMs)
                .putInt("timed", p.getInt("timed", 0) + 1);
        for (String r : rejections) e.putInt("r_" + r, p.getInt("r_" + r, 0) + 1);
        e.apply();
        outcome(trigger, source, retry, result != null ? "face" : "no_valid_frame", null, now);
        Handler h = handler;
        if (h != null && FaceSchedule.shouldRetry(trigger, result != null, retry, SystemClock.elapsedRealtime() - unlockAt)) {
            // Annulé avec le reste si l'écran s'éteint d'ici là (récepteur SCREEN_OFF).
            h.postDelayed(() -> burst(trigger, source, unlockAt, true), FaceSchedule.RETRY_DELAY_MS);
        }
    }

    private void outcome(String trigger, String source, boolean retry, String what, String detail, long at) {
        SharedPreferences p = prefs(this);
        String key = "n_" + what;
        p.edit().putString("lastOutcome", what).putString("lastTrigger", trigger).putLong("lastOutcomeAt", at)
                .putInt(key, p.getInt(key, 0) + 1)
                .putString("attempts", appendAttempt(p.getString("attempts", null), at, trigger, source, retry, what, detail))
                .apply();
    }

    /** Journal des dernières tentatives (JSON, ATTEMPTS_KEPT au plus) : jamais un score, seulement ce qui s'est passé. */
    static String appendAttempt(String json, long at, String trigger, String source, boolean retry, String what, String detail) {
        JSONArray out = new JSONArray();
        try {
            JSONArray old = json == null ? new JSONArray() : new JSONArray(json);
            for (int i = Math.max(0, old.length() - (ATTEMPTS_KEPT - 1)); i < old.length(); i++) out.put(old.get(i));
            JSONObject a = new JSONObject().put("at", at).put("trigger", trigger).put("outcome", what);
            if (source != null) a.put("source", source);
            if (retry) a.put("retry", true);
            if (detail != null) a.put("detail", detail);
            out.put(a);
        } catch (JSONException e) {
            return json;
        }
        return out.toString();
    }

    private boolean ensurePipeline() {
        if (pipeline != null) return true;
        if (!FaceModels.available(getAssets())) return false;
        long t0 = SystemClock.elapsedRealtime();
        try {
            models = FaceModels.open(getAssets());
            pipeline = models.pipeline();
        } catch (Exception | LinkageError e) {
            note("lastError", "models:" + e.getClass().getSimpleName());
            return false;
        }
        prefs(this).edit().putLong("modelLoadMs", SystemClock.elapsedRealtime() - t0).apply();
        return true;
    }

    private void closeModels() {
        pipeline = null;
        if (models != null) models.close();
        models = null;
    }

    private boolean inCall() {
        AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (am == null) return false;
        int mode = am.getMode();
        return mode == AudioManager.MODE_IN_CALL || mode == AudioManager.MODE_IN_COMMUNICATION;
    }

    private static double thermal(PowerManager pm) {
        if (pm == null || Build.VERSION.SDK_INT < 30) return Double.NaN;
        return pm.getThermalHeadroom(10);
    }

    static int batteryPercent(Context context) {
        BatteryManager bm = (BatteryManager) context.getSystemService(Context.BATTERY_SERVICE);
        return bm == null ? -1 : bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
    }

    private void note(String key, String value) {
        prefs(this).edit().putString(key, value).putLong(key + "At", System.currentTimeMillis()).apply();
    }

    private Notification notification() {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null && Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Lecture du visage", NotificationManager.IMPORTANCE_MIN);
            ch.setDescription("Service actif tant que la lecture du visage est activée dans HealthTrack.");
            nm.createNotificationChannel(ch);
        }
        int immutable = PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT;
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent content = open == null ? null : PendingIntent.getActivity(this, 0, open, immutable);
        PendingIntent stop = PendingIntent.getService(this, 1,
                new Intent(this, FaceSenseService.class).setAction(ACTION_STOP), immutable);
        return new NotificationCompat.Builder(this, CHANNEL)
                .setSmallIcon(android.R.drawable.ic_menu_camera)
                .setContentTitle("Lecture du visage active")
                .setContentText("Quelques images au déverrouillage, analysées sur le téléphone puis effacées.")
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .setOngoing(true)
                .setContentIntent(content)
                .addAction(0, "Arrêter", stop)
                .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
                .build();
    }
}
