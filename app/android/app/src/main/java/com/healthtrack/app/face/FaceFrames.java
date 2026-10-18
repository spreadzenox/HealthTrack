package com.healthtrack.app.face;

/**
 * Image de la caméra → pixels RVB à l'endroit (journal/protocoles/visage.md §8). La caméra frontale livre du
 * YUV 4:2:0 (plan Y plein, plans U et V sous-échantillonnés, avec pas de ligne et pas de pixel propres au
 * téléphone) dans le sens du capteur ; on convertit en 0xRRGGBB (BT.601 plein écart, celui des caméras
 * Android) en tournant dans le même passage. Rien n'est gardé : l'appelant jette le résultat après l'inférence.
 */
public final class FaceFrames {

    /** Pixels 0xRRGGBB d'une image à l'endroit. */
    public static final class Rgb {
        public final int[] pixels;
        public final int width;
        public final int height;

        Rgb(int[] pixels, int width, int height) {
            this.pixels = pixels;
            this.width = width;
            this.height = height;
        }
    }

    private FaceFrames() {}

    /**
     * Convertit une image YUV_420_888 de width × height (sens du capteur), tournée de rotation degrés dans le
     * sens horaire (0, 90, 180 ou 270 : orientation du capteur + rotation de l'écran pour la caméra frontale).
     */
    public static Rgb fromYuv420(byte[] y, int yRowStride, byte[] u, byte[] v, int uvRowStride, int uvPixelStride,
                                 int width, int height, int rotation) {
        int r = ((rotation % 360) + 360) % 360;
        if (r % 90 != 0) throw new IllegalArgumentException("rotation " + rotation);
        boolean swap = r == 90 || r == 270;
        int outW = swap ? height : width;
        int outH = swap ? width : height;
        int[] out = new int[width * height];
        for (int row = 0; row < height; row++) {
            int yBase = row * yRowStride;
            int uvBase = (row >> 1) * uvRowStride;
            for (int col = 0; col < width; col++) {
                int lum = y[yBase + col] & 0xff;
                int uvIndex = uvBase + (col >> 1) * uvPixelStride;
                int cb = (u[uvIndex] & 0xff) - 128;
                int cr = (v[uvIndex] & 0xff) - 128;
                int red = clamp(lum + (int) Math.round(1.402 * cr));
                int green = clamp(lum - (int) Math.round(0.344136 * cb + 0.714136 * cr));
                int blue = clamp(lum + (int) Math.round(1.772 * cb));
                int dx, dy;
                switch (r) {
                    case 90: dx = height - 1 - row; dy = col; break;
                    case 180: dx = width - 1 - col; dy = height - 1 - row; break;
                    case 270: dx = row; dy = width - 1 - col; break;
                    default: dx = col; dy = row;
                }
                out[dy * outW + dx] = (red << 16) | (green << 8) | blue;
            }
        }
        return new Rgb(out, outW, outH);
    }

    /** Rotation à appliquer à une image de la caméra frontale : capteur + écran (degrés, sens horaire). */
    public static int frontRotation(int sensorOrientation, int displayRotationDegrees) {
        return ((sensorOrientation + displayRotationDegrees) % 360 + 360) % 360;
    }

    private static int clamp(int c) {
        return c < 0 ? 0 : Math.min(c, 255);
    }
}
