package com.healthtrack.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import androidx.core.app.NotificationCompat;

import com.healthtrack.app.gut.GutEvening;
import com.healthtrack.app.huawei.CaptureInbox;
import com.healthtrack.app.mood.EveningNote;

import java.io.File;
import java.io.IOException;
import java.time.ZoneId;

/**
 * Bilan du ventre du soir (journal/IDEES.md I170) : alarme quotidienne à l'heure habituelle des bilans, puis
 * notification « Et votre ventre aujourd'hui ? » avec Calme / Gêne / Douleur en actions. Le geste dépose
 * { v, level, at } dans la boîte `gut-evening/`, sans ouvrir l'app ; GutEveningPlugin la vide à l'ouverture. La règle
 * est dans gut/GutEvening ; même mécanisme que la note du soir (EveningNoteNotice). Silencieuse (canal bas, sans son).
 */
final class GutEveningNotice {

    static final String CHANNEL = "gut_evening";
    static final int NOTIFICATION_ID = 7314;
    static final String PREFS = "gut_evening";
    static final String ACTION_ALARM = "com.healthtrack.app.gut.ALARM";
    static final String ACTION_ANSWER = "com.healthtrack.app.gut.ANSWER";
    static final String EXTRA_LEVEL = "level";
    static final int INBOX_MAX = 60;

    private GutEveningNotice() {
    }

    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static CaptureInbox inbox(Context context) {
        return new CaptureInbox(new File(context.getFilesDir(), "gut-evening"), INBOX_MAX);
    }

    private static PendingIntent alarmIntent(Context context) {
        Intent i = new Intent(context, EveningNoteReceiver.class).setAction(ACTION_ALARM);
        return PendingIntent.getBroadcast(context, 2, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    /** (Re)programme l'alarme du prochain soir, ou l'annule si le rappel est éteint. */
    static void arm(Context context) {
        SharedPreferences p = prefs(context);
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = alarmIntent(context);
        if (!p.getBoolean("enabled", false)) {
            am.cancel(pi);
            p.edit().putLong("nextAt", 0).apply();
            return;
        }
        long next = GutEvening.nextAt(System.currentTimeMillis(), ZoneId.systemDefault(),
                p.getInt("minuteOfDay", GutEvening.DEFAULT_MINUTE));
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pi);
        p.edit().putLong("nextAt", next).apply();
    }

    /** Alarme du soir : demande le bilan si la règle le permet, puis programme le lendemain. */
    static String onAlarm(Context context) {
        SharedPreferences p = prefs(context);
        long now = System.currentTimeMillis();
        ZoneId zone = ZoneId.systemDefault();
        String today = EveningNote.dayKey(now, zone);
        String quiet = GutEvening.decide(p.getBoolean("enabled", false), p.getString("noteDay", null),
                p.getString("askedDay", null), today, EveningNote.minuteOfDay(now, zone),
                p.getInt("minuteOfDay", GutEvening.DEFAULT_MINUTE));
        if (quiet == null && !post(context, GutEvening.timeoutMs(now, zone))) quiet = "notifications_off";
        SharedPreferences.Editor e = p.edit().putLong("checkAt", now).putString("check", quiet == null ? "asked" : quiet);
        if (quiet == null) e.putString("askedDay", today).putInt("asked", p.getInt("asked", 0) + 1);
        e.apply();
        arm(context);
        return quiet;
    }

    private static NotificationManager channel(Context context) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || !nm.areNotificationsEnabled()) return null;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "Bilan du ventre", NotificationManager.IMPORTANCE_LOW);
        ch.setDescription("Le bilan du ventre du soir, d'un geste, sans ouvrir l'app.");
        nm.createNotificationChannel(ch);
        return nm;
    }

    private static boolean post(Context context, long timeoutMs) {
        try {
            NotificationManager nm = channel(context);
            if (nm == null) return false;
            Intent open = new Intent(context, MainActivity.class)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent tap = PendingIntent.getActivity(context, 5, open,
                    PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            NotificationCompat.Builder b = new NotificationCompat.Builder(context, CHANNEL)
                    .setSmallIcon(R.drawable.ic_stat_healthtrack)
                    .setContentTitle("Et votre ventre aujourd'hui ?")
                    .setContentText("Dans l'ensemble, d'un geste.")
                    .setPriority(NotificationCompat.PRIORITY_LOW)
                    .setOnlyAlertOnce(true)
                    .setAutoCancel(true)
                    .setTimeoutAfter(timeoutMs)
                    .setContentIntent(tap);
            for (int i = 0; i < GutEvening.LEVELS.length; i++) {
                Intent a = new Intent(context, EveningNoteReceiver.class).setAction(ACTION_ANSWER)
                        .putExtra(EXTRA_LEVEL, GutEvening.LEVELS[i]);
                b.addAction(0, GutEvening.LABELS[i], PendingIntent.getBroadcast(context, 200 + i, a,
                        PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
            }
            nm.notify(NOTIFICATION_ID, b.build());
            return true;
        } catch (RuntimeException e) {
            return false; // notification facultative
        }
    }

    /** Geste sur un niveau : rangé dans la boîte, la notification laisse place à un « Noté » éphémère. */
    static boolean answer(Context context, String level) {
        int index = GutEvening.levelIndex(level);
        if (index < 0) return false;
        long now = System.currentTimeMillis();
        SharedPreferences p = prefs(context);
        try {
            inbox(context).put(GutEvening.record(level, now), now);
        } catch (IOException e) {
            p.edit().putString("lastError", "inbox:" + e.getClass().getSimpleName()).apply();
            return false;
        }
        p.edit().putString("noteDay", EveningNote.dayKey(now, ZoneId.systemDefault()))
                .putInt("answers", p.getInt("answers", 0) + 1).putLong("answerAt", now).apply();
        try {
            NotificationManager nm = channel(context);
            if (nm != null) {
                nm.notify(NOTIFICATION_ID, new NotificationCompat.Builder(context, CHANNEL)
                        .setSmallIcon(R.drawable.ic_stat_healthtrack)
                        .setContentTitle("Bilan du jour : " + GutEvening.LABELS[index])
                        .setContentText("Rangé dans " + context.getString(R.string.app_name) + " à la prochaine ouverture.")
                        .setPriority(NotificationCompat.PRIORITY_LOW)
                        .setOnlyAlertOnce(true)
                        .setTimeoutAfter(5_000)
                        .build());
            }
        } catch (RuntimeException ignored) {
            // le bilan est déjà gardé
        }
        return true;
    }

    static void cancel(Context context) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(NOTIFICATION_ID);
    }
}
