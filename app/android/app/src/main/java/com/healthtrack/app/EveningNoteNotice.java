package com.healthtrack.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import androidx.core.app.NotificationCompat;

import com.healthtrack.app.huawei.CaptureInbox;
import com.healthtrack.app.mood.EveningNote;

import java.io.File;
import java.io.IOException;
import java.time.ZoneId;

/**
 * « Note du soir d'un geste » (journal/IDEES.md I113) : alarme quotidienne à l'heure habituelle des notes, puis
 * notification avec les 6 notes en boutons (une notification n'a que 3 actions : vue personnalisée). Le geste
 * dépose { v, score, at } dans la boîte `evening-notes/`, sans ouvrir l'app ; EveningNotePlugin la vide à
 * l'ouverture. La règle est dans mood/EveningNote. Silencieuse (canal bas, sans son), muette si les notifications
 * de l'app ne sont pas autorisées.
 */
final class EveningNoteNotice {

    static final String CHANNEL = "evening_note";
    static final int NOTIFICATION_ID = 7313;
    static final String PREFS = "evening_note";
    static final String ACTION_ALARM = "com.healthtrack.app.evening.ALARM";
    static final String ACTION_ANSWER = "com.healthtrack.app.evening.ANSWER";
    static final String EXTRA_SCORE = "score";
    static final int INBOX_MAX = 60;
    /** Une notification oubliée disparaît d'elle-même avant le lendemain. */
    static final long TIMEOUT_MS = 4 * 60 * 60_000L;

    private static final int[] BUTTONS = {
        R.id.evening_note_0, R.id.evening_note_1, R.id.evening_note_2,
        R.id.evening_note_3, R.id.evening_note_4, R.id.evening_note_5,
    };

    private EveningNoteNotice() {
    }

    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static CaptureInbox inbox(Context context) {
        return new CaptureInbox(new File(context.getFilesDir(), "evening-notes"), INBOX_MAX);
    }

    static boolean notificationsOn(Context context) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        return nm != null && nm.areNotificationsEnabled();
    }

    private static PendingIntent alarmIntent(Context context) {
        Intent i = new Intent(context, EveningNoteReceiver.class).setAction(ACTION_ALARM);
        return PendingIntent.getBroadcast(context, 1, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    /** (Re)programme l'alarme du prochain soir, ou l'annule si la note du soir est éteinte. */
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
        long next = EveningNote.nextAt(System.currentTimeMillis(), ZoneId.systemDefault(),
                p.getInt("minuteOfDay", EveningNote.DEFAULT_MINUTE));
        // inexacte (aucune permission d'alarme exacte) mais tenue en Doze ; quelques minutes de retard suffisent
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pi);
        p.edit().putLong("nextAt", next).apply();
    }

    /** Alarme du soir : demande la note si la règle le permet, puis programme le lendemain. */
    static String onAlarm(Context context) {
        SharedPreferences p = prefs(context);
        long now = System.currentTimeMillis();
        ZoneId zone = ZoneId.systemDefault();
        String today = EveningNote.dayKey(now, zone);
        String quiet = EveningNote.decide(p.getBoolean("enabled", false), p.getString("noteDay", null),
                p.getString("askedDay", null), today, EveningNote.minuteOfDay(now, zone),
                p.getInt("minuteOfDay", EveningNote.DEFAULT_MINUTE));
        if (quiet == null && !post(context)) quiet = "notifications_off";
        SharedPreferences.Editor e = p.edit().putLong("checkAt", now).putString("check", quiet == null ? "asked" : quiet);
        if (quiet == null) e.putString("askedDay", today).putInt("asked", p.getInt("asked", 0) + 1);
        e.apply();
        arm(context);
        return quiet;
    }

    private static RemoteViews buttons(Context context, int layout) {
        RemoteViews v = new RemoteViews(context.getPackageName(), layout);
        for (int score = 0; score < BUTTONS.length; score++) {
            Intent i = new Intent(context, EveningNoteReceiver.class).setAction(ACTION_ANSWER).putExtra(EXTRA_SCORE, score);
            v.setOnClickPendingIntent(BUTTONS[score], PendingIntent.getBroadcast(context, 100 + score, i,
                    PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        }
        return v;
    }

    private static NotificationManager channel(Context context) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || !nm.areNotificationsEnabled()) return null;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "Note du soir", NotificationManager.IMPORTANCE_LOW);
        ch.setDescription("Votre note de bien-être du soir, d'un geste, sans ouvrir l'app.");
        nm.createNotificationChannel(ch);
        return nm;
    }

    private static boolean post(Context context) {
        try {
            NotificationManager nm = channel(context);
            if (nm == null) return false;
            Intent open = new Intent(context, MainActivity.class)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent tap = PendingIntent.getActivity(context, 4, open,
                    PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            nm.notify(NOTIFICATION_ID, new NotificationCompat.Builder(context, CHANNEL)
                    .setSmallIcon(android.R.drawable.ic_menu_edit)
                    .setContentTitle("Votre soirée ?")
                    .setContentText("0 = très bas, 5 = très bien")
                    .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                    .setCustomContentView(buttons(context, R.layout.notification_evening_note))
                    .setCustomBigContentView(buttons(context, R.layout.notification_evening_note_big))
                    .setPriority(NotificationCompat.PRIORITY_LOW)
                    .setOnlyAlertOnce(true)
                    .setAutoCancel(true)
                    .setTimeoutAfter(TIMEOUT_MS)
                    .setContentIntent(tap)
                    .build());
            return true;
        } catch (RuntimeException e) {
            return false; // notification facultative
        }
    }

    /** Geste sur une note : rangée dans la boîte, la notification laisse place à un « Noté » éphémère. */
    static boolean answer(Context context, int score) {
        if (!EveningNote.validScore(score)) return false;
        long now = System.currentTimeMillis();
        SharedPreferences p = prefs(context);
        try {
            inbox(context).put(EveningNote.record(score, now), now);
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
                        .setSmallIcon(android.R.drawable.ic_menu_edit)
                        .setContentTitle("Noté : " + score + " sur 5")
                        .setContentText("Rangé dans HealthTrack à la prochaine ouverture.")
                        .setPriority(NotificationCompat.PRIORITY_LOW)
                        .setOnlyAlertOnce(true)
                        .setTimeoutAfter(5_000)
                        .build());
            }
        } catch (RuntimeException ignored) {
            // la note est déjà gardée
        }
        return true;
    }

    static void cancel(Context context) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(NOTIFICATION_ID);
    }
}
