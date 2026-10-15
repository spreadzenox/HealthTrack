package com.healthtrack.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;

/**
 * Notification « la montre a refusé la clé » après une relecture app tuée (huawei.md §9.1 f) : jamais de
 * réappairage en arrière-plan, l'utilisateur rouvre l'app et touche « Synchroniser la montre ». Silencieuse si
 * les notifications de l'app ne sont pas autorisées (la carte montre dit déjà « Synchro en pause »).
 */
final class WatchNotifications {

    static final String CHANNEL = "watch_sync";
    private static final int KEY_REJECTED_ID = 7302;

    private WatchNotifications() {
    }

    static void keyRejected(Context context, String watchName) {
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null || !nm.areNotificationsEnabled()) return;
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Synchro de la montre",
                    NotificationManager.IMPORTANCE_DEFAULT));
            Intent open = new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            PendingIntent tap = PendingIntent.getActivity(context, 0, open,
                    PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            String who = watchName == null || watchName.isEmpty() ? "La montre" : watchName;
            nm.notify(KEY_REJECTED_ID, new Notification.Builder(context, CHANNEL)
                    .setSmallIcon(android.R.drawable.stat_notify_sync_noanim)
                    .setContentTitle("Synchro de la montre en pause")
                    .setContentText(who + " n'accepte plus la connexion. Ouvrez HealthTrack → « Synchroniser la montre ».")
                    .setStyle(new Notification.BigTextStyle().bigText(who
                            + " n'accepte plus la connexion de HealthTrack (elle a peut-être été réinitialisée ou liée à une"
                            + " autre app). Ouvrez HealthTrack et touchez « Synchroniser la montre »."))
                    .setContentIntent(tap)
                    .setAutoCancel(true)
                    .build());
        } catch (RuntimeException ignored) {
            // notification facultative
        }
    }
}
