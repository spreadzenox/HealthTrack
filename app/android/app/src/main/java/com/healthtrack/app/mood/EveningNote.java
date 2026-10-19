package com.healthtrack.app.mood;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * « Note du soir d'un geste » (journal/IDEES.md I113) : une notification à l'heure habituelle des notes de
 * bien-être, avec les 6 notes de l'échelle (0 à 5) en boutons, sans ouvrir l'app. La note attend dans une boîte
 * native et entre dans l'historique à l'ouverture suivante (src/services/eveningNote.js), comme une note saisie.
 * C'est de l'auto-déclaration (Y, vérité terrain de la porte du visage) : jamais obligatoire, jamais deux fois
 * par jour, jamais si une note existe déjà. Règle pure : le natif lui passe l'état, elle rend null (on demande)
 * ou la raison de se taire, gardée dans le diagnostic.
 */
public final class EveningNote {

    /** 21 h quand aucune note du soir ne donne d'heure habituelle. */
    public static final int DEFAULT_MINUTE = 21 * 60;
    /** L'heure apprise reste dans la soirée. */
    public static final int EARLIEST_MINUTE = 18 * 60;
    public static final int LATEST_MINUTE = 23 * 60;
    /** Une alarme retardée (Doze) de plus de 2 h ne demande plus rien ce soir-là. */
    public static final int LATE_AFTER_MIN = 120;

    public static final int MIN_SCORE = 0;
    public static final int MAX_SCORE = 5;
    public static final int RECORD_VERSION = 1;

    public static final String QUIET_DISABLED = "disabled";
    public static final String QUIET_NOTED = "noted_today";
    public static final String QUIET_ASKED = "asked_today";
    public static final String QUIET_LATE = "late";

    private EveningNote() {}

    /** Minute du jour ramenée dans la soirée ; valeur absurde → 21 h. */
    public static int clampMinute(int minuteOfDay) {
        if (minuteOfDay < 0 || minuteOfDay >= 24 * 60) return DEFAULT_MINUTE;
        return Math.max(EARLIEST_MINUTE, Math.min(LATEST_MINUTE, minuteOfDay));
    }

    /**
     * @param enabled     l'utilisateur a demandé la note du soir
     * @param noteDay     jour (AAAA-MM-JJ, heure locale) de la dernière note connue, saisie ou par notification
     * @param askedDay    jour de la dernière notification postée
     * @param today       jour local de maintenant
     * @param nowMinute   minute du jour de maintenant
     * @param minuteOfDay heure prévue (minute du jour)
     */
    public static String decide(boolean enabled, String noteDay, String askedDay, String today, int nowMinute,
                                int minuteOfDay) {
        if (!enabled) return QUIET_DISABLED;
        if (today.equals(noteDay)) return QUIET_NOTED;
        if (today.equals(askedDay)) return QUIET_ASKED;
        if (nowMinute - clampMinute(minuteOfDay) > LATE_AFTER_MIN) return QUIET_LATE;
        return null;
    }

    /** Prochaine échéance (ms) : aujourd'hui à l'heure prévue si elle est encore à venir, sinon demain. */
    public static long nextAt(long nowMs, ZoneId zone, int minuteOfDay) {
        int m = clampMinute(minuteOfDay);
        ZonedDateTime now = Instant.ofEpochMilli(nowMs).atZone(zone);
        LocalTime time = LocalTime.of(m / 60, m % 60);
        // heure locale (pas « minuit + n heures ») : 21 h reste 21 h le jour du changement d'heure
        ZonedDateTime at = now.toLocalDate().atTime(time).atZone(zone);
        if (!at.isAfter(now.plusSeconds(30))) at = now.toLocalDate().plusDays(1).atTime(time).atZone(zone);
        return at.toInstant().toEpochMilli();
    }

    /** Jour local AAAA-MM-JJ (même forme que localDateKey côté JS). */
    public static String dayKey(long ms, ZoneId zone) {
        LocalDate d = Instant.ofEpochMilli(ms).atZone(zone).toLocalDate();
        return d.toString();
    }

    public static int minuteOfDay(long ms, ZoneId zone) {
        ZonedDateTime t = Instant.ofEpochMilli(ms).atZone(zone);
        return t.getHour() * 60 + t.getMinute();
    }

    public static boolean validScore(int score) {
        return score >= MIN_SCORE && score <= MAX_SCORE;
    }

    /** Ce que la boîte garde d'une note : la note et l'heure du geste, rien d'autre. */
    public static String record(int score, long atMs) {
        if (!validScore(score)) throw new IllegalArgumentException("note hors échelle : " + score);
        return "{\"v\":" + RECORD_VERSION + ",\"score\":" + score + ",\"at\":" + atMs + "}";
    }
}
