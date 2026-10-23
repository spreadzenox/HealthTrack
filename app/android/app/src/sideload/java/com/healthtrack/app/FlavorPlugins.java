package com.healthtrack.app;

import com.getcapacitor.Plugin;

import java.util.Collections;
import java.util.List;

/** Plugins propres à la variante sideload : aucun (pas de Play Billing, journal/PRODUIT.md, jalon 6). */
final class FlavorPlugins {

    private FlavorPlugins() {}

    static List<Class<? extends Plugin>> list() {
        return Collections.emptyList();
    }
}
