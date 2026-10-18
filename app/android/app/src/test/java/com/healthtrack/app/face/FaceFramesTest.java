package com.healthtrack.app.face;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;

import org.junit.Test;

/** Conversion YUV 4:2:0 → RVB tournée : couleurs BT.601, pas de ligne / de pixel, quatre rotations. */
public class FaceFramesTest {

    /** Image width × height en gris (U = V = 128), Y = 10 × (ligne + 1) + colonne. */
    private static FaceFrames.Rgb gray(int width, int height, int rotation) {
        byte[] y = new byte[width * height];
        for (int r = 0; r < height; r++) for (int c = 0; c < width; c++) y[r * width + c] = (byte) (10 * (r + 1) + c);
        byte[] uv = new byte[(width / 2) * (height / 2)];
        java.util.Arrays.fill(uv, (byte) 128);
        return FaceFrames.fromYuv420(y, width, uv, uv.clone(), width / 2, 1, width, height, rotation);
    }

    private static int g(int v) {
        return (v << 16) | (v << 8) | v;
    }

    @Test
    public void sansRotationLeGrisResteLeGris() {
        FaceFrames.Rgb out = gray(4, 2, 0);
        assertEquals(4, out.width);
        assertEquals(2, out.height);
        assertArrayEquals(new int[] {g(10), g(11), g(12), g(13), g(20), g(21), g(22), g(23)}, out.pixels);
    }

    @Test
    public void quartDeTourHoraire() {
        // capteur : 10 11 12 13 / 20 21 22 23 → tourné de 90° : 2 colonnes, 4 lignes
        FaceFrames.Rgb out = gray(4, 2, 90);
        assertEquals(2, out.width);
        assertEquals(4, out.height);
        assertArrayEquals(new int[] {g(20), g(10), g(21), g(11), g(22), g(12), g(23), g(13)}, out.pixels);
    }

    @Test
    public void troisQuartsDeTourEtDemiTour() {
        FaceFrames.Rgb out = gray(4, 2, 270);
        assertArrayEquals(new int[] {g(13), g(23), g(12), g(22), g(11), g(21), g(10), g(20)}, out.pixels);
        out = gray(4, 2, -90);
        assertArrayEquals(new int[] {g(13), g(23), g(12), g(22), g(11), g(21), g(10), g(20)}, out.pixels);
        out = gray(4, 2, 180);
        assertArrayEquals(new int[] {g(23), g(22), g(21), g(20), g(13), g(12), g(11), g(10)}, out.pixels);
    }

    @Test
    public void couleursBt601PleinEcart() {
        byte[] y = {(byte) 76, (byte) 76, (byte) 76, (byte) 76};
        FaceFrames.Rgb red = FaceFrames.fromYuv420(y, 2, new byte[] {(byte) 85}, new byte[] {(byte) 255}, 1, 1, 2, 2, 0);
        assertEquals(0xfe0000, red.pixels[0]);
        int[] px = FaceFrames.fromYuv420(new byte[] {(byte) 255, 0, 0, 0}, 2, new byte[] {(byte) 128},
            new byte[] {(byte) 128}, 1, 1, 2, 2, 0).pixels;
        assertEquals(0xffffff, px[0]);
        assertEquals(0, px[1]);
    }

    @Test
    public void pasDeLigneEtPlansEntrelaces() {
        // Y de 2 × 2 avec 3 octets de bourrage par ligne ; U et V entrelacés (pas de pixel 2, comme NV21)
        byte[] y = {50, 60, 0, 0, 0, 70, 80, 0, 0, 0};
        byte[] vu = {(byte) 128, (byte) 128};
        FaceFrames.Rgb out = FaceFrames.fromYuv420(y, 5, vu, vu, 4, 2, 2, 2, 0);
        assertArrayEquals(new int[] {g(50), g(60), g(70), g(80)}, out.pixels);
    }

    @Test
    public void rotationDeLaCameraFrontale() {
        assertEquals(270, FaceFrames.frontRotation(270, 0));
        assertEquals(0, FaceFrames.frontRotation(270, 90));
        assertEquals(90, FaceFrames.frontRotation(90, 0));
    }

    @Test(expected = IllegalArgumentException.class)
    public void rotationInvalide() {
        gray(2, 2, 45);
    }
}
