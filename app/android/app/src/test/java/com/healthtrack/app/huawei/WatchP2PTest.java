package com.healthtrack.app.huawei;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

import org.junit.Test;

/**
 * Synchro « dictionnaire » P2P du client Java en arrière-plan (M6b, journal/protocoles/huawei.md §10.10) : mêmes
 * octets que p2p.js, ping, accusés, pagination, pages gardées brutes dans la capture, reprise par classe.
 * Valeurs synthétiques (aucune donnée réelle).
 */
@SuppressWarnings("unchecked")
public class WatchP2PTest {

    private static final long UNTIL = 1_760_000_400_000L - 1_760_000_400_000L % 3_600_000L;
    private static final long T0 = UNTIL - 6 * 3_600_000L;

    static byte[] tlvs(LinkCodec.Tlv... t) {
        return LinkCodec.encodeTlvs(Arrays.asList(t));
    }

    static byte[] be8(long n) {
        return ByteBuffer.allocate(8).putLong(n).array();
    }

    /** Page synthétique de la classe : un enregistrement par (début, valeur), fin = début + 60 s. */
    static byte[] page(int cls, long[] starts, double value) {
        List<LinkCodec.Tlv> records = new ArrayList<>();
        for (long s : starts) {
            byte[] field = tlvs(new LinkCodec.Tlv(9, WatchP2P.minimal(cls * 1000L + 831)),
                    new LinkCodec.Tlv(0x0A, ByteBuffer.allocate(8).putDouble(value).array()));
            records.add(new LinkCodec.Tlv(0x84, tlvs(new LinkCodec.Tlv(5, be8(s)), new LinkCodec.Tlv(6, be8(s + 60_000)),
                    new LinkCodec.Tlv(0x87, tlvs(new LinkCodec.Tlv(0x88, field))))));
        }
        List<LinkCodec.Tlv> body = new ArrayList<>();
        body.add(new LinkCodec.Tlv(1, new byte[] {1}));
        body.add(new LinkCodec.Tlv(2, WatchP2P.minimal(cls)));
        if (!records.isEmpty()) body.add(new LinkCodec.Tlv(0x83, LinkCodec.encodeTlvs(records)));
        byte[] b = LinkCodec.encodeTlvs(body);
        byte[] out = new byte[b.length + 1];
        out[0] = 1;
        System.arraycopy(b, 0, out, 1, b.length);
        return out;
    }

    /**
     * Fausse montre en clair : rien en 7/x ; P2P : ping → un message spontané d'abord (à acquitter) puis le code
     * `pingCode` (ou rien si 0) ; demande de la VFC → son accusé, puis 2 enregistrements la première fois et une page
     * vide ensuite ; température : silence.
     */
    static final class P2PWatch implements WatchLink.Transport {
        private final BlockingQueue<byte[]> incoming = new LinkedBlockingQueue<>();
        private final LinkCodec.Reassembler reassembler = new LinkCodec.Reassembler();
        private final long pingCode;
        private int watchSeq = 100;
        final List<List<LinkCodec.Tlv>> sent = new ArrayList<>();
        final List<Long> starts = new ArrayList<>();

        P2PWatch(long pingCode) {
            this.pingCode = pingCode;
        }

        private void reply(int s, int c, List<LinkCodec.Tlv> tlvs) {
            incoming.addAll(LinkCodec.encodeFrames(s, c, tlvs, 244));
        }

        private void p2p(int cmd, int seq, String src, String dst, byte[] payload, byte[] code) {
            reply(WatchP2P.SERVICE, WatchP2P.COMMAND, WatchP2P.envelope(cmd, seq, src, dst, null, null, payload, code));
        }

        @Override
        public void write(byte[] bytes) {
            for (LinkCodec.Message m : reassembler.push(bytes)) {
                if (m.serviceId == WatchReader.FITNESS) {
                    List<LinkCodec.Tlv> out = new ArrayList<>();
                    out.add(m.commandId == WatchReader.TOTALS ? LinkCodec.Tlv.empty(0x81) : new LinkCodec.Tlv(0x81, new byte[] {2, 2, 0, 0}));
                    reply(m.serviceId, m.commandId, out);
                    continue;
                }
                if (m.serviceId != WatchP2P.SERVICE) continue;
                sent.add(m.tlvs);
                int cmd = LinkCodec.find(m.tlvs, 1)[0];
                int seq = (int) LinkCodec.uint(LinkCodec.find(m.tlvs, 2));
                if (cmd == WatchP2P.PING) {
                    p2p(WatchP2P.DATA, watchSeq++, "hw.watch.other", WatchP2P.HEALTH, new byte[] {9}, null);
                    if (pingCode != 0) p2p(WatchP2P.REPLY, seq, WatchP2P.FILESYNC, WatchP2P.HEALTH, null, new byte[] {0, 0, 0, (byte) pingCode});
                } else if (cmd == WatchP2P.DATA) {
                    byte[] payload = LinkCodec.find(m.tlvs, 7);
                    List<LinkCodec.Tlv> body = LinkCodec.tryDecodeTlvs(Arrays.copyOfRange(payload, 1, payload.length));
                    long cls = LinkCodec.uint(LinkCodec.find(body, 2));
                    long start = LinkCodec.uint(LinkCodec.find(body, 5));
                    if (cls != WatchP2P.HRV_DAY) continue; // température : la montre se tait
                    starts.add(start);
                    p2p(WatchP2P.REPLY, seq, WatchP2P.FILESYNC, WatchP2P.DICTIONARY, null, new byte[] {0, 0, 0, (byte) 0xCF});
                    byte[] page = starts.size() == 1 ? page(WatchP2P.HRV_DAY, new long[] {T0, T0 + 3_600_000L}, 42.0)
                            : page(WatchP2P.HRV_DAY, new long[0], 0);
                    p2p(WatchP2P.DATA, watchSeq++, WatchP2P.FILESYNC, WatchP2P.DICTIONARY, page, null);
                }
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

    private static WatchReader.Capture capture(P2PWatch watch, List<WatchP2P.Request> dict) {
        try (WatchLink link = new WatchLink(watch)) {
            return WatchReader.read(link, UNTIL - 3_600_000L, UNTIL, UNTIL + 60_000, 200, new ArrayList<WatchReader.FileRequest>(), dict);
        }
    }

    private static int cmd(List<LinkCodec.Tlv> t) {
        return LinkCodec.find(t, 1)[0];
    }

    @Test
    public void memes_octets_que_le_js() {
        // vecteurs de p2p.js : pingP2P(2), dictionaryMessage(3, 500044, …), ackFor({ seq: 7, … })
        assertEquals("010101020200020311636f6d2e6875617765692e6865616c7468041868772e77617463682e6865616c74682e66696c6573796e63",
                IsoAuth.hex(LinkCodec.encodeTlvs(WatchP2P.ping(2))).toLowerCase());
        assertEquals("01010202020003032168772e756e6974656465766963652e6461746164696374696f6e61727973796e63041868772e77617463682e"
                        + "6865616c74682e66696c6573796e630515556e6974654465766963654d616e6167656d656e74060953797374656d4170700720"
                        + "01010101020307a14c050800000199c82cc000060800000199c863ae800d0101",
                IsoAuth.hex(LinkCodec.encodeTlvs(WatchP2P.dictionaryRequest(3, 500044, 1760000000000L, 1760003600000L))).toLowerCase());
        List<LinkCodec.Tlv> fromWatch = WatchP2P.envelope(2, 7, WatchP2P.FILESYNC, WatchP2P.DICTIONARY, null, null, new byte[] {1}, null);
        assertEquals("01010302020007032168772e756e6974656465766963652e6461746164696374696f6e61727973796e63041868772e77617463682e"
                + "6865616c74682e66696c6573796e630804000000cf", IsoAuth.hex(LinkCodec.encodeTlvs(WatchP2P.ack(fromWatch))).toLowerCase());
    }

    @Test
    public void numero_commence_a_2_et_boucle() {
        WatchP2P p2p = new WatchP2P(null, 200);
        assertEquals(2, p2p.next());
        for (int i = 3; i < WatchP2P.SEQ_MODULO; i++) p2p.next();
        assertEquals(0, p2p.next());
    }

    @Test
    public void vfc_lue_par_pages_et_gardee_brute() {
        P2PWatch watch = new P2PWatch(0xCA);
        long since = T0 - 10_000;
        WatchReader.Capture cap = capture(watch, Arrays.asList(WatchP2P.Request.hrvDay(since), WatchP2P.Request.skinTemp(since)));
        assertEquals("ok", cap.read("hrvDay").outcome);
        assertEquals(1, cap.read("hrvDay").units);
        assertEquals("timeout", cap.read("skinTemp").outcome); // silence : consigné, sans bloquer
        assertEquals(1, cap.dictionary.size());
        long last = T0 + 3_600_000L + 60_000;
        assertEquals(last, cap.dictionary.get(0).maxTime);
        // page suivante 1 s après le dernier enregistrement, puis page vide → fin
        assertEquals(Arrays.asList(since, last + 1000), watch.starts);
        // le message spontané et chaque page de la montre sont acquittés avec leur numéro
        List<Long> acked = new ArrayList<>();
        for (List<LinkCodec.Tlv> t : watch.sent) if (cmd(t) == WatchP2P.REPLY) acked.add(LinkCodec.uint(LinkCodec.find(t, 2)));
        assertEquals(Arrays.asList(100L, 101L, 102L), acked);
        assertEquals(2, LinkCodec.uint(LinkCodec.find(watch.sent.get(0), 2))); // ping : premier numéro

        Map<String, Object> json = MiniJson.parseObject(cap.toJson());
        Map<String, Object> d = (Map<String, Object>) ((List<Object>) json.get("dict")).get(0);
        assertEquals("hrvDay", d.get("id"));
        assertEquals(500044L, ((Number) d.get("cls")).longValue());
        assertEquals(since, ((Number) d.get("since")).longValue());
        assertEquals(IsoAuth.hex(page(WatchP2P.HRV_DAY, new long[] {T0, T0 + 3_600_000L}, 42.0)), ((List<Object>) d.get("pages")).get(0));
    }

    @Test
    public void ping_refuse_ou_muet_aucune_demande() {
        P2PWatch refused = new P2PWatch(0xCC);
        WatchReader.Capture cap = capture(refused, Arrays.asList(WatchP2P.Request.hrvDay(1), WatchP2P.Request.skinTemp(1)));
        assertEquals("unsupported", cap.read("hrvDay").outcome);
        assertEquals("unsupported", cap.read("skinTemp").outcome);
        assertTrue(refused.starts.isEmpty());
        WatchReader.Capture silent = capture(new P2PWatch(0), Arrays.asList(WatchP2P.Request.hrvDay(1)));
        assertEquals("timeout", silent.read("hrvDay").outcome);
        assertNull(MiniJson.parseObject(silent.toJson()).get("dict"));
    }

    @Test
    public void sans_classe_demandee_pas_de_p2p() {
        P2PWatch watch = new P2PWatch(0xCA);
        WatchReader.Capture cap = capture(watch, new ArrayList<WatchP2P.Request>());
        assertTrue(watch.sent.isEmpty());
        assertNull(cap.read("hrvDay"));
    }

    @Test
    public void classes_demandees_seulement_apres_une_lecture_du_js_et_reprise() {
        BackgroundSync.State s = new BackgroundSync.State();
        assertTrue(BackgroundSync.dictionaryRequests(s).isEmpty());
        BackgroundSync.shareFromApp(s, UNTIL, UNTIL, 0, 0, true, T0 - 10_000, 0);
        List<WatchP2P.Request> asked = BackgroundSync.dictionaryRequests(s);
        assertEquals(1, asked.size());
        assertEquals(WatchP2P.HRV_DAY, asked.get(0).cls);
        assertEquals(T0 - 9_000, asked.get(0).sinceMs);
        // une reprise plus ancienne ne recule jamais ; la relecture native avance au dernier instant lu
        BackgroundSync.shareFromApp(s, UNTIL, UNTIL, 0, 0, true, 5, 7);
        assertEquals(T0 - 10_000, s.hrvDayUntil);
        assertEquals(7, s.skinTempUntil);
        BackgroundSync.recordDictionary(s, capture(new P2PWatch(0xCA), BackgroundSync.dictionaryRequests(s)));
        assertEquals(T0 + 3_600_000L + 60_000, s.hrvDayUntil);
        assertEquals(7, s.skinTempUntil); // sans réponse : relue la prochaine fois
    }
}
