import Foundation
import ImageIO
import XCTest
import HalcyaFace
@testable import HalcyaFaceModels

/// Les vrais modèles sur simulateur iOS, mêmes cas et mêmes tolérances que `FaceModelsTest.java` d'Android (sur
/// téléphone) : sorties brutes des 3 modèles contre les références de `visage-vecteurs.py`, puis la chaîne complète.
final class FaceModelsTests: XCTestCase {
    // Tests/HalcyaFaceModelsTests/<ce fichier> → ios/HalcyaFaceModels → racine du dépôt
    static let package = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
    static let root = package.deletingLastPathComponent().deletingLastPathComponent()
    static let fixtures = root.appendingPathComponent("upstream/app/android/app/src/test/resources/face")
    static let images = ["face-frontal", "face-tilted"]

    struct Vector {
        let rgb: [UInt32]
        let width: Int
        let height: Int
        let json: [String: Any]

        init(_ name: String) throws {
            json = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: fixtures.appendingPathComponent("\(name).json"))) as? [String: Any])
            // PNG lu en octets bruts (ni dessin ni correction de couleur), rendu en 0xRRGGBB comme `int[]` d'Android
            let source = try XCTUnwrap(CGImageSourceCreateWithURL(fixtures.appendingPathComponent("\(name).png") as CFURL, nil))
            let image = try XCTUnwrap(CGImageSourceCreateImageAtIndex(source, 0, nil))
            let bytes = try XCTUnwrap(image.dataProvider?.data as Data?)
            let step = image.bitsPerPixel / 8
            let first = [.first, .premultipliedFirst, .noneSkipFirst].contains(image.alphaInfo) ? 1 : 0
            var rgb = [UInt32](repeating: 0, count: image.width * image.height)
            for y in 0..<image.height {
                for x in 0..<image.width {
                    let p = y * image.bytesPerRow + x * step + first
                    rgb[y * image.width + x] = UInt32(bytes[p]) << 16 | UInt32(bytes[p + 1]) << 8 | UInt32(bytes[p + 2])
                }
            }
            self.rgb = rgb
            width = image.width
            height = image.height
        }

        var roi: FaceGeometry.Roi {
            let r = json["roi"] as! [String: Double]
            return FaceGeometry.Roi(cx: r["cx"]!, cy: r["cy"]!, side: r["side"]!, rot: r["rot"]!)
        }
    }

    var models: FaceModels!

    override func setUpWithError() throws {
        models = try FaceModels(directory: try XCTUnwrap(FaceModels.bundledDirectory, "modèles absents : lancer scripts/face-models.sh"))
    }

    func testFormesDesModelesConformesALaSpec() {
        XCTAssertEqual(models.detector.inputSize, 128 * 128 * 3)
        XCTAssertEqual(models.landmarks.inputSize, 256 * 256 * 3)
        XCTAssertEqual(models.blendshapes.inputSize, 146 * 2)
    }

    func testDetecteurCommeLaReference() throws {
        for name in Self.images {
            let v = try Vector(name)
            let input = FaceGeometry.crop(rgb: v.rgb, width: v.width, height: v.height, roi: FaceGeometry.letterbox(width: v.width, height: v.height),
                                          size: FaceGeometry.detectorSize, lo: -1, hi: 1)
            let out = models.detector.run(input)
            XCTAssertEqual(out.count, 2)
            XCTAssertEqual(out[0].count, 896 * 16)
            XCTAssertEqual(out[1].count, 896)
            let sparse = try XCTUnwrap((v.json["detector"] as? [String: Any])?["sparse"] as? [[Double]])
            XCTAssertFalse(sparse.isEmpty)
            for row in sparse {
                let i = Int(row[0])
                XCTAssertEqual(Double(out[1][i]), row[1], accuracy: 0.05, "\(name) logit \(i)")
                for j in 0..<16 { XCTAssertEqual(Double(out[0][i * 16 + j]), row[2 + j], accuracy: 0.1, "\(name) reg \(i)/\(j)") }
            }
            let d = try XCTUnwrap(FaceGeometry.decode(regressors: out[0], logits: out[1], width: v.width, height: v.height))
            let detection = try XCTUnwrap(v.json["detection"] as? [String: Any])
            XCTAssertEqual(d.score, detection["score"] as! Double, accuracy: 0.01, name)
        }
    }

    func testMaillageCommeLaReference() throws {
        for name in Self.images {
            let v = try Vector(name)
            let crop = FaceGeometry.crop(rgb: v.rgb, width: v.width, height: v.height, roi: v.roi, size: FaceGeometry.landmarkSize, lo: 0, hi: 1)
            let out = models.landmarks.run(crop)
            let ref = try XCTUnwrap(v.json["landmarks"] as? [String: Any])
            let raw = try XCTUnwrap(ref["raw"] as? [Double])
            XCTAssertEqual(out[0].count, raw.count)
            let diff = zip(raw, out[0]).map { abs($0 - Double($1)) }.sorted()
            // pixels du recadrage 256 × 256
            XCTAssertLessThan(diff[diff.count / 2], 0.05, "\(name) écart médian")
            XCTAssertLessThan(diff[diff.count - 1], 0.5, "\(name) écart max")
            XCTAssertEqual(Double(out[1][0]), ref["presence_logit"] as! Double, accuracy: 0.05, "\(name) présence")
        }
    }

    func testBlendshapesCommeLaReference() throws {
        for name in Self.images {
            let v = try Vector(name)
            let input = try XCTUnwrap(v.json["subset"] as? [Double]).map { Float($0) }
            let bs = models.blendshapes.run(input)[0]
            let ref = try XCTUnwrap(v.json["blendshapes"] as? [Double])
            XCTAssertEqual(bs.count, ref.count)
            for i in 0..<bs.count { XCTAssertEqual(Double(bs[i]), ref[i], accuracy: 2e-3, "\(name) bs\(i)") }
        }
    }

    func testLaChaineCompleteLitLeVisage() throws {
        for name in Self.images {
            let v = try Vector(name)
            let pipeline = models.pipeline()
            let t0 = Date()
            let first = pipeline.analyze(v.rgb, width: v.width, height: v.height)
            let t1 = Date()
            let next = pipeline.analyze(v.rgb, width: v.width, height: v.height) // suivi, sans détecteur
            print("[visage] \(name) : 1re image \(Int(t1.timeIntervalSince(t0) * 1000)) ms, suivante \(Int(Date().timeIntervalSince(t1) * 1000)) ms")
            XCTAssertNil(first.rejected, "\(name) rejet \(String(describing: first.rejected))")
            XCTAssertNil(next.rejected, "\(name) rejet \(String(describing: next.rejected))")
            let ref = try XCTUnwrap(v.json["blendshapes"] as? [Double])
            let bs = try XCTUnwrap(first.blendshapes)
            let mean = zip(ref, bs).map { abs($0 - Double($1)) }.reduce(0, +) / Double(ref.count)
            XCTAssertLessThan(mean, 0.02, "\(name) écart moyen des blendshapes")
            XCTAssertEqual(first.indices!["smile"]!, (ref[44] + ref[45]) / 2, accuracy: 0.05, "\(name) sourire")
        }
    }
}
