package com.healthtrack.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import androidx.core.app.NotificationCompat;

import com.healthtrack.app.gut.PortionSchedule;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Rappel de la portion du jour pendant une réintroduction guidée (src/services/fodmapReminder.js, jalon 7b-2) : l'app
 * donne les rappels restants ({ at, title, body }, au plus 3) ; une alarme inexacte affiche le rappel échu puis
 * programme le suivant. Toucher la notification ouvre l'app sur la réintroduction. Aucune note du ventre ici.
 */
final class PortionReminder {

    static final String CHANNEL = "portion_reminder";
    static final int NOTIFICATION_ID = 7415;
    static final String PREFS = "portion_reminder";
    static final String ACTION_ALARM = "com.healthtrack.app.portion.ALARM";
    static final String ACTION_OPEN = "com.healthtrack.app.portion.OPEN";

    private PortionReminder() {
    }

    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static boolean notificationsOn(Context context) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        return nm != null && nm.areNotificationsEnabled();
    }

    private static PendingIntent alarmIntent(Context context) {
        Intent i = new Intent(context, PortionReminderReceiver.class).setAction(ACTION_ALARM);
        return PendingIntent.getBroadcast(context, 3, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    static JSONArray items(Context context) {
        try {
            return new JSONArray(prefs(context).getString("items", "[]"));
        } catch (JSONException e) {
            return new JSONArray();
        }
    }

    private static long[] ats(JSONArray items) {
        long[] out = new long[items.length()];
        for (int i = 0; i < out.length; i++) out[i] = items.optJSONObject(i) == null ? 0 : items.optJSONObject(i).optLong("at", 0);
        return out;
    }

    /** Remplace les rappels prévus (liste vide = tout annuler, notification affichée comprise). */
    static void save(Context context, JSONArray items) {
        prefs(context).edit().putString("items", items.toString()).apply();
        if (items.length() == 0) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(NOTIFICATION_ID);
        }
        arm(context);
    }

    /** (Re)programme l'alarme du prochain rappel, ou l'annule s'il n'y en a plus. */
    static void arm(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        long next = PortionSchedule.nextAt(ats(items(context)), System.currentTimeMillis());
        if (next <= 0) {
            am.cancel(alarmIntent(context));
            return;
        }
        // inexacte (aucune permission d'alarme exacte) mais tenue en Doze : quelques minutes de retard suffisent
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, alarmIntent(context));
    }

    static void onAlarm(Context context) {
        JSONArray items = items(context);
        long now = System.currentTimeMillis();
        int due = PortionSchedule.dueIndex(ats(items), now);
        if (due >= 0) {
            JSONObject item = items.optJSONObject(due);
            if (item != null) post(context, item.optString("title", "Votre portion du jour"), item.optString("body", ""));
            JSONArray rest = new JSONArray();
            for (int i = due + 1; i < items.length(); i++) rest.put(items.opt(i));
            prefs(context).edit().putString("items", rest.toString()).apply();
        }
        arm(context);
    }

    /** Notification touchée : l'app ouvrira la réintroduction à sa prochaine vérification. */
    static void markOpen(Context context) {
        prefs(context).edit().putBoolean("open", true).apply();
    }

    static boolean takeOpen(Context context) {
        SharedPreferences p = prefs(context);
        boolean open = p.getBoolean("open", false);
        if (open) p.edit().putBoolean("open", false).apply();
        return open;
    }

    private static void post(Context context, String title, String body) {
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null || !nm.areNotificationsEnabled()) return;
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Réintroduction guidée", NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("Le rappel de la portion du jour pendant un test de réintroduction.");
            nm.createNotificationChannel(ch);
            Intent open = new Intent(context, MainActivity.class).setAction(ACTION_OPEN)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent tap = PendingIntent.getActivity(context, 6, open,
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
