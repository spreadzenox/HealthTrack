package com.healthtrack.app.face;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

/** Quand le service prend une rafale, et pourquoi il la saute. */
public class FaceScheduleTest {

    private static final long NOW = 1_760_000_000_000L;
    private static final String UNLOCK = FaceSchedule.TRIGGER_UNLOCK;

    @Test
    public void deverrouillageNormal() {
        assertNull(FaceSchedule.decide(UNLOCK, NOW, 0, 0, true, false, Double.NaN));
        assertNull(FaceSchedule.decide(UNLOCK, NOW, NOW - FaceSchedule.MIN_INTERVAL_MS, 10, true, false, 0.3));
    }

    @Test
    public void deuxDeverrouillagesRapprochesNeFontQuUneRafale() {
        assertEquals(FaceSchedule.SKIP_TOO_SOON, FaceSchedule.decide(UNLOCK, NOW, NOW - 30_000, 1, true, false, Double.NaN));
        // horloge reculée (changement d'heure manuel) : on ne bloque pas
        assertNull(FaceSchedule.decide(UNLOCK, NOW, NOW + 60_000, 1, true, false, Double.NaN));
    }

    @Test
    public void garde_fous() {
        assertEquals(FaceSchedule.SKIP_SCREEN_OFF, FaceSchedule.decide(UNLOCK, NOW, 0, 0, false, false, Double.NaN));
        assertEquals(FaceSchedule.SKIP_IN_CALL, FaceSchedule.decide(UNLOCK, NOW, 0, 0, true, true, Double.NaN));
        assertEquals(FaceSchedule.SKIP_HOT, FaceSchedule.decide(UNLOCK, NOW, 0, 0, true, false, 0.95));
        assertEquals(FaceSchedule.SKIP_DAILY_CAP,
            FaceSchedule.decide(UNLOCK, NOW, 0, FaceSchedule.MAX_PER_DAY, true, false, Double.NaN));
    }

    @Test
    public void seulsLeDeverrouillageLOuvertureDeLAppEtLeTestSontAcceptes() {
        // I114 : jamais à l'ouverture d'une autre app (les images vues dépendraient de l'usage, un X)
        assertEquals(FaceSchedule.SKIP_UNKNOWN_TRIGGER, FaceSchedule.decide("other_app", NOW, 0, 0, true, false, Double.NaN));
        assertEquals(FaceSchedule.SKIP_UNKNOWN_TRIGGER, FaceSchedule.decide(null, NOW, 0, 0, true, false, Double.NaN));
        assertNull(FaceSchedule.decide(FaceSchedule.TRIGGER_APP_OPEN, NOW, 0, 0, true, false, Double.NaN));
    }

    @Test
    public void ouvertureDeLAppUneLectureParDemiHeureEtDouzeParJour() {
        String open = FaceSchedule.TRIGGER_APP_OPEN;
        assertEquals(FaceSchedule.SKIP_TOO_SOON, FaceSchedule.decide(open, NOW, NOW - 10 * 60_000, 1, true, false, Double.NaN));
        assertNull(FaceSchedule.decide(open, NOW, NOW - FaceSchedule.APP_OPEN_MIN_INTERVAL_MS, 1, true, false, Double.NaN));
        assertEquals(FaceSchedule.SKIP_DAILY_CAP,
            FaceSchedule.decide(open, NOW, 0, FaceSchedule.APP_OPEN_MAX_PER_DAY, true, false, Double.NaN));
        assertEquals(FaceSchedule.SKIP_IN_CALL, FaceSchedule.decide(open, NOW, 0, 0, true, true, Double.NaN));
        // jamais repris : l'ouverture est un moment précis, pas un déverrouillage
        assertFalse(FaceSchedule.shouldRetry(open, false, false, 3000));
    }

    @Test
    public void leTestIgnoreIntervalleEtPlafondMaisPasLaChaleur() {
        String manual = FaceSchedule.TRIGGER_MANUAL;
        assertNull(FaceSchedule.decide(manual, NOW, NOW - 1000, FaceSchedule.MAX_PER_DAY, true, false, Double.NaN));
        assertEquals(FaceSchedule.SKIP_HOT, FaceSchedule.decide(manual, NOW, 0, 0, true, false, 0.9));
    }

    @Test
    public void deuxiemeEssaiUneSeuleFoisApresUneRafaleSansVisage() {
        // I118 : 1re rafale finie ~3 s après le déverrouillage, aucune image exploitable → on reprend une fois
        assertTrue(FaceSchedule.shouldRetry(UNLOCK, false, false, 3000));
        assertFalse(FaceSchedule.shouldRetry(UNLOCK, true, false, 3000));   // visage lu : rien à reprendre
        assertFalse(FaceSchedule.shouldRetry(UNLOCK, false, true, 3000));   // déjà repris une fois
    }

    @Test
    public void deuxiemeEssaiToujoursProcheDuDeverrouillage() {
        long last = FaceSchedule.RETRY_WINDOW_MS - FaceSchedule.RETRY_DELAY_MS;
        assertTrue(FaceSchedule.shouldRetry(UNLOCK, false, false, last));
        assertFalse(FaceSchedule.shouldRetry(UNLOCK, false, false, last + 1));
        assertFalse(FaceSchedule.shouldRetry(UNLOCK, false, false, -1));
    }

    @Test
    public void leTestNEstJamaisRepris() {
        assertFalse(FaceSchedule.shouldRetry(FaceSchedule.TRIGGER_MANUAL, false, false, 0));
        assertFalse(FaceSchedule.shouldRetry("app_open", false, false, 0));
    }
}
