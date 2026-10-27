package com.healthtrack.app;

import android.content.Intent;
import android.os.Bundle;

import androidx.activity.EdgeToEdge;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /** Geste « Reprendre » de la notification « Lecture du visage arrêtée » (FaceResumeNotice). */
    static final String ACTION_FACE_RESUME = "com.healthtrack.app.face.RESUME";

    private boolean faceResumePending;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins maison (non publiés sur npm) : à enregistrer avant super.onCreate.
        registerPlugin(PhoneUsagePlugin.class);
        registerPlugin(BtClassicPlugin.class);
        registerPlugin(AppManagerPlugin.class);
        registerPlugin(CompanionPlugin.class);
        registerPlugin(WatchVaultPlugin.class);
        registerPlugin(BackupMarkerPlugin.class);
        registerPlugin(WatchCapturePlugin.class);
        registerPlugin(FaceSensePlugin.class);
        registerPlugin(EveningNotePlugin.class);
        registerPlugin(GutEveningPlugin.class);
        registerPlugin(PortionReminderPlugin.class);
        registerPlugin(VoiceProbePlugin.class);
        // Mise à jour en un clic : variante sideload seulement (Google Play met l'app à jour lui-même)
        if (BuildConfig.SELF_UPDATE) registerPlugin(AppUpdatePlugin.class);
        registerPlugin(SystemBarsPlugin.class);
        // Plugins d'une seule variante (play : Google Play Billing ; sideload : aucun), voir FlavorPlugins
        registerPlugins(FlavorPlugins.list());
        // Bord à bord sur toutes les versions (Android 15+ l'impose déjà) : encarts en CSS, voir SystemBarsPlugin
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
        faceResumePending = isFaceResume(getIntent());
        markPortionOpen(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (isFaceResume(intent)) faceResumePending = true;
        markPortionOpen(intent);
    }

    /** Rappel « Votre portion du jour » touché : l'app ouvrira la réintroduction (PortionReminder.takeOpen). */
    private void markPortionOpen(Intent intent) {
        if (intent != null && PortionReminder.ACTION_OPEN.equals(intent.getAction())) PortionReminder.markOpen(this);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Relancé une fois l'app à l'écran : Android n'autorise le service caméra qu'à ce moment-là.
        if (faceResumePending) {
            faceResumePending = false;
            FaceResumeNotice.resumeFromApp(this);
        }
    }

    private static boolean isFaceResume(Intent intent) {
        return intent != null && ACTION_FACE_RESUME.equals(intent.getAction());
    }
}
