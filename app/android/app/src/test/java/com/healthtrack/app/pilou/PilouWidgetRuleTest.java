package com.healthtrack.app.pilou;

import static org.junit.Assert.assertEquals;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;

import org.junit.Test;

/** Même règle que app/src/companion/world/widget.js (widget.test.js), vue depuis le widget Android. */
public class PilouWidgetRuleTest {

    private static LocalDateTime d(int h, int m) {
        return LocalDateTime.of(2026, 11, 19, h, m); // jeudi
    }

    private static long ms(LocalDateTime t) {
        return t.atZone(ZoneId.of("Europe/Paris")).toInstant().toEpochMilli();
    }

    private static PilouWidgetRule.State state() {
        PilouWidgetRule.State s = new PilouWidgetRule.State();
        s.day = "2026-11-19";
        s.planned = Arrays.asList("Repas", "Bien-être", "Méditation");
        s.remaining = Arrays.asList("Repas", "Bien-être");
        s.usageDay = 3;
        s.name = "Bulle";
        return s;
    }

    @Test
    public void sixPoses() {
        assertEquals("dort", PilouWidgetRule.pose(23 * 60, 3, -1, -1, -1));
        assertEquals("dort", PilouWidgetRule.pose(3 * 60, 0, -1, -1, -1));
        assertEquals("fete", PilouWidgetRule.pose(14 * 60, 0, -1, -1, -1));
        assertEquals("se-reveille", PilouWidgetRule.pose(7 * 60 + 20, 2, -1, -1, -1));
        assertEquals("se-reveille", PilouWidgetRule.pose(8 * 60 + 20, 2, -1, 8 * 60, -1));
        assertEquals("soir", PilouWidgetRule.pose(19 * 60, 2, -1, -1, -1));
        assertEquals("rassasie", PilouWidgetRule.pose(13 * 60, 2, 45, -1, -1));
        assertEquals("content", PilouWidgetRule.pose(15 * 60, 2, 165, -1, -1));
    }

    @Test
    public void textesCommeDansLApp() {
        assertEquals("Plus rien à faire", PilouWidgetRule.remainingText(0));
        assertEquals("Encore 1 chose", PilouWidgetRule.remainingText(1));
        assertEquals("Encore 3 choses", PilouWidgetRule.remainingText(3));
        assertEquals("Jeudi · jour 3", PilouWidgetRule.dayText(d(10, 0).toLocalDate(), 3));
        assertEquals("Jeudi", PilouWidgetRule.dayText(d(10, 0).toLocalDate(), 12));
    }

    @Test
    public void memeJour_ceQuiReste() {
        PilouWidgetRule.View v = PilouWidgetRule.render(state(), d(15, 0), ms(d(15, 0)));
        assertEquals("content", v.pose);
        assertEquals("Encore 2 choses", v.title);
        assertEquals("Jeudi · jour 3", v.day);
        assertEquals("Repas · Bien-être", v.bubbles);
        assertEquals("Bulle est content. Encore 2 choses : Repas, Bien-être. Jeudi · jour 3.", v.accessibility);
    }

    @Test
    public void nouveauJour_toutRevient_rienNeSAccumule() {
        // à 4 h 10 le lendemain : toutes les bulles du jour, sans compteur ni reproche
        LocalDateTime next = LocalDateTime.of(2026, 11, 20, 9, 0);
        PilouWidgetRule.View v = PilouWidgetRule.render(state(), next, ms(next));
        assertEquals("Encore 3 choses", v.title);
        assertEquals("Vendredi", v.day);
        assertEquals("Repas · Bien-être · Méditation", v.bubbles);
        // avant 4 h, c'est encore la journée d'hier
        assertEquals("2026-11-19", PilouWidgetRule.worldDay(LocalDateTime.of(2026, 11, 20, 3, 59)));
    }

    @Test
    public void sansEtat_pilouTranquille() {
        PilouWidgetRule.View v = PilouWidgetRule.render(null, d(15, 0), ms(d(15, 0)));
        assertEquals("fete", v.pose);
        assertEquals("Plus rien à faire", v.title);
        assertEquals("Pilou fait la fête. Plus rien à faire. Jeudi.", v.accessibility);
    }

    @Test
    public void laNuit_leResteAttend() {
        PilouWidgetRule.View v = PilouWidgetRule.render(state(), d(23, 0), ms(d(23, 0)));
        assertEquals("dort", v.pose);
        assertEquals("Le reste peut attendre demain", v.title);
        assertEquals("", v.bubbles);
        assertEquals("Bulle dort. Le reste peut attendre demain. Jeudi · jour 3.", v.accessibility);
    }

    @Test
    public void plusDeQuatre() {
        PilouWidgetRule.State s = state();
        s.remaining = Arrays.asList("Repas", "Bien-être", "Méditation", "Lecture", "Ventre");
        assertEquals("Repas · Bien-être · Méditation · Lecture · +1", PilouWidgetRule.render(s, d(15, 0), ms(d(15, 0))).bubbles);
    }
}
