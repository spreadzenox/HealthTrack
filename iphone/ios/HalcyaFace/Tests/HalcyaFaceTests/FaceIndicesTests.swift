import XCTest
@testable import HalcyaFace

/// Mêmes cas que `FaceIndicesTest.java` d'Android : indices par unités d'action, contrôle qualité et rafale.
final class FaceIndicesTests: XCTestCase {
    static func coefficients() -> [Float] {
        var bs = [Float](repeating: 0, count: 52)
        bs[FaceIndices.mouthSmileL] = 0.8
        bs[FaceIndices.mouthSmileR] = 0.6
        bs[FaceIndices.cheekSquintL] = 0.3
        bs[FaceIndices.cheekSquintR] = 0.5
        bs[FaceIndices.browDownL] = 0.1
        bs[FaceIndices.browDownR] = 0.3
        bs[FaceIndices.browInnerUp] = 0.25
        bs[FaceIndices.mouthFrownL] = 0.02
        bs[FaceIndices.mouthFrownR] = 0.04
        bs[FaceIndices.eyeBlinkL] = 0.2
        bs[FaceIndices.eyeBlinkR] = 0.4
        bs[FaceIndices.jawOpen] = 0.05
        return bs
    }

    func testIndicesMoyennesGaucheDroiteParUniteDAction() {
        let i = FaceIndices.fromBlendshapes(Self.coefficients(), yawDeg: -4.5)
        XCTAssertEqual(i["smile"]!, 0.7, accuracy: 1e-6)
        XCTAssertEqual(i["duchenne"]!, 0.4, accuracy: 1e-6) // min(sourire, joues)
        XCTAssertEqual(i["browDown"]!, 0.2, accuracy: 1e-6)
        XCTAssertEqual(i["browInnerUp"]!, 0.25, accuracy: 1e-6)
        XCTAssertEqual(i["mouthFrown"]!, 0.03, accuracy: 1e-6)
        XCTAssertEqual(i["eyeOpen"]!, 0.7, accuracy: 1e-6)
        XCTAssertEqual(i["jawOpen"]!, 0.05, accuracy: 1e-6)
        XCTAssertEqual(i["asymmetry"]!, 0.2, accuracy: 1e-6)
        XCTAssertEqual(i["yaw"]!, -4.5, accuracy: 1e-9)
        XCTAssertEqual(Set(i.keys), Set(FaceIndices.names))
    }

    func testAucunIndiceNeDitBonOuMauvais() {
        for n in FaceIndices.names {
            let l = n.lowercased()
            XCTAssertFalse(l.contains("mood") || l.contains("happy") || l.contains("sad") || l.contains("score"), n)
        }
    }

    func testControleQualiteDansLOrdre() {
        XCTAssertNil(FaceIndices.rejectBeforeBlendshapes(presence: 0.99, facePx: 120, yawDeg: 5, luminance: 0.5))
        XCTAssertEqual(FaceIndices.rejectBeforeBlendshapes(presence: 0.85, facePx: 120, yawDeg: 5, luminance: 0.5), .lowPresence)
        XCTAssertEqual(FaceIndices.rejectBeforeBlendshapes(presence: 0.99, facePx: 60, yawDeg: 5, luminance: 0.5), .tooSmall)
        XCTAssertEqual(FaceIndices.rejectBeforeBlendshapes(presence: 0.99, facePx: 120, yawDeg: -35, luminance: 0.5), .turned)
        XCTAssertEqual(FaceIndices.rejectBeforeBlendshapes(presence: 0.99, facePx: 120, yawDeg: 5, luminance: 0.1), .tooDark)
        XCTAssertEqual(FaceIndices.rejectBeforeBlendshapes(presence: 0.99, facePx: 120, yawDeg: 5, luminance: 0.95), .tooBright)
        var bs = Self.coefficients()
        XCTAssertNil(FaceIndices.rejectAfterBlendshapes(bs))
        bs[FaceIndices.jawOpen] = 0.6
        XCTAssertEqual(FaceIndices.rejectAfterBlendshapes(bs), .talking)
        XCTAssertEqual(FaceIndices.Reject.talking.rawValue, "talking")
    }

    func testLuminanceRec601() {
        XCTAssertEqual(FaceIndices.luminance([1, 0, 0]), 0.299, accuracy: 1e-6)
        XCTAssertEqual(FaceIndices.luminance([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]), 0.5, accuracy: 1e-6)
    }

    func testRafaleMedianesEtMobilite() throws {
        let a = Self.coefficients()
        var b = Self.coefficients(), c = Self.coefficients()
        b[FaceIndices.mouthSmileL] = 0.1
        b[FaceIndices.mouthSmileR] = 0.1
        c[FaceIndices.mouthSmileL] = 0.5
        c[FaceIndices.mouthSmileR] = 0.5
        let idx = [FaceIndices.fromBlendshapes(a, yawDeg: 0), FaceIndices.fromBlendshapes(b, yawDeg: 2), FaceIndices.fromBlendshapes(c, yawDeg: 4)]
        let burst = try XCTUnwrap(FaceIndices.burst(indices: idx, blendshapes: [a, b, c], frames: 4))
        XCTAssertEqual(burst.values["smile"]!, 0.5, accuracy: 1e-6)
        XCTAssertEqual(burst.values["yaw"]!, 2, accuracy: 1e-9)
        XCTAssertEqual(burst.valid, 3)
        XCTAssertEqual(burst.frames, 4)
        // a → b : 0,7 + 0,5 ; b → c : 0,4 + 0,4 → 2,0 / (2 × 52)
        XCTAssertEqual(burst.values["mobility"]!, 2.0 / 104, accuracy: 1e-6)
    }

    func testRafaleDUneImageSansMobilite() throws {
        let a = Self.coefficients()
        let b = try XCTUnwrap(FaceIndices.burst(indices: [FaceIndices.fromBlendshapes(a, yawDeg: 0)], blendshapes: [a], frames: 3))
        XCTAssertNil(b.values["mobility"])
        XCTAssertNil(FaceIndices.burst(indices: [], blendshapes: [], frames: 3))
    }

    func testMedianeDUnNombrePairEstLaMoyenne() {
        XCTAssertEqual(FaceIndices.median([4, 1, 3, 2]), 2.5, accuracy: 1e-12)
    }
}
