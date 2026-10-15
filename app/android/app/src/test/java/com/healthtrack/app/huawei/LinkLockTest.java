package com.healthtrack.app.huawei;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class LinkLockTest {

    @Test
    public void unSeulTitulaireALaFois() {
        LinkLock lock = new LinkLock();
        assertTrue(lock.tryAcquire(LinkLock.NATIVE));
        assertFalse(lock.tryAcquire(LinkLock.APP));
        assertTrue(lock.tryAcquire(LinkLock.NATIVE));
        assertEquals(LinkLock.NATIVE, lock.holder());
    }

    @Test
    public void onNeRendJamaisLaLiaisonDeLAutre() {
        LinkLock lock = new LinkLock();
        lock.tryAcquire(LinkLock.NATIVE);
        // la page ferme sa connexion (refusée) : la relecture native garde la sienne
        lock.release(LinkLock.APP);
        assertEquals(LinkLock.NATIVE, lock.holder());
        lock.release(LinkLock.NATIVE);
        assertNull(lock.holder());
        assertTrue(lock.tryAcquire(LinkLock.APP));
    }
}
