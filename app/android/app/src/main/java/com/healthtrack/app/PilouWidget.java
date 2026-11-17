package com.healthtrack.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import com.healthtrack.app.pilou.PilouWidgetRule;

import org.json.JSONArray;
import org.json.JSONObject;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Le widget de Pilou (specs/journee.SPEC.md § 9, étape 13 du brief) : image fixe de Pilou sur son îlot (une des six
 * poses pré-rendues), « Encore N choses », les bulles qui restent, « Jeudi · jour 3 ». L'app le met à jour après
 * chaque saisie (PilouWidgetPlugin) ; Android le rafraîchit toutes les 30 min (soir, nuit, changement de jour à 4 h),
 * sans alarme. Toucher → Ma journée. Rien d'autre n'est gardé que ces quelques mots, dans les préférences de l'app.
 */
public class PilouWidget extends AppWidgetProvider {

    static final String PREFS = "pilou_widget";
    static final String ACTION_OPEN = "com.healthtrack.app.pilou.OPEN";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) draw(context, manager, id);
    }

    /** Redessine tous les widgets posés (après une mise à jour de l'app). */
    static void refresh(Context context) {
        try {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            if (manager == null) return;
            for (int id : manager.getAppWidgetIds(new ComponentName(context, PilouWidget.class))) draw(context, manager, id);
        } catch (RuntimeException ignored) {
            // un widget qui ne se redessine pas ne doit jamais faire planter l'app
        }
    }

    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static void markOpen(Context context) {
        prefs(context).edit().putBoolean("open", true).apply();
    }

    static boolean takeOpen(Context context) {
        SharedPreferences p = prefs(context);
        boolean open = p.getBoolean("open", false);
        if (open) p.edit().putBoolean("open", false).apply();
        return open;
    }

    private static List<String> list(JSONArray a) {
        List<String> out = new ArrayList<>();
        if (a == null) return out;
        for (int i = 0; i < a.length(); i++) {
            String s = a.optString(i, "");
            if (!s.isEmpty()) out.add(s);
        }
        return out;
    }

    static PilouWidgetRule.State readState(Context context) {
        PilouWidgetRule.State s = new PilouWidgetRule.State();
        try {
            String raw = prefs(context).getString("state", null);
            if (raw == null) return s;
            JSONObject o = new JSONObject(raw);
            s.day = o.optString("day", null);
            s.planned = list(o.optJSONArray("planned"));
            s.remaining = list(o.optJSONArray("remaining"));
            s.lastMealAt = o.optLong("lastMealAt", 0);
            s.wake = o.optInt("wake", -1);
            s.bed = o.optInt("bed", -1);
            s.usageDay = o.optInt("usageDay", 0);
            s.name = o.optString("name", "Pilou");
        } catch (Exception ignored) {
            // état illisible : Pilou tranquille, sans liste
        }
        return s;
    }

    private static int poseImage(String pose) {
        switch (pose) {
            case "dort": return R.drawable.pilou_pose_dort;
            case "se-reveille": return R.drawable.pilou_pose_se_reveille;
            case "rassasie": return R.drawable.pilou_pose_rassasie;
            case "soir": return R.drawable.pilou_pose_soir;
            case "fete": return R.drawable.pilou_pose_fete;
            default: return R.drawable.pilou_pose_content;
        }
    }

    private static void draw(Context context, AppWidgetManager manager, int id) {
        PilouWidgetRule.View v = PilouWidgetRule.render(readState(context), LocalDateTime.now(), System.currentTimeMillis());
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_pilou);
        views.setImageViewResource(R.id.pilou_widget_pose, poseImage(v.pose));
        views.setTextViewText(R.id.pilou_widget_title, v.title);
        views.setTextViewText(R.id.pilou_widget_day, v.day);
        views.setTextViewText(R.id.pilou_widget_bubbles, v.bubbles);
        views.setViewVisibility(R.id.pilou_widget_bubbles, v.bubbles.isEmpty() ? android.view.View.GONE : android.view.View.VISIBLE);
        views.setContentDescription(R.id.pilou_widget_root, v.accessibility);
        Intent open = new Intent(context, MainActivity.class).setAction(ACTION_OPEN)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        views.setOnClickPendingIntent(R.id.pilou_widget_root, PendingIntent.getActivity(context, 13, open,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        manager.updateAppWidget(id, views);
    }
}
