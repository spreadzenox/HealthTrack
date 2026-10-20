package com.healthtrack.app.face;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import java.util.List;
import java.util.Map;

import org.junit.Test;

/** Recadrage et décodage du modèle valence / éveil, comparés aux vecteurs de journal/protocoles/visage-va-vecteurs.py. */
@SuppressWarnings("unchecked")
public class FaceAffectTest {

    private static Map<String, Object> vectors(String image) throws Exception {
        Map<String, Object> all = FaceFixtures.resource("affect-vectors.json");
        return (Map<String, Object>) ((Map<String, Object>) all.get("images")).get(image);
    }

    private static double[] points(FaceFixtures f) {
        return FaceFixtures.doubles(f.obj("landmarks").get("points"));
    }

    private void checkImage(String name) throws Exception {
        FaceFixtures f = FaceFixtures.load(name);
        Map<String, Object> v = vectors(name);
        Map<String, Object> r = (Map<String, Object>) v.get("roi");
        FaceGeometry.Roi roi = FaceAffect.roi(points(f));
        assertEquals(FaceFixtures.num(r, "cx"), roi.cx, 1e-6);
        assertEquals(FaceFixtures.num(r, "cy"), roi.cy, 1e-6);
        assertEquals(FaceFixtures.num(r, "side"), roi.side, 1e-6);
        assertEquals(FaceFixtures.num(r, "rot"), roi.rot, 1e-9);

        float[] input = FaceAffect.input(f.rgb, f.width, f.height, roi);
        assertEquals(3 * 224 * 224, input.length);
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
}
