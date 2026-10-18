package com.healthtrack.app.face;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Ce que HealthTrack garde d'une image puis d'une rafale (journal/protocoles/visage.md §5–§6) : une dizaine
 * d'indices nommés par unités d'action, le contrôle qualité avant tout calcul, et la médiane d'une rafale.
 * Aucun indice n'est codé « bon » ou « mauvais » (D6) : le sens vient plus tard, de l'écart à la plage
 * personnelle et de la calibration sur les notes de l'utilisateur. Ni image ni points ne sortent d'ici.
 */
public final class FaceIndices {

    public static final int BLENDSHAPES = 52;

    // Positions dans les 52 sorties du modèle de blendshapes (visage.md §4.3).
    static final int BROW_DOWN_L = 1, BROW_DOWN_R = 2, BROW_INNER_UP = 3;
    static final int CHEEK_SQUINT_L = 7, CHEEK_SQUINT_R = 8;
    static final int EYE_BLINK_L = 9, EYE_BLINK_R = 10;
    static final int JAW_OPEN = 25;
    static final int MOUTH_FROWN_L = 30, MOUTH_FROWN_R = 31;
    static final int MOUTH_SMILE_L = 44, MOUTH_SMILE_R = 45;

    /** Indices gardés par image, dans l'ordre d'export. */
    public static final String[] NAMES = {
        "smile", "duchenne", "browDown", "browInnerUp", "mouthFrown", "eyeOpen", "jawOpen", "asymmetry", "yaw",
    };

    // Contrôle qualité (§6).
    static final double MIN_PRESENCE = 0.9;
    static final double MIN_FACE_PX = 80;
    static final double MAX_YAW_DEG = 30;
    static final double MIN_LUMINANCE = 0.15;
    static final double MAX_LUMINANCE = 0.9;
    static final double MAX_JAW_OPEN = 0.5;

    /** Raisons de rejet d'une image, comptées dans le diagnostic. */
    public static final String NO_FACE = "no_face";
    public static final String LOW_PRESENCE = "low_presence";
    public static final String TOO_SMALL = "too_small";
    public static final String TURNED = "turned";
    public static final String TOO_DARK = "too_dark";
    public static final String TOO_BRIGHT = "too_bright";
    public static final String TALKING = "talking";

    private FaceIndices() {}

    /** Les indices d'une image, d'après ses 52 coefficients et son lacet (degrés). */
    public static Map<String, Double> fromBlendshapes(float[] bs, double yawDeg) {
        double smile = mean(bs[MOUTH_SMILE_L], bs[MOUTH_SMILE_R]);
        Map<String, Double> out = new LinkedHashMap<>();
        out.put("smile", smile);
        out.put("duchenne", Math.min(smile, mean(bs[CHEEK_SQUINT_L], bs[CHEEK_SQUINT_R])));
        out.put("browDown", mean(bs[BROW_DOWN_L], bs[BROW_DOWN_R]));
        out.put("browInnerUp", (double) bs[BROW_INNER_UP]);
        out.put("mouthFrown", mean(bs[MOUTH_FROWN_L], bs[MOUTH_FROWN_R]));
        out.put("eyeOpen", 1 - mean(bs[EYE_BLINK_L], bs[EYE_BLINK_R]));
        out.put("jawOpen", (double) bs[JAW_OPEN]);
        out.put("asymmetry", (double) Math.abs(bs[MOUTH_SMILE_L] - bs[MOUTH_SMILE_R]));
        out.put("yaw", yawDeg);
        return out;
    }

    private static double mean(float a, float b) {
        return (a + b) / 2.0;
    }

    /** Luminance moyenne (Rec. 601) d'un tenseur RVB dont les valeurs sont dans [0, 1]. */
    public static double luminance(float[] rgb01) {
        double sum = 0;
        int n = rgb01.length / 3;
        for (int i = 0; i < n; i++) {
            sum += 0.299 * rgb01[3 * i] + 0.587 * rgb01[3 * i + 1] + 0.114 * rgb01[3 * i + 2];
        }
        return n > 0 ? sum / n : 0;
    }

    /** Raison de rejet avant le calcul des blendshapes (§6), ou null si l'image est exploitable. */
    public static String rejectBeforeBlendshapes(double presence, double facePx, double yawDeg, double luminance) {
        if (presence < MIN_PRESENCE) return LOW_PRESENCE;
        if (facePx < MIN_FACE_PX) return TOO_SMALL;
        if (Math.abs(yawDeg) > MAX_YAW_DEG) return TURNED;
        if (luminance < MIN_LUMINANCE) return TOO_DARK;
        if (luminance > MAX_LUMINANCE) return TOO_BRIGHT;
        return null;
    }

    /** Raison de rejet après les blendshapes (bouche ouverte : parole ou bâillement), ou null. */
    public static String rejectAfterBlendshapes(float[] bs) {
        return bs[JAW_OPEN] > MAX_JAW_OPEN ? TALKING : null;
    }

    /** Résultat d'une rafale : médiane de chaque indice sur les images valides, plus n et la mobilité. */
    public static final class Burst {
        public final Map<String, Double> values;
        public final int valid;
        public final int frames;

        Burst(Map<String, Double> values, int valid, int frames) {
            this.values = values;
            this.valid = valid;
            this.frames = frames;
        }
    }

    /**
     * Agrège une rafale. indices / blendshapes = images valides seulement, dans l'ordre de capture ;
     * frames = nombre d'images prises. mobility = écart absolu moyen des 52 coefficients entre images
     * successives (absent sous 2 images valides). Rend null si aucune image valide.
     */
    public static Burst burst(List<Map<String, Double>> indices, List<float[]> blendshapes, int frames) {
        if (indices.isEmpty()) return null;
        Map<String, Double> out = new LinkedHashMap<>();
        for (String name : NAMES) {
            double[] v = new double[indices.size()];
            for (int i = 0; i < v.length; i++) v[i] = indices.get(i).get(name);
            out.put(name, median(v));
        }
        if (blendshapes.size() >= 2) {
            double sum = 0;
            for (int i = 1; i < blendshapes.size(); i++) {
                float[] a = blendshapes.get(i - 1), b = blendshapes.get(i);
                for (int k = 0; k < BLENDSHAPES; k++) sum += Math.abs(a[k] - b[k]);
            }
            out.put("mobility", sum / ((blendshapes.size() - 1) * (double) BLENDSHAPES));
        }
        return new Burst(out, indices.size(), frames);
    }

    static double median(double[] v) {
        double[] s = v.clone();
        Arrays.sort(s);
        int n = s.length;
        return n % 2 == 1 ? s[n / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
    }
}
