package com.healthtrack.app.face;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Enchaînement d'une image (journal/protocoles/visage.md §8) : détecteur (1re image ou visage perdu) → ROI →
 * maillage → qualité → 146 points → blendshapes → indices, puis, si le modèle valence / éveil est présent
 * ({@link FaceAffect}, étape 2 de la consigne du 19/10 au soir), valence et éveil de l'image valide. Les modèles sont
 * derrière {@link Model} :
 * LiteRT sur le téléphone (étape suivante), sorties figées dans les tests JVM. Le pipeline ne garde que la ROI
 * de l'image précédente ; aucune image, aucun point n'est conservé ni rendu à l'appelant.
 */
public final class FacePipeline {

    /** Un modèle : un tenseur d'entrée aplati → ses sorties aplaties, dans l'ordre des sorties du modèle. */
    public interface Model {
        float[][] run(float[] input);
    }

    /** Ce qu'on retient d'une image : indices et coefficients si elle est valide, sinon la raison du rejet. */
    public static final class Frame {
        public final Map<String, Double> indices;
        public final float[] blendshapes;
        public final String rejected;
        public final double facePx;
        /** { valence, éveil } de l'image, ou null (pas de modèle valence / éveil, ou son échec). */
        public final double[] affect;

        Frame(Map<String, Double> indices, float[] blendshapes, String rejected, double facePx) {
            this(indices, blendshapes, rejected, facePx, null);
        }

        Frame(Map<String, Double> indices, float[] blendshapes, String rejected, double facePx, double[] affect) {
            this.indices = indices;
            this.blendshapes = blendshapes;
            this.rejected = rejected;
            this.facePx = facePx;
            this.affect = affect;
        }
    }

    private final Model detector;
    private final Model landmarks;
    private final Model blendshapes;
    private final Model affect;
    private FaceGeometry.Roi previous;
    private String lastAffectError;

    public FacePipeline(Model detector, Model landmarks, Model blendshapes) {
        this(detector, landmarks, blendshapes, null);
    }

    /** @param affect modèle valence / éveil (entrée {@link FaceAffect#input}), ou null pour s'en passer */
    public FacePipeline(Model detector, Model landmarks, Model blendshapes, Model affect) {
        this.detector = detector;
        this.landmarks = landmarks;
        this.blendshapes = blendshapes;
        this.affect = affect;
    }

    public boolean affectEnabled() {
        return affect != null;
    }

    /** Erreur du modèle valence / éveil pendant la dernière rafale (classe : message), pour le diagnostic ; sinon null. */
    public String lastAffectError() {
        return lastAffectError;
    }

    /** Oublie le visage suivi : la prochaine image repasse par le détecteur (nouvelle rafale). */
    public void reset() {
        previous = null;
    }

    /** Analyse une image RVB (0xRRGGBB, déjà tournée à l'endroit). */
    public Frame analyze(int[] rgb, int width, int height) {
        FaceGeometry.Roi roi = previous;
        if (roi == null) {
            float[] input = FaceGeometry.crop(rgb, width, height, FaceGeometry.letterbox(width, height),
                FaceGeometry.DETECTOR_SIZE, -1f, 1f);
            float[][] out = detector.run(input);
            FaceGeometry.Detection d = FaceGeometry.decode(out[0], out[1], width, height);
            if (d == null) return new Frame(null, null, FaceIndices.NO_FACE, 0);
            roi = FaceGeometry.roiFromDetection(d);
        }
        float[] crop = FaceGeometry.crop(rgb, width, height, roi, FaceGeometry.LANDMARK_SIZE, 0f, 1f);
        float[][] out = landmarks.run(crop);
        double presence = 1 / (1 + Math.exp(-out[1][0]));
        double[] pts = FaceGeometry.toImage(out[0], roi);
        double facePx = FaceGeometry.faceSize(pts);
        double yaw = FaceGeometry.yawDegrees(pts);
        String rejected = FaceIndices.rejectBeforeBlendshapes(presence, facePx, yaw, FaceIndices.luminance(crop));
        previous = presence >= FaceIndices.MIN_PRESENCE ? FaceGeometry.roiFromPoints(pts) : null;
        if (rejected != null) return new Frame(null, null, rejected, facePx);
        float[] bs = blendshapes.run(FaceGeometry.blendshapeInput(pts))[0];
        rejected = FaceIndices.rejectAfterBlendshapes(bs);
        if (rejected != null) return new Frame(null, null, rejected, facePx);
        return new Frame(FaceIndices.fromBlendshapes(bs, yaw), bs, null, facePx, affect(rgb, width, height, pts));
    }

    /** Valence et éveil d'une image valide ; un échec du modèle ne fait jamais perdre la lecture. */
    private double[] affect(int[] rgb, int width, int height, double[] pts) {
        if (affect == null) return null;
        try {
            double[] va = FaceAffect.decode(affect.run(FaceAffect.input(rgb, width, height, FaceAffect.roi(pts)))[0]);
            if (va == null) lastAffectError = "bad_output";
            return va;
        } catch (RuntimeException e) {
            lastAffectError = e.getClass().getSimpleName() + ": " + e.getMessage();
            return null;
        }
    }

    /** Analyse une rafale (images dans l'ordre) et rend son agrégat, ou null si aucune image valide. */
    public FaceIndices.Burst burst(List<int[]> images, int width, int height, List<String> rejections) {
        reset();
        lastAffectError = null;
        List<Map<String, Double>> indices = new ArrayList<>();
        List<float[]> coefficients = new ArrayList<>();
        List<double[]> affects = new ArrayList<>();
        for (int[] rgb : images) {
            Frame f = analyze(rgb, width, height);
            if (f.rejected != null) {
                if (rejections != null) rejections.add(f.rejected);
                continue;
            }
            indices.add(f.indices);
            coefficients.add(f.blendshapes);
            if (f.affect != null) affects.add(f.affect);
        }
        FaceIndices.Burst b = FaceIndices.burst(indices, coefficients, images.size());
        if (b != null && !affects.isEmpty()) {
            double[] v = new double[affects.size()], a = new double[affects.size()];
            for (int i = 0; i < v.length; i++) {
                v[i] = affects.get(i)[0];
                a[i] = affects.get(i)[1];
            }
            b.values.put("valence", FaceIndices.median(v));
            b.values.put("arousal", FaceIndices.median(a));
            b.values.put("affectFrames", (double) v.length);
        }
        return b;
    }
}
