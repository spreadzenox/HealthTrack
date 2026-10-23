package com.healthtrack.app;

import com.getcapacitor.Plugin;

import java.util.Collections;
import java.util.List;

/** Plugins propres à la variante play : Google Play Billing (jalon 6c-2). */
final class FlavorPlugins {

    private FlavorPlugins() {}

    static List<Class<? extends Plugin>> list() {
        return Collections.singletonList(PlayBillingPlugin.class);
    }
}
