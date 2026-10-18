package com.healthtrack.app.face;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.junit.Test;

/** Indices par unités d'action, contrôle qualité et rafale (visage.md §5–§6). */
public class FaceIndicesTest {

    private static float[] coefficients() {
        float[] bs = new float[52];
        bs[FaceIndices.MOUTH_SMILE_L] = 0.8f;
        bs[FaceIndices.MOUTH_SMILE_R] = 0.6f;
        bs[FaceIndices.CHEEK_SQUINT_L] = 0.3f;
        bs[FaceIndices.CHEEK_SQUINT_R] = 0.5f;
        bs[FaceIndices.BROW_DOWN_L] = 0.1f;
        bs[FaceIndices.BROW_DOWN_R] = 0.3f;
        bs[FaceIndices.BROW_INNER_UP] = 0.25f;
        bs[FaceIndices.MOUTH_FROWN_L] = 0.02f;
        bs[FaceIndices.MOUTH_FROWN_R] = 0.04f;
        bs[FaceIndices.EYE_BLINK_L] = 0.2f;
        bs[FaceIndices.EYE_BLINK_R] = 0.4f;
        bs[FaceIndices.JAW_OPEN] = 0.05f;
        return bs;
    }

    @Test
    public void indicesAreLeftRightMeansByActionUnit() {
        Map<String, Double> i = FaceIndices.fromBlendshapes(coefficients(), -4.5);
        assertEquals(0.7, i.get("smile"), 1e-6);
        assertEquals(0.4, i.get("duchenne"), 1e-6); // min(sourire, joues)
        assertEquals(0.2, i.get("browDown"), 1e-6);
        assertEquals(0.25, i.get("browInnerUp"), 1e-6);
        assertEquals(0.03, i.get("mouthFrown"), 1e-6);
        assertEquals(0.7, i.get("eyeOpen"), 1e-6);
        assertEquals(0.05, i.get("jawOpen"), 1e-6);
        assertEquals(0.2, i.get("asymmetry"), 1e-6);
        assertEquals(-4.5, i.get("yaw"), 1e-9);
        assertEquals(Arrays.asList(FaceIndices.NAMES), Arrays.asList(i.keySet().toArray(new String[0])));
    }

    @Test
    public void indicesCarryNoValence() {
        // D6 : aucun indice « positif » ou « négatif », ni score composite d'humeur à ce niveau
        for (String n : FaceIndices.NAMES) {
            assertFalse(n, n.toLowerCase().contains("mood") || n.toLowerCase().contains("happy")
                || n.toLowerCase().contains("sad") || n.toLowerCase().contains("score"));
        }
    }

    @Test
    public void qualityChecksInOrder() {
        assertNull(FaceIndices.rejectBeforeBlendshapes(0.99, 120, 5, 0.5));
        assertEquals(FaceIndices.LOW_PRESENCE, FaceIndices.rejectBeforeBlendshapes(0.85, 120, 5, 0.5));
        assertEquals(FaceIndices.TOO_SMALL, FaceIndices.rejectBeforeBlendshapes(0.99, 60, 5, 0.5));
        assertEquals(FaceIndices.TURNED, FaceIndices.rejectBeforeBlendshapes(0.99, 120, -35, 0.5));
        assertEquals(FaceIndices.TOO_DARK, FaceIndices.rejectBeforeBlendshapes(0.99, 120, 5, 0.1));
        assertEquals(FaceIndices.TOO_BRIGHT, FaceIndices.rejectBeforeBlendshapes(0.99, 120, 5, 0.95));
        float[] bs = coefficients();
        assertNull(FaceIndices.rejectAfterBlendshapes(bs));
        bs[FaceIndices.JAW_OPEN] = 0.6f;
        assertEquals(FaceIndices.TALKING, FaceIndices.rejectAfterBlendshapes(bs));
    }

    @Test
    public void luminanceIsRec601() {
        assertEquals(0.299, FaceIndices.luminance(new float[] {1, 0, 0}), 1e-6);
        assertEquals(0.5, FaceIndices.luminance(new float[] {0.5f, 0.5f, 0.5f, 0.5f, 0.5f, 0.5f}), 1e-6);
    }

    @Test
    public void burstTakesMediansAndMobility() {
        float[] a = coefficients(), b = coefficients(), c = coefficients();
        b[FaceIndices.MOUTH_SMILE_L] = b[FaceIndices.MOUTH_SMILE_R] = 0.1f;
        c[FaceIndices.MOUTH_SMILE_L] = c[FaceIndices.MOUTH_SMILE_R] = 0.5f;
        List<float[]> bs = Arrays.asList(a, b, c);
        List<Map<String, Double>> idx = Arrays.asList(
            FaceIndices.fromBlendshapes(a, 0), FaceIndices.fromBlendshapes(b, 2), FaceIndices.fromBlendshapes(c, 4));
        FaceIndices.Burst burst = FaceIndices.burst(idx, bs, 4);
        assertEquals(0.5, burst.values.get("smile"), 1e-6);
        assertEquals(2, burst.values.get("yaw"), 1e-9);
        assertEquals(3, burst.valid);
        assertEquals(4, burst.frames);
        // a → b : 0,7 + 0,5 ; b → c : 0,4 + 0,4 → 2,0 / (2 × 52)
        assertEquals(2.0 / 104, burst.values.get("mobility"), 1e-6);
    }

    @Test
    public void burstWithOneImageHasNoMobility() {
        float[] a = coefficients();
        FaceIndices.Burst b = FaceIndices.burst(
            Collections.singletonList(FaceIndices.fromBlendshapes(a, 0)), Collections.singletonList(a), 3);
        assertFalse(b.values.containsKey("mobility"));
        assertNull(FaceIndices.burst(Collections.emptyList(), Collections.emptyList(), 3));
    }

    @Test
    public void medianOfEvenCountIsTheMean() {
        assertEquals(2.5, FaceIndices.median(new double[] {4, 1, 3, 2}), 1e-12);
    }
}
