package com.healthtrack.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;

import androidx.core.app.NotificationCompat;

/**
 * Rappel de fin d'essai, variante play (src/services/trialReminder.js, VC-18b) : une alarme inexacte 2 jours avant le
 * premier paiement, puis une notification qui ouvre la page « Abonnements » de Google Play. Le titre, le texte et le
 * lien viennent de l'app ; ils sont gardés ici pour reprogrammer l'alarme après un redémarrage ou une mise à jour.
 */
final class TrialReminder {

    static final String CHANNEL = "trial_reminder";
    static final int NOTIFICATION_ID = 7414;
    static final String PREFS = "trial_reminder";
    static final String ACTION_ALARM = "com.healthtrack.app.trial.ALARM";

    private TrialReminder() {
    }

    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static boolean notificationsOn(Context context) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        return nm != null && nm.areNotificationsEnabled();
    }

    private static PendingIntent alarmIntent(Context context) {
        Intent i = new Intent(context, TrialReminderReceiver.class).setAction(ACTION_ALARM);
        return PendingIntent.getBroadcast(context, 2, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    static void save(Context context, long at, String title, String body, String url) {
        prefs(context).edit().putLong("at", at).putString("title", title).putString("body", body).putString("url", url).apply();
    }

    static void clear(Context context) {
        prefs(context).edit().clear().apply();
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(alarmIntent(context));
    }

    /** (Re)programme l'alarme enregistrée ; une date passée de peu (téléphone éteint) prévient tout de suite. */
    static void arm(Context context) {
        long at = prefs(context).getLong("at", 0);
        if (at <= 0) return;
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        // inexacte (aucune permission d'alarme exacte) mais tenue en Doze : quelques minutes de retard suffisent
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, Math.max(at, System.currentTimeMillis() + 60_000L), alarmIntent(context));
    }

    static void onAlarm(Context context) {
        SharedPreferences p = prefs(context);
        long at = p.getLong("at", 0);
        // le récepteur est exporté (redémarrage) : une intention venue d'ailleurs avant l'heure ne fait rien
        if (at <= 0 || System.currentTimeMillis() < at - 60 * 60_000L) return;
        String title = p.getString("title", null);
        if (title != null) post(context, title, p.getString("body", ""), p.getString("url", null));
        p.edit().clear().apply();
    }

    private static void post(Context context, String title, String body, String url) {
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null || !nm.areNotificationsEnabled()) return;
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Fin de l'essai gratuit", NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("Un rappel 2 jours avant le premier paiement de l'abonnement.");
            nm.createNotificationChannel(ch);
            Intent open = url != null
                    ? new Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    : new Intent(context, MainActivity.class);
            open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            PendingIntent tap = PendingIntent.getActivity(context, 5, open,
                    PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            nm.notify(NOTIFICATION_ID, new NotificationCompat.Builder(context, CHANNEL)
                    .setSmallIcon(R.drawable.ic_stat_healthtrack)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                    .setContentIntent(tap)
                    .setAutoCancel(true)
                    .build());
        } catch (RuntimeException ignored) {
            // un rappel manqué ne doit jamais faire planter l'app
        }
    }
}
