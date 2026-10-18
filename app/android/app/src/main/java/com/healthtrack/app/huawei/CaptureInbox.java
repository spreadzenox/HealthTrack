package com.healthtrack.app.huawei;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Boîte de dépôt des captures du client Java « synchro seule » (journal/protocoles/huawei.md §9.1 d) : un fichier
 * JSON par synchro en arrière-plan, dans le stockage privé de l'app, en attendant que le JS les importe à
 * l'ouverture puis les retire. Écriture atomique (fichier temporaire puis renommage) ; au plus MAX fichiers
 * gardés (les plus anciens partent : la synchro en direct relira de toute façon depuis la dernière reprise).
 * Ne lit ni n'efface jamais un fichier qui n'a pas le nom d'une capture.
 */
public final class CaptureInbox {

    public static final int MAX = 48;
    private static final Pattern NAME = Pattern.compile("capture-\\d{13}-\\d{3}\\.json");

    private final File dir;
    private final int max;

    public CaptureInbox(File dir) {
        this(dir, MAX);
    }

    /** Boîte gardant au plus max fichiers (rafales du visage : bien plus nombreuses que les synchros de la montre). */
    public CaptureInbox(File dir, int max) {
        this.dir = dir;
        this.max = max;
    }

    /** Une capture en attente : nom du fichier et JSON. */
    public static final class Item {
        public final String name;
        public final String json;

        Item(String name, String json) {
            this.name = name;
            this.json = json;
        }
    }

    public static boolean isCaptureName(String name) {
        return name != null && NAME.matcher(name).matches();
    }

    private String[] names() {
        String[] all = dir.list((d, n) -> isCaptureName(n));
        if (all == null) return new String[0];
        Arrays.sort(all);
        return all;
    }

    /** Dépose une capture ; rend le nom du fichier. */
    public synchronized String put(String json, long atMs) throws IOException {
        if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("Dossier des captures non créé");
        String name = null;
        for (int n = 0; n < 1000 && name == null; n++) {
            String candidate = String.format(Locale.ROOT, "capture-%013d-%03d.json", Math.max(0, atMs), n);
            if (!new File(dir, candidate).exists()) name = candidate;
        }
        if (name == null) throw new IOException("Trop de captures à la même milliseconde");
        File tmp = new File(dir, name + ".tmp");
        try (FileOutputStream out = new FileOutputStream(tmp)) {
            out.write(json.getBytes(StandardCharsets.UTF_8));
            out.getFD().sync();
        }
        if (!tmp.renameTo(new File(dir, name))) {
            tmp.delete();
            throw new IOException("Capture non enregistrée");
        }
        String[] all = names();
        for (int i = 0; i < all.length - max; i++) new File(dir, all[i]).delete();
        return name;
    }

    /** Nombre de captures en attente (sans les lire). */
    public synchronized int count() {
        return names().length;
    }

    /** Captures en attente, de la plus ancienne à la plus récente (illisibles sautées). */
    public synchronized List<Item> list() {
        List<Item> out = new ArrayList<>();
        for (String n : names()) {
            try {
                out.add(new Item(n, new String(Files.readAllBytes(new File(dir, n).toPath()), StandardCharsets.UTF_8)));
            } catch (IOException ignored) {
                // fichier disparu entre-temps
            }
        }
        return out;
    }

    /** Retire les captures importées ; rend le nombre de fichiers effacés. */
    public synchronized int remove(List<String> names) {
        int removed = 0;
        for (String n : names) if (isCaptureName(n) && new File(dir, n).delete()) removed++;
        return removed;
    }
}
