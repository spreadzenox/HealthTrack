package com.healthtrack.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Alarmes du soir et gestes sur la notification (EveningNoteNotice, GutEveningNotice) ; non exporté : seules nos intentions l'atteignent. */
public class EveningNoteReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent == null ? null : intent.getAction();
        Context app = context.getApplicationContext();
        if (EveningNoteNotice.ACTION_ALARM.equals(action)) EveningNoteNotice.onAlarm(app);
        else if (EveningNoteNotice.ACTION_ANSWER.equals(action))
            EveningNoteNotice.answer(app, intent.getIntExtra(EveningNoteNotice.EXTRA_SCORE, -1));
        else if (GutEveningNotice.ACTION_ALARM.equals(action)) GutEveningNotice.onAlarm(app);
        else if (GutEveningNotice.ACTION_ANSWER.equals(action))
            GutEveningNotice.answer(app, intent.getStringExtra(GutEveningNotice.EXTRA_LEVEL));
    }
}
