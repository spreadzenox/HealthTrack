package com.healthtrack.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Rappel de fin d'essai (TrialReminder) : l'alarme elle-même (intention non exportée, envoyée par notre alarme), et sa
 * reprogrammation après un redémarrage ou une mise à jour, qui effacent les alarmes.
 */
public class TrialReminderReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent == null ? null : intent.getAction();
        Context app = context.getApplicationContext();
        if (TrialReminder.ACTION_ALARM.equals(action)) TrialReminder.onAlarm(app);
        else if (Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) TrialReminder.arm(app);
    }
}
