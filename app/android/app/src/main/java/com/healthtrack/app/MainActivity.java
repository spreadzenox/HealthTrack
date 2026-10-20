package com.healthtrack.app;

import android.content.Intent;
import android.os.Bundle;

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
        registerPlugin(WatchCapturePlugin.class);
        registerPlugin(FaceSensePlugin.class);
        registerPlugin(EveningNotePlugin.class);
        registerPlugin(VoiceProbePlugin.class);
        registerPlugin(AppUpdatePlugin.class);
        registerPlugin(SystemBarsPlugin.class);
        super.onCreate(savedInstanceState);
        faceResumePending = isFaceResume(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (isFaceResume(intent)) faceResumePending = true;
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
