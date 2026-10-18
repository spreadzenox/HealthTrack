package com.healthtrack.app.face;

/**
 * Quand prendre une rafale (journal/IDEES.md I88, I114). Seules les rafales du **déverrouillage** servent à
 * l'humeur : déclencher aussi à l'ouverture de certaines apps ferait dépendre les images vues de l'usage du
 * téléphone, un X (biais de composition, D5). Les rafales « manual » (bouton « Tester » de l'app) ne servent
 * qu'au diagnostic. Règle pure : le service lui passe l'état du téléphone, elle rend null (on y va) ou la
 * raison du saut, comptée dans le diagnostic.
 */
public final class FaceSchedule {

    public static final String TRIGGER_UNLOCK = "unlock";
    public static final String TRIGGER_MANUAL = "manual";

    /** Deux déverrouillages rapprochés ne font qu'une rafale. */
    public static final long MIN_INTERVAL_MS = 2 * 60 * 1000L;
    /** Plafond de sécurité par jour (≈ 60 déverrouillages attendus, visage.md / I88). */
    public static final int MAX_PER_DAY = 150;
    /** Marge thermique d'Android (0 = froid, 1 = bridage imminent) au-delà de laquelle on ne lance rien. */
    public static final double MAX_THERMAL_HEADROOM = 0.8;

    public static final String SKIP_TOO_SOON = "too_soon";
    public static final String SKIP_DAILY_CAP = "daily_cap";
    public static final String SKIP_SCREEN_OFF = "screen_off";
    public static final String SKIP_IN_CALL = "in_call";
    public static final String SKIP_HOT = "hot";
    public static final String SKIP_UNKNOWN_TRIGGER = "unknown_trigger";

    private FaceSchedule() {}

    /**
     * @param lastBurstAt  heure de la dernière rafale du déverrouillage (ms, 0 si aucune)
     * @param burstsToday  rafales du déverrouillage déjà prises aujourd'hui
     * @param thermal      marge thermique (NaN si le téléphone ne la donne pas)
     */
    public static String decide(String trigger, long now, long lastBurstAt, int burstsToday, boolean screenOn,
                                boolean inCall, double thermal) {
        boolean manual = TRIGGER_MANUAL.equals(trigger);
        if (!manual && !TRIGGER_UNLOCK.equals(trigger)) return SKIP_UNKNOWN_TRIGGER;
        if (!screenOn) return SKIP_SCREEN_OFF;
        if (inCall) return SKIP_IN_CALL;
        if (!Double.isNaN(thermal) && thermal > MAX_THERMAL_HEADROOM) return SKIP_HOT;
        if (manual) return null;
        if (burstsToday >= MAX_PER_DAY) return SKIP_DAILY_CAP;
        if (lastBurstAt > 0 && now - lastBurstAt >= 0 && now - lastBurstAt < MIN_INTERVAL_MS) return SKIP_TOO_SOON;
        return null;
    }
}
