package com.healthtrack.app.huawei;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.List;

/**
 * Synchro « dictionnaire » par le service P2P (0x34/0x01) pour le client Java « synchro seule » (M6b) : VFC de
 * journée (classe 500044) et température de la peau (400012), mêmes messages que createP2P
 * (src/devices/huawei/p2p.js, journal/protocoles/huawei.md §10.4 et §10.10) : un ping (service disponible si la
 * montre répond 0xCA), puis les pages d'une classe après l'autre, tout message de la montre acquitté (0xCF) avant
 * d'être lu. Rien n'est décodé ici sauf l'instant de reprise de chaque page : la charge utile est gardée **brute**
 * dans la capture, et le JS la lit avec parseDictionaryPage.
 */
public final class WatchP2P {

    public static final int SERVICE = 0x34;
    static final int COMMAND = 0x01;
    static final int PING = 1;
    static final int DATA = 2;
    static final int REPLY = 3;
    static final long AVAILABLE = 0xCA;
    static final long RECEIVED = 0xCF;
    static final String HEALTH = "com.huawei.health";
    static final String FILESYNC = "hw.watch.health.filesync";
    static final String DICTIONARY = "hw.unitedevice.datadictionarysync";
    /** Empreintes publiques des demandes de dictionnaire (aucun secret). */
    static final String FINGERPRINT_SOURCE = "UniteDeviceManagement";
    static final String FINGERPRINT_DESTINATION = "SystemApp";
    static final int SEQ_MODULO = 32766;
    static final long PING_TIMEOUT_MS = 5000;
    /** En arrière-plan, quelques pages suffisent (30 min au moins entre deux relectures) ; la suite à la prochaine. */
    static final int MAX_PAGES = 10;
    static final long NEXT_PAGE_GAP_MS = 1000;

    public static final int HRV_DAY = 500044;
    public static final int SKIN_TEMP = 400012;

    /** Classe à relire : id de lecture (hrvDay, skinTemp), classe, début (ms ; 1 s après la dernière lue). */
    public static final class Request {
        public final String id;
        public final int cls;
        public final long sinceMs;

        public Request(String id, int cls, long sinceMs) {
            this.id = id;
            this.cls = cls;
            this.sinceMs = sinceMs;
        }

        public static Request hrvDay(long sinceMs) {
            return new Request("hrvDay", HRV_DAY, sinceMs);
        }

        public static Request skinTemp(long sinceMs) {
            return new Request("skinTemp", SKIN_TEMP, sinceMs);
        }
    }

    /** Pages reçues pour une classe : charges utiles brutes et dernier instant lu (0 si aucun enregistrement). */
    public static final class Pages {
        public final String id;
        public final int cls;
        public final long sinceMs;
        public final List<byte[]> pages = new ArrayList<>();
        public long maxTime;

        Pages(Request r) {
            this.id = r.id;
            this.cls = r.cls;
            this.sinceMs = r.sinceMs;
        }
    }

    private final WatchLink link;
    private final long timeoutMs;
    private int seq = 1;

    WatchP2P(WatchLink link, long timeoutMs) {
        this.link = link;
        this.timeoutMs = timeoutMs;
    }

    /** Numéro suivant : incrémenté avant chaque envoi, le premier message porte donc 2. */
    int next() {
        seq = (seq + 1) % SEQ_MODULO;
        return seq;
    }

    private static byte[] be(long n, int size) {
        byte[] out = new byte[size];
        for (int i = size - 1; i >= 0; i--, n >>>= 8) out[i] = (byte) n;
        return out;
    }

    private static byte[] utf8(String s) {
        return s.getBytes(StandardCharsets.UTF_8);
    }

    /** Entier gros-boutiste sur le minimum d'octets (500044 → 07 A1 4C), comme minimalBytes. */
    static byte[] minimal(long n) {
        int size = 1;
        while (size < 8 && (n >>> (8 * size)) != 0) size++;
        return be(n, size);
    }

    static List<LinkCodec.Tlv> envelope(int cmd, int seq, String src, String dst, String srcFp, String dstFp, byte[] payload, byte[] code) {
        List<LinkCodec.Tlv> tlvs = new ArrayList<>();
        tlvs.add(new LinkCodec.Tlv(1, new byte[] {(byte) cmd}));
        tlvs.add(new LinkCodec.Tlv(2, be(seq, 2)));
        tlvs.add(new LinkCodec.Tlv(3, utf8(src)));
        tlvs.add(new LinkCodec.Tlv(4, utf8(dst)));
        if (srcFp != null) tlvs.add(new LinkCodec.Tlv(5, utf8(srcFp)));
        if (dstFp != null) tlvs.add(new LinkCodec.Tlv(6, utf8(dstFp)));
        if (payload != null && payload.length > 0) tlvs.add(new LinkCodec.Tlv(7, payload));
        if (code != null) tlvs.add(new LinkCodec.Tlv(8, code));
        return tlvs;
    }

    static List<LinkCodec.Tlv> ping(int seq) {
        return envelope(PING, seq, HEALTH, FILESYNC, null, null, null, null);
    }

    /** Demande d'une page : 0x01 puis opération 1, classe, début et maintenant (ms sur 8 octets), 0x0D = 1. */
    static List<LinkCodec.Tlv> dictionaryRequest(int seq, int cls, long startMs, long nowMs) {
        List<LinkCodec.Tlv> body = new ArrayList<>();
        body.add(new LinkCodec.Tlv(1, new byte[] {1}));
        body.add(new LinkCodec.Tlv(2, minimal(cls)));
        body.add(new LinkCodec.Tlv(5, be(Math.max(0, startMs), 8)));
        body.add(new LinkCodec.Tlv(6, be(nowMs, 8)));
        body.add(new LinkCodec.Tlv(0x0D, new byte[] {1}));
        byte[] tlvs = LinkCodec.encodeTlvs(body);
        byte[] payload = new byte[tlvs.length + 1];
        payload[0] = 1;
        System.arraycopy(tlvs, 0, payload, 1, tlvs.length);
        return envelope(DATA, seq, DICTIONARY, FILESYNC, FINGERPRINT_SOURCE, FINGERPRINT_DESTINATION, payload, null);
    }

    /** Accusé « reçu » d'un message de la montre : son numéro, paquets inversés, sans empreinte, code 0xCF sur 4 octets. */
    static List<LinkCodec.Tlv> ack(List<LinkCodec.Tlv> msg) {
        return envelope(REPLY, (int) LinkCodec.uint(LinkCodec.find(msg, 2)), text(LinkCodec.find(msg, 4)), text(LinkCodec.find(msg, 3)),
                null, null, null, be(RECEIVED, 4));
    }

    private static String text(byte[] b) {
        return b == null ? "" : new String(b, StandardCharsets.UTF_8);
    }

    private static int cmdOf(List<LinkCodec.Tlv> msg) {
        byte[] c = LinkCodec.find(msg, 1);
        return c == null || c.length == 0 ? -1 : c[0] & 0xFF;
    }

    /** Classe d'une charge utile de page (étiquette 2 après l'octet 0x01), -1 si illisible. */
    static long classOf(byte[] payload) {
        if (payload == null || payload.length < 2 || payload[0] != 1) return -1;
        byte[] cls = LinkCodec.find(LinkCodec.tryDecodeTlvs(java.util.Arrays.copyOfRange(payload, 1, payload.length)), 2);
        return cls == null || cls.length == 0 ? -1 : LinkCodec.uint(cls);
    }

    /**
     * Instant de reprise d'une page comme parseDictionaryPage : le plus grand max(fin, modification) (le début à
     * défaut) sur tous ses enregistrements ; 0 si la page n'en a aucun (classe terminée).
     */
    static long maxTime(byte[] payload) {
        List<LinkCodec.Tlv> body = LinkCodec.tryDecodeTlvs(java.util.Arrays.copyOfRange(payload, 1, payload.length));
        byte[] container = LinkCodec.find(body, 0x83);
        if (container == null) return 0;
        long max = 0;
        for (LinkCodec.Tlv item : LinkCodec.tryDecodeTlvs(container)) {
            if (item.tag != 0x84) continue;
            List<LinkCodec.Tlv> r = LinkCodec.tryDecodeTlvs(item.value);
            long t = Math.max(LinkCodec.uint(LinkCodec.find(r, 6)), LinkCodec.uint(LinkCodec.find(r, 0x0C)));
            if (t == 0) t = LinkCodec.uint(LinkCodec.find(r, 5));
            max = Math.max(max, t);
        }
        return max;
    }

    /** Vrai si la page porte au moins un enregistrement (conteneur 0x83 non vide). */
    static boolean hasRecords(byte[] payload) {
        List<LinkCodec.Tlv> body = LinkCodec.tryDecodeTlvs(java.util.Arrays.copyOfRange(payload, 1, payload.length));
        byte[] container = LinkCodec.find(body, 0x83);
        if (container == null) return false;
        for (LinkCodec.Tlv item : LinkCodec.tryDecodeTlvs(container)) if (item.tag == 0x84) return true;
        return false;
    }

    /**
     * Prochain message P2P de la montre, après avoir acquitté les commandes 1 et 2 qu'elle envoie ; rend le message
     * accepté par `want`, ignore le reste (accusés d'autres numéros, pages non demandées).
     */
    private List<LinkCodec.Tlv> await(java.util.function.Predicate<List<LinkCodec.Tlv>> want, long ms) throws IOException, GeneralSecurityException {
        long deadline = System.nanoTime() + ms * 1_000_000L;
        for (;;) {
            long left = (deadline - System.nanoTime()) / 1_000_000L;
            if (left <= 0) throw new IOException("Pas de réponse de la montre (P2P) en " + Math.round(ms / 1000.0) + " s");
            LinkCodec.Message m = link.await(SERVICE, COMMAND, left);
            int cmd = cmdOf(m.tlvs);
            if (cmd == PING || cmd == DATA) link.send(SERVICE, COMMAND, ack(m.tlvs), false);
            if (want.test(m.tlvs)) return m.tlvs;
        }
    }

    /** Code de la réponse au ping (0xCA = disponible) ; lève si la montre se tait. */
    long ping() throws IOException, GeneralSecurityException {
        int n = next();
        link.send(SERVICE, COMMAND, ping(n), false);
        List<LinkCodec.Tlv> reply = await(t -> cmdOf(t) == REPLY && LinkCodec.uint(LinkCodec.find(t, 2)) == n, Math.min(timeoutMs, PING_TIMEOUT_MS));
        return LinkCodec.uint(LinkCodec.find(reply, 8));
    }

    /** Une page de la classe depuis `startMs` : la charge utile brute. */
    byte[] page(int cls, long startMs, long nowMs) throws IOException, GeneralSecurityException {
        link.send(SERVICE, COMMAND, dictionaryRequest(next(), cls, startMs, nowMs), false);
        List<LinkCodec.Tlv> msg = await(t -> cmdOf(t) == DATA && FILESYNC.equals(text(LinkCodec.find(t, 3)))
                && classOf(LinkCodec.find(t, 7)) == cls, timeoutMs);
        return LinkCodec.find(msg, 7);
    }

    /**
     * Lit chaque classe demandée (une après l'autre, une seule page en vol) et consigne son issue dans `cap`. Ping
     * ≠ 0xCA → « unsupported » pour toutes ; silence au ping → « timeout ». Une page perdue après la première garde ce
     * qui est lu. Ne lève jamais.
     */
    static void read(WatchLink link, WatchReader.Capture cap, List<Request> requests, long nowMs, long timeoutMs) {
        if (requests.isEmpty()) return;
        WatchP2P p2p = new WatchP2P(link, timeoutMs);
        String refusal = null;
        try {
            if (p2p.ping() != AVAILABLE) refusal = "unsupported";
        } catch (IOException | GeneralSecurityException e) {
            refusal = WatchReader.outcomeOf(e);
        }
        for (Request r : requests) {
            WatchReader.Read read = new WatchReader.Read(r.id);
            cap.reads.add(read);
            if (refusal != null) {
                read.outcome = refusal;
                continue;
            }
            Pages pages = new Pages(r);
            long start = r.sinceMs;
            try {
                for (int i = 0; i < MAX_PAGES; i++) {
                    byte[] payload;
                    try {
                        payload = p2p.page(r.cls, start, nowMs);
                    } catch (IOException | GeneralSecurityException e) {
                        if (pages.pages.isEmpty()) throw e;
                        break; // la suite à la prochaine relecture
                    }
                    if (!hasRecords(payload)) break;
                    pages.pages.add(payload);
                    long t = maxTime(payload);
                    pages.maxTime = Math.max(pages.maxTime, t);
                    if (t + NEXT_PAGE_GAP_MS <= start) break; // la reprise n'avance plus
                    start = t + NEXT_PAGE_GAP_MS;
                }
                read.units = pages.pages.size();
                read.outcome = pages.pages.isEmpty() ? "empty" : "ok";
                if (!pages.pages.isEmpty()) cap.dictionary.add(pages);
            } catch (IOException | GeneralSecurityException e) {
                read.outcome = WatchReader.outcomeOf(e);
            }
        }
    }
}
