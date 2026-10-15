package com.healthtrack.app.huawei;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.BeforeClass;
import org.junit.Test;

/**
 * Relecture app tuée (§9.1 e) : même fenêtre que `syncWindow` (vecteurs JS), règles d'espacement / pause du JS,
 * relecture complète rejouée sur la transcription du pilote JS, état après chaque issue.
 */
@SuppressWarnings("unchecked")
public class BackgroundSyncTest {

    private static Map<String, Object> vectors;

    @BeforeClass
    public static void load() throws Exception {
        try (InputStream in = BackgroundSyncTest.class.getResourceAsStream("/huawei/link-vectors.json")) {
            assertNotNull(in);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            for (int n; (n = in.read(buf)) > 0; ) out.write(buf, 0, n);
            vectors = MiniJson.parseObject(new String(out.toByteArray(), StandardCharsets.UTF_8));
        }
    }

    private static long num(Map<String, Object> m, String k) {
        return ((Number) m.get(k)).longValue();
    }

    private static final long MIN = 60_000L;

    @Test
    public void fenetre_identique_a_syncWindow() {
        List<Object> cases = (List<Object>) vectors.get("windows");
        assertTrue(cases.size() >= 5);
        for (Object o : cases) {
            Map<String, Object> c = (Map<String, Object>) o;
            long[] w = BackgroundSync.window(num(c, "lastUntil"), num(c, "now"));
            assertEquals(c.toString(), num(c, "since"), w[0]);
            assertEquals(c.toString(), num(c, "until"), w[1]);
        }
    }

    @Test
    public void decision_comme_le_js() {
        BackgroundSync.State s = new BackgroundSync.State();
        long now = 1_760_500_000_000L;
        assertEquals("app", BackgroundSync.decide(s, now, true, false, true));
        assertEquals("busy", BackgroundSync.decide(s, now, false, true, true));
        assertEquals("no_key", BackgroundSync.decide(s, now, false, false, false));
        assertEquals("run", BackgroundSync.decide(s, now, false, false, true));
        s.lastAttemptAt = now - 29 * MIN;
        assertEquals("recent", BackgroundSync.decide(s, now, false, false, true));
        s.lastAttemptAt = now - 31 * MIN;
        assertEquals("run", BackgroundSync.decide(s, now, false, false, true));
        s.failures = 2; // 2 h
        assertEquals("recent", BackgroundSync.decide(s, now, false, false, true));
        s.failures = 9; // plafonné à 4 h
        assertEquals(4 * 60 * MIN, BackgroundSync.interval(s));
        s.paused = true;
        assertEquals("paused", BackgroundSync.decide(s, now + 24 * 60 * MIN, false, false, true));
    }

    @Test
    public void declencheurs_deverrouillage_et_periodique() {
        BackgroundSync.State s = new BackgroundSync.State();
        long now = 1_760_500_000_000L;
        // La reconnexion signalée prouve la présence : l'état connu ne compte pas.
        assertEquals("run", BackgroundSync.decide(BackgroundSync.TRIGGER_PRESENCE, s, now, false, false, true, BackgroundSync.ABSENT));
        // Déverrouillage / filet : montre partie → on ne tente rien (pas d'échec compté, pas de recul).
        assertEquals("absent", BackgroundSync.decide(BackgroundSync.TRIGGER_UNLOCK, s, now, false, false, true, BackgroundSync.ABSENT));
        assertEquals("absent", BackgroundSync.decide(BackgroundSync.TRIGGER_PERIODIC, s, now, false, false, true, BackgroundSync.ABSENT));
        assertEquals("run", BackgroundSync.decide(BackgroundSync.TRIGGER_UNLOCK, s, now, false, false, true, BackgroundSync.PRESENT));
        // Présence inconnue (pas d'appareil compagnon) : le filet essaie quand même.
        assertEquals("run", BackgroundSync.decide(BackgroundSync.TRIGGER_PERIODIC, s, now, false, false, true, BackgroundSync.UNKNOWN));
        // Les règles communes passent avant : app ouverte, pause, sans clé, 30 min.
        assertEquals("app", BackgroundSync.decide(BackgroundSync.TRIGGER_UNLOCK, s, now, true, false, true, BackgroundSync.ABSENT));
        assertEquals("no_key", BackgroundSync.decide(BackgroundSync.TRIGGER_PERIODIC, s, now, false, false, false, BackgroundSync.PRESENT));
        s.lastAttemptAt = now - 10 * MIN;
        assertEquals("recent", BackgroundSync.decide(BackgroundSync.TRIGGER_UNLOCK, s, now, false, false, true, BackgroundSync.PRESENT));
        s.paused = true;
        assertEquals("paused", BackgroundSync.decide(BackgroundSync.TRIGGER_PERIODIC, s, now, false, false, true, BackgroundSync.PRESENT));
    }

    @Test
    public void presence_lue_du_service_compagnon() {
        assertEquals(BackgroundSync.UNKNOWN, BackgroundSync.presenceOf(null));
        assertEquals(BackgroundSync.PRESENT, BackgroundSync.presenceOf("appeared"));
        assertEquals(BackgroundSync.ABSENT, BackgroundSync.presenceOf("disappeared"));
        assertEquals(BackgroundSync.UNKNOWN, BackgroundSync.presenceOf("autre"));
    }

    @Test
    public void synchro_de_l_app_partagee() {
        BackgroundSync.State s = new BackgroundSync.State();
        s.failures = 3;
        s.paused = true;
        s.lastUntil = 5000;
        BackgroundSync.shareFromApp(s, 4000, 9000);
        assertEquals(5000, s.lastUntil); // jamais de recul
        assertEquals(9000, s.lastAttemptAt);
        assertEquals(0, s.failures);
        assertFalse(s.paused);
        assertEquals("recent", BackgroundSync.decide(s, 9000 + 10 * MIN, false, false, true));
    }

    @Test
    public void relecture_complete_rejouee_sur_le_pilote_js() {
        Map<String, Object> v = (Map<String, Object>) vectors.get("read");
        Map<String, Object> expected = (Map<String, Object>) v.get("capture");
        WatchHandshakeTest.Replay replay = new WatchHandshakeTest.Replay((List<Object>) v.get("steps"), Integer.MAX_VALUE);
        LinkVectorsTest.Scripted random = new LinkVectorsTest.Scripted((List<Object>) v.get("random"));
        BackgroundSync.State s = new BackgroundSync.State();
        s.lastUntil = num(expected, "since") + 6 * 3_600_000L; // reprise → fenêtre du vecteur (6 h relues)
        s.failures = 1;
        List<String> stored = new ArrayList<>();
        BackgroundSync.Result r = BackgroundSync.run(s, () -> replay, "AA:BB:CC:DD:EE:FF", "HUAWEI WATCH GT 6 Pro-123",
                (String) v.get("authId"), IsoAuth.unhex((String) v.get("authToken")),
                (json, at) -> {
                    stored.add(json);
                    return "capture-x";
                }, num(expected, "at"), num(v, "requestId"), random, 2000);
        assertEquals(new ArrayList<String>(), replay.mismatches);
        assertEquals("connected", r.outcome);
        assertEquals("capture-x", r.captureName);
        assertEquals(1, stored.size());
        Map<String, Object> got = MiniJson.parseObject(stored.get(0));
        assertEquals(num(expected, "since"), num(got, "since"));
        assertEquals(num(expected, "until"), num(got, "until"));
        assertEquals("AA:BB:CC:DD:EE:FF", got.get("address"));
        assertEquals(((List<Object>) expected.get("replies")).size(), ((List<Object>) got.get("replies")).size());
        assertEquals(num(expected, "battery"), s.battery);
        assertEquals(num(expected, "until"), s.lastUntil);
        assertEquals(0, s.failures);
        assertEquals(num(expected, "at"), s.lastSuccessAt);
    }

    @Test
    public void montre_injoignable_espace_les_essais() {
        BackgroundSync.State s = new BackgroundSync.State();
        BackgroundSync.Result r = BackgroundSync.run(s, () -> {
            throw new IOException("hors de portée");
        }, "AA:BB:CC:DD:EE:FF", null, "id", new byte[32], (j, a) -> "x", 1000, 1000, null, 100);
        assertEquals("unreachable", r.outcome);
        assertNull(r.captureName);
        assertEquals(1, s.failures);
        assertEquals(1000, s.lastAttemptAt);
        assertEquals(0, s.lastUntil);
    }

    @Test
    public void sans_cle_rien_n_est_tente() {
        BackgroundSync.State s = new BackgroundSync.State();
        boolean[] opened = {false};
        BackgroundSync.Result r = BackgroundSync.run(s, () -> {
            opened[0] = true;
            return null;
        }, "AA:BB:CC:DD:EE:FF", null, null, null, (j, a) -> "x", 1000, 1000, null, 100);
        assertEquals("no_key", r.outcome);
        assertFalse(opened[0]);
    }

    @Test
    public void cle_refusee_met_en_pause() {
        BackgroundSync.State s = new BackgroundSync.State();
        assertEquals("key_rejected", BackgroundSync.outcomeOf(new IsoAuth.AuthException("key_rejected", "refusée")));
        assertEquals("failed", BackgroundSync.outcomeOf(new IsoAuth.AuthException("format", "x")));
        BackgroundSync.record(s, "key_rejected", 1000, 5000, false, -1);
        assertTrue(s.paused);
        assertEquals(0, s.failures);
        assertEquals("paused", BackgroundSync.decide(s, 1000 + 999 * MIN, false, false, true));
    }

    @Test
    public void reprise_n_avance_que_si_la_montre_a_rendu_des_blocs() {
        BackgroundSync.State s = new BackgroundSync.State();
        s.lastUntil = 100;
        BackgroundSync.record(s, "connected", 1000, 5000, false, 80);
        assertEquals(100, s.lastUntil);
        assertEquals(80, s.battery);
        BackgroundSync.record(s, "connected", 2000, 6000, true, -1);
        assertEquals(6000, s.lastUntil);
        assertEquals(80, s.battery);
    }
}
