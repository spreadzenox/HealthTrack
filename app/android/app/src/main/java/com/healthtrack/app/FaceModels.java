package com.healthtrack.app;

import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;

import com.healthtrack.app.face.FacePipeline;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;

/**
 * Les trois modèles du Face Landmarker (spec journal/protocoles/visage.md §1), rangés dans les assets « face/ » par la
 * tâche Gradle {@code faceModels} (téléchargés au build, SHA-256 vérifiés, jamais committés). Stockés sans
 * compression dans l'APK : projetés en mémoire, sans copie.
 */
public final class FaceModels implements AutoCloseable {

    static final String DIR = "face/";
    static final String DETECTOR = "face_detector.tflite";
    static final String LANDMARKS = "face_landmarks_detector.tflite";
    static final String BLENDSHAPES = "face_blendshapes.tflite";

    public final LiteRtModel detector;
    public final LiteRtModel landmarks;
    public final LiteRtModel blendshapes;

    private FaceModels(LiteRtModel detector, LiteRtModel landmarks, LiteRtModel blendshapes) {
        this.detector = detector;
        this.landmarks = landmarks;
        this.blendshapes = blendshapes;
    }

    public static FaceModels open(AssetManager assets) throws IOException {
        LiteRtModel det = new LiteRtModel(map(assets, DETECTOR), "regressors", "classificators");
        try {
            LiteRtModel lmk = new LiteRtModel(map(assets, LANDMARKS), "Identity", "Identity_1");
            try {
                return new FaceModels(det, lmk, new LiteRtModel(map(assets, BLENDSHAPES)));
            } catch (IOException | RuntimeException e) {
                lmk.close();
                throw e;
            }
        } catch (IOException | RuntimeException e) {
            det.close();
            throw e;
        }
    }

    /** Vrai si l'APK contient les trois modèles (absents d'un build hors ligne sans cache). */
    public static boolean available(AssetManager assets) {
        for (String name : new String[] {DETECTOR, LANDMARKS, BLENDSHAPES}) {
            try (AssetFileDescriptor fd = assets.openFd(DIR + name)) {
                if (fd.getLength() <= 0) return false;
            } catch (IOException e) {
                return false;
            }
        }
        return true;
    }

    public FacePipeline pipeline() {
        return new FacePipeline(detector, landmarks, blendshapes);
    }

    /** Pipeline avec le modèle valence / éveil (FaceAffectModel), ou sans s'il est null. */
    public FacePipeline pipeline(FacePipeline.Model affect) {
        return new FacePipeline(detector, landmarks, blendshapes, affect);
    }

    /** Pipeline avec le duo valence / éveil (B0, MobileFaceNet), chacun pouvant manquer (null). */
    public FacePipeline pipeline(FacePipeline.Model affect, FacePipeline.Model affect2) {
        return new FacePipeline(detector, landmarks, blendshapes, affect, affect2);
    }

    private static ByteBuffer map(AssetManager assets, String name) throws IOException {
        try (AssetFileDescriptor fd = assets.openFd(DIR + name);
             FileInputStream in = new FileInputStream(fd.getFileDescriptor());
             FileChannel channel = in.getChannel()) {
            return channel.map(FileChannel.MapMode.READ_ONLY, fd.getStartOffset(), fd.getDeclaredLength());
        }
    }

    @Override
    public void close() {
        detector.close();
        landmarks.close();
        blendshapes.close();
    }
}
