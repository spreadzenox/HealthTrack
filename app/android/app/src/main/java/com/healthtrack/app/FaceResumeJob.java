package com.healthtrack.app;

import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;
import android.util.Log;

import com.healthtrack.app.face.FaceResume;

/**
 * Vérifie toutes les ~heures que la lecture du visage tourne encore (FaceResumeNotice) : programmée quand
 * l'utilisateur l'active, annulée quand il l'arrête, gardée après un redémarrage. Travail de quelques
 * millisecondes, sans contrainte de batterie.
 */
public class FaceResumeJob extends JobService {

    static final int JOB_ID = 7311;
    static final long PERIOD_MS = 60 * 60_000L;
    static final long FLEX_MS = 20 * 60_000L;

    static void ensureScheduled(Context context) {
        try {
            JobScheduler js = (JobScheduler) context.getSystemService(Context.JOB_SCHEDULER_SERVICE);
            if (js == null || js.getPendingJob(JOB_ID) != null) return;
            js.schedule(new JobInfo.Builder(JOB_ID, new ComponentName(context, FaceResumeJob.class))
                    .setPeriodic(PERIOD_MS, FLEX_MS)
                    .setPersisted(true)
                    .build());
        } catch (RuntimeException e) {
            Log.w("HealthTrackFace", "vérification de la lecture du visage non programmée", e);
        }
    }

    static void cancel(Context context) {
        JobScheduler js = (JobScheduler) context.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if (js != null) js.cancel(JOB_ID);
    }

    @Override
    public boolean onStartJob(JobParameters params) {
        FaceResumeNotice.check(getApplicationContext(), FaceResume.TRIGGER_PERIODIC);
        return false;
    }

    @Override
    public boolean onStopJob(JobParameters params) {
        return false;
    }
}
