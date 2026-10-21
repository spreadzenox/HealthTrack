package com.healthtrack.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.media.AudioManager;
import android.os.PowerManager;
import android.os.SystemClock;

import com.healthtrack.app.face.FaceIndices;
import com.healthtrack.app.face.FaceRecord;
import com.healthtrack.app.face.FaceSchedule;

import java.util.ArrayList;
import java.util.List;

/**
 * Une lecture du visage **app à l'écran**, sans service (variante play, journal/PLAY-CONFORMITE.md option B) : à
 * l'ouverture de HealthTrack (« app_open ») ou pour le bouton « Tester » (« manual »). Mêmes modèles, même rafale
 * et même boîte que FaceSenseService : le JS range ensuite la lecture dans l'historique, scores seuls. Les modèles
 * sont ouverts puis refermés à chaque lecture (une lecture par demi-heure au plus) ; les images sont oubliées dès
 * l'inférence faite. Appel bloquant, à faire hors du fil principal ; une seule lecture à la fois.
 */
final class FaceOneShot {

    private FaceOneShot() {}

    /** Rend le résultat (« face », « no_valid_frame », « skip:… », « camera:… »…), noté aussi dans le diagnostic. */
    static synchronized String run(Context context, String trigger) {
        Context app = context.getApplicationContext();
        SharedPreferences p = FaceSenseService.prefs(app);
        long now = System.currentTimeMillis();
        FaceSenseService.rollDay(p, now);
        boolean appOpen = FaceSchedule.TRIGGER_APP_OPEN.equals(trigger);
        PowerManager pm = (PowerManager) app.getSystemService(Context.POWER_SERVICE);
        String skip = FaceSchedule.decide(trigger, now, p.getLong("lastAppOpenAt", 0), p.getInt("dayAppOpens", 0),
                pm == null || pm.isInteractive(), inCall(app), FaceSenseService.thermal(pm));
        if (skip == null && !CompanionPlugin.isAppInForeground()) skip = "not_visible";
        if (skip == null && !FaceSenseService.hasCameraPermission(app)) skip = "no_permission";
        if (skip == null && !FaceModels.available(app.getAssets())) skip = "no_models";
        if (skip != null) return outcome(app, trigger, "skip:" + skip, null, now);

        FaceModels models = null;
        OnnxModel affect = null;
        OnnxModel affect2 = null;
        try {
            long t0 = SystemClock.elapsedRealtime();
            try {
                models = FaceModels.open(app.getAssets());
            } catch (Exception | LinkageError e) {
                return outcome(app, trigger, "skip:no_models", "models:" + e.getClass().getSimpleName(), now);
            }
            try {
                if (FaceAffectModel.available(app, FaceAffectModel.B0)) affect = FaceAffectModel.open(app, FaceAffectModel.B0);
            } catch (Exception | LinkageError e) {
                p.edit().putString("lastAffectError", "open:" + e.getClass().getSimpleName()).putLong("lastAffectErrorAt", now).apply();
            }
            try {
                if (FaceAffectModel.available(app, FaceAffectModel.MBF)) affect2 = FaceAffectModel.open(app, FaceAffectModel.MBF);
            } catch (Exception | LinkageError e) {
                p.edit().putString("lastAffectError", "open:mbf:" + e.getClass().getSimpleName()).putLong("lastAffectErrorAt", now).apply();
            }
            p.edit().putLong("modelLoadMs", SystemClock.elapsedRealtime() - t0).apply();

            FaceCamera.Capture cap = FaceCamera.capture(app, FaceSenseService.FRAMES);
            if (cap.error != null) return outcome(app, trigger, "camera:" + cap.error, cap.detail, now);
            long t1 = SystemClock.elapsedRealtime();
            List<String> rejections = new ArrayList<>();
            FaceIndices.Burst result;
            try {
                result = models.pipeline(affect, affect2).burst(cap.images, cap.width, cap.height, rejections);
            } catch (RuntimeException e) {
                return outcome(app, trigger, "inference_error", e.getClass().getSimpleName(), now);
            } finally {
                cap.images.clear(); // images oubliées dès l'inférence faite
            }
            long inferenceMs = SystemClock.elapsedRealtime() - t1;
            String json = FaceRecord.json(now, trigger, FaceSenseService.FRAMES, result, rejections, cap.openMs, inferenceMs);
            try {
                FaceSenseService.inbox(app).put(json, now);
            } catch (Exception e) {
                return outcome(app, trigger, "store_error", e.getClass().getSimpleName(), now);
            }
            SharedPreferences.Editor e = p.edit();
            if (appOpen) {
                e.putLong("lastAppOpenAt", now).putInt("dayAppOpens", p.getInt("dayAppOpens", 0) + 1);
                if (result != null) e.putInt("dayAppOpenFaces", p.getInt("dayAppOpenFaces", 0) + 1);
            }
            if (result != null && result.values.containsKey("valence")) e.putInt("affectBursts", p.getInt("affectBursts", 0) + 1);
            if (result != null && result.values.containsKey("affectGap")) e.putInt("affectDuoBursts", p.getInt("affectDuoBursts", 0) + 1);
            e.putLong("sumCameraMs", p.getLong("sumCameraMs", 0) + cap.openMs)
                    .putLong("sumInferenceMs", p.getLong("sumInferenceMs", 0) + inferenceMs)
                    .putInt("timed", p.getInt("timed", 0) + 1);
            for (String r : rejections) e.putInt("r_" + r, p.getInt("r_" + r, 0) + 1);
            e.apply();
            return outcome(app, trigger, result != null ? "face" : "no_valid_frame", null, now);
        } finally {
            if (models != null) models.close();
            if (affect != null) affect.close();
            if (affect2 != null) affect2.close();
        }
    }

    private static String outcome(Context app, String trigger, String what, String detail, long at) {
        SharedPreferences p = FaceSenseService.prefs(app);
        String key = "n_" + what;
        p.edit().putString("lastOutcome", what).putString("lastTrigger", trigger).putLong("lastOutcomeAt", at)
                .putInt(key, p.getInt(key, 0) + 1)
                .putString("attempts", FaceSenseService.appendAttempt(p.getString("attempts", null), at, trigger, "app", false, what, detail))
                .apply();
        return what;
    }

    private static boolean inCall(Context app) {
        AudioManager am = (AudioManager) app.getSystemService(Context.AUDIO_SERVICE);
        if (am == null) return false;
        int mode = am.getMode();
        return mode == AudioManager.MODE_IN_CALL || mode == AudioManager.MODE_IN_COMMUNICATION;
    }
}
