package com.healthtrack.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import com.healthtrack.app.face.FaceResume;

/**
 * Un redémarrage ou une mise à jour de l'app arrête toujours la lecture du visage, et Android interdit de relancer
 * un service caméra à ce moment-là : on prévient tout de suite (FaceResumeNotice) au lieu d'attendre l'heure.
 */
public class FaceResumeReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent == null ? null : intent.getAction();
        String trigger;
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) trigger = FaceResume.TRIGGER_BOOT;
        else if (Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) trigger = FaceResume.TRIGGER_UPDATE;
        else return;
        Context app = context.getApplicationContext();
        if (!FaceSenseService.prefs(app).getBoolean("enabled", false)) return;
        FaceResumeJob.ensureScheduled(app);
        FaceResumeNotice.check(app, trigger);
    }
}
