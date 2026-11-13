import Foundation
import HalcyaFace
import TensorFlowLiteC

/// Un modèle .tflite exécuté par TensorFlow Lite C, comme `LiteRtModel.java` d'Android : un seul fil, entrée float32
/// aplatie, sorties choisies par nom (toutes, dans l'ordre, sans nom).
public final class LiteRtModel: FaceModel {
    public enum LoadError: Error {
        case model(String), interpreter, allocation, missingOutput(String)
    }

    private let model: OpaquePointer
    private let options: OpaquePointer
    private let interpreter: OpaquePointer
    private let outputIndices: [Int32]
    /// Nombre de valeurs float32 attendues en entrée.
    public let inputSize: Int

    public init(path: String, outputs names: [String] = []) throws {
        guard let model = TfLiteModelCreateFromFile(path) else { throw LoadError.model(path) }
        guard let options = TfLiteInterpreterOptionsCreate() else {
            TfLiteModelDelete(model)
            throw LoadError.interpreter
        }
        TfLiteInterpreterOptionsSetNumThreads(options, 1)
        guard let interpreter = TfLiteInterpreterCreate(model, options) else {
            TfLiteInterpreterOptionsDelete(options)
            TfLiteModelDelete(model)
            throw LoadError.interpreter
        }
        guard TfLiteInterpreterAllocateTensors(interpreter) == kTfLiteOk else {
            TfLiteInterpreterDelete(interpreter)
            TfLiteInterpreterOptionsDelete(options)
            TfLiteModelDelete(model)
            throw LoadError.allocation
        }
        self.model = model
        self.options = options
        self.interpreter = interpreter
        let count = TfLiteInterpreterGetOutputTensorCount(interpreter)
        if names.isEmpty {
            outputIndices = Array(0..<count)
        } else {
            outputIndices = try names.map { name in
                guard let i = (0..<count).first(where: { String(cString: TfLiteTensorName(TfLiteInterpreterGetOutputTensor(interpreter, $0))) == name })
                else { throw LoadError.missingOutput(name) }
                return i
            }
        }
        inputSize = Int(TfLiteTensorByteSize(TfLiteInterpreterGetInputTensor(interpreter, 0))) / MemoryLayout<Float>.size
    }

    deinit {
        TfLiteInterpreterDelete(interpreter)
        TfLiteInterpreterOptionsDelete(options)
        TfLiteModelDelete(model)
    }

    /// Exécute le modèle ; rend ses sorties aplaties, ou aucune si l'entrée n'a pas la bonne taille ou si l'exécution échoue.
    public func run(_ input: [Float]) -> [[Float]] {
        guard input.count == inputSize else { return [] }
        let tensor = TfLiteInterpreterGetInputTensor(interpreter, 0)
        let copied = input.withUnsafeBytes { TfLiteTensorCopyFromBuffer(tensor, $0.baseAddress, $0.count) }
        guard copied == kTfLiteOk, TfLiteInterpreterInvoke(interpreter) == kTfLiteOk else { return [] }
        return outputIndices.map { i in
            let out = TfLiteInterpreterGetOutputTensor(interpreter, i)
            var values = [Float](repeating: 0, count: Int(TfLiteTensorByteSize(out)) / MemoryLayout<Float>.size)
            _ = values.withUnsafeMutableBytes { TfLiteTensorCopyToBuffer(out, $0.baseAddress, $0.count) }
            return values
        }
    }
}

/// Les 3 modèles du Face Landmarker, comme `FaceModels.java` d'Android (mêmes fichiers, mêmes sorties par nom).
public struct FaceModels {
    public static let detectorFile = "face_detector.tflite"
    public static let landmarksFile = "face_landmarks_detector.tflite"
    public static let blendshapesFile = "face_blendshapes.tflite"

    /// Les 3 modèles vérifiés que la build embarque (`Models/`, rempli par scripts/face-models.sh), ou nil s'il en manque.
    public static var bundledDirectory: URL? {
        guard let dir = Bundle.module.url(forResource: "Models", withExtension: nil) else { return nil }
        let all = [detectorFile, landmarksFile, blendshapesFile].allSatisfy {
            FileManager.default.fileExists(atPath: dir.appendingPathComponent($0).path)
        }
        return all ? dir : nil
    }

    /// Modèles absents de la build.
    public struct Missing: Error {
        public init() {}
    }

    public let detector: LiteRtModel
    public let landmarks: LiteRtModel
    public let blendshapes: LiteRtModel

    /// `directory` : dossier qui contient les 3 fichiers .tflite vérifiés.
    public init(directory: URL) throws {
        detector = try LiteRtModel(path: directory.appendingPathComponent(Self.detectorFile).path, outputs: ["regressors", "classificators"])
        landmarks = try LiteRtModel(path: directory.appendingPathComponent(Self.landmarksFile).path, outputs: ["Identity", "Identity_1"])
        blendshapes = try LiteRtModel(path: directory.appendingPathComponent(Self.blendshapesFile).path)
    }

    public func pipeline() -> FacePipeline {
        FacePipeline(detector: detector, landmarks: landmarks, blendshapes: blendshapes)
    }
}
