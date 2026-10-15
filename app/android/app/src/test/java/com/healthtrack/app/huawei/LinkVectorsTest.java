package com.healthtrack.app.huawei;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.junit.BeforeClass;
import org.junit.Test;

/**
 * Le client Java « synchro seule » reproduit exactement le pilote JS (vecteurs générés par
 * src/devices/huawei/javaVectors.test.js) : trames, tranches, rassemblage, chiffrement, authentification.
 */
@SuppressWarnings("unchecked")
public class LinkVectorsTest {

    private static Map<String, Object> vectors;

    @BeforeClass
    public static void load() throws Exception {
        try (InputStream in = LinkVectorsTest.class.getResourceAsStream("/huawei/link-vectors.json")) {
            assertNotNull("link-vectors.json introuvable", in);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            for (int n; (n = in.read(buf)) > 0; ) out.write(buf, 0, n);
            vectors = MiniJson.parseObject(new String(out.toByteArray(), StandardCharsets.UTF_8));
        }
        assertNotNull(vectors);
    }

    /** Rejoue la liste d'aléas du vecteur, dans l'ordre et à la bonne taille. */
    static final class Scripted extends Random {
        private final Deque<byte[]> queue = new ArrayDeque<>();

        Scripted(List<Object> hex) {
            for (Object h : hex) queue.add(IsoAuth.unhex((String) h));
        }

        @Override
        public void nextBytes(byte[] bytes) {
            byte[] next = queue.poll();
            if (next == null || next.length != bytes.length) throw new IllegalStateException("aléa scripté : " + bytes.length + " octets demandés");
            System.arraycopy(next, 0, bytes, 0, bytes.length);
        }
    }

    private static int num(Object o) {
        return ((Number) o).intValue();
    }

    private static List<LinkCodec.Tlv> tlvs(Object list) {
        List<LinkCodec.Tlv> out = new ArrayList<>();
        for (Object o : (List<Object>) list) {
            Map<String, Object> t = (Map<String, Object>) o;
            out.add(new LinkCodec.Tlv(num(t.get("tag")), IsoAuth.unhex((String) t.get("hex"))));
        }
        return out;
    }

    private static void assertSameTlvs(Object expected, List<LinkCodec.Tlv> actual) {
        List<LinkCodec.Tlv> e = tlvs(expected);
        assertEquals(e.size(), actual.size());
        for (int i = 0; i < e.size(); i++) {
            assertEquals(e.get(i).tag, actual.get(i).tag);
            assertArrayEquals(e.get(i).value, actual.get(i).value);
        }
    }

    @Test
    public void trames_identiques_au_js() {
        for (Object o : (List<Object>) vectors.get("frames")) {
            Map<String, Object> c = (Map<String, Object>) o;
            List<byte[]> frames = LinkCodec.encodeFrames(num(c.get("service")), num(c.get("command")), tlvs(c.get("tlvs")), num(c.get("max")));
            List<Object> expected = (List<Object>) c.get("frames");
            assertEquals(expected.size(), frames.size());
            for (int i = 0; i < frames.size(); i++) assertEquals(((String) expected.get(i)).toUpperCase(), IsoAuth.hex(frames.get(i)));
        }
    }

    @Test
    public void rassemblage_des_morceaux_et_tranches() {
        Map<String, Object> v = (Map<String, Object>) vectors.get("reassembly");
        LinkCodec.Reassembler r = new LinkCodec.Reassembler();
        List<LinkCodec.Message> got = new ArrayList<>();
        for (Object chunk : (List<Object>) v.get("chunks")) got.addAll(r.push(IsoAuth.unhex((String) chunk)));
        List<Object> expected = (List<Object>) v.get("messages");
        assertEquals(expected.size(), got.size());
        Map<String, Object> m = (Map<String, Object>) expected.get(0);
        assertEquals(num(m.get("service")), got.get(0).serviceId);
        assertEquals(num(m.get("command")), got.get(0).commandId);
        assertEquals(((String) m.get("raw")).toUpperCase(), IsoAuth.hex(got.get(0).raw));
        assertFalse(got.get(0).tlvs.isEmpty());
    }

    @Test
    public void trame_au_crc_faux_refusee() {
        byte[] frame = LinkCodec.encodeFrames(1, 1, new byte[] {1, 0}, 244).get(0);
        frame[frame.length - 1] ^= 1;
        try {
            new LinkCodec.Reassembler().push(frame);
            fail("CRC faux accepté");
        } catch (IllegalArgumentException expected) {
            assertTrue(expected.getMessage().contains("CRC"));
        }
    }

    @Test
    public void entiers_variables_et_tlv() {
        for (int n : new int[] {0, 1, 127, 128, 300, 16383, 16384, 2_000_000}) {
            byte[] e = LinkCodec.encodeVarInt(n);
            assertEquals(n, LinkCodec.decodeVarInt(e, 0)[0]);
            assertEquals(e.length, LinkCodec.decodeVarInt(e, 0)[1]);
        }
        assertTrue(LinkCodec.tryDecodeTlvs(new byte[] {1, 5, 0}).isEmpty());
    }

    @Test
    public void chiffrement_identique_au_js() throws Exception {
        for (Object o : (List<Object>) vectors.get("cipher")) {
            Map<String, Object> c = (Map<String, Object>) o;
            byte[] key = IsoAuth.unhex((String) c.get("key"));
            boolean gcm = (Boolean) c.get("gcm");
            boolean randomIv = (Boolean) c.get("randomIv");
            long counter = ((Number) c.get("counter")).longValue();
            LinkCipher cipher = new LinkCipher(key, gcm, randomIv, counter, new Scripted((List<Object>) c.get("random")));
            byte[] plain = IsoAuth.unhex((String) c.get("plain"));
            List<Object> sealed = (List<Object>) c.get("sealed");
            for (Object expected : sealed) {
                List<LinkCodec.Tlv> got = cipher.seal(plain);
                assertSameTlvs(expected, got);
                assertTrue(LinkCipher.isSealed(got));
                // et le déchiffrement relit le corps d'origine
                assertArrayEquals(plain, new LinkCipher(key, gcm, randomIv).open(got));
            }
        }
    }

    @Test
    public void authentification_identique_au_js() throws Exception {
        Map<String, Object> a = (Map<String, Object>) vectors.get("auth");
        List<Object> sent = (List<Object>) a.get("sent");
        List<Object> replies = (List<Object>) a.get("replies");
        IsoAuth auth = new IsoAuth(IsoAuth.unhex((String) a.get("authToken")), (String) a.get("authId"), new Scripted((List<Object>) a.get("random")));

        byte[] start = auth.startMessage();
        assertEquals(sent.get(0), new String(start, StandardCharsets.UTF_8));
        assertSameTlvs(a.get("firstRequestTlvs"), IsoAuth.requestTlvs(start, ((Number) a.get("requestId")).longValue()));

        // la réponse de la montre finit par un octet NUL (GT 6 Pro, §6.9)
        byte[] token = auth.tokenMessage(IsoAuth.parseReply(tlvs(replies.get(0))));
        assertEquals(sent.get(1), new String(token, StandardCharsets.UTF_8));
        byte[] confirm = auth.confirmMessage(IsoAuth.parseReply(tlvs(replies.get(1))));
        assertEquals(sent.get(2), new String(confirm, StandardCharsets.UTF_8));
        IsoAuth.Reply last = IsoAuth.parseReply(tlvs(replies.get(2)));
        assertTrue(last.last);
        assertNull(last.payload);
        assertEquals(((String) a.get("frameKey")).toUpperCase(), IsoAuth.hex(auth.frameKey()));
    }

    @Test
    public void cle_refusee_si_le_jeton_de_la_montre_differe() throws Exception {
        Map<String, Object> a = (Map<String, Object>) vectors.get("auth");
        byte[] wrongKey = IsoAuth.unhex((String) a.get("authToken"));
        wrongKey[0] ^= 1;
        IsoAuth auth = new IsoAuth(wrongKey, (String) a.get("authId"), new Scripted((List<Object>) a.get("random")));
        auth.startMessage();
        try {
            auth.tokenMessage(IsoAuth.parseReply(tlvs(((List<Object>) a.get("replies")).get(0))));
            fail("jeton faux accepté");
        } catch (IsoAuth.AuthException e) {
            assertEquals("key_rejected", e.code);
        }
    }

    @Test
    public void erreurs_de_la_montre_typees() {
        List<LinkCodec.Tlv> refused = Arrays.asList(new LinkCodec.Tlv(1, "{\"payload\":{\"errorCode\":3}}".getBytes(StandardCharsets.UTF_8)));
        List<LinkCodec.Tlv> result = Arrays.asList(new LinkCodec.Tlv(0x7F, new byte[] {0, 1, (byte) 0x86, (byte) 0xA1}));
        List<LinkCodec.Tlv> garbage = Arrays.asList(new LinkCodec.Tlv(1, new byte[] {0x01, 0x02}));
        String[][] cases = {{"watch_error"}, {"watch_error"}, {"format"}};
        List<List<LinkCodec.Tlv>> inputs = Arrays.asList(refused, result, garbage);
        for (int i = 0; i < inputs.size(); i++) {
            try {
                IsoAuth.parseReply(inputs.get(i));
                fail("réponse acceptée : cas " + i);
            } catch (IsoAuth.AuthException e) {
                assertEquals(cases[i][0], e.code);
            }
        }
    }

    @Test
    public void identifiant_de_groupe() throws Exception {
        assertEquals(64, IsoAuth.groupId().length());
        assertTrue(IsoAuth.groupId().matches("[0-9A-F]+"));
    }
}
