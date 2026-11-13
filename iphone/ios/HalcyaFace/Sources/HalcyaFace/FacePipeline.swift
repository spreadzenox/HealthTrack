import Foundation

/// Un modèle : un tenseur d'entrée aplati → ses sorties aplaties, dans l'ordre des sorties du modèle (moteur sur
/// l'iPhone, sorties figées dans les tests).
public protocol FaceModel: AnyObject {
    func run(_ input: [Float]) -> [[Float]]
}

/// Enchaînement d'une image et d'une rafale, comme `FacePipeline.java` d'Android (visage.md §8) : détecteur (1re image
/// ou visage perdu) → ROI → maillage → qualité → 146 points → blendshapes → indices, et la lumière du visage pour peser
/// la lecture. Valence et éveil (HSEmotion) ne sont pas branchés sur iPhone tant que la licence de leurs poids n'est
/// pas tranchée (`journal/DEMANDES.md`). Ne garde que la ROI de l'image précédente : aucune image, aucun point.
public final class FacePipeline {
    /// Ce qu'on retient d'une image : indices et coefficients si elle est valide, sinon la raison du rejet.
    public struct Frame {
        public let indices: [String: Double]?
        public let blendshapes: [Float]?
        public let rejected: FaceIndices.Reject?
        public let facePx: Double
        /// Luminance moyenne du recadrage du visage dans [0, 1], NaN hors des images valides.
        public let luminance: Double
    }

    private let detector: FaceModel
    private let landmarks: FaceModel
    private let blendshapes: FaceModel
    private var previous: FaceGeometry.Roi?

    public init(detector: FaceModel, landmarks: FaceModel, blendshapes: FaceModel) {
        self.detector = detector
        self.landmarks = landmarks
        self.blendshapes = blendshapes
    }

    /// Oublie le visage suivi : la prochaine image repasse par le détecteur (nouvelle rafale).
    public func reset() {
        previous = nil
    }

    /// Analyse une image RVB (0xRRGGBB, déjà tournée à l'endroit).
    public func analyze(_ rgb: [UInt32], width: Int, height: Int) -> Frame {
        let roi: FaceGeometry.Roi
        if let previous {
            roi = previous
        } else {
            let input = FaceGeometry.crop(rgb: rgb, width: width, height: height, roi: FaceGeometry.letterbox(width: width, height: height),
                                          size: FaceGeometry.detectorSize, lo: -1, hi: 1)
            let out = detector.run(input)
            guard let d = FaceGeometry.decode(regressors: out[0], logits: out[1], width: width, height: height) else {
                return Frame(indices: nil, blendshapes: nil, rejected: .noFace, facePx: 0, luminance: .nan)
            }
            roi = FaceGeometry.roi(from: d)
        }
        let crop = FaceGeometry.crop(rgb: rgb, width: width, height: height, roi: roi, size: FaceGeometry.landmarkSize, lo: 0, hi: 1)
        let out = landmarks.run(crop)
        let presence = 1 / (1 + exp(-Double(out[1][0])))
        let pts = FaceGeometry.toImage(out[0], roi: roi)
        let facePx = FaceGeometry.faceSize(pts)
        let yaw = FaceGeometry.yawDegrees(pts)
        let light = FaceIndices.luminance(crop)
        previous = presence >= FaceIndices.minPresence ? FaceGeometry.roi(fromPoints: pts) : nil
        if let rejected = FaceIndices.rejectBeforeBlendshapes(presence: presence, facePx: facePx, yawDeg: yaw, luminance: light) {
            return Frame(indices: nil, blendshapes: nil, rejected: rejected, facePx: facePx, luminance: .nan)
        }
        let bs = blendshapes.run(FaceGeometry.blendshapeInput(pts))[0]
        if let rejected = FaceIndices.rejectAfterBlendshapes(bs) {
            return Frame(indices: nil, blendshapes: nil, rejected: rejected, facePx: facePx, luminance: .nan)
        }
        return Frame(indices: FaceIndices.fromBlendshapes(bs, yawDeg: yaw), blendshapes: bs, rejected: nil, facePx: facePx, luminance: light)
    }

    /// Analyse une rafale (images dans l'ordre) et rend son agrégat, ou nil si aucune image valide ; `rejections`
    /// reçoit la raison de chaque image rejetée.
    public func burst(_ images: [[UInt32]], width: Int, height: Int, rejections: inout [String]) -> FaceIndices.Burst? {
        reset()
        var indices: [[String: Double]] = [], coefficients: [[Float]] = [], lights: [Double] = []
        for rgb in images {
            let f = analyze(rgb, width: width, height: height)
            if let rejected = f.rejected {
                rejections.append(rejected.rawValue)
                continue
            }
            indices.append(f.indices!)
            coefficients.append(f.blendshapes!)
            if !f.luminance.isNaN { lights.append(f.luminance) }
        }
        guard var b = FaceIndices.burst(indices: indices, blendshapes: coefficients, frames: images.count) else { return nil }
        // Lumière des images valides : qualité de la lecture, lue dans son poids, jamais dans l'humeur.
        if !lights.isEmpty { b.set("light", FaceIndices.median(lights)) }
        return b
    }
}
