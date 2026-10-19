package com.healthtrack.app.face;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import org.junit.Test;

/** Quand HealthTrack propose « Reprendre » la lecture du visage, et pourquoi il se tait. */
public class FaceResumeTest {

    private static final long NOW = 1_760_000_000_000L;
    private static final String P = FaceResume.TRIGGER_PERIODIC;

    @Test
    public void serviceTueAppFermee_onPrevient() {
        assertNull(FaceResume.decide(true, false, false, true, 0, NOW, P));
        assertNull(FaceResume.decide(true, false, false, true, NOW - FaceResume.REMIND_AFTER_MS, NOW, P));
    }

    @Test
    public void rienQuandToutVaBienOuQueLUtilisateurAArrete() {
        assertEquals(FaceResume.QUIET_DISABLED, FaceResume.decide(false, false, false, true, 0, NOW, P));
        assertEquals(FaceResume.QUIET_RUNNING, FaceResume.decide(true, true, false, true, 0, NOW, P));
    }

    @Test
    public void appOuverte_laCarteSuffit() {
        assertEquals(FaceResume.QUIET_APP_OPEN, FaceResume.decide(true, false, true, true, 0, NOW, P));
    }

    @Test
    public void cameraRetiree_cEstALAppDeRedemander() {
        assertEquals(FaceResume.QUIET_NO_PERMISSION, FaceResume.decide(true, false, false, false, 0, NOW, P));
    }

    @Test
    public void pasDeRappelToutesLesHeures() {
        assertEquals(FaceResume.QUIET_RECENT, FaceResume.decide(true, false, false, true, NOW - 60 * 60_000L, NOW, P));
        // horloge reculée : on ne se bloque pas indéfiniment
        assertNull(FaceResume.decide(true, false, false, true, NOW + 60_000, NOW, P));
    }

    @Test
    public void redemarrageOuMiseAJour_onPrevientTouteDeSuite() {
        long recent = NOW - 10 * 60_000L;
        assertNull(FaceResume.decide(true, false, false, true, recent, NOW, FaceResume.TRIGGER_BOOT));
        assertNull(FaceResume.decide(true, false, false, true, recent, NOW, FaceResume.TRIGGER_UPDATE));
    }
}
