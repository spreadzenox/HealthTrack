package com.healthtrack.app.face;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

/**
 * Ce que le service dépose pour une rafale (journal/protocoles/visage.md §5) : l'heure, le déclencheur, les
 * indices médians et leur nombre d'images, les rejets par raison et les temps. Jamais d'image ni de points.
 * Le JS l'importe à l'ouverture (entrée `face_burst`, I90). Format versionné (`v`).
 */
public final class FaceRecord {

    public static final int VERSION = 1;

    private FaceRecord() {}

    /**
     * @param burst      agrégat de la rafale, ou null si aucune image valide (les rejets sont alors gardés seuls)
     * @param rejections raisons de rejet, une par image rejetée
     */
    public static String json(long at, String trigger, int frames, FaceIndices.Burst burst, List<String> rejections,
                              long cameraMs, long inferenceMs) {
        StringBuilder sb = new StringBuilder(256);
        sb.append("{\"v\":").append(VERSION);
        sb.append(",\"at\":").append(at);
        sb.append(",\"trigger\":").append(quote(trigger));
        sb.append(",\"frames\":").append(frames);
        sb.append(",\"valid\":").append(burst == null ? 0 : burst.valid);
        if (burst != null) {
            sb.append(",\"values\":{");
            boolean first = true;
            for (Map.Entry<String, Double> e : burst.values.entrySet()) {
                Double val = e.getValue();
                if (val == null || val.isNaN() || val.isInfinite()) continue;
                if (!first) sb.append(',');
                first = false;
                sb.append(quote(e.getKey())).append(':').append(String.format(Locale.ROOT, "%.4f", val));
            }
            sb.append('}');
        }
        Map<String, Integer> counts = new TreeMap<>();
        if (rejections != null) for (String r : rejections) counts.merge(r, 1, Integer::sum);
        sb.append(",\"rejected\":{");
        boolean first = true;
        for (Map.Entry<String, Integer> e : counts.entrySet()) {
            if (!first) sb.append(',');
            first = false;
            sb.append(quote(e.getKey())).append(':').append(e.getValue());
        }
        sb.append('}');
        sb.append(",\"ms\":{\"camera\":").append(cameraMs).append(",\"inference\":").append(inferenceMs).append("}}");
        return sb.toString();
    }

    static String quote(String s) {
        if (s == null) return "null";
        StringBuilder sb = new StringBuilder(s.length() + 2).append('"');
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '"' || c == '\\') sb.append('\\').append(c);
            else if (c < 0x20) sb.append(String.format(Locale.ROOT, "\\u%04x", (int) c));
            else sb.append(c);
        }
        return sb.append('"').toString();
    }
}
