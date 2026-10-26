package com.healthtrack.app.gut;

import com.healthtrack.app.mood.EveningNote;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * Bilan du ventre du soir par notification (journal/IDEES.md I170, src/services/gutEvening.js) : « Et votre ventre
 * aujourd'hui ? » avec Calme / Gêne / Douleur en boutons, sans ouvrir l'app. La réponse attend dans une boîte native
 * et devient, à l'ouverture suivante, le même bilan qu'un geste dans la carte « Votre ventre ». Mêmes règles que la
 * note du soir (mood/EveningNote) : jamais sans le choix de la personne, jamais deux fois par jour, jamais si le
 * bilan du jour est fait ; l'heure suit les bilans (20 h par défaut). Règle pure, testée sans Android.
 */
public final class GutEvening {

    /** 20 h quand aucun bilan du soir ne donne d'heure habituelle. */
    public static final int DEFAULT_MINUTE = 20 * 60;
    public static final int RECORD_VERSION = 1;

    /** Les trois niveaux, dans l'ordre des boutons (mêmes identifiants que GUT_LEVELS côté JS). */
    public static final String[] LEVELS = {"calm", "discomfort", "pain"};
    public static final String[] LABELS = {"Calme", "Gêne", "Douleur"};

    private GutEvening() {}

    /** Heure prévue ramenée dans la soirée (18 h – 23 h) ; valeur absurde → 20 h. */
    public static int clampMinute(int minuteOfDay) {
        if (minuteOfDay < 0 || minuteOfDay >= 24 * 60) return DEFAULT_MINUTE;
        return EveningNote.clampMinute(minuteOfDay);
    }

    /** null = on demande ; sinon la raison de se taire (mêmes raisons que la note du soir). */
    public static String decide(boolean enabled, String doneDay, String askedDay, String today, int nowMinute,
                                int minuteOfDay) {
        return EveningNote.decide(enabled, doneDay, askedDay, today, nowMinute, clampMinute(minuteOfDay));
    }

    public static long nextAt(long nowMs, ZoneId zone, int minuteOfDay) {
        return EveningNote.nextAt(nowMs, zone, clampMinute(minuteOfDay));
    }

    /**
     * Durée de vie de la notification : jusqu'à minuit (une réponse après minuit parlerait du mauvais jour), au plus
     * 4 h, au moins 1 min.
     */
    public static long timeoutMs(long nowMs, ZoneId zone) {
        ZonedDateTime now = Instant.ofEpochMilli(nowMs).atZone(zone);
        long untilMidnight = now.toLocalDate().plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli() - nowMs;
        return Math.max(60_000L, Math.min(4 * 60 * 60_000L, untilMidnight));
    }

    public static int levelIndex(String level) {
        for (int i = 0; i < LEVELS.length; i++) if (LEVELS[i].equals(level)) return i;
        return -1;
    }

    /** Ce que la boîte garde d'un bilan : le niveau et l'heure du geste, rien d'autre. */
    public static String record(String level, long atMs) {
        if (levelIndex(level) < 0) throw new IllegalArgumentException("niveau inconnu : " + level);
        return "{\"v\":" + RECORD_VERSION + ",\"level\":\"" + level + "\",\"at\":" + atMs + "}";
    }
}
