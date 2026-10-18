package com.healthtrack.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
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
import com.healthtrack.app.huawei.CaptureInbox;

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
 * (`face-bursts/`) que le JS importera. Écran éteint, il ne fait rien. START_NOT_STICKY : Android ne permet pas
 * de relancer un service caméra depuis l'arrière-plan ; si le service est tué, l'app le voit et propose de le
 * relancer. Le diagnostic (compteurs, temps, raisons des sauts et des rejets) vit dans les préférences
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

    private static volatile boolean running;

    private HandlerThread thread;
    private Handler handler;
    private FaceModels models;
    private FacePipeline pipeline;

    private final BroadcastReceiver screen = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (handler == null) return;
            if (Intent.ACTION_USER_PRESENT.equals(intent.getAction())) {
                handler.postDelayed(() -> burst(FaceSchedule.TRIGGER_UNLOCK), UNLOCK_DELAY_MS);
            } else if (Intent.ACTION_SCREEN_OFF.equals(intent.getAction())) {
                handler.removeCallbacksAndMessages(null);
            }
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
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        // ACTION_USER_PRESENT n'est pas livré aux récepteurs du manifeste : récepteur dynamique, vivant avec le service.
        ContextCompat.registerReceiver(this, screen, filter, ContextCompat.RECEIVER_NOT_EXPORTED);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();
        if (ACTION_STOP.equals(action)) {
            prefs(this).edit().putBoolean("enabled", false).apply();
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
        if (!running) {
            running = true;
            prefs(this).edit().putBoolean("enabled", true).putLong("startedAt", System.currentTimeMillis())
                    .putInt("startBattery", batteryPercent(this)).remove("lastError").apply();
        }
        if (ACTION_TEST.equals(action)) handler.post(() -> burst(FaceSchedule.TRIGGER_MANUAL));
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

    /** Une rafale, sur le fil du service (jamais deux à la fois). */
    private void burst(String trigger) {
        SharedPreferences p = prefs(this);
        long now = System.currentTimeMillis();
        String day = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).format(new Date(now));
        if (!day.equals(p.getString("day", null))) {
            p.edit().putString("day", day).putInt("dayUnlocks", 0).putInt("dayBursts", 0).putInt("dayFaces", 0).apply();
        }
        int today = p.getInt("dayBursts", 0);
        boolean unlock = FaceSchedule.TRIGGER_UNLOCK.equals(trigger);
        if (unlock) p.edit().putInt("dayUnlocks", p.getInt("dayUnlocks", 0) + 1).apply();
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        String skip = FaceSchedule.decide(trigger, now, p.getLong("lastBurstAt", 0), today,
                pm == null || pm.isInteractive(), inCall(), thermal(pm));
        if (skip == null && !hasCameraPermission(this)) skip = "no_permission";
        if (skip == null && !ensurePipeline()) skip = "no_models";
        if (skip != null) {
            outcome(trigger, "skip:" + skip, now);
            return;
        }
        FaceCamera.Capture cap = FaceCamera.capture(this, FRAMES);
        if (cap.error != null) {
            outcome(trigger, "camera:" + cap.error, now);
            return;
        }
        long t0 = SystemClock.elapsedRealtime();
        List<String> rejections = new ArrayList<>();
        FaceIndices.Burst result;
        try {
            result = pipeline.burst(cap.images, cap.width, cap.height, rejections);
        } catch (RuntimeException e) {
            outcome(trigger, "inference_error", now);
            return;
        } finally {
            cap.images.clear(); // images oubliées dès l'inférence faite
        }
        long inferenceMs = SystemClock.elapsedRealtime() - t0;
        String json = FaceRecord.json(now, trigger, FRAMES, result, rejections, cap.openMs, inferenceMs);
        try {
            inbox(this).put(json, now);
        } catch (Exception e) {
            outcome(trigger, "store_error", now);
            return;
        }
        SharedPreferences.Editor e = p.edit();
        if (unlock) e.putLong("lastBurstAt", now).putInt("dayBursts", today + 1);
        if (unlock && result != null) e.putInt("dayFaces", p.getInt("dayFaces", 0) + 1);
        e.putLong("sumCameraMs", p.getLong("sumCameraMs", 0) + cap.openMs)
                .putLong("sumInferenceMs", p.getLong("sumInferenceMs", 0) + inferenceMs)
                .putInt("timed", p.getInt("timed", 0) + 1);
        for (String r : rejections) e.putInt("r_" + r, p.getInt("r_" + r, 0) + 1);
        e.apply();
        outcome(trigger, result != null ? "face" : "no_valid_frame", now);
    }

    private void outcome(String trigger, String what, long at) {
        SharedPreferences p = prefs(this);
        String key = "n_" + what;
        p.edit().putString("lastOutcome", what).putString("lastTrigger", trigger).putLong("lastOutcomeAt", at)
                .putInt(key, p.getInt(key, 0) + 1).apply();
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
