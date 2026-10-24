package com.healthtrack.app.face;

/**
 * Entrée et sortie du modèle valence / éveil (HSEmotion `enet_b0_8_va_mtl`, consigne du 19/10 au soir, étape 2 ;
 * choix et licence : journal/BIEN-ETRE-AUTO.md). Le visage est recadré d'après les 478 points du Face Landmarker :
 * carré aligné sur la ligne des yeux, côté = 1,1 × la boîte des points dans ce repère, 224 × 224, normalisation
 * ImageNet, ordre C × H × W. Sortie : 8 scores d'émotion puis valence et éveil, chacun dans [−1, 1] environ.
 * Second modèle du duo (I126) : HSEmotion `mbf_va_mtl` (MobileFaceNet), même recadrage et mêmes sorties, mais
 * 112 × 112 et normalisation (x − 0,5) / 0,5, comme dans EmotiEffLib.
 * Sans dépendance Android (testé sur la JVM, vecteurs de journal/protocoles/visage-va-vecteurs.py). Rien n'est gardé.
 */
public final class FaceAffect {

    public static final int SIZE = 224;
    public static final int OUTPUTS = 10;
    /**
     * Les 8 premiers scores, dans l'ordre d'AffectNet (colère, mépris, dégoût, peur, joie, neutre, tristesse,
     * surprise), clés des probabilités gardées dans la rafale (POL-2). Des estimations d'expression, jamais un état.
     */
    public static final String[] EXPRESSIONS = {
        "exAnger", "exContempt", "exDisgust", "exFear", "exHappiness", "exNeutral", "exSadness", "exSurprise",
    };
    static final double SCALE = 1.1;

    /** Taille et normalisation de l'entrée d'un modèle valence / éveil. */
    public static final class Spec {
        public final int size;
        final float[] mean;
        final float[] std;

        Spec(int size, float[] mean, float[] std) {
            this.size = size;
            this.mean = mean;
            this.std = std;
        }
    }

    /** EfficientNet-B0 (`enet_b0_8_va_mtl`) : 224 px, normalisation ImageNet. */
    public static final Spec B0 = new Spec(SIZE, new float[] {0.485f, 0.456f, 0.406f}, new float[] {0.229f, 0.224f, 0.225f});
    /** MobileFaceNet (`mbf_va_mtl`) : 112 px, (x − 0,5) / 0,5. */
    public static final Spec MBF = new Spec(112, new float[] {0.5f, 0.5f, 0.5f}, new float[] {0.5f, 0.5f, 0.5f});

    private FaceAffect() {}

    /** Carré à recadrer pour le modèle, d'après les 478 points dans l'image (x, y, z). */
    public static FaceGeometry.Roi roi(double[] pts) {
        double x0 = pts[3 * 33], y0 = pts[3 * 33 + 1], x1 = pts[3 * 263], y1 = pts[3 * 263 + 1];
        double rot = Math.atan2(y1 - y0, x1 - x0);
        double c = Math.cos(rot), s = Math.sin(rot);
        double minU = Double.MAX_VALUE, minV = Double.MAX_VALUE, maxU = -Double.MAX_VALUE, maxV = -Double.MAX_VALUE;
        for (int i = 0; i < FaceGeometry.POINTS; i++) {
            double x = pts[3 * i], y = pts[3 * i + 1];
            double u = c * x + s * y, v = -s * x + c * y;
            minU = Math.min(minU, u);
            maxU = Math.max(maxU, u);
            minV = Math.min(minV, v);
            maxV = Math.max(maxV, v);
        }
        double mu = (minU + maxU) / 2, mv = (minV + maxV) / 2;
        double side = Math.max(maxU - minU, maxV - minV) * SCALE;
        return new FaceGeometry.Roi(c * mu - s * mv, s * mu + c * mv, side, rot);
    }

    /** Tenseur d'entrée 1 × 3 × 224 × 224 (aplati) du visage de l'image RVB (0xRRGGBB), pour le modèle B0. */
    public static float[] input(int[] rgb, int width, int height, FaceGeometry.Roi roi) {
        return input(B0, rgb, width, height, roi);
    }

    /** Tenseur d'entrée 1 × 3 × taille × taille (aplati) du visage, selon le modèle. */
    public static float[] input(Spec spec, int[] rgb, int width, int height, FaceGeometry.Roi roi) {
        float[] hwc = FaceGeometry.crop(rgb, width, height, roi, spec.size, 0f, 1f);
        int plane = spec.size * spec.size;
        float[] chw = new float[3 * plane];
        for (int p = 0; p < plane; p++) {
            for (int k = 0; k < 3; k++) chw[k * plane + p] = (hwc[3 * p + k] - spec.mean[k]) / spec.std[k];
        }
        return chw;
    }

    /** { valence, éveil } bornés à [−1, 1], ou null si la sortie n'a pas la forme attendue. */
    public static double[] decode(float[] out) {
        if (out == null || out.length < OUTPUTS) return null;
        double v = out[OUTPUTS - 2], a = out[OUTPUTS - 1];
        if (Double.isNaN(v) || Double.isNaN(a) || Double.isInfinite(v) || Double.isInfinite(a)) return null;
        return new double[] {clamp(v), clamp(a)};
    }

    /** Probabilités des 8 expressions (softmax des scores), ou null si la sortie n'a pas la forme attendue. */
    public static double[] expressions(float[] out) {
        if (out == null || out.length < OUTPUTS) return null;
        int n = EXPRESSIONS.length;
        double max = Double.NEGATIVE_INFINITY;
        for (int i = 0; i < n; i++) {
            if (Float.isNaN(out[i]) || Float.isInfinite(out[i])) return null;
            max = Math.max(max, out[i]);
        }
        double[] p = new double[n];
        double sum = 0;
        for (int i = 0; i < n; i++) sum += p[i] = Math.exp(out[i] - max);
        for (int i = 0; i < n; i++) p[i] /= sum;
        return p;
    }

    private static double clamp(double x) {
        return Math.max(-1, Math.min(1, x));
    }
}
