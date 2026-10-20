package com.healthtrack.app.update;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;

/**
 * Mise à jour en un clic (signalement du 20/10 19:05) : ce qui se teste sans Android. Traduction des états du
 * DownloadManager et vérification de l'APK téléchargé (taille annoncée par GitHub, empreinte SHA-256 « digest »
 * de l'asset de la release) avant d'ouvrir l'installateur.
 */
public final class UpdateFile {

    private UpdateFile() {}

    // Valeurs de android.app.DownloadManager.STATUS_* (constantes publiques, stables depuis l'API 9).
    public static final int DM_PENDING = 1;
    public static final int DM_RUNNING = 2;
    public static final int DM_PAUSED = 4;
    public static final int DM_SUCCESSFUL = 8;
    public static final int DM_FAILED = 16;

    public static final String SIZE_MISMATCH = "size_mismatch";
    public static final String SHA_MISMATCH = "sha_mismatch";
    public static final String EMPTY = "empty";

    /** État lisible côté JS : pending, running, paused, successful, failed, unknown. */
    public static String stateName(int dmStatus) {
        switch (dmStatus) {
            case DM_PENDING: return "pending";
            case DM_RUNNING: return "running";
            case DM_PAUSED: return "paused";
            case DM_SUCCESSFUL: return "successful";
            case DM_FAILED: return "failed";
            default: return "unknown";
        }
    }

    /** « sha256:abc… » (champ digest de l'API GitHub) → « abc… » en minuscules ; null si absent ou autre algo. */
    public static String expectedSha256(String digest) {
        if (digest == null) return null;
        String d = digest.trim().toLowerCase(Locale.ROOT);
        if (!d.startsWith("sha256:")) return null;
        String hex = d.substring(7);
        return hex.matches("[0-9a-f]{64}") ? hex : null;
    }

    public static String sha256Hex(InputStream in) throws IOException {
        MessageDigest md;
        try {
            md = MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new IOException(e);
        }
        byte[] buf = new byte[64 * 1024];
        int n;
        while ((n = in.read(buf)) > 0) md.update(buf, 0, n);
        StringBuilder sb = new StringBuilder();
        for (byte b : md.digest()) sb.append(String.format(Locale.ROOT, "%02x", b));
        return sb.toString();
    }

    /**
     * null si le fichier est bon ; sinon la raison. Une taille ou une empreinte attendue inconnue (≤ 0 ou null)
     * n'est pas vérifiée : l'installateur Android vérifie de toute façon la signature.
     */
    public static String verify(long actualSize, long expectedSize, String actualSha, String expectedSha) {
        if (actualSize <= 0) return EMPTY;
        if (expectedSize > 0 && actualSize != expectedSize) return SIZE_MISMATCH;
        if (expectedSha != null && actualSha != null && !expectedSha.equalsIgnoreCase(actualSha)) return SHA_MISMATCH;
        return null;
    }
}
