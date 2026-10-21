package com.healthtrack.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.healthtrack.app.face.FaceResume;

/**
 * Notification « Lecture du visage arrêtée · Reprendre » (journal/IDEES.md I88 ②). Vérifiée toutes les heures
 * (FaceResumeJob), après un redémarrage et après chaque mise à jour de l'app (FaceResumeReceiver) ; la règle est
 * dans face/FaceResume. Le geste « Reprendre » ouvre l'app (MainActivity), seule à pouvoir relancer un service
 * caméra ; « Arrêter » éteint l'interrupteur. Silencieuse (canal bas, sans son) et muette si les notifications de
 * l'app ne sont pas autorisées : la carte de Connecteurs propose de toute façon « Relancer ».
 */
final class FaceResumeNotice {

    static final String CHANNEL = "face_resume";
    static final int NOTIFICATION_ID = 7312;

    private FaceResumeNotice() {
    }

    /** Vérifie et prévient si besoin ; rend null (prévenu) ou la raison du silence. */
    static String check(Context context, String trigger) {
        SharedPreferences p = FaceSenseService.prefs(context);
        long now = System.currentTimeMillis();
        String quiet = FaceResume.decide(p.getBoolean("enabled", false), FaceSenseService.isRunning(),
                CompanionPlugin.isAppInForeground(), FaceSenseService.hasCameraPermission(context),
                p.getLong("resumeNoticeAt", 0), now, trigger);
        if (quiet == null && !post(context)) quiet = "notifications_off";
        SharedPreferences.Editor e = p.edit().putLong("resumeCheckAt", now).putString("resumeCheckTrigger", trigger)
                .putString("resumeCheck", quiet == null ? "notified" : quiet);
        if (quiet == null) e.putLong("resumeNoticeAt", now).putInt("resumeNotices", p.getInt("resumeNotices", 0) + 1);
        e.apply();
        return quiet;
    }

    private static boolean post(Context context) {
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null || !nm.areNotificationsEnabled()) return false;
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Lecture du visage arrêtée",
                    NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Prévient quand Android a arrêté la lecture du visage, pour la reprendre d'un geste.");
            nm.createNotificationChannel(ch);
            int flags = PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT;
            Intent resume = new Intent(context, MainActivity.class).setAction(MainActivity.ACTION_FACE_RESUME)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent tap = PendingIntent.getActivity(context, 2, resume, flags);
            PendingIntent stop = PendingIntent.getService(context, 3,
                    new Intent(context, FaceSenseService.class).setAction(FaceSenseService.ACTION_STOP), flags);
            nm.notify(NOTIFICATION_ID, new NotificationCompat.Builder(context, CHANNEL)
                    .setSmallIcon(R.drawable.ic_stat_healthtrack)
                    .setContentTitle("Lecture du visage arrêtée")
                    .setContentText("Android l'a mise en pause. Touchez « Reprendre » pour la relancer.")
                    .setStyle(new NotificationCompat.BigTextStyle().bigText("Android a mis la lecture du visage en"
                            + " pause (mise à jour, redémarrage ou économie de batterie). Touchez « Reprendre » : HealthTrack"
                            + " s'ouvre et la relance."))
                    .setPriority(NotificationCompat.PRIORITY_LOW)
                    .setOnlyAlertOnce(true)
                    .setAutoCancel(true)
                    .setContentIntent(tap)
                    .addAction(0, "Reprendre", tap)
                    .addAction(0, "Arrêter", stop)
                    .build());
            return true;
        } catch (RuntimeException e) {
            return false; // notification facultative
        }
    }

    static void cancel(Context context) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(NOTIFICATION_ID);
    }

    /** Geste « Reprendre » : l'app est à l'écran, Android autorise le service caméra. */
    static void resumeFromApp(Context context) {
        cancel(context);
        SharedPreferences p = FaceSenseService.prefs(context);
        p.edit().putInt("resumeTaps", p.getInt("resumeTaps", 0) + 1).apply();
        if (!p.getBoolean("enabled", false) || FaceSenseService.isRunning()
                || !FaceSenseService.hasCameraPermission(context)) return;
        try {
            ContextCompat.startForegroundService(context,
                    new Intent(context, FaceSenseService.class).setAction(FaceSenseService.ACTION_START)
                            .putExtra(FaceSenseService.EXTRA_ORIGIN, FaceSenseService.ORIGIN_APP));
        } catch (RuntimeException e) {
            p.edit().putString("lastError", "resume_refused:" + e.getClass().getSimpleName())
                    .putLong("lastErrorAt", System.currentTimeMillis()).apply();
        }
    }
}
