package com.healthtrack.app.face;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.Test;

/** Le JSON d'une rafale : indices arrondis, rejets comptés, jamais de valeur non finie. */
public class FaceRecordTest {

    @Test
    public void rafaleValide() {
        Map<String, Double> idx = new LinkedHashMap<>();
        for (String n : FaceIndices.NAMES) idx.put(n, 0.0);
        idx.put("smile", 0.123456);
        float[] bs = new float[FaceIndices.BLENDSHAPES];
        FaceIndices.Burst burst = FaceIndices.burst(Arrays.asList(idx, idx), Arrays.asList(bs, bs), 3);
        String json = FaceRecord.json(1_760_000_000_000L, "unlock", 3, burst, Collections.singletonList("no_face"), 812, 95);
        assertTrue(json, json.startsWith("{\"v\":1,\"at\":1760000000000,\"trigger\":\"unlock\",\"frames\":3,\"valid\":2,\"values\":{\"smile\":0.1235,"));
        assertTrue(json, json.contains("\"mobility\":0.0000"));
        assertTrue(json, json.endsWith(",\"rejected\":{\"no_face\":1},\"ms\":{\"camera\":812,\"inference\":95}}"));
    }

    @Test
    public void rafaleSansVisage() {
        List<String> rej = Arrays.asList("too_dark", "no_face", "too_dark");
        String json = FaceRecord.json(5, "manual", 3, null, rej, 0, 0);
        assertEquals("{\"v\":1,\"at\":5,\"trigger\":\"manual\",\"frames\":3,\"valid\":0,"
            + "\"rejected\":{\"no_face\":1,\"too_dark\":2},\"ms\":{\"camera\":0,\"inference\":0}}", json);
    }

    @Test
    public void valeursNonFiniesOmises() {
        Map<String, Double> idx = new LinkedHashMap<>();
        for (String n : FaceIndices.NAMES) idx.put(n, 0.5);
        idx.put("yaw", Double.NaN);
        FaceIndices.Burst burst = FaceIndices.burst(Collections.singletonList(idx),
            Collections.singletonList(new float[FaceIndices.BLENDSHAPES]), 1);
        String json = FaceRecord.json(1, "unlock", 1, burst, null, 1, 1);
        assertFalse(json, json.contains("yaw"));
        assertFalse(json, json.contains("NaN"));
    }

    @Test
    public void echappement() {
        assertEquals("\"a\\\"b\\\\c\\u000a\"", FaceRecord.quote("a\"b\\c\n"));
    }
}
