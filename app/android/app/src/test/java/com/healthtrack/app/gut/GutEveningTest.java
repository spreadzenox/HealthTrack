package com.healthtrack.app.gut;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import com.healthtrack.app.mood.EveningNote;

import java.time.ZoneId;
import java.time.ZonedDateTime;

import org.junit.Test;

/** Quand Halcya demande le bilan du ventre du soir, quand il se tait, et ce qu'il garde du geste. */
public class GutEveningTest {

    private static final ZoneId PARIS = ZoneId.of("Europe/Paris");
    private static final String TODAY = "2026-10-26";
    private static final int AT_20 = 20 * 60;

    private static long paris(int y, int mo, int d, int h, int mi) {
        return ZonedDateTime.of(y, mo, d, h, mi, 0, 0, PARIS).toInstant().toEpochMilli();
    }

    @Test
    public void soireeSansBilan_onDemande() {
        assertNull(GutEvening.decide(true, "2026-10-25", "2026-10-25", TODAY, AT_20, AT_20));
    }

    @Test
    public void jamaisSansChoixNiDeuxFoisNiSiBilanFait() {
        assertEquals(EveningNote.QUIET_DISABLED, GutEvening.decide(false, null, null, TODAY, AT_20, AT_20));
        assertEquals(EveningNote.QUIET_NOTED, GutEvening.decide(true, TODAY, null, TODAY, AT_20, AT_20));
        assertEquals(EveningNote.QUIET_ASKED, GutEvening.decide(true, null, TODAY, TODAY, AT_20, AT_20));
        assertEquals(EveningNote.QUIET_LATE, GutEvening.decide(true, null, null, TODAY, AT_20 + 121, AT_20));
    }

    @Test
    public void heureParDefaut20hEtBornee() {
        assertEquals(GutEvening.DEFAULT_MINUTE, GutEvening.clampMinute(-1));
        assertEquals(GutEvening.DEFAULT_MINUTE, GutEvening.clampMinute(24 * 60));
        assertEquals(18 * 60, GutEvening.clampMinute(9 * 60));
        assertEquals(23 * 60, GutEvening.clampMinute(23 * 60 + 40));
        assertEquals(paris(2026, 10, 26, 20, 0), GutEvening.nextAt(paris(2026, 10, 26, 9, 0), PARIS, -5));
        assertEquals(paris(2026, 10, 27, 20, 0), GutEvening.nextAt(paris(2026, 10, 26, 20, 30), PARIS, AT_20));
    }

    @Test
    public void notificationDisparaitAvantMinuit() {
        assertEquals(4 * 60 * 60_000L, GutEvening.timeoutMs(paris(2026, 10, 26, 18, 0), PARIS));
        assertEquals(90 * 60_000L, GutEvening.timeoutMs(paris(2026, 10, 26, 22, 30), PARIS));
        assertEquals(60_000L, GutEvening.timeoutMs(paris(2026, 10, 26, 23, 59), PARIS));
    }

    @Test
    public void laBoiteNeGardeQueLeNiveauEtLHeure() {
        assertEquals("{\"v\":1,\"level\":\"discomfort\",\"at\":1234}", GutEvening.record("discomfort", 1234));
        assertEquals(2, GutEvening.levelIndex("pain"));
        assertEquals(-1, GutEvening.levelIndex("terrible"));
    }

    @Test(expected = IllegalArgumentException.class)
    public void niveauInconnuRefuse() {
        GutEvening.record("\"},{\"x", 1);
    }
}
