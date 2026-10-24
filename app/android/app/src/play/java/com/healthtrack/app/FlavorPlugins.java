package com.healthtrack.app;

import com.getcapacitor.Plugin;

import java.util.Arrays;
import java.util.List;

/** Plugins propres à la variante play : Google Play Billing (jalon 6c-2), Play Integrity (6b-2b) et
 * le rappel de fin d'essai (VC-18b). */
final class FlavorPlugins {

    private FlavorPlugins() {}

    static List<Class<? extends Plugin>> list() {
        return Arrays.asList(PlayBillingPlugin.class, PlayIntegrityPlugin.class, TrialReminderPlugin.class);
    }
}
