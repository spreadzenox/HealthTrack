package com.healthtrack.app.huawei;

import java.util.concurrent.atomic.AtomicReference;

/**
 * Une seule liaison à la montre à la fois, partagée entre la page (BtClassicPlugin, connexion ouverte par le JS)
 * et le client Java d'arrière-plan (BackgroundWatchSync), huawei.md §9.1 g. Le premier qui la prend la garde
 * jusqu'à ce qu'il la rende ; l'autre renonce (« busy ») au lieu d'ouvrir une 2e connexion RFCOMM. Sans dépendance
 * Android (testé sur la JVM).
 */
public final class LinkLock {

    public static final String APP = "app";
    public static final String NATIVE = "native";
    /** Verrou du processus. */
    public static final LinkLock SHARED = new LinkLock();

    private final AtomicReference<String> holder = new AtomicReference<>();

    /** Prend la liaison pour `owner` (vrai aussi s'il la tient déjà). */
    public boolean tryAcquire(String owner) {
        return holder.compareAndSet(null, owner) || owner.equals(holder.get());
    }

    /** Rend la liaison si `owner` la tient (sans effet sinon : on ne rend jamais celle de l'autre). */
    public void release(String owner) {
        holder.compareAndSet(owner, null);
    }

    /** Qui tient la liaison (APP, NATIVE) ou null. */
    public String holder() {
        return holder.get();
    }
}
