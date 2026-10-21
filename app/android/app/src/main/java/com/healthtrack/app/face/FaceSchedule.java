package com.healthtrack.app.face;

/**
 * Quand prendre une rafale (journal/IDEES.md I88, I114). En sideload, seules les rafales du **déverrouillage**
 * servent au bien-être : déclencher aussi à l'ouverture d'autres apps ferait dépendre les images vues de l'usage
 * du téléphone, un X (biais de composition, D5). La variante play, qui n'a pas de service caméra en arrière-plan
 * (journal/PLAY-CONFORMITE.md, option B), lit le visage à l'**ouverture de HealthTrack** seulement (« app_open ») :
 * jamais à l'ouverture d'une autre app, avec son propre intervalle et son plafond. Les rafales « manual » (bouton
 * « Tester » de l'app) ne servent qu'au diagnostic. Règle pure : l'appelant lui passe l'état du téléphone et les
 * compteurs du même déclencheur, elle rend null (on y va) ou la raison du saut, comptée dans le diagnostic.
 */
public final class FaceSchedule {

    public static final String TRIGGER_UNLOCK = "unlock";
    public static final String TRIGGER_MANUAL = "manual";
    /** Ouverture de HealthTrack, variante play seulement (FaceOneShot). */
    public static final String TRIGGER_APP_OPEN = "app_open";

    /** Deux déverrouillages rapprochés ne font qu'une rafale. */
    public static final long MIN_INTERVAL_MS = 2 * 60 * 1000L;
    /** Plafond de sécurité par jour (≈ 60 déverrouillages attendus, visage.md / I88). */
    public static final int MAX_PER_DAY = 150;
    /** Ouverture de l'app : une lecture au plus toutes les 30 min (rouvrir l'app ne multiplie pas les lectures)… */
    public static final long APP_OPEN_MIN_INTERVAL_MS = 30 * 60 * 1000L;
    /** … et au plus 12 par jour. */
    public static final int APP_OPEN_MAX_PER_DAY = 12;
    /** Marge thermique d'Android (0 = froid, 1 = bridage imminent) au-delà de laquelle on ne lance rien. */
    public static final double MAX_THERMAL_HEADROOM = 0.8;

    /** 2e essai (I118) : une rafale sans aucune image exploitable est reprise une fois, 2 s plus tard. */
    public static final long RETRY_DELAY_MS = 2000;
    /** … mais jamais au-delà de 10 s après le déverrouillage : la rafale doit rester celle du déverrouillage. */
    public static final long RETRY_WINDOW_MS = 10_000;

    public static final String SKIP_TOO_SOON = "too_soon";
    public static final String SKIP_DAILY_CAP = "daily_cap";
    public static final String SKIP_SCREEN_OFF = "screen_off";
    public static final String SKIP_IN_CALL = "in_call";
    public static final String SKIP_HOT = "hot";
    public static final String SKIP_UNKNOWN_TRIGGER = "unknown_trigger";

    private FaceSchedule() {}

    /**
     * @param lastBurstAt  heure de la dernière rafale du même déclencheur (ms, 0 si aucune)
     * @param burstsToday  rafales du même déclencheur déjà prises aujourd'hui
     * @param thermal      marge thermique (NaN si le téléphone ne la donne pas)
     */
    public static String decide(String trigger, long now, long lastBurstAt, int burstsToday, boolean screenOn,
                                boolean inCall, double thermal) {
        boolean manual = TRIGGER_MANUAL.equals(trigger);
        boolean appOpen = TRIGGER_APP_OPEN.equals(trigger);
        if (!manual && !appOpen && !TRIGGER_UNLOCK.equals(trigger)) return SKIP_UNKNOWN_TRIGGER;
        if (!screenOn) return SKIP_SCREEN_OFF;
        if (inCall) return SKIP_IN_CALL;
        if (!Double.isNaN(thermal) && thermal > MAX_THERMAL_HEADROOM) return SKIP_HOT;
        if (manual) return null;
        if (burstsToday >= (appOpen ? APP_OPEN_MAX_PER_DAY : MAX_PER_DAY)) return SKIP_DAILY_CAP;
        long interval = appOpen ? APP_OPEN_MIN_INTERVAL_MS : MIN_INTERVAL_MS;
        if (lastBurstAt > 0 && now - lastBurstAt >= 0 && now - lastBurstAt < interval) return SKIP_TOO_SOON;
        return null;
    }

    /**
     * Faut-il reprendre la rafale du déverrouillage qui n'a lu aucun visage (I118) ? Une seule fois par
     * déverrouillage, même déclencheur, et seulement si le 2e essai tombe encore dans les 10 s qui suivent le
     * déverrouillage. Le test (« manual ») n'est jamais repris : c'est du diagnostic.
     *
     * @param sinceUnlockMs temps écoulé depuis le déverrouillage à la fin de la 1re rafale
     */
    public static boolean shouldRetry(String trigger, boolean faceFound, boolean alreadyRetried, long sinceUnlockMs) {
        if (!TRIGGER_UNLOCK.equals(trigger) || faceFound || alreadyRetried) return false;
        return sinceUnlockMs >= 0 && sinceUnlockMs + RETRY_DELAY_MS <= RETRY_WINDOW_MS;
    }
}
