package com.healthtrack.app.huawei;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

import org.junit.BeforeClass;
import org.junit.Test;

/**
 * Lectures santé du client Java (§9.1 d) : rejouées sur la transcription du pilote JS (mêmes trames, même
 * capture), puis tolérance aux blocs refusés / sans réponse, et boîte de dépôt des captures.
 */
@SuppressWarnings("unchecked")
public class WatchReaderTest {

    private static Map<String, Object> vector;

    @BeforeClass
    public static void load() throws Exception {
        try (InputStream in = WatchReaderTest.class.getResourceAsStream("/huawei/link-vectors.json")) {
            assertNotNull(in);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            for (int n; (n = in.read(buf)) > 0; ) out.write(buf, 0, n);
            vector = (Map<String, Object>) MiniJson.parseObject(new String(out.toByteArray(), StandardCharsets.UTF_8)).get("read");
        }
    }

    private static long num(Map<String, Object> m, String k) {
        return ((Number) m.get(k)).longValue();
    }

    @Test
    public void lecture_identique_au_pilote_js() throws Exception {
        WatchHandshakeTest.Replay replay = new WatchHandshakeTest.Replay((List<Object>) vector.get("steps"), Integer.MAX_VALUE);
        LinkVectorsTest.Scripted random = new LinkVectorsTest.Scripted((List<Object>) vector.get("random"));
        Map<String, Object> expected = (Map<String, Object>) vector.get("capture");
        WatchReader.Capture cap;
        try (WatchLink link = new WatchLink(replay)) {
            WatchHandshake.authenticate(link, IsoAuth.unhex((String) vector.get("authToken")), (String) vector.get("authId"), num(vector, "requestId"), random, 2000);
            int battery = WatchHandshake.battery(link, 2000);
            cap = WatchReader.read(link, num(expected, "since"), num(expected, "until"), num(expected, "at"), 2000);
            cap.battery = battery;
        }
        assertEquals(new ArrayList<String>(), replay.mismatches);
        Map<String, Object> got = MiniJson.parseObject(cap.toJson());
        List<Object> want = (List<Object>) expected.get("replies");
        List<Object> have = (List<Object>) got.get("replies");
        assertEquals(want.size(), have.size());
        for (int i = 0; i < want.size(); i++) {
            Map<String, Object> w = (Map<String, Object>) want.get(i);
            Map<String, Object> h = (Map<String, Object>) have.get(i);
            assertEquals(num(w, "s"), num(h, "s"));
            assertEquals(num(w, "c"), num(h, "c"));
            assertEquals(num(w, "i"), num(h, "i"));
            assertEquals(((String) w.get("hex")).toUpperCase(), h.get("hex"));
        }
        assertEquals(expected.get("reads").toString(), got.get("reads").toString());
        assertEquals(num(expected, "battery"), num(got, "battery"));
        assertEquals(1L, num(got, "v"));
        assertTrue(cap.gotBlocks());
    }

    /**
     * Fausse montre en clair : `blocks` réponses annoncées, le bloc `refused` refusé (code 0x7F), plus de réponse
     * à partir du bloc `silentFrom` ; totaux sans réponse si `silentTotals`.
     */
    static final class PlainWatch implements WatchLink.Transport {
        private final BlockingQueue<byte[]> incoming = new LinkedBlockingQueue<>();
        private final LinkCodec.Reassembler reassembler = new LinkCodec.Reassembler();
        private final int blocks;
        private final int refused;
        private final int silentFrom;
        private final boolean silentTotals;
        final List<String> asked = new ArrayList<>();

        PlainWatch(int blocks, int refused, int silentFrom, boolean silentTotals) {
            this.blocks = blocks;
            this.refused = refused;
            this.silentFrom = silentFrom;
            this.silentTotals = silentTotals;
        }

        private void reply(int s, int c, List<LinkCodec.Tlv> tlvs) {
            for (byte[] f : LinkCodec.encodeFrames(s, c, tlvs, 244)) incoming.add(f);
        }

        @Override
        public void write(byte[] bytes) {
            for (LinkCodec.Message m : reassembler.push(bytes)) {
                asked.add(m.serviceId + "/" + m.commandId);
                List<LinkCodec.Tlv> out = new ArrayList<>();
                if (m.commandId == WatchReader.SLEEP_COUNT || m.commandId == WatchReader.MINUTE_COUNT) {
                    int n = m.commandId == WatchReader.MINUTE_COUNT ? blocks : 0;
                    out.add(new LinkCodec.Tlv(0x81, new byte[] {2, 2, 0, (byte) n}));
                } else if (m.commandId == WatchReader.MINUTE_DATA) {
                    byte[] inner = LinkCodec.find(LinkCodec.decodeTlvs(LinkCodec.find(m.tlvs, 0x81)), 2);
                    int index = (int) LinkCodec.uint(inner);
                    if (index >= silentFrom) return;
                    if (index == refused) out.add(new LinkCodec.Tlv(0x7F, new byte[] {0, 1, (byte) 0x86, (byte) 0xA3}));
                    else out.add(new LinkCodec.Tlv(0x81, new byte[] {2, 2, 0, (byte) index}));
                } else if (m.commandId == WatchReader.TOTALS) {
                    if (silentTotals) return;
                    out.add(LinkCodec.Tlv.empty(0x81));
                }
                reply(m.serviceId, m.commandId, out);
            }
        }

        @Override
        public int read(byte[] buffer) {
            byte[] b;
            try {
                b = incoming.take();
            } catch (InterruptedException e) {
                return -1;
            }
            if (b.length == 0) return -1;
            System.arraycopy(b, 0, buffer, 0, b.length);
            return b.length;
        }

        @Override
        public void close() {
            incoming.add(new byte[0]);
        }
    }

    private static WatchReader.Read read(WatchReader.Capture cap, String id) {
        for (WatchReader.Read r : cap.reads) if (r.id.equals(id)) return r;
        throw new AssertionError(id);
    }

    @Test
    public void bloc_refuse_saute_bloc_muet_arrete_le_service() {
        PlainWatch watch = new PlainWatch(5, 1, 3, true);
        WatchReader.Capture cap;
        try (WatchLink link = new WatchLink(watch)) {
            cap = WatchReader.read(link, 0, 3_600_000L * 24 * 365 * 40, 1, 150);
        }
        WatchReader.Read sleep = read(cap, "sleep");
        assertEquals("empty", sleep.outcome);
        WatchReader.Read minutes = read(cap, "minutes");
        assertEquals("ok", minutes.outcome);
        assertEquals(5, minutes.units);
        assertEquals(1 + 2, minutes.failed); // bloc 1 refusé, blocs 3 et 4 abandonnés
        List<Integer> indexes = new ArrayList<>();
        for (WatchReader.Reply r : cap.replies) indexes.add(r.index);
        assertEquals(Arrays.asList(0, 2), indexes);
        assertEquals("timeout", read(cap, "totals").outcome);
        // le bloc 4 n'est jamais demandé : la montre ne répondait plus
        int blockRequests = 0;
        for (String a : watch.asked) if (a.equals("7/11")) blockRequests++;
        assertEquals(4, blockRequests);
    }

    @Test
    public void demandes_conformes_au_js() {
        List<LinkCodec.Tlv> count = WatchReader.countTlvs(1000, 1_760_000_000_000L);
        assertEquals(0x81, count.get(0).tag);
        assertEquals(0, count.get(0).value.length);
        assertEquals(WatchReader.MIN_START_SEC, LinkCodec.uint(count.get(1).value)); // jamais avant le 1/1/2000
        assertEquals(1_760_000_000L, LinkCodec.uint(count.get(2).value));
        assertEquals("81040202012C", IsoAuth.hex(LinkCodec.encodeTlvs(WatchReader.blockTlvs(300))));
        assertEquals(7, WatchReader.parseCount(LinkCodec.decodeTlvs(IsoAuth.unhex("8104020200" + "07"))));
        assertEquals(0, WatchReader.parseCount(new ArrayList<>()));
    }

    @Test
    public void capture_json_echappe_le_nom() {
        WatchReader.Capture cap = new WatchReader.Capture(1, 2, 3);
        cap.address = "AA:BB:CC:DD:EE:FF";
        cap.name = "HUAWEI \"WATCH\" GT 6 Pro";
        Map<String, Object> json = MiniJson.parseObject(cap.toJson());
        assertEquals("HUAWEI \"WATCH\" GT 6 Pro", json.get("name"));
        assertEquals("AA:BB:CC:DD:EE:FF", json.get("address"));
        assertFalse(cap.gotBlocks());
    }

    @Test
    public void boite_des_captures() throws Exception {
        File dir = Files.createTempDirectory("captures").toFile();
        CaptureInbox inbox = new CaptureInbox(dir);
        String a = inbox.put("{\"v\":1}", 1_760_000_000_000L);
        String b = inbox.put("{\"v\":2}", 1_760_000_000_000L);
        assertEquals("capture-1760000000000-000.json", a);
        assertEquals("capture-1760000000000-001.json", b);
        assertTrue(new File(dir, "autre.json").createNewFile());
        List<CaptureInbox.Item> items = inbox.list();
        assertEquals(2, items.size());
        assertEquals("{\"v\":1}", items.get(0).json);
        assertEquals(1, inbox.remove(Arrays.asList(a, "autre.json", "../x")));
        assertTrue(new File(dir, "autre.json").exists()); // jamais un fichier qui n'est pas une capture
        for (int i = 0; i < CaptureInbox.MAX + 5; i++) inbox.put("{}", 1_760_000_001_000L + i);
        items = inbox.list();
        assertEquals(CaptureInbox.MAX, items.size());
        assertEquals("capture-1760000001005-000.json", items.get(0).name); // les plus anciennes sont parties
    }
}
