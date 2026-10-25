package com.healthtrack.app.huawei;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

import org.junit.Test;

/**
 * Séances relues en arrière-plan (M7b, journal/protocoles/huawei.md §7.5 bis) : mêmes demandes que sync.js (octets
 * comparés à ceux du JS), réponses gardées brutes avec le numéro de la séance, tolérance (séance refusée, bloc muet,
 * séance hors période sans détail). Trames synthétiques.
 */
public class WatchWorkoutsTest {

    static final long DAY = 24 * 3_600_000L;
    static final long UNTIL = 1_760_000_000_000L;
    static final long SINCE = UNTIL - 2 * DAY;

    @Test
    public void demandes_identiques_au_js() {
        // octets produits par workoutListTlvs / workoutTotalsTlvs / workoutSamplesTlvs / workoutPaceTlvs (sync.js)
        assertEquals("810C0304386D4380040468E77800", IsoAuth.hex(LinkCodec.encodeTlvs(WatchReader.workoutListTlvs(1000, UNTIL))));
        assertEquals("81040202012C", IsoAuth.hex(LinkCodec.encodeTlvs(WatchReader.workoutTotalsTlvs(300))));
        assertEquals("810A0202000C030200020700", IsoAuth.hex(LinkCodec.encodeTlvs(WatchReader.workoutSamplesTlvs(12, 2))));
        assertEquals("81080202000C08020001", IsoAuth.hex(LinkCodec.encodeTlvs(WatchReader.workoutPaceTlvs(12, 1))));
    }

    private static byte[] be(long n, int size) {
        byte[] out = new byte[size];
        for (int i = size - 1; i >= 0; i--, n >>>= 8) out[i] = (byte) n;
        return out;
    }

    private static List<LinkCodec.Tlv> wrap(LinkCodec.Tlv... inner) {
        List<LinkCodec.Tlv> out = new ArrayList<>();
        out.add(new LinkCodec.Tlv(0x81, LinkCodec.encodeTlvs(Arrays.asList(inner))));
        return out;
    }

    /**
     * Fausse montre en clair : séance 7 dans la période (2 blocs d'échantillons annoncés, le 2e sans réponse ; 1 bloc
     * d'allures), séance 8 refusée, séance 9 commencée avant la veille de `since` (aucun détail demandé).
     */
    static final class WorkoutWatch implements WatchLink.Transport {
        private final BlockingQueue<byte[]> incoming = new LinkedBlockingQueue<>();
        private final LinkCodec.Reassembler reassembler = new LinkCodec.Reassembler();
        final List<String> asked = new ArrayList<>();

        private static LinkCodec.Tlv entry(int number, int samples, int paces) {
            return new LinkCodec.Tlv(0x85, LinkCodec.encodeTlvs(Arrays.asList(
                    new LinkCodec.Tlv(6, be(number, 2)), new LinkCodec.Tlv(7, be(samples, 2)), new LinkCodec.Tlv(8, be(paces, 2)))));
        }

        @Override
        public void write(byte[] bytes) {
            for (LinkCodec.Message m : reassembler.push(bytes)) {
                List<LinkCodec.Tlv> inner = LinkCodec.decodeTlvs(LinkCodec.find(m.tlvs, 0x81));
                int number = (int) LinkCodec.uint(LinkCodec.find(inner, 2));
                List<LinkCodec.Tlv> out;
                if (m.commandId == WatchReader.WORKOUT_LIST) {
                    asked.add("list");
                    out = wrap(new LinkCodec.Tlv(2, be(3, 2)), entry(7, 2, 1), entry(8, 1, 0), entry(9, 1, 1));
                } else if (m.commandId == WatchReader.WORKOUT_TOTALS) {
                    asked.add("totals " + number);
                    if (number == 8) {
                        out = new ArrayList<>();
                        out.add(new LinkCodec.Tlv(0x7F, new byte[] {0, 1, (byte) 0x86, (byte) 0xA1}));
                    } else {
                        long start = (number == 9 ? SINCE - 3 * DAY : SINCE + 3_600_000L) / 1000;
                        out = wrap(new LinkCodec.Tlv(2, be(number, 2)), new LinkCodec.Tlv(4, be(start, 4)), new LinkCodec.Tlv(5, be(start + 1800, 4)));
                    }
                } else if (m.commandId == WatchReader.WORKOUT_SAMPLES) {
                    int block = (int) LinkCodec.uint(LinkCodec.find(inner, 3));
                    asked.add("samples " + number + "/" + block);
                    if (block == 1) return;
                    out = wrap(new LinkCodec.Tlv(2, be(number, 2)), new LinkCodec.Tlv(3, be(block, 2)));
                } else {
                    asked.add("pace " + number + "/" + LinkCodec.uint(LinkCodec.find(inner, 8)));
                    out = wrap(new LinkCodec.Tlv(2, be(number, 2)));
                }
                for (byte[] f : LinkCodec.encodeFrames(m.serviceId, m.commandId, out, 244)) incoming.add(f);
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

    @Test
    public void seances_brutes_avec_numero_tolerance_et_periode() {
        WorkoutWatch watch = new WorkoutWatch();
        WatchReader.Capture cap = new WatchReader.Capture(SINCE, UNTIL, UNTIL);
        try (WatchLink link = new WatchLink(watch)) {
            WatchReader.workouts(link, cap, 150);
        }
        assertEquals(Arrays.asList("list", "totals 7", "samples 7/0", "samples 7/1", "pace 7/0", "totals 8", "totals 9"), watch.asked);
        WatchReader.Read read = cap.read("workouts");
        assertEquals("ok", read.outcome);
        assertEquals(3, read.units);
        assertEquals(1, read.failed); // séance 8 refusée
        List<String> replies = new ArrayList<>();
        for (WatchReader.Reply r : cap.replies) replies.add(r.service + "/" + r.command + "#" + r.index);
        // la séance 9 (hors période) garde ses totaux, que le JS écarte comme readWorkouts
        assertEquals(Arrays.asList("23/7#-1", "23/8#7", "23/10#7", "23/12#7", "23/8#9"), replies);
        assertTrue(cap.toJson().contains("\"workouts\""));
    }

    @Test
    public void sans_seances_lues_par_l_app_le_service_n_est_jamais_demande() {
        WatchReaderTest.PlainWatch watch = new WatchReaderTest.PlainWatch(0, -1, 99, false);
        WatchReader.Capture cap;
        try (WatchLink link = new WatchLink(watch)) {
            cap = WatchReader.read(link, SINCE, UNTIL, UNTIL, 150);
        }
        for (String a : watch.asked) assertFalse(a, a.startsWith("23/"));
        assertEquals(null, cap.read("workouts"));
    }

    @Test
    public void seances_partagees_par_l_app_restent_lues() {
        BackgroundSync.State s = new BackgroundSync.State();
        assertFalse(s.workouts);
        BackgroundSync.shareFromApp(s, UNTIL, UNTIL, 0, 0, true, 0, 0, true);
        assertTrue(s.workouts);
        // une synchro suivante qui ne les mentionne pas ne les coupe pas
        BackgroundSync.shareFromApp(s, UNTIL, UNTIL, 0, 0, true, 0, 0);
        assertTrue(s.workouts);
    }
}
