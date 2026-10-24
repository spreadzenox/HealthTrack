package com.healthtrack.app.huawei;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

import org.junit.Test;

/**
 * Fichiers 0x2C lus par le client Java en arrière-plan (M6, journal/protocoles/huawei.md §7.6) : téléchargement
 * par blocs poussés, fichier vide, refus et silence, octets gardés bruts dans la capture, reprise par fichier.
 */
@SuppressWarnings("unchecked")
public class WatchFilesTest {

    /** Contenu synthétique (aucune donnée réelle) : 12 octets, envoyés par blocs de 5 en deux morceaux. */
    static final byte[] SLEEP = "nuit-exemple".getBytes(StandardCharsets.US_ASCII);

    /**
     * Fausse montre en clair : rien en 7/x, sommeil détaillé de 12 octets, stress `stress` = "empty" (taille 0),
     * "refused" (code d'erreur) ou "silent" (pas de réponse).
     */
    static final class FileWatch implements WatchLink.Transport {
        private final BlockingQueue<byte[]> incoming = new LinkedBlockingQueue<>();
        private final LinkCodec.Reassembler reassembler = new LinkCodec.Reassembler();
        private final String stress;
        final List<String> asked = new ArrayList<>();
        final List<String> opened = new ArrayList<>();
        int done;

        FileWatch(String stress) {
            this.stress = stress;
        }

        private void reply(int s, int c, List<LinkCodec.Tlv> tlvs) {
            for (byte[] f : LinkCodec.encodeFrames(s, c, tlvs, 244)) incoming.add(f);
        }

        private void push(int offset, byte[] data) {
            byte[] raw = new byte[6 + data.length];
            raw[0] = 1;
            raw[1] = (byte) (offset >> 24);
            raw[2] = (byte) (offset >> 16);
            raw[3] = (byte) (offset >> 8);
            raw[4] = (byte) offset;
            System.arraycopy(data, 0, raw, 6, data.length);
            for (byte[] f : LinkCodec.encodeFrames(WatchReader.FILES, WatchReader.FILE_PUSH, raw, 244)) incoming.add(f);
        }

        @Override
        public void write(byte[] bytes) {
            for (LinkCodec.Message m : reassembler.push(bytes)) {
                asked.add(m.serviceId + "/" + m.commandId);
                List<LinkCodec.Tlv> out = new ArrayList<>();
                if (m.serviceId == WatchReader.FITNESS) {
                    if (m.commandId == WatchReader.TOTALS) out.add(LinkCodec.Tlv.empty(0x81));
                    else out.add(new LinkCodec.Tlv(0x81, new byte[] {2, 2, 0, 0}));
                    reply(m.serviceId, m.commandId, out);
                    continue;
                }
                if (m.commandId == WatchReader.FILE_OPEN) {
                    String name = new String(LinkCodec.find(m.tlvs, 1), StandardCharsets.UTF_8);
                    opened.add(name + "@" + LinkCodec.uint(LinkCodec.find(m.tlvs, 5)) + "-" + LinkCodec.uint(LinkCodec.find(m.tlvs, 6))
                            + (LinkCodec.find(m.tlvs, 0x0C) != null ? "#" + LinkCodec.uint(LinkCodec.find(m.tlvs, 0x0C)) : ""));
                    boolean sleep = name.equals("sequence_data");
                    if (!sleep && stress.equals("silent")) continue;
                    if (!sleep && stress.equals("refused")) {
                        out.add(new LinkCodec.Tlv(0x7F, new byte[] {0, 1, (byte) 0x86, (byte) 0xA3}));
                    } else {
                        out.add(new LinkCodec.Tlv(3, new byte[] {1}));
                        out.add(new LinkCodec.Tlv(4, sleep ? new byte[] {0, 0, 0, (byte) SLEEP.length} : new byte[] {0, 0, 0, 0}));
                    }
                    reply(m.serviceId, m.commandId, out);
                } else if (m.commandId == WatchReader.FILE_INFO) {
                    out.add(new LinkCodec.Tlv(4, new byte[] {0, 5}));
                    out.add(new LinkCodec.Tlv(5, new byte[] {0}));
                    reply(m.serviceId, m.commandId, out);
                } else if (m.commandId == WatchReader.FILE_BLOCK) {
                    int offset = (int) LinkCodec.uint(LinkCodec.find(m.tlvs, 2));
                    int want = (int) LinkCodec.uint(LinkCodec.find(m.tlvs, 3));
                    // un bloc d'une autre fichier d'abord (ignoré), puis le bloc en deux morceaux
                    incoming.addAll(LinkCodec.encodeFrames(WatchReader.FILES, WatchReader.FILE_PUSH, new byte[] {9, 0, 0, 0, 0, 0, 1}, 244));
                    int half = want / 2;
                    push(offset, Arrays.copyOfRange(SLEEP, offset, offset + half));
                    push(offset + half, Arrays.copyOfRange(SLEEP, offset + half, offset + want));
                } else if (m.commandId == WatchReader.FILE_DONE) {
                    done++;
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

    private static final long DAY = 24 * 3_600_000L;
    private static final long UNTIL = 1_760_000_400_000L - 1_760_000_400_000L % 3_600_000L;

    private static WatchReader.Capture capture(FileWatch watch) {
        List<WatchReader.FileRequest> files = Arrays.asList(
                WatchReader.FileRequest.sleep(UNTIL - 2 * DAY), WatchReader.FileRequest.stress(UNTIL - DAY));
        try (WatchLink link = new WatchLink(watch)) {
            return WatchReader.read(link, UNTIL - DAY, UNTIL, UNTIL + 60_000, 200, files);
        }
    }

    @Test
    public void fichier_rassemble_et_garde_brut() {
        FileWatch watch = new FileWatch("empty");
        WatchReader.Capture cap = capture(watch);
        assertEquals(1, cap.files.size());
        assertEquals("sleepFile", cap.files.get(0).id);
        assertEquals(UNTIL - 2 * DAY, cap.files.get(0).sinceMs);
        assertArrayEquals(SLEEP, cap.files.get(0).bytes);
        assertEquals("ok", cap.read("sleepFile").outcome);
        assertEquals(SLEEP.length, cap.read("sleepFile").units);
        assertEquals("empty", cap.read("stress").outcome);
        assertTrue(cap.gotBlocks());
        // mêmes demandes que downloadFile (files.js) : nom, début, fin, dictionnaire 700013 pour le sommeil
        assertEquals(Arrays.asList(
                "sequence_data@" + (UNTIL - 2 * DAY) / 1000 + "-" + UNTIL / 1000 + "#700013",
                "rrisqi_data.bin@" + (UNTIL - DAY) / 1000 + "-" + UNTIL / 1000), watch.opened);
        assertEquals(2, watch.done); // fin de transfert envoyée, même pour un fichier vide

        Map<String, Object> json = MiniJson.parseObject(cap.toJson());
        List<Object> files = (List<Object>) json.get("files");
        Map<String, Object> f = (Map<String, Object>) files.get(0);
        assertEquals("sleepFile", f.get("id"));
        assertEquals(IsoAuth.hex(SLEEP), f.get("hex"));
        assertEquals(UNTIL - 2 * DAY, ((Number) f.get("since")).longValue());
        assertNull(json.get("bedTime")); // vrai par défaut : absent
    }

    @Test
    public void refus_et_silence_consignes_sans_bloquer() {
        WatchReader.Capture refused = capture(new FileWatch("refused"));
        assertEquals("ok", refused.read("sleepFile").outcome);
        assertEquals("refused", refused.read("stress").outcome);
        WatchReader.Capture silent = capture(new FileWatch("silent"));
        assertEquals("timeout", silent.read("stress").outcome);
        assertEquals(1, silent.files.size());
    }

    @Test
    public void sans_fichier_demande_capture_inchangee() {
        WatchReader.Capture cap;
        FileWatch watch = new FileWatch("empty");
        try (WatchLink link = new WatchLink(watch)) {
            cap = WatchReader.read(link, UNTIL - DAY, UNTIL, UNTIL, 200);
        }
        assertTrue(watch.opened.isEmpty());
        assertNull(MiniJson.parseObject(cap.toJson()).get("files"));
        assertNull(cap.read("sleepFile"));
        assertFalse(cap.gotBlocks());
    }

    @Test
    public void fichiers_demandes_seulement_apres_une_lecture_du_js() {
        BackgroundSync.State s = new BackgroundSync.State();
        assertTrue(BackgroundSync.fileRequests(s, UNTIL - DAY).isEmpty());
        BackgroundSync.shareFromApp(s, UNTIL - DAY, UNTIL - DAY, UNTIL - 3 * DAY, 0, false);
        List<WatchReader.FileRequest> files = BackgroundSync.fileRequests(s, UNTIL - DAY);
        assertEquals(1, files.size());
        assertEquals("sleepFile", files.get(0).id);
        assertEquals(UNTIL - 4 * DAY, files.get(0).startMs); // la veille de la dernière lecture
        assertFalse(s.bedTime);
        // une reprise plus ancienne ne recule jamais
        BackgroundSync.shareFromApp(s, UNTIL - DAY, UNTIL - DAY, UNTIL - 9 * DAY, UNTIL - 2 * DAY, true);
        assertEquals(UNTIL - 3 * DAY, s.sleepFileUntil);
        assertEquals(UNTIL - 2 * DAY, s.stressFileUntil);
        assertTrue(s.bedTime);
    }

    @Test
    public void relecture_native_avance_la_reprise_des_fichiers() {
        BackgroundSync.State s = new BackgroundSync.State();
        BackgroundSync.shareFromApp(s, UNTIL - 2 * DAY, UNTIL - 2 * DAY, UNTIL - 2 * DAY, UNTIL - 2 * DAY, false);
        WatchReader.Capture cap = capture(new FileWatch("silent"));
        BackgroundSync.recordFiles(s, cap, UNTIL);
        assertEquals(UNTIL, s.sleepFileUntil); // lu
        assertEquals(UNTIL - 2 * DAY, s.stressFileUntil); // sans réponse : relu la prochaine fois
        BackgroundSync.recordFiles(s, capture(new FileWatch("empty")), UNTIL - DAY);
        assertEquals(UNTIL, s.sleepFileUntil); // jamais en arrière
        assertEquals(UNTIL - DAY, s.stressFileUntil); // vide : lu quand même
    }
}
