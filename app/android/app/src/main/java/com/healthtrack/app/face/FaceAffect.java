package com.healthtrack.app.face;

/**
 * Entrée et sortie du modèle valence / éveil (HSEmotion `enet_b0_8_va_mtl`, consigne du 19/10 au soir, étape 2 ;
 * choix et licence : journal/BIEN-ETRE-AUTO.md). Le visage est recadré d'après les 478 points du Face Landmarker :
 * carré aligné sur la ligne des yeux, côté = 1,1 × la boîte des points dans ce repère, 224 × 224, normalisation
 * ImageNet, ordre C × H × W. Sortie : 8 scores d'émotion puis valence et éveil, chacun dans [−1, 1] environ.
 * Sans dépendance Android (testé sur la JVM, vecteurs de journal/protocoles/visage-va-vecteurs.py). Rien n'est gardé.
 */
public final class FaceAffect {

    public static final int SIZE = 224;
    public static final int OUTPUTS = 10;
    static final double SCALE = 1.1;
    private static final float[] MEAN = {0.485f, 0.456f, 0.406f};
    private static final float[] STD = {0.229f, 0.224f, 0.225f};

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

    /** Tenseur d'entrée 1 × 3 × 224 × 224 (aplati) du visage de l'image RVB (0xRRGGBB). */
    public static float[] input(int[] rgb, int width, int height, FaceGeometry.Roi roi) {
        float[] hwc = FaceGeometry.crop(rgb, width, height, roi, SIZE, 0f, 1f);
        int plane = SIZE * SIZE;
        float[] chw = new float[3 * plane];
        for (int p = 0; p < plane; p++) {
            for (int k = 0; k < 3; k++) chw[k * plane + p] = (hwc[3 * p + k] - MEAN[k]) / STD[k];
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

    private static double clamp(double x) {
        return Math.max(-1, Math.min(1, x));
    }
}
