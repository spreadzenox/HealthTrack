package com.healthtrack.app.face;

/**
 * Repérer chaque déverrouillage (signalement du 19/10 15:05 : aucun repéré sur un Galaxy A56 déverrouillé à
 * l'empreinte). Trois voies, la première arrivée compte, une seule lecture par allumage de l'écran :
 * - la diffusion ACTION_USER_PRESENT (envoyée par l'écran de verrouillage) ;
 * - l'interrogation du verrou (KeyguardManager.isKeyguardLocked), toutes les POLL_EVERY_MS pendant
 *   POLL_WINDOW_MS après l'allumage, si la diffusion n'arrive pas (constructeur, empreinte, visage) ;
 * - l'écran qui s'allume déjà déverrouillé (Smart Lock, pas de verrou, verrouillage différé).
 * Règle pure : le service lui passe les événements et l'état du verrou, elle rend la source du déverrouillage
 * à lire, ou null.
 */
public final class UnlockWatch {

    public static final String SOURCE_USER_PRESENT = "user_present";
    public static final String SOURCE_KEYGUARD = "keyguard";
    public static final String SOURCE_SCREEN_ON = "screen_on";

    public static final long POLL_EVERY_MS = 500;
    /** Au-delà, on regardait l'écran verrouillé (heure, notifications) : la diffusion seule compte encore. */
    public static final long POLL_WINDOW_MS = 60_000;

    private boolean fired;
    private boolean polling;
    private long screenOnAt;

    /** Écran allumé ; `locked` : écran de verrouillage affiché à cet instant. */
    public String onScreenOn(long now, boolean locked) {
        fired = false;
        screenOnAt = now;
        if (!locked) return fire();
        polling = true;
        return null;
    }

    public String onUserPresent(long now) {
        if (fired) return null;
        return fire(SOURCE_USER_PRESENT);
    }

    /** Une interrogation du verrou, tant que polling() est vrai. */
    public String onPoll(long now, boolean locked) {
        if (!polling || fired) return null;
        if (!locked) return fire(SOURCE_KEYGUARD);
        if (now - screenOnAt >= POLL_WINDOW_MS) polling = false;
        return null;
    }

    public void onScreenOff() {
        fired = false;
        polling = false;
    }

    public boolean polling() {
        return polling;
    }

    private String fire() {
        return fire(SOURCE_SCREEN_ON);
    }

    private String fire(String source) {
        fired = true;
        polling = false;
        return source;
    }
}
