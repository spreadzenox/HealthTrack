package com.healthtrack.app.huawei;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.List;

/**
 * Lectures santé du client Java « synchro seule » (journal/protocoles/huawei.md §7.2–§7.4, §7.6, §9.1 d), sur une
 * session déjà authentifiée : sommeil (7/0x0C puis 7/0x0D), minutes (7/0x0A puis 7/0x0B), totaux du jour
 * (7/0x03), puis les fichiers 0x2C demandés (sommeil détaillé `sequence_data`, stress `rrisqi_data.bin` : M6) et
 * les classes du dictionnaire P2P (VFC de journée, température de la peau : M6b, WatchP2P), et les séances avec
 * leurs blocs de FC et d'allures (M7b) si l'app les a déjà lues une fois,
 * dans l'ordre et avec les mêmes demandes que readWatchData (src/devices/huawei/sync.js).
 * Rien n'est décodé ici : chaque réponse est gardée **brute** (TLV déchiffrés ; octets du fichier rassemblés) dans une capture que le JS
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
    /** Service des séances (§7.5, §7.5 bis) : liste, totaux, échantillons (FC, vitesse), allures au km. */
    public static final int WORKOUT = 0x17;
    static final int WORKOUT_LIST = 0x07;
    static final int WORKOUT_TOTALS = 0x08;
    static final int WORKOUT_SAMPLES = 0x0A;
    static final int WORKOUT_PACE = 0x0C;
    /** Blocs lus au plus par séance et par commande (comme MAX_WORKOUT_BLOCKS, sync.js). */
    static final int MAX_WORKOUT_BLOCKS = 40;
    static final long DAY_MS = 24 * 3_600_000L;
    /** Service des fichiers (§7.6) et ses commandes : ouverture, infos, demande de bloc, bloc poussé, fin. */
    public static final int FILES = 0x2C;
    static final int FILE_OPEN = 0x01;
    static final int FILE_INFO = 0x03;
    static final int FILE_BLOCK = 0x04;
    static final int FILE_PUSH = 0x05;
    static final int FILE_DONE = 0x06;
    /** Taille maxi acceptée pour un fichier (comme MAX_FILE_BYTES, files.js). */
    static final int MAX_FILE_BYTES = 2 * 1024 * 1024;
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

    /** Fichier 0x2C à télécharger : id de lecture (sleepFile, stress), nom, type, début (ms), dictionnaire ou -1. */
    public static final class FileRequest {
        public final String id;
        public final String name;
        public final int type;
        public final long startMs;
        public final long dictionary;

        public FileRequest(String id, String name, int type, long startMs, long dictionary) {
            this.id = id;
            this.name = name;
            this.type = type;
            this.startMs = startMs;
            this.dictionary = dictionary;
        }

        /** Sommeil détaillé (type 0x16, dictionnaire 700013). */
        public static FileRequest sleep(long startMs) {
            return new FileRequest("sleepFile", "sequence_data", 0x16, startMs, 700013);
        }

        /** Stress automatique (type 0x10). */
        public static FileRequest stress(long startMs) {
            return new FileRequest("stress", "rrisqi_data.bin", 0x10, startMs, -1);
        }
    }

    /** Fichier reçu : id de lecture, début demandé (ms), octets bruts. */
    public static final class FileData {
        public final String id;
        public final long sinceMs;
        public final byte[] bytes;

        FileData(String id, long sinceMs, byte[] bytes) {
            this.id = id;
            this.sinceMs = sinceMs;
            this.bytes = bytes;
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
        /** Sommeil détaillé lu depuis le coucher (capacité 199) : recopié du JS, sert au décodage. */
        public boolean bedTime = true;
        public final List<Reply> replies = new ArrayList<>();
        public final List<FileData> files = new ArrayList<>();
        /** Pages du dictionnaire P2P (VFC de journée, température : M6b), charges utiles brutes. */
        public final List<WatchP2P.Pages> dictionary = new ArrayList<>();
        public final List<Read> reads = new ArrayList<>();

        Capture(long sinceMs, long untilMs, long atMs) {
            this.sinceMs = sinceMs;
            this.untilMs = untilMs;
            this.atMs = atMs;
        }

        /** Issue d'une lecture par son id, ou null. */
        public Read read(String id) {
            for (Read r : reads) if (r.id.equals(id)) return r;
            return null;
        }

        /** Vrai si au moins un bloc de minutes ou de sommeil (ou un fichier) est arrivé (la reprise peut avancer). */
        public boolean gotBlocks() {
            for (Reply r : replies) if (r.index >= 0) return true;
            for (FileData f : files) if (f.bytes.length > 0) return true;
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
            if (!files.isEmpty()) {
                if (!bedTime) b.append(",\"bedTime\":false");
                b.append(",\"files\":[");
                for (int i = 0; i < files.size(); i++) {
                    FileData f = files.get(i);
                    if (i > 0) b.append(',');
                    b.append("{\"id\":").append(MiniJson.quote(f.id))
                            .append(",\"since\":").append(f.sinceMs)
                            .append(",\"hex\":\"").append(IsoAuth.hex(f.bytes)).append("\"}");
                }
                b.append(']');
            }
            if (!dictionary.isEmpty()) {
                b.append(",\"dict\":[");
                for (int i = 0; i < dictionary.size(); i++) {
                    WatchP2P.Pages d = dictionary.get(i);
                    if (i > 0) b.append(',');
                    b.append("{\"id\":").append(MiniJson.quote(d.id))
                            .append(",\"cls\":").append(d.cls)
                            .append(",\"since\":").append(d.sinceMs)
                            .append(",\"max\":").append(d.maxTime)
                            .append(",\"pages\":[");
                    for (int j = 0; j < d.pages.size(); j++) {
                        if (j > 0) b.append(',');
                        b.append('"').append(IsoAuth.hex(d.pages.get(j))).append('"');
                    }
                    b.append("]}");
                }
                b.append(']');
            }
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
        return read(link, sinceMs, untilMs, nowMs, timeoutMs, new ArrayList<FileRequest>());
    }

    /** Idem, puis télécharge chaque fichier demandé jusqu'à `untilMs` (un fichier qui cale n'empêche pas le suivant). */
    public static Capture read(WatchLink link, long sinceMs, long untilMs, long nowMs, long timeoutMs, List<FileRequest> files) {
        return read(link, sinceMs, untilMs, nowMs, timeoutMs, files, new ArrayList<WatchP2P.Request>());
    }

    /** Idem, puis relit les classes du dictionnaire demandées par le P2P (VFC de journée, température : M6b). */
    public static Capture read(WatchLink link, long sinceMs, long untilMs, long nowMs, long timeoutMs, List<FileRequest> files,
                               List<WatchP2P.Request> dictionary) {
        return read(link, sinceMs, untilMs, nowMs, timeoutMs, files, dictionary, false);
    }

    /** Idem, avec les séances après les totaux (M7b) quand `workouts` est vrai (l'app les a déjà lues : service pris en charge). */
    public static Capture read(WatchLink link, long sinceMs, long untilMs, long nowMs, long timeoutMs, List<FileRequest> files,
                               List<WatchP2P.Request> dictionary, boolean workouts) {
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
        if (workouts) workouts(link, cap, timeoutMs);
        for (FileRequest f : files) {
            Read read = new Read(f.id);
            cap.reads.add(read);
            try {
                byte[] bytes = downloadFile(link, f, untilMs, timeoutMs);
                if (bytes != null && bytes.length > 0) {
                    cap.files.add(new FileData(f.id, f.startMs, bytes));
                    read.outcome = "ok";
                    read.units = bytes.length;
                }
            } catch (IOException | GeneralSecurityException e) {
                read.outcome = outcomeOf(e);
            }
        }
        WatchP2P.read(link, cap, dictionary, nowMs, timeoutMs);
        return cap;
    }

    /** 0x17/0x07 : séances sur [since, until), début et fin (s) dans `81` (comme workoutListTlvs). */
    static List<LinkCodec.Tlv> workoutListTlvs(long sinceMs, long untilMs) {
        List<LinkCodec.Tlv> inner = new ArrayList<>();
        inner.add(new LinkCodec.Tlv(3, be(Math.max(MIN_START_SEC, Math.floorDiv(sinceMs, 1000)), 4)));
        inner.add(new LinkCodec.Tlv(4, be(Math.floorDiv(untilMs, 1000), 4)));
        return wrap(inner);
    }

    /** 0x17/0x08 : totaux de la séance `number`. */
    static List<LinkCodec.Tlv> workoutTotalsTlvs(int number) {
        List<LinkCodec.Tlv> tlvs = new ArrayList<>();
        tlvs.add(new LinkCodec.Tlv(0x81, new byte[] {0x02, 0x02, (byte) (number >> 8), (byte) number}));
        return tlvs;
    }

    /** 0x17/0x0A : bloc d'échantillons `block` de la séance `number` (étiquette 7 vide). */
    static List<LinkCodec.Tlv> workoutSamplesTlvs(int number, int block) {
        List<LinkCodec.Tlv> inner = new ArrayList<>();
        inner.add(new LinkCodec.Tlv(2, be(number, 2)));
        inner.add(new LinkCodec.Tlv(3, be(block, 2)));
        inner.add(LinkCodec.Tlv.empty(7));
        return wrap(inner);
    }

    /** 0x17/0x0C : bloc d'allures `block` de la séance `number`. */
    static List<LinkCodec.Tlv> workoutPaceTlvs(int number, int block) {
        List<LinkCodec.Tlv> inner = new ArrayList<>();
        inner.add(new LinkCodec.Tlv(2, be(number, 2)));
        inner.add(new LinkCodec.Tlv(8, be(block, 2)));
        return wrap(inner);
    }

    private static List<LinkCodec.Tlv> wrap(List<LinkCodec.Tlv> inner) {
        List<LinkCodec.Tlv> tlvs = new ArrayList<>();
        tlvs.add(new LinkCodec.Tlv(0x81, LinkCodec.encodeTlvs(inner)));
        return tlvs;
    }

    /** Entrées de la liste 0x17/0x07 : { numéro, blocs d'échantillons, blocs d'allures } (comme parseWorkoutIndex). */
    static List<int[]> parseWorkoutIndex(List<LinkCodec.Tlv> tlvs) {
        List<int[]> out = new ArrayList<>();
        byte[] inner = LinkCodec.find(tlvs, 0x81);
        if (inner == null) return out;
        for (LinkCodec.Tlv t : LinkCodec.tryDecodeTlvs(inner)) {
            if (t.tag != 0x85) continue;
            List<LinkCodec.Tlv> b = LinkCodec.tryDecodeTlvs(t.value);
            byte[] number = LinkCodec.find(b, 6);
            if (number == null) continue;
            out.add(new int[] {(int) LinkCodec.uint(number), (int) LinkCodec.uint(LinkCodec.find(b, 7)), (int) LinkCodec.uint(LinkCodec.find(b, 8))});
        }
        return out;
    }

    /** Début (ms) annoncé par les totaux d'une séance (étiquette 4 dans `81`), 0 si absent. */
    static long workoutStart(List<LinkCodec.Tlv> tlvs) {
        byte[] inner = LinkCodec.find(tlvs, 0x81);
        if (inner == null) return 0;
        return LinkCodec.uint(LinkCodec.find(LinkCodec.tryDecodeTlvs(inner), 4)) * 1000L;
    }

    /**
     * Séances comme readWorkouts (sync.js) : liste, puis totaux de chacune ; FC et allures seulement pour les séances
     * de la période (début ≥ veille de `since`). Réponses gardées brutes : liste (index -1), totaux, échantillons et
     * allures (index = numéro de la séance, blocs dans l'ordre). Une séance qui échoue n'empêche pas les autres ;
     * un bloc de détail qui échoue arrête seulement sa série.
     */
    static void workouts(WatchLink link, Capture cap, long timeoutMs) {
        Read read = new Read("workouts");
        cap.reads.add(read);
        List<int[]> list;
        try {
            LinkCodec.Message reply = link.request(WORKOUT, WORKOUT_LIST, workoutListTlvs(cap.sinceMs, cap.untilMs), false, timeoutMs);
            long code = LinkCodec.resultCode(reply.tlvs);
            if (code >= 0 && code != LinkCodec.RESULT_SUCCESS) {
                read.outcome = "refused";
                return;
            }
            cap.replies.add(new Reply(WORKOUT, WORKOUT_LIST, -1, LinkCodec.encodeTlvs(reply.tlvs)));
            list = parseWorkoutIndex(reply.tlvs);
        } catch (IOException | GeneralSecurityException e) {
            read.outcome = outcomeOf(e);
            return;
        }
        read.units = list.size();
        int got = 0;
        String failure = null;
        for (int[] w : list) {
            int number = w[0];
            List<LinkCodec.Tlv> totals;
            try {
                LinkCodec.Message reply = link.request(WORKOUT, WORKOUT_TOTALS, workoutTotalsTlvs(number), false, timeoutMs);
                long code = LinkCodec.resultCode(reply.tlvs);
                if (code >= 0 && code != LinkCodec.RESULT_SUCCESS) throw new IOException("séance refusée");
                totals = reply.tlvs;
            } catch (IOException | GeneralSecurityException e) {
                read.failed++;
                if (failure == null) failure = outcomeOf(e);
                continue;
            }
            cap.replies.add(new Reply(WORKOUT, WORKOUT_TOTALS, number, LinkCodec.encodeTlvs(totals)));
            long start = workoutStart(totals);
            if (start <= 0 || start < cap.sinceMs - DAY_MS || start >= cap.untilMs) continue;
            got++;
            for (int i = 0; i < Math.min(w[1], MAX_WORKOUT_BLOCKS); i++) {
                if (!workoutBlock(link, cap, WORKOUT_SAMPLES, workoutSamplesTlvs(number, i), number, timeoutMs)) break;
            }
            for (int i = 0; i < Math.min(w[2], MAX_WORKOUT_BLOCKS); i++) {
                if (!workoutBlock(link, cap, WORKOUT_PACE, workoutPaceTlvs(number, i), number, timeoutMs)) break;
            }
        }
        read.outcome = got > 0 ? "ok" : failure != null ? failure : list.isEmpty() ? "empty" : "ok";
    }

    private static boolean workoutBlock(WatchLink link, Capture cap, int command, List<LinkCodec.Tlv> ask, int number, long timeoutMs) {
        try {
            LinkCodec.Message reply = link.request(WORKOUT, command, ask, false, timeoutMs);
            cap.replies.add(new Reply(WORKOUT, command, number, LinkCodec.encodeTlvs(reply.tlvs)));
            return true;
        } catch (IOException | GeneralSecurityException e) {
            return false;
        }
    }

    /** Demande d'ouverture 0x2C/0x01 : nom, type, début et fin (s), dictionnaire éventuel. */
    static List<LinkCodec.Tlv> openFileTlvs(FileRequest f, long untilMs) {
        List<LinkCodec.Tlv> tlvs = new ArrayList<>();
        tlvs.add(new LinkCodec.Tlv(1, f.name.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        tlvs.add(new LinkCodec.Tlv(2, new byte[] {(byte) f.type}));
        tlvs.add(new LinkCodec.Tlv(5, be(Math.floorDiv(f.startMs, 1000), 4)));
        tlvs.add(new LinkCodec.Tlv(6, be(Math.floorDiv(untilMs, 1000), 4)));
        if (f.dictionary >= 0) tlvs.add(new LinkCodec.Tlv(0x0C, be(f.dictionary, 4)));
        return tlvs;
    }

    /**
     * Télécharge un fichier comme downloadFile (files.js) : ouverture, infos (taille de bloc, envoi en clair),
     * demandes de blocs, blocs poussés en 0x2C/0x05 (identifiant, décalage sur 4 octets, 1 octet, données), fin.
     * Rend null si le fichier est vide ; lève si la montre refuse, se tait ou pousse un bloc inattendu.
     */
    static byte[] downloadFile(WatchLink link, FileRequest f, long untilMs, long timeoutMs) throws IOException, GeneralSecurityException {
        LinkCodec.Message opened = link.request(FILES, FILE_OPEN, openFileTlvs(f, untilMs), false, timeoutMs);
        long code = LinkCodec.resultCode(opened.tlvs);
        if (code >= 0 && code != LinkCodec.RESULT_SUCCESS) throw new IOException("fichier " + f.name + " refusé (code " + code + ")");
        byte[] id = LinkCodec.find(opened.tlvs, 3);
        if (id == null || id.length == 0) throw new IOException("fichier " + f.name + " : pas d'identifiant");
        int fileId = id[0] & 0xFF;
        long size = LinkCodec.uint(LinkCodec.find(opened.tlvs, 4));
        try {
            if (size == 0 || size == 0xFFFFFFFFL) return null;
            if (size > MAX_FILE_BYTES) throw new IOException("fichier " + f.name + " trop gros (" + size + " octets)");
            List<LinkCodec.Tlv> ask = new ArrayList<>();
            ask.add(new LinkCodec.Tlv(1, new byte[] {(byte) fileId}));
            for (int t = 2; t <= 5; t++) ask.add(LinkCodec.Tlv.empty(t));
            LinkCodec.Message info = link.request(FILES, FILE_INFO, ask, false, timeoutMs);
            long maxBlock = LinkCodec.uint(LinkCodec.find(info.tlvs, 4));
            if (maxBlock <= 0) maxBlock = 4096;
            byte[] plainFlag = LinkCodec.find(info.tlvs, 5);
            boolean plain = plainFlag != null && plainFlag.length > 0 && plainFlag[0] == 1;
            byte[] file = new byte[(int) size];
            int received = 0;
            while (received < size) {
                int offset = received;
                int want = (int) Math.min(size - offset, maxBlock);
                List<LinkCodec.Tlv> block = new ArrayList<>();
                block.add(new LinkCodec.Tlv(1, new byte[] {(byte) fileId}));
                block.add(new LinkCodec.Tlv(2, be(offset, 4)));
                block.add(new LinkCodec.Tlv(3, be(want, 4)));
                if (f.dictionary >= 0) block.add(new LinkCodec.Tlv(4, be(f.dictionary, 4)));
                link.send(FILES, FILE_BLOCK, block, plain);
                int got = 0;
                while (got < want) {
                    LinkCodec.Message m;
                    try {
                        m = link.await(FILES, FILE_PUSH, timeoutMs);
                    } catch (IOException e) {
                        if (e.getMessage() != null && e.getMessage().startsWith("Pas de réponse")) {
                            throw new IOException("fichier " + f.name + " : bloc " + offset + " incomplet");
                        }
                        throw e;
                    }
                    byte[] raw = m.raw;
                    if (raw == null || raw.length < 6 || (raw[0] & 0xFF) != fileId) continue;
                    long at = LinkCodec.uint(java.util.Arrays.copyOfRange(raw, 1, 5)) - offset;
                    int len = raw.length - 6;
                    if (at < 0 || at + len > want) throw new IOException("fichier " + f.name + " : bloc inattendu");
                    System.arraycopy(raw, 6, file, offset + (int) at, len);
                    got = (int) Math.max(got, at + len);
                }
                received += want;
            }
            return file;
        } finally {
            List<LinkCodec.Tlv> done = new ArrayList<>();
            done.add(new LinkCodec.Tlv(1, new byte[] {(byte) fileId}));
            done.add(new LinkCodec.Tlv(2, new byte[] {1}));
            try {
                link.send(FILES, FILE_DONE, done, false);
            } catch (IOException | GeneralSecurityException ignored) {
                // la fin de transfert est une politesse : la montre referme d'elle-même
            }
        }
    }
}
