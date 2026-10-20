package com.healthtrack.app;

import com.healthtrack.app.face.FacePipeline;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;
import java.util.Collections;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OnnxValue;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;

/**
 * Un modèle ONNX Runtime derrière l'interface {@link FacePipeline.Model} : une entrée float32 de forme fixe, la
 * première sortie rendue aplatie. Sert au modèle valence / éveil (FaceAffectModel), publié en ONNX par ses auteurs :
 * on l'exécute tel quel plutôt que de le convertir (aucun poids modifié ni redistribué). CPU, 2 fils.
 * Les erreurs d'ONNX Runtime remontent en RuntimeException : le pipeline garde alors la lecture sans valence.
 */
public final class OnnxModel implements FacePipeline.Model, AutoCloseable {

    private final OrtEnvironment env;
    private final OrtSession session;
    private final String inputName;
    private final long[] shape;
    private final FloatBuffer input;

    public OnnxModel(String path, long[] shape) throws OrtException {
        env = OrtEnvironment.getEnvironment();
        try (OrtSession.SessionOptions options = new OrtSession.SessionOptions()) {
            options.setIntraOpNumThreads(2);
            options.setOptimizationLevel(OrtSession.SessionOptions.OptLevel.ALL_OPT);
            session = env.createSession(path, options);
        }
        inputName = session.getInputNames().iterator().next();
        this.shape = shape.clone();
        long n = 1;
        for (long d : shape) n *= d;
        input = ByteBuffer.allocateDirect((int) n * 4).order(ByteOrder.nativeOrder()).asFloatBuffer();
    }

    @Override
    public float[][] run(float[] data) {
        input.clear();
        input.put(data);
        input.flip();
        try (OnnxTensor tensor = OnnxTensor.createTensor(env, input, shape);
             OrtSession.Result result = session.run(Collections.singletonMap(inputName, tensor))) {
            OnnxValue out = result.get(0);
            Object value = out.getValue();
            if (value instanceof float[][]) return new float[][] {((float[][]) value)[0]};
            if (value instanceof float[]) return new float[][] {(float[]) value};
            throw new IllegalStateException("sortie inattendue " + (value == null ? "null" : value.getClass().getSimpleName()));
        } catch (OrtException e) {
            throw new IllegalStateException(e.getMessage(), e);
        }
    }

    @Override
    public void close() {
        try {
            session.close();
        } catch (OrtException ignored) {
            // rien à faire : le service s'arrête
        }
    }
}
