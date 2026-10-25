package com.healthtrack.app.huawei;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Relecture de la montre app tuée ou en arrière-plan (journal/protocoles/huawei.md §9.1 e, g) : décide s'il faut relire, rejoue
 * reconnexion → batterie → lectures, dépose la capture et tient l'état. Mêmes règles que le JS
 * (src/services/watchAutoSync.js) : 30 min au moins entre deux essais, doublées à chaque échec (4 h au plus),
 * pause définitive après une clé refusée (jamais de réappairage en arrière-plan), une seule liaison à la fois
 * (LinkLock, partagé avec la page).
 * Fenêtre de lecture identique à `syncWindow` (src/devices/huawei/sync.js) ; la reprise est recopiée par le JS
 * après chaque synchro. Sans dépendance Android (testé sur la JVM) ; ne lève jamais.
 */
public final class BackgroundSync {

    public static final long MIN_INTERVAL_MS = 30 * 60_000L;
    static final int MAX_BACKOFF_STEPS = 3;
    static final long HOUR = 3_600_000L;
    static final long OVERLAP_MS = 6 * HOUR;
    static final int MAX_DAYS = 30;

    /** Ce qui réveille la relecture (§9.1 f) : reconnexion signalée, déverrouillage, filet périodique. */
    public static final String TRIGGER_PRESENCE = "presence";
    public static final String TRIGGER_UNLOCK = "unlock";
    public static final String TRIGGER_PERIODIC = "periodic";
    /** Présence de la montre d'après le dernier événement du service compagnon. */
    public static final int ABSENT = 0;
    public static final int PRESENT = 1;
    public static final int UNKNOWN = -1;

    /** Ouvre la connexion à la montre (RFCOMM dans l'app). */
    public interface Opener {
        WatchLink.Transport open() throws IOException;
    }

    /** Dépôt des captures (CaptureInbox dans l'app). */
    public interface Sink {
        String put(String json, long atMs) throws IOException;
    }

    /** État gardé entre deux essais (préférences privées dans l'app). */
    public static final class State {
        /** Fin de la dernière période vraiment reçue (ms), 0 = jamais : première synchro. */
        public long lastUntil;
        /** Dernier essai (JS ou natif), dernière réussite native. */
        public long lastAttemptAt;
        public long lastSuccessAt;
        public int failures;
        public boolean paused;
        /** Issue du dernier essai natif : connected, key_rejected, unreachable, no_key, failed. */
        public String outcome;
        public int battery = -1;
        /** Dernière lecture des fichiers 0x2C (ms, recopiée du JS ; 0 = jamais lu : le fichier n'est pas demandé). */
        public long sleepFileUntil;
        public long stressFileUntil;
        /** Sommeil détaillé lu depuis le coucher (capacité 199, recopié du JS). */
        public boolean bedTime = true;
        /** Dernier instant lu par classe du dictionnaire (ms, recopié du JS ; 0 = jamais lu : la classe n'est pas demandée). */
        public long hrvDayUntil;
        public long skinTempUntil;
        /** Séances déjà lues une fois par l'app (service 0x17 pris en charge, recopié du JS) : relues aussi (M7b). */
        public boolean workouts;
    }

    private BackgroundSync() {
    }

    /** { since, until } comme `syncWindow` : heure pleine, 6 h relues, 30 jours au plus, tout l'historique la 1re fois. */
    public static long[] window(long lastUntil, long nowMs) {
        long until = Math.floorDiv(nowMs, HOUR) * HOUR;
        if (lastUntil <= 0) return new long[] {WatchReader.MIN_START_SEC * 1000L, until};
        return new long[] {Math.max(until - MAX_DAYS * 24 * HOUR, Math.min(lastUntil, until) - OVERLAP_MS), until};
    }

    /**
     * Fichiers 0x2C à relire (M6) : seulement ceux que le JS a déjà lus une fois (la montre les prend en charge et le
     * rattrapage de 60 jours est fait app ouverte), depuis la veille de leur dernière lecture, comme sleepFileSince.
     */
    public static List<WatchReader.FileRequest> fileRequests(State s, long sinceMs) {
        List<WatchReader.FileRequest> files = new ArrayList<>();
        if (s.sleepFileUntil > 0) files.add(WatchReader.FileRequest.sleep(Math.min(sinceMs, s.sleepFileUntil) - 24 * HOUR));
        if (s.stressFileUntil > 0) files.add(WatchReader.FileRequest.stress(Math.min(sinceMs, s.stressFileUntil) - 24 * HOUR));
        return files;
    }

    /**
     * Classes du dictionnaire à relire (M6b) : seulement celles dont le JS a déjà reçu des mesures (la montre les prend
     * en charge, l'historique est rattrapé app ouverte), 1 s après le dernier instant lu, comme classSince (p2p.js).
     */
    public static List<WatchP2P.Request> dictionaryRequests(State s) {
        List<WatchP2P.Request> classes = new ArrayList<>();
        if (s.hrvDayUntil > 0) classes.add(WatchP2P.Request.hrvDay(s.hrvDayUntil + WatchP2P.NEXT_PAGE_GAP_MS));
        if (s.skinTempUntil > 0) classes.add(WatchP2P.Request.skinTemp(s.skinTempUntil + WatchP2P.NEXT_PAGE_GAP_MS));
        return classes;
    }

    /** Délai minimum après le dernier essai : 30 min × 2^échecs (3 doublements au plus). */
    public static long interval(State s) {
        return MIN_INTERVAL_MS << Math.min(Math.max(s.failures, 0), MAX_BACKOFF_STEPS);
    }

    /**
     * Même décision selon le déclencheur : au déverrouillage et au filet périodique, une montre que le service
     * compagnon sait partie n'est pas tentée (« absent » : ni connexion de 15 s, ni échec compté). La reconnexion
     * signalée prouve la présence ; sans appareil compagnon (inconnue), on essaie.
     */
    public static String decide(String trigger, State s, long nowMs, boolean appForeground, boolean busy,
                                boolean hasKey, int presence) {
        String d = decide(s, nowMs, appForeground, busy, hasKey);
        if ("run".equals(d) && !TRIGGER_PRESENCE.equals(trigger) && presence == ABSENT) return "absent";
        return d;
    }

    /** Dernier événement de présence (« appeared » / « disappeared ») → PRESENT / ABSENT / UNKNOWN. */
    public static int presenceOf(String lastEvent) {
        if ("appeared".equals(lastEvent)) return PRESENT;
        if ("disappeared".equals(lastEvent)) return ABSENT;
        return UNKNOWN;
    }

    /**
     * « run » s'il faut relire maintenant, sinon la raison : app (l'app est à l'écran, le JS s'en charge), busy
     * (la liaison est déjà prise, par la page ou par une relecture native : LinkLock), paused, no_key, recent.
     * App en arrière-plan mais pas tuée (§9.1 g) : `appForeground` faux, la relecture native passe.
     */
    public static String decide(State s, long nowMs, boolean appForeground, boolean busy, boolean hasKey) {
        if (appForeground) return "app";
        if (busy) return "busy";
        if (s.paused) return "paused";
        if (!hasKey) return "no_key";
        if (nowMs - Math.max(s.lastAttemptAt, s.lastSuccessAt) < interval(s)) return "recent";
        return "run";
    }

    /** Reprise partagée par le JS après une synchro qu'il a faite (ou importée) : elle vaut essai réussi. */
    public static void shareFromApp(State s, long until, long atMs) {
        shareFromApp(s, until, atMs, 0, 0, s.bedTime);
    }

    /** Idem, avec la dernière lecture des fichiers 0x2C et le mode de lecture du sommeil détaillé. */
    public static void shareFromApp(State s, long until, long atMs, long sleepFileUntil, long stressFileUntil, boolean bedTime) {
        shareFromApp(s, until, atMs, sleepFileUntil, stressFileUntil, bedTime, 0, 0);
    }

    /** Idem, avec le dernier instant lu des classes du dictionnaire (VFC de journée, température). */
    public static void shareFromApp(State s, long until, long atMs, long sleepFileUntil, long stressFileUntil, boolean bedTime,
                                    long hrvDayUntil, long skinTempUntil) {
        shareFromApp(s, until, atMs, sleepFileUntil, stressFileUntil, bedTime, hrvDayUntil, skinTempUntil, false);
    }

    /** Idem, avec les séances : une fois lues par l'app, elles le restent en arrière-plan. */
    public static void shareFromApp(State s, long until, long atMs, long sleepFileUntil, long stressFileUntil, boolean bedTime,
                                    long hrvDayUntil, long skinTempUntil, boolean workouts) {
        if (workouts) s.workouts = true;
        if (hrvDayUntil > s.hrvDayUntil) s.hrvDayUntil = hrvDayUntil;
        if (skinTempUntil > s.skinTempUntil) s.skinTempUntil = skinTempUntil;
        if (sleepFileUntil > s.sleepFileUntil) s.sleepFileUntil = sleepFileUntil;
        if (stressFileUntil > s.stressFileUntil) s.stressFileUntil = stressFileUntil;
        s.bedTime = bedTime;
        if (until > s.lastUntil) s.lastUntil = until;
        if (atMs > s.lastAttemptAt) s.lastAttemptAt = atMs;
        s.failures = 0;
        s.paused = false;
    }

    /** Résultat d'une relecture : issue, capture déposée (nom) ou null. */
    public static final class Result {
        public final String outcome;
        public final String captureName;

        Result(String outcome, String captureName) {
            this.outcome = outcome;
            this.captureName = captureName;
        }
    }

    static String outcomeOf(Exception e) {
        if (e instanceof IsoAuth.AuthException) return "key_rejected".equals(((IsoAuth.AuthException) e).code) ? "key_rejected" : "failed";
        return "failed";
    }

    /** Fichier lu (même vide) : la prochaine relecture repart de là, comme writeWatchData. */
    static void recordFiles(State s, WatchReader.Capture cap, long until) {
        if (fileRead(cap, "sleepFile")) s.sleepFileUntil = Math.max(s.sleepFileUntil, until);
        if (fileRead(cap, "stress")) s.stressFileUntil = Math.max(s.stressFileUntil, until);
    }

    /** Classe du dictionnaire lue : la prochaine relecture repart après son dernier instant. */
    static void recordDictionary(State s, WatchReader.Capture cap) {
        for (WatchP2P.Pages d : cap.dictionary) {
            if (d.cls == WatchP2P.HRV_DAY) s.hrvDayUntil = Math.max(s.hrvDayUntil, d.maxTime);
            else if (d.cls == WatchP2P.SKIN_TEMP) s.skinTempUntil = Math.max(s.skinTempUntil, d.maxTime);
        }
    }

    private static boolean fileRead(WatchReader.Capture cap, String id) {
        WatchReader.Read r = cap.read(id);
        return r != null && ("ok".equals(r.outcome) || "empty".equals(r.outcome));
    }

    /** Met l'état à jour après une relecture native. */
    static void record(State s, String outcome, long nowMs, long until, boolean gotBlocks, int battery) {
        s.outcome = outcome;
        s.lastAttemptAt = nowMs;
        if ("connected".equals(outcome)) {
            s.failures = 0;
            s.lastSuccessAt = nowMs;
            if (battery >= 0) s.battery = battery;
            // la reprise n'avance que si la montre a rendu quelque chose (comme writeWatchData)
            if (gotBlocks && until > s.lastUntil) s.lastUntil = until;
        } else if ("key_rejected".equals(outcome)) {
            s.paused = true;
        } else {
            s.failures++;
        }
    }

    /**
     * Relit la montre et dépose la capture. `authToken` / `authId` : clé du coffre ; `requestId` : identifiant
     * HiChain (l'heure en ms dans l'app). Met `state` à jour ; ne lève jamais. La connexion est toujours fermée.
     */
    public static Result run(State state, Opener opener, String address, String name, String authId, byte[] authToken,
                             Sink sink, long nowMs, long requestId, Random random, long timeoutMs) {
        if (authToken == null || authId == null) {
            state.outcome = "no_key";
            return new Result("no_key", null);
        }
        long[] w = window(state.lastUntil, nowMs);
        WatchLink.Transport transport;
        try {
            transport = opener.open();
        } catch (IOException | RuntimeException e) {
            record(state, "unreachable", nowMs, w[1], false, -1);
            return new Result("unreachable", null);
        }
        String outcome;
        String captureName = null;
        WatchReader.Capture cap = null;
        int battery = -1;
        try (WatchLink link = new WatchLink(transport)) {
            WatchHandshake.authenticate(link, authToken, authId, requestId, random, timeoutMs);
            battery = WatchHandshake.battery(link, timeoutMs);
            cap = WatchReader.read(link, w[0], w[1], nowMs, timeoutMs, fileRequests(state, w[0]), dictionaryRequests(state),
                    state.workouts);
            cap.battery = battery;
            cap.bedTime = state.bedTime;
            cap.address = address;
            cap.name = name;
            captureName = sink.put(cap.toJson(), nowMs);
            outcome = "connected";
        } catch (IOException | GeneralSecurityException | IsoAuth.AuthException | RuntimeException e) {
            outcome = outcomeOf(e);
        }
        record(state, outcome, nowMs, w[1], cap != null && captureName != null && cap.gotBlocks(), battery);
        if (cap != null && captureName != null) {
            recordFiles(state, cap, w[1]);
            recordDictionary(state, cap);
        }
        return new Result(outcome, captureName);
    }
}
