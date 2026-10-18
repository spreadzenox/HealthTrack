package com.healthtrack.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Log;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import com.healthtrack.app.face.FaceGeometry;
import com.healthtrack.app.face.FacePipeline;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Les vrais modèles LiteRT de l'APK, sur l'appareil, rendent les mêmes sorties que le prototype de référence
 * (visage-vecteurs.py, à 0,4 px médian de MediaPipe Tasks) sur les vecteurs de src/test/resources/face/ (I100 ① b,
 * I101). Spec : journal/protocoles/visage.md §7.
 */
@RunWith(AndroidJUnit4.class)
public class FaceModelsTest {

    private static final String TAG = "FaceModelsTest";
    private static final String[] IMAGES = {"face-frontal", "face-tilted"};
    private static FaceModels models;

    private static final class Vector {
        final JSONObject json;
        final int[] rgb;
        final int width, height;

        Vector(String name) throws Exception {
            Context test = InstrumentationRegistry.getInstrumentation().getContext();
            json = new JSONObject(read(test, "face/" + name + ".json"));
            Bitmap bmp;
            try (InputStream in = test.getAssets().open("face/" + json.getString("image"))) {
                bmp = BitmapFactory.decodeStream(in);
            }
            width = bmp.getWidth();
            height = bmp.getHeight();
            rgb = new int[width * height];
            bmp.getPixels(rgb, 0, width, 0, 0, width, height);
            bmp.recycle();
        }

        FaceGeometry.Roi roi() throws Exception {
            JSONObject r = json.getJSONObject("roi");
            return new FaceGeometry.Roi(r.getDouble("cx"), r.getDouble("cy"), r.getDouble("side"), r.getDouble("rot"));
        }
    }

    @BeforeClass
    public static void openModels() throws Exception {
        Context app = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertTrue("modèles absents de l'APK (tâche Gradle faceModels)", FaceModels.available(app.getAssets()));
        models = FaceModels.open(app.getAssets());
    }

    @AfterClass
    public static void closeModels() {
        if (models != null) models.close();
    }

    @Test
    public void modelShapesMatchTheSpec() {
        assertEquals(128 * 128 * 3, models.detector.inputSize());
        assertEquals(256 * 256 * 3, models.landmarks.inputSize());
        assertEquals(146 * 2, models.blendshapes.inputSize());
    }

    @Test
    public void detectorMatchesTheReference() throws Exception {
        for (String name : IMAGES) {
            Vector v = new Vector(name);
            float[] input = FaceGeometry.crop(v.rgb, v.width, v.height, FaceGeometry.letterbox(v.width, v.height),
                FaceGeometry.DETECTOR_SIZE, -1f, 1f);
            float[][] out = models.detector.run(input);
            assertEquals(896 * 16, out[0].length);
            assertEquals(896, out[1].length);
            JSONArray sparse = v.json.getJSONObject("detector").getJSONArray("sparse");
            assertTrue(sparse.length() > 0);
            for (int k = 0; k < sparse.length(); k++) {
                JSONArray row = sparse.getJSONArray(k);
                int i = row.getInt(0);
                assertEquals(name + " logit " + i, row.getDouble(1), out[1][i], 0.05);
                for (int j = 0; j < 16; j++) {
                    assertEquals(name + " reg " + i + "/" + j, row.getDouble(2 + j), out[0][i * 16 + j], 0.1);
                }
            }
            FaceGeometry.Detection d = FaceGeometry.decode(out[0], out[1], v.width, v.height);
            assertEquals(v.json.getJSONObject("detection").getDouble("score"), d.score, 0.01);
        }
    }

    @Test
    public void landmarksMatchTheReference() throws Exception {
        for (String name : IMAGES) {
            Vector v = new Vector(name);
            float[] crop = FaceGeometry.crop(v.rgb, v.width, v.height, v.roi(), FaceGeometry.LANDMARK_SIZE, 0f, 1f);
            float[][] out = models.landmarks.run(crop);
            JSONObject ref = v.json.getJSONObject("landmarks");
            JSONArray raw = ref.getJSONArray("raw");
            assertEquals(raw.length(), out[0].length);
            double[] diff = new double[raw.length()];
            for (int i = 0; i < diff.length; i++) diff[i] = Math.abs(raw.getDouble(i) - out[0][i]);
            Arrays.sort(diff);
            // pixels du recadrage 256 × 256
            assertTrue(name + " écart médian " + diff[diff.length / 2], diff[diff.length / 2] < 0.05);
            assertTrue(name + " écart max " + diff[diff.length - 1], diff[diff.length - 1] < 0.5);
            assertEquals(name + " présence", ref.getDouble("presence_logit"), out[1][0], 0.05);
        }
    }

    @Test
    public void blendshapesMatchTheReference() throws Exception {
        for (String name : IMAGES) {
            Vector v = new Vector(name);
            JSONArray subset = v.json.getJSONArray("subset");
            float[] input = new float[subset.length()];
            for (int i = 0; i < input.length; i++) input[i] = (float) subset.getDouble(i);
            float[] bs = models.blendshapes.run(input)[0];
            JSONArray ref = v.json.getJSONArray("blendshapes");
            assertEquals(ref.length(), bs.length);
            for (int i = 0; i < bs.length; i++) assertEquals(name + " bs" + i, ref.getDouble(i), bs[i], 2e-3);
        }
    }

    @Test
    public void wholePipelineReadsTheFace() throws Exception {
        for (String name : IMAGES) {
            Vector v = new Vector(name);
            FacePipeline pipeline = models.pipeline();
            long t0 = System.nanoTime();
            FacePipeline.Frame first = pipeline.analyze(v.rgb, v.width, v.height);
            long t1 = System.nanoTime();
            FacePipeline.Frame next = pipeline.analyze(v.rgb, v.width, v.height); // suivi, sans détecteur
            long t2 = System.nanoTime();
            Log.i(TAG, name + " : 1re image " + (t1 - t0) / 1_000_000 + " ms, suivante " + (t2 - t1) / 1_000_000 + " ms");
            assertNull(name + " rejet " + first.rejected, first.rejected);
            assertNull(name + " rejet " + next.rejected, next.rejected);
            JSONArray ref = v.json.getJSONArray("blendshapes");
            double sum = 0;
            for (int i = 0; i < ref.length(); i++) sum += Math.abs(ref.getDouble(i) - first.blendshapes[i]);
            assertTrue(name + " écart moyen des blendshapes " + sum / ref.length(), sum / ref.length() < 0.02);
            double smile = (ref.getDouble(44) + ref.getDouble(45)) / 2;
            assertEquals(name + " sourire", smile, first.indices.get("smile"), 0.05);
        }
    }

    private static String read(Context context, String path) throws Exception {
        try (InputStream in = context.getAssets().open(path)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            for (int n; (n = in.read(buf)) > 0; ) out.write(buf, 0, n);
            return out.toString(StandardCharsets.UTF_8.name());
        }
    }
}
