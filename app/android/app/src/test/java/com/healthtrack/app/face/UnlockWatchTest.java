package com.healthtrack.app.face;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

/** Repérer chaque déverrouillage (signalement du 19/10 15:05) : diffusion, interrogation du verrou, ou les deux. */
public class UnlockWatchTest {

    private static final long T = 1_000_000L;

    @Test
    public void deverrouillageClassique_userPresentSeul() {
        UnlockWatch w = new UnlockWatch();
        assertNull(w.onScreenOn(T, true));
        assertTrue(w.polling());
        assertEquals(UnlockWatch.SOURCE_USER_PRESENT, w.onUserPresent(T + 800));
        assertFalse(w.polling());
    }

    @Test
    public void empreinteSansDiffusion_lInterrogationDuVerrouPrendLeRelais() {
        UnlockWatch w = new UnlockWatch();
        assertNull(w.onScreenOn(T, true));
        assertNull(w.onPoll(T + 500, true));
        assertEquals(UnlockWatch.SOURCE_KEYGUARD, w.onPoll(T + 1000, false));
        // la diffusion arrive après coup : pas de deuxième lecture pour le même déverrouillage
        assertNull(w.onUserPresent(T + 1100));
        assertFalse(w.polling());
    }

    @Test
    public void ecranAllumeDejaDeverrouille_smartLockOuSansVerrou() {
        UnlockWatch w = new UnlockWatch();
        assertEquals(UnlockWatch.SOURCE_SCREEN_ON, w.onScreenOn(T, false));
        assertNull(w.onUserPresent(T + 300));
    }

    @Test
    public void unDeverrouillageParAllumage() {
        UnlockWatch w = new UnlockWatch();
        w.onScreenOn(T, true);
        assertEquals(UnlockWatch.SOURCE_USER_PRESENT, w.onUserPresent(T + 500));
        w.onScreenOff();
        assertNull(w.onScreenOn(T + 60_000, true));
        assertEquals(UnlockWatch.SOURCE_USER_PRESENT, w.onUserPresent(T + 61_000));
    }

    @Test
    public void ecranRestéVerrouillé_onArreteDInterrogerAuBoutDeLaFenetre() {
        UnlockWatch w = new UnlockWatch();
        w.onScreenOn(T, true);
        assertNull(w.onPoll(T + UnlockWatch.POLL_WINDOW_MS - 1, true));
        assertTrue(w.polling());
        assertNull(w.onPoll(T + UnlockWatch.POLL_WINDOW_MS, true));
        assertFalse(w.polling());
        // déverrouillé plus tard (on regardait juste l'heure, puis on y revient) : la diffusion compte encore
        assertEquals(UnlockWatch.SOURCE_USER_PRESENT, w.onUserPresent(T + UnlockWatch.POLL_WINDOW_MS + 5000));
    }

    @Test
    public void ecranEteint_plusRienNEstInterroge() {
        UnlockWatch w = new UnlockWatch();
        w.onScreenOn(T, true);
        w.onScreenOff();
        assertFalse(w.polling());
        assertNull(w.onPoll(T + 500, false));
    }

    @Test
    public void diffusionSansAllumageVu_serviceDemarreEcranAllume() {
        UnlockWatch w = new UnlockWatch();
        assertEquals(UnlockWatch.SOURCE_USER_PRESENT, w.onUserPresent(T));
        assertNull(w.onUserPresent(T + 100));
    }
}
