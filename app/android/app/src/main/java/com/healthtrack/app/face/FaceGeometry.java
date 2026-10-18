package com.healthtrack.app.face;

/**
 * Géométrie du pipeline visage (D4, I100 ①), écrite depuis journal/protocoles/visage.md §2–§4 :
 * ancres et décodage du détecteur, fusion pondérée, rectangle du visage (ROI), recadrage bilinéaire,
 * retour des 478 points dans l'image et choix des 146 points des blendshapes. Sans dépendance Android
 * (testé sur la JVM) ; l'image n'est jamais copiée ni gardée, seul le tenseur demandé est produit.
 */
public final class FaceGeometry {

    public static final int ANCHORS = 896;
    public static final int DETECTOR_SIZE = 128;
    public static final int LANDMARK_SIZE = 256;
    public static final int POINTS = 478;
    static final double MIN_SCORE = 0.5;
    static final double NMS_IOU = 0.3;
    static final double ROI_SCALE = 1.5;

    /** Les 146 points lus par le modèle de blendshapes (visage.md §4.1), dans cet ordre. */
    static final int[] SUBSET = {
        0, 1, 4, 5, 6, 7, 8, 10, 13, 14, 17, 21, 33, 37, 39, 40, 46, 52, 53, 54, 55, 58, 61, 63, 65, 66, 67, 70, 78, 80,
        81, 82, 84, 87, 88, 91, 93, 95, 103, 105, 107, 109, 127, 132, 133, 136, 144, 145, 146, 148, 149, 150, 152, 153,
        154, 155, 157, 158, 159, 160, 161, 162, 163, 168, 172, 173, 176, 178, 181, 185, 191, 195, 197, 234, 246, 249, 251,
        263, 267, 269, 270, 276, 282, 283, 284, 285, 288, 291, 293, 295, 296, 297, 300, 308, 310, 311, 312, 314, 317, 318,
        321, 323, 324, 332, 334, 336, 338, 356, 361, 362, 365, 373, 374, 375, 377, 378, 379, 380, 381, 382, 384, 385, 386,
        387, 388, 389, 390, 397, 398, 400, 402, 405, 409, 415, 454, 466, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477,
    };

    private static final double[] ANCHOR_XY = buildAnchors();

    private FaceGeometry() {}

    /** Un visage trouvé par le détecteur, en pixels de l'image ; keypoints = 6 × (x, y), k0 / k1 = les yeux. */
    public static final class Detection {
        public final double score;
        public final int boxes;
        public final double cx, cy, w, h;
        public final double[] keypoints;

        Detection(double score, int boxes, double cx, double cy, double w, double h, double[] keypoints) {
            this.score = score;
            this.boxes = boxes;
            this.cx = cx;
            this.cy = cy;
            this.w = w;
            this.h = h;
            this.keypoints = keypoints;
        }
    }

    /** Carré tourné à recadrer : centre et côté en pixels de l'image, rotation en radians. */
    public static final class Roi {
        public final double cx, cy, side, rot;

        public Roi(double cx, double cy, double side, double rot) {
            this.cx = cx;
            this.cy = cy;
            this.side = side;
            this.rot = rot;
        }
    }

    /** Ancres du détecteur « courte portée » : (x, y) normalisés, 896 × 2 (visage.md §2.2). */
    static double[] anchors() {
        return ANCHOR_XY.clone();
    }

    private static double[] buildAnchors() {
        double[] out = new double[ANCHORS * 2];
        int k = 0;
        int[][] layers = {{16, 2}, {8, 6}};
        for (int[] layer : layers) {
            int grid = layer[0];
            for (int y = 0; y < grid; y++) {
                for (int x = 0; x < grid; x++) {
                    for (int a = 0; a < layer[1]; a++) {
                        out[k++] = (x + 0.5) / grid;
                        out[k++] = (y + 0.5) / grid;
                    }
                }
            }
        }
        return out;
    }

    /** Carré centré qui contient toute l'image (bandes noires) : l'entrée du détecteur. */
    public static Roi letterbox(int width, int height) {
        return new Roi(width / 2.0, height / 2.0, Math.max(width, height), 0);
    }

    /**
     * Décode les sorties du détecteur (regressors 896 × 16, logits 896) et fusionne les boîtes qui se
     * recouvrent (moyenne pondérée par le score). Rend le plus grand visage, ou null si aucun.
     */
    public static Detection decode(float[] regressors, float[] logits, int width, int height) {
        int n = 0;
        int[] order = new int[ANCHORS];
        double[] score = new double[ANCHORS];
        for (int i = 0; i < ANCHORS; i++) {
            double logit = Math.max(-100, Math.min(100, logits[i]));
            score[i] = 1 / (1 + Math.exp(-logit));
            if (score[i] >= MIN_SCORE) order[n++] = i;
        }
        if (n == 0) return null;
        Integer[] sorted = new Integer[n];
        for (int i = 0; i < n; i++) sorted[i] = order[i];
        java.util.Arrays.sort(sorted, (a, b) -> Double.compare(score[b], score[a]));

        double[][] boxes = new double[ANCHORS][];
        for (Integer i : sorted) boxes[i] = box(regressors, i);

        boolean[] used = new boolean[ANCHORS];
        Detection best = null;
        double bestArea = -1;
        for (Integer top : sorted) {
            if (used[top]) continue;
            double[] sum = new double[16];
            double weight = 0;
            int count = 0;
            for (Integer j : sorted) {
                if (used[j] || iou(boxes[top], boxes[j]) <= NMS_IOU) continue;
                used[j] = true;
                count++;
                weight += score[j];
                for (int k = 0; k < 16; k++) sum[k] += boxes[j][k] * score[j];
            }
            for (int k = 0; k < 16; k++) sum[k] /= weight;
            double area = sum[2] * sum[3];
            if (area > bestArea) {
                bestArea = area;
                best = toPixels(sum, score[top], count, width, height);
            }
        }
        return best;
    }

    private static double[] box(float[] reg, int i) {
        double ax = ANCHOR_XY[2 * i], ay = ANCHOR_XY[2 * i + 1];
        double[] b = new double[16];
        int o = i * 16;
        b[0] = reg[o] / 128.0 + ax;
        b[1] = reg[o + 1] / 128.0 + ay;
        b[2] = reg[o + 2] / 128.0;
        b[3] = reg[o + 3] / 128.0;
        for (int k = 4; k < 16; k++) b[k] = reg[o + k] / 128.0 + (k % 2 == 0 ? ax : ay);
        return b;
    }

    private static double iou(double[] p, double[] q) {
        double ix = Math.max(0, Math.min(p[0] + p[2] / 2, q[0] + q[2] / 2) - Math.max(p[0] - p[2] / 2, q[0] - q[2] / 2));
        double iy = Math.max(0, Math.min(p[1] + p[3] / 2, q[1] + q[3] / 2) - Math.max(p[1] - p[3] / 2, q[1] - q[3] / 2));
        double inter = ix * iy;
        double union = p[2] * p[3] + q[2] * q[3] - inter;
        return union > 0 ? inter / union : 0;
    }

    private static Detection toPixels(double[] b, double score, int count, int width, int height) {
        double side = Math.max(width, height);
        double ox = (side - width) / 2, oy = (side - height) / 2;
        double[] kp = new double[12];
        for (int k = 0; k < 12; k++) kp[k] = b[4 + k] * side - (k % 2 == 0 ? ox : oy);
        return new Detection(score, count, b[0] * side - ox, b[1] * side - oy, b[2] * side, b[3] * side, kp);
    }

    /** ROI d'après le détecteur : centre de la boîte, angle des yeux, côté = max(w, h) × 1,5 (§3.1). */
    public static Roi roiFromDetection(Detection d) {
        double[] k = d.keypoints;
        return roi(d.cx, d.cy, d.w, d.h, k[0], k[1], k[2], k[3]);
    }

    /** ROI de l'image suivante d'une rafale, d'après les 478 points (x, y, z) de la précédente (§3.4). */
    public static Roi roiFromPoints(double[] pts) {
        double minX = Double.MAX_VALUE, minY = Double.MAX_VALUE, maxX = -Double.MAX_VALUE, maxY = -Double.MAX_VALUE;
        for (int i = 0; i < POINTS; i++) {
            minX = Math.min(minX, pts[3 * i]);
            maxX = Math.max(maxX, pts[3 * i]);
            minY = Math.min(minY, pts[3 * i + 1]);
            maxY = Math.max(maxY, pts[3 * i + 1]);
        }
        return roi((minX + maxX) / 2, (minY + maxY) / 2, maxX - minX, maxY - minY,
            pts[3 * 33], pts[3 * 33 + 1], pts[3 * 263], pts[3 * 263 + 1]);
    }

    private static Roi roi(double cx, double cy, double w, double h, double x0, double y0, double x1, double y1) {
        double rot = Math.atan2(y1 - y0, x1 - x0);
        return new Roi(cx, cy, Math.max(w, h) * ROI_SCALE, rot);
    }

    /**
     * Recadre le carré tourné vers size × size (RVB, NHWC), valeurs ramenées dans [lo, hi]. Le pixel de sortie
     * (i, j) lit l'image en centre + R · (((i + 0,5) / size − 0,5) × côté, …), bilinéaire, extérieur noir.
     * rgb = pixels 0xRRGGBB ligne par ligne (l'alpha est ignoré).
     */
    public static float[] crop(int[] rgb, int width, int height, Roi roi, int size, float lo, float hi) {
        float[] out = new float[size * size * 3];
        double c = Math.cos(roi.rot), s = Math.sin(roi.rot);
        double scale = (hi - lo) / 255.0;
        double[] px = new double[3];
        int o = 0;
        for (int j = 0; j < size; j++) {
            double v = ((j + 0.5) / size - 0.5) * roi.side;
            for (int i = 0; i < size; i++) {
                double u = ((i + 0.5) / size - 0.5) * roi.side;
                sample(rgb, width, height, roi.cx + c * u - s * v - 0.5, roi.cy + s * u + c * v - 0.5, px);
                out[o++] = (float) (px[0] * scale + lo);
                out[o++] = (float) (px[1] * scale + lo);
                out[o++] = (float) (px[2] * scale + lo);
            }
        }
        return out;
    }

    private static void sample(int[] rgb, int width, int height, double x, double y, double[] out) {
        int x0 = (int) Math.floor(x), y0 = (int) Math.floor(y);
        double fx = x - x0, fy = y - y0;
        out[0] = out[1] = out[2] = 0;
        add(rgb, width, height, x0, y0, (1 - fx) * (1 - fy), out);
        add(rgb, width, height, x0 + 1, y0, fx * (1 - fy), out);
        add(rgb, width, height, x0, y0 + 1, (1 - fx) * fy, out);
        add(rgb, width, height, x0 + 1, y0 + 1, fx * fy, out);
    }

    private static void add(int[] rgb, int width, int height, int x, int y, double w, double[] out) {
        if (x < 0 || y < 0 || x >= width || y >= height || w == 0) return;
        int p = rgb[y * width + x];
        out[0] += ((p >> 16) & 0xff) * w;
        out[1] += ((p >> 8) & 0xff) * w;
        out[2] += (p & 0xff) * w;
    }

    /** Sortie du maillage (478 × 3, pixels du recadrage 256) → points (x, y, z) en pixels de l'image (§3.3). */
    public static double[] toImage(float[] raw, Roi roi) {
        double[] pts = new double[POINTS * 3];
        double c = Math.cos(roi.rot), s = Math.sin(roi.rot);
        for (int i = 0; i < POINTS; i++) {
            double dx = (raw[3 * i] / (double) LANDMARK_SIZE - 0.5) * roi.side;
            double dy = (raw[3 * i + 1] / (double) LANDMARK_SIZE - 0.5) * roi.side;
            pts[3 * i] = roi.cx + c * dx - s * dy;
            pts[3 * i + 1] = roi.cy + s * dx + c * dy;
            pts[3 * i + 2] = raw[3 * i + 2] / (double) LANDMARK_SIZE * roi.side;
        }
        return pts;
    }

    /** Entrée du modèle de blendshapes : (x, y) en pixels des 146 points (§4.2, jamais normalisés par axe). */
    public static float[] blendshapeInput(double[] pts) {
        float[] out = new float[SUBSET.length * 2];
        for (int k = 0; k < SUBSET.length; k++) {
            out[2 * k] = (float) pts[3 * SUBSET[k]];
            out[2 * k + 1] = (float) pts[3 * SUBSET[k] + 1];
        }
        return out;
    }

    /** Côté du visage en pixels (plus grand côté de la boîte englobante des points). */
    public static double faceSize(double[] pts) {
        double minX = Double.MAX_VALUE, minY = Double.MAX_VALUE, maxX = -Double.MAX_VALUE, maxY = -Double.MAX_VALUE;
        for (int i = 0; i < 468; i++) {
            minX = Math.min(minX, pts[3 * i]);
            maxX = Math.max(maxX, pts[3 * i]);
            minY = Math.min(minY, pts[3 * i + 1]);
            maxY = Math.max(maxY, pts[3 * i + 1]);
        }
        return Math.max(maxX - minX, maxY - minY);
    }

    /**
     * Lacet approché (degrés) : angle de la droite joue gauche (234) → joue droite (454) dans le plan (x, z),
     * une fois la rotation dans le plan de l'image retirée. 0 = de face ; le signe dit le côté.
     */
    public static double yawDegrees(double[] pts) {
        double rot = Math.atan2(pts[3 * 263 + 1] - pts[3 * 33 + 1], pts[3 * 263] - pts[3 * 33]);
        double dx = pts[3 * 454] - pts[3 * 234], dy = pts[3 * 454 + 1] - pts[3 * 234 + 1];
        double along = dx * Math.cos(rot) + dy * Math.sin(rot);
        double dz = pts[3 * 454 + 2] - pts[3 * 234 + 2];
        return Math.toDegrees(Math.atan2(dz, along));
    }
}
