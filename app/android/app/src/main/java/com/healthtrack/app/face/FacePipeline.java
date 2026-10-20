package com.healthtrack.app.face;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Enchaînement d'une image (journal/protocoles/visage.md §8) : détecteur (1re image ou visage perdu) → ROI →
 * maillage → qualité → 146 points → blendshapes → indices, puis, si le modèle valence / éveil est présent
 * ({@link FaceAffect}, étape 2 de la consigne du 19/10 au soir), valence et éveil de l'image valide. Avec le second
 * modèle (MobileFaceNet, duo I126), l'image a la moyenne des deux et leur écart de valence, qui entre dans la
 * confiance de l'humeur estimée (« accord entre signaux »). La lumière du visage (luminance moyenne du recadrage,
 * I127b) est gardée pour peser la lecture : une pénombre ou un contre-jour proches des limites la font compter moins,
 * sans jamais entrer dans l'humeur elle-même. Les modèles sont
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
        /** { valence, éveil } de l'image (moyenne du duo s'il a répondu), ou null (pas de modèle, ou son échec). */
        public final double[] affect;
        /** |valence B0 − valence MobileFaceNet| quand les deux modèles ont répondu, sinon NaN. */
        public final double affectGap;
        /** Luminance moyenne du recadrage du visage dans [0, 1] (I127b), NaN si aucun visage n'a été recadré. */
        public final double luminance;

        Frame(Map<String, Double> indices, float[] blendshapes, String rejected, double facePx) {
            this(indices, blendshapes, rejected, facePx, null);
        }

        Frame(Map<String, Double> indices, float[] blendshapes, String rejected, double facePx, double[] affect) {
            this(indices, blendshapes, rejected, facePx, affect, Double.NaN);
        }

        Frame(Map<String, Double> indices, float[] blendshapes, String rejected, double facePx, double[] affect,
              double affectGap) {
            this(indices, blendshapes, rejected, facePx, affect, affectGap, Double.NaN);
        }

        Frame(Map<String, Double> indices, float[] blendshapes, String rejected, double facePx, double[] affect,
              double affectGap, double luminance) {
            this.affectGap = affectGap;
            this.luminance = luminance;
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
    private final Model affect2;
    private FaceGeometry.Roi previous;
    private String lastAffectError;

    public FacePipeline(Model detector, Model landmarks, Model blendshapes) {
        this(detector, landmarks, blendshapes, null);
    }

    /** @param affect modèle valence / éveil (entrée {@link FaceAffect#input}), ou null pour s'en passer */
    public FacePipeline(Model detector, Model landmarks, Model blendshapes, Model affect) {
        this(detector, landmarks, blendshapes, affect, null);
    }

    /**
     * @param affect  modèle B0 ({@link FaceAffect#B0}), ou null
     * @param affect2 modèle MobileFaceNet ({@link FaceAffect#MBF}), ou null ; seul, il sert comme le B0
     */
    public FacePipeline(Model detector, Model landmarks, Model blendshapes, Model affect, Model affect2) {
        this.detector = detector;
        this.landmarks = landmarks;
        this.blendshapes = blendshapes;
        this.affect = affect;
        this.affect2 = affect2;
    }

    public boolean affectEnabled() {
        return affect != null || affect2 != null;
    }

    /** Nombre de modèles valence / éveil branchés (0, 1 ou 2). */
    public int affectModels() {
        return (affect != null ? 1 : 0) + (affect2 != null ? 1 : 0);
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
        double light = FaceIndices.luminance(crop);
        String rejected = FaceIndices.rejectBeforeBlendshapes(presence, facePx, yaw, light);
        previous = presence >= FaceIndices.MIN_PRESENCE ? FaceGeometry.roiFromPoints(pts) : null;
        if (rejected != null) return new Frame(null, null, rejected, facePx);
        float[] bs = blendshapes.run(FaceGeometry.blendshapeInput(pts))[0];
        rejected = FaceIndices.rejectAfterBlendshapes(bs);
        if (rejected != null) return new Frame(null, null, rejected, facePx);
        Map<String, Double> idx = FaceIndices.fromBlendshapes(bs, yaw);
        if (!affectEnabled()) return new Frame(idx, bs, null, facePx, null, Double.NaN, light);
        FaceGeometry.Roi faceRoi = FaceAffect.roi(pts);
        double[] a = affect(affect, FaceAffect.B0, "", rgb, width, height, faceRoi);
        double[] b = affect(affect2, FaceAffect.MBF, "mbf:", rgb, width, height, faceRoi);
        if (a != null && b != null) {
            return new Frame(idx, bs, null, facePx, new double[] {(a[0] + b[0]) / 2, (a[1] + b[1]) / 2},
                Math.abs(a[0] - b[0]), light);
        }
        return new Frame(idx, bs, null, facePx, a != null ? a : b, Double.NaN, light);
    }

    /** Valence et éveil d'une image valide par un modèle ; un échec du modèle ne fait jamais perdre la lecture. */
    private double[] affect(Model model, FaceAffect.Spec spec, String tag, int[] rgb, int width, int height,
                            FaceGeometry.Roi roi) {
        if (model == null) return null;
        try {
            double[] va = FaceAffect.decode(model.run(FaceAffect.input(spec, rgb, width, height, roi))[0]);
            if (va == null) lastAffectError = tag + "bad_output";
            return va;
        } catch (RuntimeException e) {
            lastAffectError = tag + e.getClass().getSimpleName() + ": " + e.getMessage();
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
        List<Double> gaps = new ArrayList<>();
        List<Double> lights = new ArrayList<>();
        for (int[] rgb : images) {
            Frame f = analyze(rgb, width, height);
            if (f.rejected != null) {
                if (rejections != null) rejections.add(f.rejected);
                continue;
            }
            indices.add(f.indices);
            coefficients.add(f.blendshapes);
            if (f.affect != null) affects.add(f.affect);
            if (!Double.isNaN(f.affectGap)) gaps.add(f.affectGap);
            if (!Double.isNaN(f.luminance)) lights.add(f.luminance);
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
        if (b != null && !gaps.isEmpty()) {
            double[] g = new double[gaps.size()];
            for (int i = 0; i < g.length; i++) g[i] = gaps.get(i);
            // Désaccord du duo : médiane des écarts de valence image par image (I126), lu dans la confiance.
            b.values.put("affectGap", FaceIndices.median(g));
            b.values.put("affectModels", 2.0);
        }
        if (b != null && !lights.isEmpty()) {
            double[] l = new double[lights.size()];
            for (int i = 0; i < l.length; i++) l[i] = lights.get(i);
            // Lumière des images valides (I127b) : qualité de la lecture, lue dans son poids, jamais dans l'humeur.
            b.values.put("light", FaceIndices.median(l));
        }
        return b;
    }
}
