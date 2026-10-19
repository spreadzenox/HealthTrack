package com.healthtrack.app.mood;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.time.ZoneId;
import java.time.ZonedDateTime;

import org.junit.Test;

/** Quand HealthTrack demande la note du soir, quand il se tait, et ce qu'il garde du geste. */
public class EveningNoteTest {

    private static final ZoneId PARIS = ZoneId.of("Europe/Paris");
    private static final String TODAY = "2026-10-19";
    private static final int AT_21 = 21 * 60;

    private static long paris(int y, int mo, int d, int h, int mi) {
        return ZonedDateTime.of(y, mo, d, h, mi, 0, 0, PARIS).toInstant().toEpochMilli();
    }

    @Test
    public void soireeSansNote_onDemande() {
        assertNull(EveningNote.decide(true, "2026-10-18", "2026-10-18", TODAY, AT_21, AT_21));
        assertNull(EveningNote.decide(true, null, null, TODAY, AT_21 + 15, AT_21));
    }

    @Test
    public void jamaisSiDesactiveeOuDejaNoteeOuDejaDemandee() {
        assertEquals(EveningNote.QUIET_DISABLED, EveningNote.decide(false, null, null, TODAY, AT_21, AT_21));
        assertEquals(EveningNote.QUIET_NOTED, EveningNote.decide(true, TODAY, null, TODAY, AT_21, AT_21));
        assertEquals(EveningNote.QUIET_ASKED, EveningNote.decide(true, null, TODAY, TODAY, AT_21, AT_21));
    }

    @Test
    public void alarmeTresRetardee_rienCeSoir() {
        assertEquals(EveningNote.QUIET_LATE, EveningNote.decide(true, null, null, TODAY, AT_21 + 121, AT_21));
        assertNull(EveningNote.decide(true, null, null, TODAY, AT_21 + 120, AT_21));
    }

    @Test
    public void heureRameneeDansLaSoiree() {
        assertEquals(18 * 60, EveningNote.clampMinute(8 * 60));
        assertEquals(23 * 60, EveningNote.clampMinute(23 * 60 + 50));
        assertEquals(21 * 60 + 10, EveningNote.clampMinute(21 * 60 + 10));
        assertEquals(EveningNote.DEFAULT_MINUTE, EveningNote.clampMinute(-1));
        assertEquals(EveningNote.DEFAULT_MINUTE, EveningNote.clampMinute(24 * 60));
    }

    @Test
    public void prochaineEcheance_ceSoirOuDemain() {
        assertEquals(paris(2026, 10, 19, 21, 0), EveningNote.nextAt(paris(2026, 10, 19, 6, 30), PARIS, AT_21));
        assertEquals(paris(2026, 10, 20, 21, 0), EveningNote.nextAt(paris(2026, 10, 19, 21, 0), PARIS, AT_21));
        assertEquals(paris(2026, 10, 20, 21, 0), EveningNote.nextAt(paris(2026, 10, 19, 22, 0), PARIS, AT_21));
    }

    @Test
    public void changementDHeure_resteA21hLocale() {
        // nuit du 24 au 25 octobre 2026 : passage à l'heure d'hiver
        assertEquals(paris(2026, 10, 25, 21, 0), EveningNote.nextAt(paris(2026, 10, 24, 22, 0), PARIS, AT_21));
    }

    @Test
    public void jourEtMinuteLocaux() {
        long t = paris(2026, 10, 19, 0, 30); // 22:30 UTC la veille
        assertEquals(TODAY, EveningNote.dayKey(t, PARIS));
        assertEquals(30, EveningNote.minuteOfDay(t, PARIS));
    }

    @Test
    public void laBoiteNeGardeQueLaNoteEtLHeure() {
        assertEquals("{\"v\":1,\"score\":4,\"at\":1760900000000}", EveningNote.record(4, 1_760_900_000_000L));
        assertTrue(EveningNote.validScore(0));
        assertTrue(EveningNote.validScore(5));
        assertFalse(EveningNote.validScore(6));
        assertFalse(EveningNote.validScore(-1));
    }

    @Test(expected = IllegalArgumentException.class)
    public void noteHorsEchelle_refusee() {
        EveningNote.record(7, 0);
    }
}
