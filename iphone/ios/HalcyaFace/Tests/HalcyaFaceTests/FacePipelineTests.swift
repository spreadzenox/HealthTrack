import XCTest
@testable import HalcyaFace

/// Mêmes scénarios que `FacePipelineTest.java` d'Android (hors valence et éveil, éteints sur iPhone), avec les modèles
/// remplacés par leurs sorties figées.
final class FacePipelineTests: XCTestCase {
    /// Modèle simulé : rend toujours les mêmes sorties et garde la dernière entrée reçue.
    final class Fixed: FaceModel {
        let outputs: [[Float]]
        var lastInput: [Float] = []
        var calls = 0
        init(_ outputs: [Float]...) { self.outputs = outputs }
        func run(_ input: [Float]) -> [[Float]] {
            lastInput = input
            calls += 1
            return outputs
        }
    }

    static func detector(_ f: FaceGeometryTests.Fixture) throws -> Fixed {
        let out = try FaceDetectionTests.detectorOutputs(f)
        return Fixed(out.regressors, out.logits)
    }

    static func landmarks(_ f: FaceGeometryTests.Fixture, presence: Float? = nil) throws -> Fixed {
        let l = try XCTUnwrap(f.json["landmarks"] as? [String: Any])
        let logit = Float(try XCTUnwrap(l["presence_logit"] as? Double))
        return Fixed(try FaceDetectionTests.raw(f), [presence ?? logit])
    }

    static func coefficients(_ f: FaceGeometryTests.Fixture) throws -> [Float] {
        try XCTUnwrap(f.json["blendshapes"] as? [Double]).map { Float($0) }
    }

    func testAnalyseUneImageDeBoutEnBout() throws {
        let f = try FaceGeometryTests.load("face-tilted")
        let det = try Self.detector(f), lmk = try Self.landmarks(f), bsm = Fixed(try Self.coefficients(f))
        let frame = FacePipeline(detector: det, landmarks: lmk, blendshapes: bsm).analyze(f.rgb, width: f.width, height: f.height)
        XCTAssertNil(frame.rejected)
        XCTAssertEqual(det.lastInput.count, 128 * 128 * 3)
        XCTAssertEqual(lmk.lastInput.count, 256 * 256 * 3)
        let subset = try XCTUnwrap(f.json["subset"] as? [Double])
        for i in 0..<subset.count { XCTAssertEqual(Double(bsm.lastInput[i]), subset[i], accuracy: 2e-3) }
        let bs = try Self.coefficients(f)
        XCTAssertEqual(frame.blendshapes, bs)
        XCTAssertEqual(frame.indices!["smile"]!, Double(bs[44] + bs[45]) / 2, accuracy: 1e-6)
        XCTAssertEqual(Set(frame.indices!.keys), Set(FaceIndices.names))
    }

    func testImageSuivanteSuitLeVisageSansLeDetecteur() throws {
        let f = try FaceGeometryTests.load("face-frontal")
        let det = try Self.detector(f), lmk = try Self.landmarks(f)
        let p = FacePipeline(detector: det, landmarks: lmk, blendshapes: Fixed(try Self.coefficients(f)))
        _ = p.analyze(f.rgb, width: f.width, height: f.height)
        _ = p.analyze(f.rgb, width: f.width, height: f.height)
        XCTAssertEqual(det.calls, 1)
        XCTAssertEqual(lmk.calls, 2)
        p.reset()
        _ = p.analyze(f.rgb, width: f.width, height: f.height)
        XCTAssertEqual(det.calls, 2)
    }

    func testSansVisagePasDeMaillage() throws {
        let f = try FaceGeometryTests.load("face-frontal")
        let lmk = try Self.landmarks(f)
        let frame = FacePipeline(detector: Fixed([Float](repeating: 0, count: 896 * 16), [Float](repeating: -100, count: 896)),
                                 landmarks: lmk, blendshapes: Fixed(try Self.coefficients(f))).analyze(f.rgb, width: f.width, height: f.height)
        XCTAssertEqual(frame.rejected, .noFace)
        XCTAssertNil(frame.indices)
        XCTAssertEqual(lmk.calls, 0)
    }

    func testPresenceFaibleRejeteeEtDetecteurRelance() throws {
        let f = try FaceGeometryTests.load("face-frontal")
        let det = try Self.detector(f), bsm = Fixed(try Self.coefficients(f))
        let p = FacePipeline(detector: det, landmarks: try Self.landmarks(f, presence: 0), blendshapes: bsm)
        XCTAssertEqual(p.analyze(f.rgb, width: f.width, height: f.height).rejected, .lowPresence)
        _ = p.analyze(f.rgb, width: f.width, height: f.height)
        XCTAssertEqual(det.calls, 2)
        XCTAssertEqual(bsm.calls, 0)
    }

    func testBoucheOuverteRejeteeCommeParole() throws {
        let f = try FaceGeometryTests.load("face-frontal")
        var bs = try Self.coefficients(f)
        bs[FaceIndices.jawOpen] = 0.7
        let frame = FacePipeline(detector: try Self.detector(f), landmarks: try Self.landmarks(f), blendshapes: Fixed(bs))
            .analyze(f.rgb, width: f.width, height: f.height)
        XCTAssertEqual(frame.rejected, .talking)
    }

    func testImageNoireTropSombre() throws {
        let f = try FaceGeometryTests.load("face-frontal")
        let black = [UInt32](repeating: 0, count: f.rgb.count)
        let frame = FacePipeline(detector: try Self.detector(f), landmarks: try Self.landmarks(f), blendshapes: Fixed(try Self.coefficients(f)))
            .analyze(black, width: f.width, height: f.height)
        XCTAssertEqual(frame.rejected, .tooDark)
    }

    func testRafaleGardeLesMedianesEtCompteLesRejets() throws {
        let f = try FaceGeometryTests.load("face-frontal")
        let p = FacePipeline(detector: try Self.detector(f), landmarks: try Self.landmarks(f), blendshapes: Fixed(try Self.coefficients(f)))
        var rejected: [String] = []
        let b = try XCTUnwrap(p.burst([f.rgb, [UInt32](repeating: 0, count: f.rgb.count), f.rgb], width: f.width, height: f.height, rejections: &rejected))
        XCTAssertEqual(b.frames, 3)
        XCTAssertEqual(b.valid, 2)
        XCTAssertEqual(rejected, ["too_dark"])
        XCTAssertEqual(b.values["mobility"]!, 0, accuracy: 1e-9)
        let one = FaceIndices.fromBlendshapes(try Self.coefficients(f), yawDeg: b.values["yaw"]!)
        XCTAssertEqual(b.values["smile"]!, one["smile"]!, accuracy: 1e-9)
        XCTAssertGreaterThan(b.values["eyeOpen"]!, 0.5)
        // Lumière des seules images valides (l'image noire rejetée n'y entre pas), dans les limites acceptées.
        let light = b.values["light"]!
        XCTAssertTrue(light >= FaceIndices.minLuminance && light <= FaceIndices.maxLuminance, "lumière \(light)")
        // Une seule image : la lumière de la rafale est celle de l'image (même recadrage par le détecteur).
        var none: [String] = []
        let one1 = try XCTUnwrap(p.burst([f.rgb], width: f.width, height: f.height, rejections: &none))
        p.reset()
        XCTAssertEqual(p.analyze(f.rgb, width: f.width, height: f.height).luminance, one1.values["light"]!, accuracy: 1e-9)
        // Ordre d'export d'Android : les indices, la mobilité, puis la lumière.
        XCTAssertEqual(b.keys, FaceIndices.names + ["mobility", "light"])
    }

    func testSansModeleValenceEveilRienNEstEcrit() throws {
        let f = try FaceGeometryTests.load("face-frontal")
        let p = FacePipeline(detector: try Self.detector(f), landmarks: try Self.landmarks(f), blendshapes: Fixed(try Self.coefficients(f)))
        var rejected: [String] = []
        let b = try XCTUnwrap(p.burst([f.rgb, f.rgb], width: f.width, height: f.height, rejections: &rejected))
        XCTAssertNil(b.values["valence"])
        XCTAssertNil(b.values["affectFrames"])
    }
}
