package com.healthtrack.app.face;

import static com.healthtrack.app.face.FaceFixtures.doubles;
import static com.healthtrack.app.face.FaceFixtures.list;
import static com.healthtrack.app.face.FaceFixtures.num;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.junit.Test;

/**
 * Le post-traitement Java reproduit le prototype de référence (visage-vecteurs.py), lui-même à 0,4 px médian
 * de MediaPipe Tasks : vecteurs « face-frontal » (portrait de face, 320 × 400) et « face-tilted » (tête penchée
 * de 18°, 320 × 240, visage ≈ 100 px comme une capture réelle).
 */
public class FaceGeometryTest {

    private static final String[] IMAGES = {"face-frontal", "face-tilted"};

    @Test
    public void anchorsFollowTheShortRangeGrid() {
        double[] a = FaceGeometry.anchors();
        assertEquals(896 * 2, a.length);
        // 1re cellule 16 × 16 (2 ancres identiques), puis la grille 8 × 8 à 6 ancres à partir de l'index 512
        assertEquals(0.5 / 16, a[0], 1e-12);
        assertEquals(0.5 / 16, a[3], 1e-12);
        assertEquals(1.5 / 16, a[4], 1e-12);
        assertEquals(0.5 / 8, a[2 * 512], 1e-12);
        assertEquals(0.5 / 8, a[2 * 517 + 1], 1e-12);
        assertEquals(7.5 / 8, a[2 * 895], 1e-12);
        assertEquals(7.5 / 8, a[2 * 895 + 1], 1e-12);
    }

    @Test
    public void detectorInputMatchesTheReference() throws Exception {
        for (String name : IMAGES) {
            FaceFixtures f = FaceFixtures.load(name);
            float[] t = FaceGeometry.crop(f.rgb, f.width, f.height, FaceGeometry.letterbox(f.width, f.height), 128, -1f, 1f);
            assertEquals(128 * 128 * 3, t.length);
            assertSamples(name, t, 128, f.obj("detector").get("input_samples"));
        }
    }

    @Test
    public void decodesAndFusesTheDetectorBoxes() throws Exception {
        for (String name : IMAGES) {
            FaceFixtures f = FaceFixtures.load(name);
            float[][] out = f.detectorOutputs();
            FaceGeometry.Detection d = FaceGeometry.decode(out[0], out[1], f.width, f.height);
            assertNotNull(name, d);
            Map<String, Object> e = f.obj("detection");
            assertEquals(name, num(e, "score"), d.score, 1e-4);
            assertEquals(name, (int) num(e, "boxes"), d.boxes);
            assertEquals(name, num(e, "cx"), d.cx, 1e-3);
            assertEquals(name, num(e, "cy"), d.cy, 1e-3);
            assertEquals(name, num(e, "w"), d.w, 1e-3);
            assertEquals(name, num(e, "h"), d.h, 1e-3);
            double[] kp = doubles(e.get("keypoints"));
            for (int k = 0; k < 12; k++) assertEquals(name + " kp" + k, kp[k], d.keypoints[k], 1e-3);
        }
    }

    @Test
    public void noFaceWhenEveryScoreIsBelowHalf() {
        float[] logits = new float[896];
        Arrays.fill(logits, -0.01f);
        assertNull(FaceGeometry.decode(new float[896 * 16], logits, 320, 240));
    }

    @Test
    public void keepsTheLargestOfTwoSeparateFaces() {
        float[] reg = new float[896 * 16];
        float[] logits = new float[896];
        Arrays.fill(logits, -100f);
        // ancre 0 (coin haut gauche) : petit visage très sûr ; ancre 895 (coin bas droit) : grand visage moins sûr
        logits[0] = 5f;
        reg[2] = reg[3] = 0.1f * 128;
        logits[895] = 1f;
        reg[895 * 16 + 2] = reg[895 * 16 + 3] = 0.3f * 128;
        FaceGeometry.Detection d = FaceGeometry.decode(reg, logits, 128, 128);
        assertEquals(7.5 / 8 * 128, d.cx, 1e-3);
        assertEquals(0.3 * 128, d.w, 1e-3);
        assertEquals(1, d.boxes);
    }

    @Test
    public void fusesOverlappingBoxesWeightedByScore() {
        float[] reg = new float[896 * 16];
        float[] logits = new float[896];
        Arrays.fill(logits, -100f);
        // deux boîtes 0,4 × 0,4 sur la même ancre de pas 16 (index 512), décalées de 0,15 : IoU ≈ 0,45
        logits[512] = 2f;
        logits[513] = 0f;
        for (int i : new int[] {512, 513}) reg[i * 16 + 2] = reg[i * 16 + 3] = 0.4f * 128;
        reg[513 * 16] = 0.15f * 128;
        FaceGeometry.Detection d = FaceGeometry.decode(reg, logits, 100, 100);
        double s1 = 1 / (1 + Math.exp(-2)), s2 = 0.5;
        assertEquals(2, d.boxes);
        assertEquals((0.0625 * s1 + 0.2125 * s2) / (s1 + s2) * 100, d.cx, 1e-3);
        assertEquals(s1, d.score, 1e-9);
    }

    @Test
    public void roiFromDetectionUsesTheEyesAngleAndOnePointFive() throws Exception {
        for (String name : IMAGES) {
            FaceFixtures f = FaceFixtures.load(name);
            float[][] out = f.detectorOutputs();
            FaceGeometry.Roi r = FaceGeometry.roiFromDetection(FaceGeometry.decode(out[0], out[1], f.width, f.height));
            assertRoi(name, f.roi("roi"), r);
        }
        // même visage, l'image penchée de 18° de plus : la rotation du recadrage suit (y vers le bas)
        double tilt = FaceFixtures.load("face-tilted").roi("roi").rot - FaceFixtures.load("face-frontal").roi("roi").rot;
        assertEquals(-18, Math.toDegrees(tilt), 5);
    }

    @Test
    public void landmarkInputMatchesTheReference() throws Exception {
        for (String name : IMAGES) {
            FaceFixtures f = FaceFixtures.load(name);
            float[] t = FaceGeometry.crop(f.rgb, f.width, f.height, f.roi("roi"), 256, 0f, 1f);
            assertSamples(name, t, 256, f.obj("landmarks").get("input_samples"));
        }
    }

    @Test
    public void pointsGoBackToImagePixelsAndFeedTheBlendshapes() throws Exception {
        for (String name : IMAGES) {
            FaceFixtures f = FaceFixtures.load(name);
            double[] pts = FaceGeometry.toImage(f.landmarkOutputs()[0], f.roi("roi"));
            double[] expected = doubles(f.obj("landmarks").get("points"));
            assertEquals(478 * 3, pts.length);
            for (int i = 0; i < pts.length; i++) assertEquals(name + " p" + i, expected[i], pts[i], 2e-3);
            float[] sub = FaceGeometry.blendshapeInput(pts);
            double[] subExpected = doubles(f.json.get("subset"));
            assertEquals(146 * 2, sub.length);
            for (int i = 0; i < sub.length; i++) assertEquals(name + " s" + i, subExpected[i], sub[i], 2e-3);
            assertRoi(name + " suivante", f.roi("next_roi"), FaceGeometry.roiFromPoints(pts));
        }
    }

    @Test
    public void faceSizeAndYawOnRealFaces() throws Exception {
        for (String name : IMAGES) {
            FaceFixtures f = FaceFixtures.load(name);
            double[] pts = FaceGeometry.toImage(f.landmarkOutputs()[0], f.roi("roi"));
            assertTrue(name + " de face", Math.abs(FaceGeometry.yawDegrees(pts)) < 20);
        }
        double[] tilted = FaceGeometry.toImage(FaceFixtures.load("face-tilted").landmarkOutputs()[0],
            FaceFixtures.load("face-tilted").roi("roi"));
        double size = FaceGeometry.faceSize(tilted);
        assertTrue("visage ≈ 100 px dans la capture 320 × 240 : " + size, size > 85 && size < 120);
    }

    @Test
    public void yawGrowsWhenTheFaceTurns() {
        double[] pts = new double[478 * 3];
        // yeux à l'horizontale ; joues à ± 50 px, profondeur opposée : tête tournée de 30°
        pts[3 * 33] = 100; pts[3 * 263] = 160; pts[3 * 33 + 1] = pts[3 * 263 + 1] = 100;
        double t = Math.toRadians(30);
        pts[3 * 234] = 130 - 50 * Math.cos(t); pts[3 * 234 + 2] = -50 * Math.sin(t);
        pts[3 * 454] = 130 + 50 * Math.cos(t); pts[3 * 454 + 2] = 50 * Math.sin(t);
        pts[3 * 234 + 1] = pts[3 * 454 + 1] = 120;
        assertEquals(30, FaceGeometry.yawDegrees(pts), 1e-6);
    }

    private static void assertRoi(String name, FaceGeometry.Roi expected, FaceGeometry.Roi actual) {
        assertEquals(name + " cx", expected.cx, actual.cx, 1e-3);
        assertEquals(name + " cy", expected.cy, actual.cy, 1e-3);
        assertEquals(name + " côté", expected.side, actual.side, 1e-3);
        assertEquals(name + " rotation", expected.rot, actual.rot, 1e-5);
    }

    private static void assertSamples(String name, float[] t, int size, Object samples) {
        List<Object> rows = list(samples);
        assertTrue(rows.size() >= 32);
        for (Object row : rows) {
            double[] r = doubles(row);
            int y = (int) r[0], x = (int) r[1], ch = (int) r[2];
            assertEquals(name + " (" + x + "," + y + "," + ch + ")", r[3], t[(y * size + x) * 3 + ch], 1e-5);
        }
    }
}
