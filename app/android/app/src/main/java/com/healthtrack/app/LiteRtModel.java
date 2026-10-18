package com.healthtrack.app;

import com.healthtrack.app.face.FacePipeline;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.HashMap;
import java.util.Map;

import org.tensorflow.lite.Interpreter;
import org.tensorflow.lite.Tensor;

/**
 * Un modèle LiteRT derrière l'interface {@link FacePipeline.Model} (spec journal/protocoles/visage.md §1, §8) :
 * une entrée float32, des sorties rendues dans l'ordre demandé par leur nom (l'ordre des index du fichier n'est pas
 * garanti). Un seul thread, tampons alloués une fois : l'interprète vit tant que le service vit.
 */
public final class LiteRtModel implements FacePipeline.Model, AutoCloseable {

    private final Interpreter interpreter;
    private final ByteBuffer input;
    private final int inputFloats;
    private final int[] outputIndices;
    private final ByteBuffer[] outputs;
    private final Map<Integer, Object> outputMap = new HashMap<>();

    /**
     * @param model       fichier .tflite (de préférence projeté en mémoire)
     * @param outputNames noms des sorties à rendre, dans l'ordre ; aucun = toutes, dans l'ordre des index
     */
    public LiteRtModel(ByteBuffer model, String... outputNames) {
        interpreter = new Interpreter(model, new Interpreter.Options().setNumThreads(1));
        Tensor in = interpreter.getInputTensor(0);
        inputFloats = in.numElements();
        input = ByteBuffer.allocateDirect(in.numBytes()).order(ByteOrder.nativeOrder());
        outputIndices = outputNames.length == 0 ? allOutputs(interpreter) : findOutputs(interpreter, outputNames);
        outputs = new ByteBuffer[outputIndices.length];
        for (int k = 0; k < outputIndices.length; k++) {
            Tensor t = interpreter.getOutputTensor(outputIndices[k]);
            outputs[k] = ByteBuffer.allocateDirect(t.numBytes()).order(ByteOrder.nativeOrder());
            outputMap.put(outputIndices[k], outputs[k]);
        }
    }

    static int[] findOutputs(Interpreter interpreter, String[] names) {
        int[] found = new int[names.length];
        for (int k = 0; k < names.length; k++) {
            found[k] = -1;
            for (int i = 0; i < interpreter.getOutputTensorCount(); i++) {
                if (names[k].equals(interpreter.getOutputTensor(i).name())) found[k] = i;
            }
            if (found[k] < 0) throw new IllegalStateException("sortie « " + names[k] + " » absente du modèle");
        }
        return found;
    }

    private static int[] allOutputs(Interpreter interpreter) {
        int[] all = new int[interpreter.getOutputTensorCount()];
        for (int i = 0; i < all.length; i++) all[i] = i;
        return all;
    }

    public int inputSize() {
        return inputFloats;
    }

    @Override
    public float[][] run(float[] values) {
        if (values.length != inputFloats) {
            throw new IllegalArgumentException("entrée de " + values.length + " valeurs, " + inputFloats + " attendues");
        }
        input.clear();
        input.asFloatBuffer().put(values);
        for (ByteBuffer b : outputs) b.clear();
        interpreter.runForMultipleInputsOutputs(new Object[] {input}, outputMap);
        float[][] result = new float[outputs.length][];
        for (int k = 0; k < outputs.length; k++) {
            outputs[k].rewind();
            result[k] = new float[outputs[k].capacity() / 4];
            outputs[k].asFloatBuffer().get(result[k]);
        }
        return result;
    }

    @Override
    public void close() {
        interpreter.close();
    }
}
