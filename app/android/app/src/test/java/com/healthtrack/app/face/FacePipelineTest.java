package com.healthtrack.app.face;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.junit.Test;

/** L'enchaînement d'une image et d'une rafale, avec les modèles remplacés par leurs sorties figées. */
public class FacePipelineTest {

    /** Modèle simulé : rend toujours les mêmes sorties et garde la dernière entrée reçue. */
    private static final class Fixed implements FacePipeline.Model {
        final float[][] outputs;
        float[] lastInput;
        int calls;

        Fixed(float[]... outputs) {
            this.outputs = outputs;
        }

        @Override
        public float[][] run(float[] input) {
            lastInput = input;
            calls++;
            return outputs;
        }
    }

    @Test
    public void analysesOneImageEndToEnd() throws Exception {
        FaceFixtures f = FaceFixtures.load("face-tilted");
        Fixed det = new Fixed(f.detectorOutputs());
        Fixed lmk = new Fixed(f.landmarkOutputs());
        Fixed bsm = new Fixed(f.blendshapes());
        FacePipeline.Frame frame = new FacePipeline(det, lmk, bsm).analyze(f.rgb, f.width, f.height);

        assertNull(frame.rejected, frame.rejected);
        assertEquals(128 * 128 * 3, det.lastInput.length);
        assertEquals(256 * 256 * 3, lmk.lastInput.length);
        double[] subset = FaceFixtures.doubles(f.json.get("subset"));
        for (int i = 0; i < subset.length; i++) assertEquals(subset[i], bsm.lastInput[i], 2e-3);
        float[] bs = f.blendshapes();
        assertArrayEquals(bs, frame.blendshapes, 0f);
        assertEquals((bs[44] + bs[45]) / 2.0, frame.indices.get("smile"), 1e-6);
        assertEquals(Arrays.asList(FaceIndices.NAMES), new ArrayList<>(frame.indices.keySet()));
    }

    @Test
    public void nextImageFollowsTheFaceWithoutTheDetector() throws Exception {
        FaceFixtures f = FaceFixtures.load("face-frontal");
        Fixed det = new Fixed(f.detectorOutputs());
        Fixed lmk = new Fixed(f.landmarkOutputs());
        FacePipeline p = new FacePipeline(det, lmk, new Fixed(f.blendshapes()));
        p.analyze(f.rgb, f.width, f.height);
        p.analyze(f.rgb, f.width, f.height);
        assertEquals(1, det.calls);
        assertEquals(2, lmk.calls);
        p.reset();
        p.analyze(f.rgb, f.width, f.height);
        assertEquals(2, det.calls);
    }

    @Test
    public void noFaceMeansNoLandmarkRun() throws Exception {
        FaceFixtures f = FaceFixtures.load("face-frontal");
        float[] logits = new float[896];
        Arrays.fill(logits, -100f);
        Fixed lmk = new Fixed(f.landmarkOutputs());
        FacePipeline.Frame frame = new FacePipeline(new Fixed(new float[896 * 16], logits), lmk,
            new Fixed(f.blendshapes())).analyze(f.rgb, f.width, f.height);
        assertEquals(FaceIndices.NO_FACE, frame.rejected);
        assertNull(frame.indices);
        assertEquals(0, lmk.calls);
    }

    @Test
    public void lowPresenceIsRejectedAndTheDetectorRunsAgain() throws Exception {
        FaceFixtures f = FaceFixtures.load("face-frontal");
        Fixed det = new Fixed(f.detectorOutputs());
        Fixed bsm = new Fixed(f.blendshapes());
        FacePipeline p = new FacePipeline(det, new Fixed(f.landmarkOutputs()[0], new float[] {0f}), bsm);
        assertEquals(FaceIndices.LOW_PRESENCE, p.analyze(f.rgb, f.width, f.height).rejected);
        p.analyze(f.rgb, f.width, f.height);
        assertEquals(2, det.calls);
        assertEquals(0, bsm.calls);
    }

    @Test
    public void openMouthIsRejectedAsTalking() throws Exception {
        FaceFixtures f = FaceFixtures.load("face-frontal");
        float[] bs = f.blendshapes();
        bs[FaceIndices.JAW_OPEN] = 0.7f;
        FacePipeline.Frame frame = new FacePipeline(new Fixed(f.detectorOutputs()), new Fixed(f.landmarkOutputs()),
            new Fixed(bs)).analyze(f.rgb, f.width, f.height);
        assertEquals(FaceIndices.TALKING, frame.rejected);
    }

    @Test
    public void blackImageIsTooDark() throws Exception {
        FaceFixtures f = FaceFixtures.load("face-frontal");
        int[] black = new int[f.rgb.length];
        FacePipeline.Frame frame = new FacePipeline(new Fixed(f.detectorOutputs()), new Fixed(f.landmarkOutputs()),
            new Fixed(f.blendshapes())).analyze(black, f.width, f.height);
        assertEquals(FaceIndices.TOO_DARK, frame.rejected);
    }

    @Test
    public void burstKeepsMediansAndCountsRejections() throws Exception {
        FaceFixtures f = FaceFixtures.load("face-frontal");
        FacePipeline p = new FacePipeline(new Fixed(f.detectorOutputs()), new Fixed(f.landmarkOutputs()),
            new Fixed(f.blendshapes()));
        List<String> rejected = new ArrayList<>();
        FaceIndices.Burst b = p.burst(Arrays.asList(f.rgb, new int[f.rgb.length], f.rgb), f.width, f.height, rejected);
        assertNotNull(b);
        assertEquals(3, b.frames);
        assertEquals(2, b.valid);
        assertEquals(Arrays.asList(FaceIndices.TOO_DARK), rejected);
        assertEquals(0.0, b.values.get("mobility"), 1e-9);
        Map<String, Double> one = FaceIndices.fromBlendshapes(f.blendshapes(), b.values.get("yaw"));
        assertEquals(one.get("smile"), b.values.get("smile"), 1e-9);
        assertTrue(b.values.get("eyeOpen") > 0.5);
        // Lumière des seules images valides (l'image noire rejetée n'y entre pas), dans les limites acceptées.
        double light = b.values.get("light");
        assertTrue("lumière " + light, light >= FaceIndices.MIN_LUMINANCE && light <= FaceIndices.MAX_LUMINANCE);
        // Une seule image : la lumière de la rafale est celle de l'image (même recadrage par le détecteur).
        FaceIndices.Burst one1 = p.burst(Arrays.asList(f.rgb), f.width, f.height, null);
        p.reset();
        assertEquals(p.analyze(f.rgb, f.width, f.height).luminance, one1.values.get("light"), 1e-9);
    }

    @Test
    public void affectModelAddsValenceAndArousalToTheBurst() throws Exception {
        FaceFixtures f = FaceFixtures.load("face-frontal");
        float[] out = new float[FaceAffect.OUTPUTS];
        out[8] = 0.4f;
        out[9] = -0.2f;
        Fixed affect = new Fixed(out);
        FacePipeline p = new FacePipeline(new Fixed(f.detectorOutputs()), new Fixed(f.landmarkOutputs()),
            new Fixed(f.blendshapes()), affect);
        FaceIndices.Burst b = p.burst(Arrays.asList(f.rgb, new int[f.rgb.length], f.rgb), f.width, f.height,
            new ArrayList<>());
        assertEquals(2, affect.calls);
        assertEquals(3 * 224 * 224, affect.lastInput.length);
        assertEquals(0.4, b.values.get("valence"), 1e-6);
        assertEquals(-0.2, b.values.get("arousal"), 1e-6);
        assertEquals(2.0, b.values.get("affectFrames"), 0);
        assertTrue(p.affectEnabled());
        assertNull(p.lastAffectError());
    }

    @Test
    public void duoAveragesBothModelsAndMeasuresTheirDisagreement() throws Exception {
        FaceFixtures f = FaceFixtures.load("face-frontal");
        float[] a = new float[FaceAffect.OUTPUTS];
        a[8] = 0.5f;
        a[9] = -0.2f;
        float[] m = new float[FaceAffect.OUTPUTS];
        m[8] = 0.1f;
        m[9] = 0.2f;
        Fixed b0 = new Fixed(a);
        Fixed mbf = new Fixed(m);
        FacePipeline p = new FacePipeline(new Fixed(f.detectorOutputs()), new Fixed(f.landmarkOutputs()),
            new Fixed(f.blendshapes()), b0, mbf);
        FaceIndices.Burst b = p.burst(Arrays.asList(f.rgb, f.rgb), f.width, f.height, new ArrayList<>());
        assertEquals(2, p.affectModels());
        assertEquals(3 * 224 * 224, b0.lastInput.length);
        assertEquals("MobileFaceNet lit un visage de 112 px", 3 * 112 * 112, mbf.lastInput.length);
        assertEquals(0.3, b.values.get("valence"), 1e-6);
        assertEquals(0.0, b.values.get("arousal"), 1e-6);
        assertEquals(0.4, b.values.get("affectGap"), 1e-6);
        assertEquals(2.0, b.values.get("affectModels"), 0);
        // Scores d'expression tous nuls pour les deux modèles : probabilités égales (1/8), moyennes du duo.
        assertEquals(0.125, b.values.get("exHappiness"), 1e-6);
    }

    @Test
    public void burstKeepsTheMeanExpressionProbabilities() throws Exception {
        FaceFixtures f = FaceFixtures.load("face-frontal");
        float[] out = new float[FaceAffect.OUTPUTS];
        out[4] = 3f;
        FacePipeline p = new FacePipeline(new Fixed(f.detectorOutputs()), new Fixed(f.landmarkOutputs()),
            new Fixed(f.blendshapes()), new Fixed(out));
        FaceIndices.Burst b = p.burst(Arrays.asList(f.rgb, f.rgb), f.width, f.height, new ArrayList<>());
        double e3 = Math.exp(3);
        assertEquals(e3 / (e3 + 7), b.values.get("exHappiness"), 1e-6);
        assertEquals(1 / (e3 + 7), b.values.get("exSadness"), 1e-6);
        double sum = 0;
        for (String k : FaceAffect.EXPRESSIONS) sum += b.values.get(k);
        assertEquals(1, sum, 1e-6);
    }

    @Test
    public void duoFallsBackToTheModelThatAnswers() throws Exception {
        FaceFixtures f = FaceFixtures.load("face-frontal");
        float[] m = new float[FaceAffect.OUTPUTS];
        m[8] = 0.1f;
        m[9] = 0.2f;
        FacePipeline.Model broken = input -> {
            throw new IllegalStateException("ort");
        };
        FacePipeline p = new FacePipeline(new Fixed(f.detectorOutputs()), new Fixed(f.landmarkOutputs()),
            new Fixed(f.blendshapes()), broken, new Fixed(m));
        FaceIndices.Burst b = p.burst(Arrays.asList(f.rgb), f.width, f.height, new ArrayList<>());
        assertEquals(0.1, b.values.get("valence"), 1e-6);
        assertNull("pas d'écart sans les deux modèles", b.values.get("affectGap"));
        assertEquals("IllegalStateException: ort", p.lastAffectError());

        p = new FacePipeline(new Fixed(f.detectorOutputs()), new Fixed(f.landmarkOutputs()),
            new Fixed(f.blendshapes()), null, broken);
        b = p.burst(Arrays.asList(f.rgb), f.width, f.height, new ArrayList<>());
        assertNull(b.values.get("valence"));
        assertEquals("l'erreur du second modèle est étiquetée", "mbf:IllegalStateException: ort", p.lastAffectError());
    }

    @Test
    public void failingAffectModelKeepsTheReading() throws Exception {
        FaceFixtures f = FaceFixtures.load("face-frontal");
        FacePipeline.Model broken = input -> {
            throw new IllegalStateException("ort");
        };
        FacePipeline p = new FacePipeline(new Fixed(f.detectorOutputs()), new Fixed(f.landmarkOutputs()),
            new Fixed(f.blendshapes()), broken);
        FaceIndices.Burst b = p.burst(Arrays.asList(f.rgb, f.rgb), f.width, f.height, new ArrayList<>());
        assertEquals(2, b.valid);
        assertNull(b.values.get("valence"));
        assertEquals("IllegalStateException: ort", p.lastAffectError());
        p.burst(Arrays.asList(new int[f.rgb.length]), f.width, f.height, new ArrayList<>());
        assertNull("l'erreur d'une rafale ne colle pas à la suivante", p.lastAffectError());
    }

    @Test
    public void withoutAffectModelNoValenceIsWritten() throws Exception {
        FaceFixtures f = FaceFixtures.load("face-frontal");
        FacePipeline p = new FacePipeline(new Fixed(f.detectorOutputs()), new Fixed(f.landmarkOutputs()),
            new Fixed(f.blendshapes()));
        FaceIndices.Burst b = p.burst(Arrays.asList(f.rgb, f.rgb), f.width, f.height, new ArrayList<>());
        assertNull(b.values.get("valence"));
        assertNull(b.values.get("affectFrames"));
        assertTrue(!p.affectEnabled());
    }
}
