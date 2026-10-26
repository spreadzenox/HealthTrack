package com.healthtrack.app.gut;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

/** Quel rappel de portion afficher, et lequel programmer ensuite. */
public class PortionScheduleTest {

    private static final long H = 3_600_000L;
    private static final long[] ATS = {12 * H, 36 * H, 60 * H};

    @Test
    public void rienAvantLePremierRappel() {
        assertEquals(-1, PortionSchedule.dueIndex(ATS, 11 * H));
        assertEquals(12 * H, PortionSchedule.nextAt(ATS, 11 * H));
    }

    @Test
    public void alarmeUnPeuEnAvanceTraiteeMaintenant() {
        assertEquals(0, PortionSchedule.dueIndex(ATS, 12 * H - 30_000L));
        assertEquals(36 * H, PortionSchedule.nextAt(ATS, 12 * H - 30_000L));
    }

    @Test
    public void telephoneEteintDeuxJoursSeulLeDernierEstAffiche() {
        assertEquals(1, PortionSchedule.dueIndex(ATS, 40 * H));
        assertEquals(60 * H, PortionSchedule.nextAt(ATS, 40 * H));
    }

    @Test
    public void plusRienApresLeDernier() {
        assertEquals(2, PortionSchedule.dueIndex(ATS, 61 * H));
        assertEquals(0, PortionSchedule.nextAt(ATS, 61 * H));
        assertEquals(-1, PortionSchedule.dueIndex(new long[0], 61 * H));
        assertEquals(0, PortionSchedule.nextAt(new long[0], 61 * H));
    }
}
