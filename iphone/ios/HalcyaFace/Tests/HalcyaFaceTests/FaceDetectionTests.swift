import Foundation
import XCTest
@testable import HalcyaFace

/// Mêmes cas et mêmes tolérances que `FaceGeometryTest.java` d'Android (détecteur, ROI, points, blendshapes).
final class FaceDetectionTests: XCTestCase {
    typealias Fixture = FaceGeometryTests.Fixture

    /// Sorties du détecteur : logits à −100 hors des ancres gardées dans le vecteur (logit > −8).
    static func detectorOutputs(_ f: Fixture) throws -> (regressors: [Float], logits: [Float]) {
        var reg = [Float](repeating: 0, count: 896 * 16)
        var logits = [Float](repeating: -100, count: 896)
        let detector = try XCTUnwrap(f.json["detector"] as? [String: Any])
        for row in try XCTUnwrap(detector["sparse"] as? [[Double]]) {
            let i = Int(row[0])
            logits[i] = Float(row[1])
            for k in 0..<16 { reg[i * 16 + k] = Float(row[2 + k]) }
        }
        return (reg, logits)
    }

    static func roi(_ f: Fixture, _ key: String) throws -> FaceGeometry.Roi {
        let r = try XCTUnwrap(f.json[key] as? [String: Double])
        return FaceGeometry.Roi(cx: r["cx"]!, cy: r["cy"]!, side: r["side"]!, rot: r["rot"]!)
    }

    static func raw(_ f: Fixture) throws -> [Float] {
        let l = try XCTUnwrap(f.json["landmarks"] as? [String: Any])
        return try XCTUnwrap(l["raw"] as? [Double]).map { Float($0) }
    }

    func assertRoi(_ expected: FaceGeometry.Roi, _ actual: FaceGeometry.Roi, _ name: String, file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertEqual(actual.cx, expected.cx, accuracy: 1e-3, "\(name) cx", file: file, line: line)
        XCTAssertEqual(actual.cy, expected.cy, accuracy: 1e-3, "\(name) cy", file: file, line: line)
        XCTAssertEqual(actual.side, expected.side, accuracy: 1e-3, "\(name) côté", file: file, line: line)
        XCTAssertEqual(actual.rot, expected.rot, accuracy: 1e-5, "\(name) rotation", file: file, line: line)
    }

    func testDecodeEtFusionneLesBoitesDuDetecteur() throws {
        for name in ["face-frontal", "face-tilted"] {
            let f = try FaceGeometryTests.load(name)
            let out = try Self.detectorOutputs(f)
            let d = try XCTUnwrap(FaceGeometry.decode(regressors: out.regressors, logits: out.logits, width: f.width, height: f.height), name)
            let e = try XCTUnwrap(f.json["detection"] as? [String: Any])
            XCTAssertEqual(d.score, e["score"] as! Double, accuracy: 1e-4, name)
            XCTAssertEqual(d.boxes, e["boxes"] as? Int, name)
            for (value, key) in [(d.cx, "cx"), (d.cy, "cy"), (d.w, "w"), (d.h, "h")] {
                XCTAssertEqual(value, e[key] as! Double, accuracy: 1e-3, "\(name) \(key)")
            }
            let kp = try XCTUnwrap(e["keypoints"] as? [Double])
            for k in 0..<12 { XCTAssertEqual(d.keypoints[k], kp[k], accuracy: 1e-3, "\(name) kp\(k)") }
        }
    }

    func testAucunVisageQuandTousLesScoresSontSousUnDemi() {
        XCTAssertNil(FaceGeometry.decode(regressors: [Float](repeating: 0, count: 896 * 16), logits: [Float](repeating: -0.01, count: 896), width: 320, height: 240))
    }

    func testGardeLePlusGrandDeDeuxVisagesSepares() throws {
        var reg = [Float](repeating: 0, count: 896 * 16)
        var logits = [Float](repeating: -100, count: 896)
        // ancre 0 (coin haut gauche) : petit visage très sûr ; ancre 895 (coin bas droit) : grand visage moins sûr
        logits[0] = 5
        reg[2] = 0.1 * 128
        reg[3] = 0.1 * 128
        logits[895] = 1
        reg[895 * 16 + 2] = 0.3 * 128
        reg[895 * 16 + 3] = 0.3 * 128
        let d = try XCTUnwrap(FaceGeometry.decode(regressors: reg, logits: logits, width: 128, height: 128))
        XCTAssertEqual(d.cx, 7.5 / 8 * 128, accuracy: 1e-3)
        XCTAssertEqual(d.w, 0.3 * 128, accuracy: 1e-3)
        XCTAssertEqual(d.boxes, 1)
    }

    func testFusionneLesBoitesQuiSeRecouvrentPondereesParLeScore() throws {
        var reg = [Float](repeating: 0, count: 896 * 16)
        var logits = [Float](repeating: -100, count: 896)
        // deux boîtes 0,4 × 0,4 sur la même ancre de pas 16 (index 512), décalées de 0,15 : IoU ≈ 0,45
        logits[512] = 2
        logits[513] = 0
        for i in [512, 513] {
            reg[i * 16 + 2] = 0.4 * 128
            reg[i * 16 + 3] = 0.4 * 128
        }
        reg[513 * 16] = 0.15 * 128
        let d = try XCTUnwrap(FaceGeometry.decode(regressors: reg, logits: logits, width: 100, height: 100))
        let s1 = 1 / (1 + exp(-2.0)), s2 = 0.5
        XCTAssertEqual(d.boxes, 2)
        XCTAssertEqual(d.cx, (0.0625 * s1 + 0.2125 * s2) / (s1 + s2) * 100, accuracy: 1e-3)
        XCTAssertEqual(d.score, s1, accuracy: 1e-9)
    }

    func testRoiSelonLAngleDesYeuxEtUnEtDemi() throws {
        for name in ["face-frontal", "face-tilted"] {
            let f = try FaceGeometryTests.load(name)
            let out = try Self.detectorOutputs(f)
            let d = try XCTUnwrap(FaceGeometry.decode(regressors: out.regressors, logits: out.logits, width: f.width, height: f.height))
            assertRoi(try Self.roi(f, "roi"), FaceGeometry.roi(from: d), name)
        }
        // même visage, l'image penchée de 18° de plus : la rotation du recadrage suit (y vers le bas)
        let tilt = try Self.roi(FaceGeometryTests.load("face-tilted"), "roi").rot - Self.roi(FaceGeometryTests.load("face-frontal"), "roi").rot
        XCTAssertEqual(tilt * 180 / .pi, -18, accuracy: 5)
    }

    func testPointsRamenesDansLImageEtEntreeDesBlendshapes() throws {
        for name in ["face-frontal", "face-tilted"] {
            let f = try FaceGeometryTests.load(name)
            let pts = FaceGeometry.toImage(try Self.raw(f), roi: try Self.roi(f, "roi"))
            let l = try XCTUnwrap(f.json["landmarks"] as? [String: Any])
            let expected = try XCTUnwrap(l["points"] as? [Double])
            XCTAssertEqual(pts.count, 478 * 3)
            for i in 0..<pts.count { XCTAssertEqual(pts[i], expected[i], accuracy: 2e-3, "\(name) p\(i)") }
            let sub = FaceGeometry.blendshapeInput(pts)
            let subExpected = try XCTUnwrap(f.json["subset"] as? [Double])
            XCTAssertEqual(sub.count, 146 * 2)
            for i in 0..<sub.count { XCTAssertEqual(Double(sub[i]), subExpected[i], accuracy: 2e-3, "\(name) s\(i)") }
            assertRoi(try Self.roi(f, "next_roi"), FaceGeometry.roi(fromPoints: pts), "\(name) suivante")
        }
    }

    func testTailleEtLacetSurDeVraisVisages() throws {
        for name in ["face-frontal", "face-tilted"] {
            let f = try FaceGeometryTests.load(name)
            let pts = FaceGeometry.toImage(try Self.raw(f), roi: try Self.roi(f, "roi"))
            XCTAssertLessThan(abs(FaceGeometry.yawDegrees(pts)), 20, "\(name) de face")
        }
        let f = try FaceGeometryTests.load("face-tilted")
        let size = FaceGeometry.faceSize(FaceGeometry.toImage(try Self.raw(f), roi: try Self.roi(f, "roi")))
        XCTAssertTrue(size > 85 && size < 120, "visage ≈ 100 px dans la capture 320 × 240 : \(size)")
    }
}
