package com.healthtrack.app.huawei;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

import org.junit.BeforeClass;
import org.junit.Test;

/**
 * Reconnexion Java rejouée sur la transcription du pilote JS face à une fausse GT 6 Pro (HiChain 3,
 * GCM, IV aléatoire, JSON + NUL) : chaque trame envoyée doit être identique, octet pour octet.
 */
@SuppressWarnings("unchecked")
public class WatchHandshakeTest {

    private static Map<String, Object> vector;

    @BeforeClass
    public static void load() throws Exception {
        try (InputStream in = WatchHandshakeTest.class.getResourceAsStream("/huawei/link-vectors.json")) {
            assertNotNull(in);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            for (int n; (n = in.read(buf)) > 0; ) out.write(buf, 0, n);
            vector = (Map<String, Object>) MiniJson.parseObject(new String(out.toByteArray(), StandardCharsets.UTF_8)).get("handshake");
        }
    }

    /** Transport qui vérifie chaque trame envoyée et livre les réponses enregistrées qui la suivent. */
    static final class Replay implements WatchLink.Transport {
        private final List<Map<String, Object>> steps;
        private final BlockingQueue<byte[]> incoming = new LinkedBlockingQueue<>();
        private int next;
        final List<String> mismatches = new ArrayList<>();
        private final int truncateAfter;

        Replay(List<Object> steps, int truncateAfter) {
            this.steps = new ArrayList<>();
            for (Object s : steps) this.steps.add((Map<String, Object>) s);
            this.truncateAfter = truncateAfter;
        }

        @Override
        public synchronized void write(byte[] bytes) {
            if (next >= steps.size() || !"out".equals(steps.get(next).get("dir"))) {
                mismatches.add("trame en trop : " + IsoAuth.hex(bytes));
                return;
            }
            String expected = ((String) steps.get(next++).get("hex")).toUpperCase();
            if (!expected.equals(IsoAuth.hex(bytes))) mismatches.add("étape " + (next - 1) + " : attendu " + expected + ", envoyé " + IsoAuth.hex(bytes));
            while (next < steps.size() && "in".equals(steps.get(next).get("dir"))) {
                if (next >= truncateAfter) {
                    incoming.add(new byte[0]);
                    break;
                }
                incoming.add(IsoAuth.unhex((String) steps.get(next++).get("hex")));
            }
        }

        @Override
        public int read(byte[] buffer) throws IOException {
            byte[] b;
            try {
                b = incoming.take();
            } catch (InterruptedException e) {
                return -1;
            }
            if (b.length == 0) return -1; // connexion coupée
            System.arraycopy(b, 0, buffer, 0, b.length);
            return b.length;
        }

        @Override
        public void close() {
            incoming.add(new byte[0]);
        }
    }

    private static LinkVectorsTest.Scripted random() {
        return new LinkVectorsTest.Scripted((List<Object>) vector.get("random"));
    }

    @Test
    public void reconnexion_identique_au_pilote_js() throws Exception {
        Replay replay = new Replay((List<Object>) vector.get("steps"), Integer.MAX_VALUE);
        LinkVectorsTest.Scripted random = random();
        try (WatchLink link = new WatchLink(replay)) {
            WatchHandshake.LinkParams lp = WatchHandshake.authenticate(link, IsoAuth.unhex((String) vector.get("authToken")),
                    (String) vector.get("authId"), ((Number) vector.get("requestId")).longValue(), random, 2000);
            assertEquals(4, lp.deviceSupportType);
            assertTrue(lp.gcm() && lp.randomIv());
            assertTrue(link.encrypted());
            assertEquals(((Number) vector.get("battery")).intValue(), WatchHandshake.battery(link, 2000));
        }
        assertEquals(new ArrayList<String>(), replay.mismatches);
    }

    @Test
    public void connexion_coupee_pendant_l_authentification() throws Exception {
        Replay replay = new Replay((List<Object>) vector.get("steps"), 9);
        try (WatchLink link = new WatchLink(replay)) {
            WatchHandshake.authenticate(link, IsoAuth.unhex((String) vector.get("authToken")), (String) vector.get("authId"),
                    ((Number) vector.get("requestId")).longValue(), random(), 2000);
            fail("authentification sans réponse acceptée");
        } catch (IOException e) {
            assertTrue(e.getMessage(), e.getMessage().contains("coupée"));
        }
    }

    @Test
    public void montre_muette_delai_depasse() throws Exception {
        WatchLink.Transport silent = new WatchLink.Transport() {
            private final BlockingQueue<byte[]> q = new LinkedBlockingQueue<>();

            @Override
            public void write(byte[] bytes) {}

            @Override
            public int read(byte[] buffer) {
                try {
                    q.take();
                } catch (InterruptedException e) {
                    // fermeture
                }
                return -1;
            }

            @Override
            public void close() {
                q.add(new byte[0]);
            }
        };
        try (WatchLink link = new WatchLink(silent)) {
            WatchHandshake.authenticate(link, new byte[32], "00", 1, random(), 150);
            fail("montre muette acceptée");
        } catch (IOException e) {
            assertTrue(e.getMessage(), e.getMessage().startsWith("Pas de réponse de la montre (1/1)"));
        }
    }

    @Test
    public void negociation_hichain() {
        List<LinkCodec.Tlv> one = new ArrayList<>();
        one.add(LinkCodec.Tlv.ofByte(1, 1));
        assertTrue(WatchHandshake.isHichain(one));
        List<LinkCodec.Tlv> lite = new ArrayList<>();
        lite.add(LinkCodec.Tlv.ofByte(2, 1));
        assertTrue(!WatchHandshake.isHichain(lite));
    }
}
