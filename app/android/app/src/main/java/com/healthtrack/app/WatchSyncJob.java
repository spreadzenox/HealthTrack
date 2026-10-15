package com.healthtrack.app;

import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;
import android.util.Log;

import com.healthtrack.app.huawei.BackgroundSync;

/**
 * Filet de la relecture app tuée (huawei.md §9.1 f) : toutes les ~2 h (Android choisit le moment, batterie pas
 * faible), relit la montre connue si aucune page de l'app ne tourne, avec les règles de BackgroundSync (30 min,
 * pause, montre partie → rien). Programmée à la première reprise recopiée par le JS, gardée après un redémarrage.
 * JobScheduler du système : aucune dépendance ajoutée.
 */
public class WatchSyncJob extends JobService {

    static final int JOB_ID = 7301;
    static final long PERIOD_MS = 2 * 60 * 60_000L;
    static final long FLEX_MS = 30 * 60_000L;

    static boolean isScheduled(Context context) {
        JobScheduler js = (JobScheduler) context.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        return js != null && js.getPendingJob(JOB_ID) != null;
    }

    /** Programme le filet une fois (sans effet s'il l'est déjà). */
    static void ensureScheduled(Context context) {
        try {
            JobScheduler js = (JobScheduler) context.getSystemService(Context.JOB_SCHEDULER_SERVICE);
            if (js == null || js.getPendingJob(JOB_ID) != null) return;
            js.schedule(new JobInfo.Builder(JOB_ID, new ComponentName(context, WatchSyncJob.class))
                    .setPeriodic(PERIOD_MS, FLEX_MS)
                    .setRequiresBatteryNotLow(true)
                    .setPersisted(true)
                    .build());
        } catch (RuntimeException e) {
            Log.w("HealthTrackWatch", "filet de synchro non programmé", e);
        }
    }

    @Override
    public boolean onStartJob(JobParameters params) {
        Context app = getApplicationContext();
        String address = BackgroundWatchSync.knownAddress(app);
        if (address == null) return false;
        String decision = BackgroundWatchSync.maybeStart(app, address, CompanionPlugin.isAppAlive(),
                BackgroundSync.TRIGGER_PERIODIC, () -> jobFinished(params, false));
        return "run".equals(decision);
    }

    @Override
    public boolean onStopJob(JobParameters params) {
        // La relecture se termine seule (délais bornés) ; pas de reprogrammation anticipée.
        return false;
    }
}
