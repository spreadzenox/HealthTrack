package com.healthtrack.app.gut;

/**
 * Règle pure du rappel de la portion du jour (réintroduction guidée, src/services/fodmapReminder.js) : l'app donne
 * la liste des rappels restants (heures croissantes, au plus 3) ; le natif affiche le dernier rappel échu et programme
 * le suivant. Testée sur la JVM (PortionScheduleTest).
 */
public final class PortionSchedule {

    /** Tolérance d'une alarme inexacte : un rappel dû dans la minute est traité maintenant. */
    public static final long EARLY_MS = 60_000L;

    private PortionSchedule() {
    }

    /** Indice du dernier rappel échu à `now` (le plus récent, on n'empile pas les anciens), ou -1. */
    public static int dueIndex(long[] ats, long now) {
        int due = -1;
        for (int i = 0; i < ats.length; i++) if (ats[i] <= now + EARLY_MS) due = i;
        return due;
    }

    /** Heure du prochain rappel à programmer après `now`, ou 0 s'il n'y en a plus. */
    public static long nextAt(long[] ats, long now) {
        for (long at : ats) if (at > now + EARLY_MS) return at;
        return 0;
    }
}
