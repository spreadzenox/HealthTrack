package com.healthtrack.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Un redémarrage ou une mise à jour efface les alarmes : on reprogramme la note du soir et le bilan du ventre (s'ils sont demandés). */
public class EveningNoteBootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent == null ? null : intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action) && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) return;
        Context app = context.getApplicationContext();
        if (EveningNoteNotice.prefs(app).getBoolean("enabled", false)) EveningNoteNotice.arm(app);
        if (GutEveningNotice.prefs(app).getBoolean("enabled", false)) GutEveningNotice.arm(app);
    }
}
