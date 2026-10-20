package com.healthtrack.app.face;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.imageio.ImageIO;

/**
 * Vecteurs du pipeline visage (src/test/resources/face/*.json), écrits par journal/protocoles/visage-vecteurs.py :
 * sorties brutes des 3 modèles LiteRT sur une image du domaine public + résultats attendus.
 */
@SuppressWarnings("unchecked")
final class FaceFixtures {

    final Map<String, Object> json;
    final int[] rgb;
    final int width, height;

    private FaceFixtures(Map<String, Object> json, int[] rgb, int width, int height) {
        this.json = json;
        this.rgb = rgb;
        this.width = width;
        this.height = height;
    }

    static FaceFixtures load(String name) throws Exception {
        Map<String, Object> json = (Map<String, Object>) new Parser(read("/face/" + name + ".json")).value();
        BufferedImage img;
        try (InputStream in = FaceFixtures.class.getResourceAsStream("/face/" + json.get("image"))) {
            img = ImageIO.read(in);
        }
        int w = img.getWidth(), h = img.getHeight();
        int[] rgb = img.getRGB(0, 0, w, h, null, 0, w);
        return new FaceFixtures(json, rgb, w, h);
    }

    /** Un JSON des ressources face/ (par exemple affect-vectors.json). */
    static Map<String, Object> resource(String name) throws Exception {
        return (Map<String, Object>) new Parser(read("/face/" + name)).value();
    }

    Map<String, Object> obj(String key) {
        return (Map<String, Object>) json.get(key);
    }

    static double num(Map<String, Object> m, String key) {
        return ((Number) m.get(key)).doubleValue();
    }

    static List<Object> list(Object o) {
        return (List<Object>) o;
    }

    static float[] floats(Object list) {
        List<Object> l = list(list);
        float[] out = new float[l.size()];
        for (int i = 0; i < out.length; i++) out[i] = ((Number) l.get(i)).floatValue();
        return out;
    }

    static double[] doubles(Object list) {
        List<Object> l = list(list);
        double[] out = new double[l.size()];
        for (int i = 0; i < out.length; i++) out[i] = ((Number) l.get(i)).doubleValue();
        return out;
    }

    FaceGeometry.Roi roi(String key) {
        Map<String, Object> r = obj(key);
        return new FaceGeometry.Roi(num(r, "cx"), num(r, "cy"), num(r, "side"), num(r, "rot"));
    }

    /** Sorties du détecteur : logits à −100 hors des ancres gardées dans le vecteur (logit > −8). */
    float[][] detectorOutputs() {
        float[] reg = new float[FaceGeometry.ANCHORS * 16];
        float[] logits = new float[FaceGeometry.ANCHORS];
        java.util.Arrays.fill(logits, -100f);
        for (Object row : list(obj("detector").get("sparse"))) {
            List<Object> r = list(row);
            int i = ((Number) r.get(0)).intValue();
            logits[i] = ((Number) r.get(1)).floatValue();
            for (int k = 0; k < 16; k++) reg[i * 16 + k] = ((Number) r.get(2 + k)).floatValue();
        }
        return new float[][] {reg, logits};
    }

    float[][] landmarkOutputs() {
        Map<String, Object> l = obj("landmarks");
        return new float[][] {floats(l.get("raw")), {(float) num(l, "presence_logit")}};
    }

    float[] blendshapes() {
        return floats(json.get("blendshapes"));
    }

    private static String read(String path) throws Exception {
        try (InputStream in = FaceFixtures.class.getResourceAsStream(path)) {
            if (in == null) throw new IllegalStateException(path + " introuvable");
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            for (int n; (n = in.read(buf)) > 0; ) out.write(buf, 0, n);
            return out.toString(StandardCharsets.UTF_8);
        }
    }

    /** Lecteur JSON minimal (objets, tableaux, nombres, chaînes simples, booléens, null). */
    private static final class Parser {
        private final String s;
        private int i;

        Parser(String s) {
            this.s = s;
        }

        Object value() {
            skip();
            char c = s.charAt(i);
            if (c == '{') {
                Map<String, Object> m = new LinkedHashMap<>();
                i++;
                skip();
                if (s.charAt(i) == '}') { i++; return m; }
                while (true) {
                    skip();
                    String k = (String) value();
                    skip();
                    i++; // ':'
                    m.put(k, value());
                    skip();
                    if (s.charAt(i++) == '}') return m;
                }
            }
            if (c == '[') {
                List<Object> l = new ArrayList<>();
                i++;
                skip();
                if (s.charAt(i) == ']') { i++; return l; }
                while (true) {
                    l.add(value());
                    skip();
                    if (s.charAt(i++) == ']') return l;
                }
            }
            if (c == '"') {
                int end = s.indexOf('"', i + 1);
                String v = s.substring(i + 1, end);
                i = end + 1;
                return v;
            }
            if (s.startsWith("true", i)) { i += 4; return Boolean.TRUE; }
            if (s.startsWith("false", i)) { i += 5; return Boolean.FALSE; }
            if (s.startsWith("null", i)) { i += 4; return null; }
            int start = i;
            while (i < s.length() && "+-0123456789.eE".indexOf(s.charAt(i)) >= 0) i++;
            return Double.parseDouble(s.substring(start, i));
        }

        private void skip() {
            while (i < s.length() && Character.isWhitespace(s.charAt(i))) i++;
        }
    }
}
