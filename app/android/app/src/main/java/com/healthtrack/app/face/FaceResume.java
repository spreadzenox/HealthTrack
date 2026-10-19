package com.healthtrack.app.face;

/**
 * Faut-il proposer « Reprendre » (journal/IDEES.md I88 ②) ? Android ne laisse pas relancer un service caméra
 * depuis l'arrière-plan : quand la lecture du visage a été tuée (mise à jour de l'app, redémarrage, One UI qui
 * fait le ménage), HealthTrack poste une notification discrète dont le geste rouvre l'app et relance le service.
 * Règle pure : le natif lui passe l'état, elle rend null (on prévient) ou la raison de se taire, gardée dans le
 * diagnostic.
 */
public final class FaceResume {

    public static final String TRIGGER_PERIODIC = "periodic";
    public static final String TRIGGER_BOOT = "boot";
    public static final String TRIGGER_UPDATE = "update";

    /** Une notification ignorée n'est reposée qu'après ce délai (pas de harcèlement). */
    public static final long REMIND_AFTER_MS = 6 * 60 * 60_000L;

    public static final String QUIET_DISABLED = "disabled";
    public static final String QUIET_RUNNING = "running";
    public static final String QUIET_APP_OPEN = "app_open";
    public static final String QUIET_NO_PERMISSION = "no_permission";
    public static final String QUIET_RECENT = "recent";

    private FaceResume() {}

    /**
     * @param enabled        l'utilisateur a laissé l'interrupteur allumé (« Arrêter » l'éteint)
     * @param running        le service tourne
     * @param appOpen        l'app est à l'écran : sa carte propose déjà de relancer
     * @param permission     l'accès à la caméra est toujours accordé (sinon c'est à l'app de le redemander)
     * @param lastNoticeAt   dernière notification postée (ms, 0 si aucune)
     * @param trigger        un redémarrage ou une mise à jour tue toujours le service : on prévient tout de suite
     */
    public static String decide(boolean enabled, boolean running, boolean appOpen, boolean permission,
                                long lastNoticeAt, long now, String trigger) {
        if (!enabled) return QUIET_DISABLED;
        if (running) return QUIET_RUNNING;
        if (appOpen) return QUIET_APP_OPEN;
        if (!permission) return QUIET_NO_PERMISSION;
        boolean fresh = TRIGGER_BOOT.equals(trigger) || TRIGGER_UPDATE.equals(trigger);
        if (!fresh && lastNoticeAt > 0 && now - lastNoticeAt >= 0 && now - lastNoticeAt < REMIND_AFTER_MS) {
            return QUIET_RECENT;
        }
        return null;
    }
}
