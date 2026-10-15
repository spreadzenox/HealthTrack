package com.healthtrack.app.huawei;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.List;

/**
 * Lectures santé du client Java « synchro seule » (journal/protocoles/huawei.md §7.2–§7.4, §9.1 d), sur une
 * session déjà authentifiée : sommeil (7/0x0C puis 7/0x0D), minutes (7/0x0A puis 7/0x0B) et totaux du jour
 * (7/0x03), dans l'ordre et avec les mêmes demandes que readWatchData (src/devices/huawei/sync.js).
 * Rien n'est décodé ici : chaque réponse est gardée **brute** (TLV déchiffrés) dans une capture que le JS
 * importe à l'ouverture avec son propre analyseur — une seule implémentation du décodage santé.
 * Mêmes règles de tolérance que le JS (§7.10) : bloc refusé sauté, bloc sans réponse = fin de ce service
 * (ce qui est lu est gardé), une lecture qui cale n'empêche pas les suivantes.
 */
public final class WatchReader {

    public static final int FITNESS = 7;
    static final int TOTALS = 0x03;
    static final int MINUTE_COUNT = 0x0A;
    static final int MINUTE_DATA = 0x0B;
    static final int SLEEP_COUNT = 0x0C;
    static final int SLEEP_DATA = 0x0D;
    /** Début minimal accepté par certaines montres (1/1/2000, en s) : jamais 0. */
    static final long MIN_START_SEC = 946684800L;
    /** Format de la capture lu par src/devices/huawei/capture.js. */
    public static final int CAPTURE_VERSION = 1;

    private WatchReader() {}

    /** Une réponse brute : service, commande, numéro de bloc (-1 pour un compte ou les totaux), TLV déchiffrés. */
    public static final class Reply {
        public final int service;
        public final int command;
        public final int index;
        public final byte[] body;

        Reply(int service, int command, int index, byte[] body) {
            this.service = service;
            this.command = command;
            this.index = index;
            this.body = body;
        }
    }

    /** Issue d'une lecture, mêmes mots que le JS : ok · empty · timeout · refused · error. */
    public static final class Read {
        public final String id;
        public String outcome = "empty";
        public int units;
        public int failed;

        Read(String id) {
            this.id = id;
        }
    }

    /** Ce que la montre a rendu pendant une synchro en arrière-plan. */
    public static final class Capture {
        public final long sinceMs;
        public final long untilMs;
        public long atMs;
        public int battery = -1;
        /** Adresse de la montre (normalisée), posée par le service qui a fait la synchro. */
        public String address;
        /** Nom de la montre (source affichée des mesures), facultatif. */
        public String name;
        public final List<Reply> replies = new ArrayList<>();
        public final List<Read> reads = new ArrayList<>();

        Capture(long sinceMs, long untilMs, long atMs) {
            this.sinceMs = sinceMs;
            this.untilMs = untilMs;
            this.atMs = atMs;
        }

        /** Vrai si au moins un bloc de minutes ou de sommeil est arrivé (la reprise peut avancer). */
        public boolean gotBlocks() {
            for (Reply r : replies) if (r.index >= 0) return true;
            return false;
        }

        /** JSON lu par le JS ; des octets et des nombres, aucun champ décodé. */
        public String toJson() {
            StringBuilder b = new StringBuilder("{\"v\":").append(CAPTURE_VERSION)
                    .append(",\"since\":").append(sinceMs)
                    .append(",\"until\":").append(untilMs)
                    .append(",\"at\":").append(atMs)
                    .append(",\"battery\":").append(battery);
            if (address != null) b.append(",\"address\":").append(MiniJson.quote(address));
            if (name != null) b.append(",\"name\":").append(MiniJson.quote(name));
            b.append(",\"reads\":[");
            for (int i = 0; i < reads.size(); i++) {
                Read r = reads.get(i);
                if (i > 0) b.append(',');
                b.append("{\"id\":").append(MiniJson.quote(r.id))
                        .append(",\"outcome\":").append(MiniJson.quote(r.outcome))
                        .append(",\"units\":").append(r.units)
                        .append(",\"failed\":").append(r.failed).append('}');
            }
            b.append("],\"replies\":[");
            for (int i = 0; i < replies.size(); i++) {
                Reply r = replies.get(i);
                if (i > 0) b.append(',');
                b.append("{\"s\":").append(r.service)
                        .append(",\"c\":").append(r.command)
                        .append(",\"i\":").append(r.index)
                        .append(",\"hex\":\"").append(IsoAuth.hex(r.body)).append("\"}");
            }
            return b.append("]}").toString();
        }
    }

    private static byte[] be(long n, int size) {
        byte[] out = new byte[size];
        for (int i = size - 1; i >= 0; i--, n >>>= 8) out[i] = (byte) n;
        return out;
    }

    /** Demande de nombre de blocs (§7.2) : `81` vide, puis début et fin (s) au premier niveau. */
    static List<LinkCodec.Tlv> countTlvs(long sinceMs, long untilMs) {
        List<LinkCodec.Tlv> tlvs = new ArrayList<>();
        tlvs.add(LinkCodec.Tlv.empty(0x81));
        tlvs.add(new LinkCodec.Tlv(3, be(Math.max(MIN_START_SEC, Math.floorDiv(sinceMs, 1000)), 4)));
        tlvs.add(new LinkCodec.Tlv(4, be(Math.floorDiv(untilMs, 1000), 4)));
        return tlvs;
    }

    /** Demande du bloc n : `81` { 02 = n sur 2 octets }. */
    static List<LinkCodec.Tlv> blockTlvs(int index) {
        List<LinkCodec.Tlv> tlvs = new ArrayList<>();
        tlvs.add(new LinkCodec.Tlv(0x81, new byte[] {0x02, 0x02, (byte) (index >> 8), (byte) index}));
        return tlvs;
    }

    /** Nombre de blocs annoncé : étiquette 2 dans `81` (0 si absent). */
    static int parseCount(List<LinkCodec.Tlv> tlvs) {
        byte[] inner = LinkCodec.find(tlvs, 0x81);
        if (inner == null) return 0;
        long n = LinkCodec.uint(LinkCodec.find(LinkCodec.tryDecodeTlvs(inner), 2));
        return n > 0 ? (int) Math.min(n, 0xFFFF) : 0;
    }

    /** Issue d'une exception, comme outcomeOf (sync.js). */
    static String outcomeOf(Exception e) {
        String msg = e.getMessage() == null ? "" : e.getMessage();
        if (e instanceof IOException && msg.startsWith("Pas de réponse")) return "timeout";
        return msg.contains("refusé") ? "refused" : "error";
    }

    private static void blocks(WatchLink link, Capture cap, String id, int countCmd, int dataCmd, long timeoutMs) {
        Read read = new Read(id);
        cap.reads.add(read);
        int got = 0;
        String failure = null;
        try {
            LinkCodec.Message count = link.request(FITNESS, countCmd, countTlvs(cap.sinceMs, cap.untilMs), false, timeoutMs);
            int n = parseCount(count.tlvs);
            read.units = n;
            for (int i = 0; i < n; i++) {
                LinkCodec.Message reply;
                try {
                    reply = link.request(FITNESS, dataCmd, blockTlvs(i), false, timeoutMs);
                } catch (IOException | GeneralSecurityException e) {
                    read.failed += n - i;
                    failure = outcomeOf(e);
                    break;
                }
                long code = LinkCodec.resultCode(reply.tlvs);
                if (code >= 0 && code != LinkCodec.RESULT_SUCCESS) {
                    read.failed++;
                    if (failure == null) failure = "refused";
                    continue;
                }
                cap.replies.add(new Reply(FITNESS, dataCmd, i, LinkCodec.encodeTlvs(reply.tlvs)));
                got++;
            }
            read.outcome = got > 0 ? "ok" : failure != null ? failure : n > 0 ? "ok" : "empty";
        } catch (IOException | GeneralSecurityException e) {
            read.outcome = outcomeOf(e);
        }
    }

    /**
     * Lit sommeil, minutes et totaux sur [sinceMs, untilMs). Ne lève jamais : chaque issue est dans `reads`.
     * `nowMs` : heure de la capture (sert au JS pour dater les totaux du jour).
     */
    public static Capture read(WatchLink link, long sinceMs, long untilMs, long nowMs, long timeoutMs) {
        Capture cap = new Capture(sinceMs, untilMs, nowMs);
        blocks(link, cap, "sleep", SLEEP_COUNT, SLEEP_DATA, timeoutMs);
        blocks(link, cap, "minutes", MINUTE_COUNT, MINUTE_DATA, timeoutMs);
        Read totals = new Read("totals");
        cap.reads.add(totals);
        try {
            List<LinkCodec.Tlv> ask = new ArrayList<>();
            ask.add(LinkCodec.Tlv.empty(1));
            LinkCodec.Message reply = link.request(FITNESS, TOTALS, ask, false, timeoutMs);
            cap.replies.add(new Reply(FITNESS, TOTALS, -1, LinkCodec.encodeTlvs(reply.tlvs)));
            byte[] inner = LinkCodec.find(reply.tlvs, 0x81);
            totals.outcome = inner != null && inner.length > 0 ? "ok" : "empty";
        } catch (IOException | GeneralSecurityException e) {
            totals.outcome = outcomeOf(e);
        }
        return cap;
    }
}
