package com.healthtrack.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Alarme du rappel de la portion du jour (PortionReminder), envoyée seulement par notre intention explicite. */
public class PortionReminderReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null && PortionReminder.ACTION_ALARM.equals(intent.getAction())) PortionReminder.onAlarm(context.getApplicationContext());
    }
}
