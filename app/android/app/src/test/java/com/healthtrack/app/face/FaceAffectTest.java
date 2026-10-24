package com.healthtrack.app.face;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import java.util.List;
import java.util.Map;

import org.junit.Test;

/** Recadrage et décodage du modèle valence / éveil, comparés aux vecteurs de journal/protocoles/visage-va-vecteurs.py. */
@SuppressWarnings("unchecked")
public class FaceAffectTest {

    private static Map<String, Object> vectors(String file, String image) throws Exception {
        Map<String, Object> all = FaceFixtures.resource(file);
        return (Map<String, Object>) ((Map<String, Object>) all.get("images")).get(image);
    }

    private static double[] points(FaceFixtures f) {
        return FaceFixtures.doubles(f.obj("landmarks").get("points"));
    }

    private void checkImage(String name) throws Exception {
        checkImage(name, FaceAffect.B0, "affect-vectors.json");
    }

    private void checkImage(String name, FaceAffect.Spec spec, String file) throws Exception {
        FaceFixtures f = FaceFixtures.load(name);
        Map<String, Object> v = vectors(file, name);
        Map<String, Object> r = (Map<String, Object>) v.get("roi");
        FaceGeometry.Roi roi = FaceAffect.roi(points(f));
        assertEquals(FaceFixtures.num(r, "cx"), roi.cx, 1e-6);
        assertEquals(FaceFixtures.num(r, "cy"), roi.cy, 1e-6);
        assertEquals(FaceFixtures.num(r, "side"), roi.side, 1e-6);
        assertEquals(FaceFixtures.num(r, "rot"), roi.rot, 1e-9);

        float[] input = spec == FaceAffect.B0
            ? FaceAffect.input(f.rgb, f.width, f.height, roi)
            : FaceAffect.input(spec, f.rgb, f.width, f.height, roi);
        assertEquals(3 * spec.size * spec.size, input.length);
        for (Object sample : FaceFixtures.list(v.get("input_samples"))) {
            List<Object> s = FaceFixtures.list(sample);
            int k = ((Number) s.get(0)).intValue();
            assertEquals("entrée " + k, ((Number) s.get(1)).doubleValue(), input[k], 1e-4);
        }
        double mean = 0;
        for (float x : input) mean += x;
        assertEquals(FaceFixtures.num(v, "input_mean"), mean / input.length, 1e-4);

        double[] va = FaceAffect.decode(FaceFixtures.floats(v.get("output")));
        assertEquals(FaceFixtures.num(v, "valence"), va[0], 1e-6);
        assertEquals(FaceFixtures.num(v, "arousal"), va[1], 1e-6);
    }

    @Test
    public void cropsTheFrontalFaceLikeTheReference() throws Exception {
        checkImage("face-frontal");
    }

    @Test
    public void alignsATiltedFaceOnTheEyes() throws Exception {
        checkImage("face-tilted");
    }

    @Test
    public void preparesTheMobileFaceNetInputLikeTheReference() throws Exception {
        assertEquals(112, FaceAffect.MBF.size);
        checkImage("face-frontal", FaceAffect.MBF, "affect-vectors-mbf.json");
        checkImage("face-tilted", FaceAffect.MBF, "affect-vectors-mbf.json");
    }

    @Test
    public void decodeClampsAndRejectsBadOutputs() {
        float[] out = new float[10];
        out[8] = 1.7f;
        out[9] = -3f;
        double[] va = FaceAffect.decode(out);
        assertEquals(1, va[0], 0);
        assertEquals(-1, va[1], 0);
        assertNull(FaceAffect.decode(new float[8]));
        assertNull(FaceAffect.decode(null));
        out[8] = Float.NaN;
        assertNull(FaceAffect.decode(out));
    }

    @Test
    public void expressionsAreTheSoftmaxOfTheEightScores() {
        float[] out = new float[10];
        out[4] = 2f; // joie
        out[5] = 1f; // neutre
        double[] p = FaceAffect.expressions(out);
        assertEquals(8, p.length);
        double sum = 0;
        for (double x : p) sum += x;
        assertEquals(1, sum, 1e-9);
        double e = Math.E * Math.E + Math.E + 6;
        assertEquals(Math.E * Math.E / e, p[4], 1e-9);
        assertEquals(1 / e, p[0], 1e-9);
        assertEquals(8, FaceAffect.EXPRESSIONS.length);
        assertEquals("exHappiness", FaceAffect.EXPRESSIONS[4]);
        assertNull(FaceAffect.expressions(new float[8]));
        out[2] = Float.NaN;
        assertNull(FaceAffect.expressions(out));
    }
}
