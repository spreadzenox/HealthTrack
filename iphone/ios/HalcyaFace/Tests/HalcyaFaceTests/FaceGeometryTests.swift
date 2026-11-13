import Foundation
import ImageIO
import XCTest
@testable import HalcyaFace

/// Mêmes vecteurs que `FaceGeometryTest.java` d'Android : portraits du domaine public et entrées attendues des modèles
/// (`journal/protocoles/visage-vecteurs.py` d'Android), lus dans `upstream/` préparé par `scripts/upstream.sh`, sans copie.
final class FaceGeometryTests: XCTestCase {
    // Tests/HalcyaFaceTests/<ce fichier> → racine du dépôt (ios/HalcyaFace/…) → upstream/
    static let fixtures = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        .deletingLastPathComponent().deletingLastPathComponent()
        .appendingPathComponent("upstream/app/android/app/src/test/resources/face")

    struct Fixture {
        let rgb: [UInt32]
        let width: Int
        let height: Int
        let json: [String: Any]
    }

    /// PNG lu en octets bruts (ni dessin ni correction de couleur), rendu en 0xRRGGBB comme `int[]` d'Android.
    static func load(_ name: String) throws -> Fixture {
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: fixtures.appendingPathComponent("\(name).json"))) as? [String: Any])
        let source = try XCTUnwrap(CGImageSourceCreateWithURL(fixtures.appendingPathComponent("\(name).png") as CFURL, nil))
        let image = try XCTUnwrap(CGImageSourceCreateImageAtIndex(source, 0, nil))
        XCTAssertEqual(image.bitsPerComponent, 8)
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
        XCTAssertEqual(image.width, json["width"] as? Int)
        XCTAssertEqual(image.height, json["height"] as? Int)
        return Fixture(rgb: rgb, width: image.width, height: image.height, json: json)
    }

    /// Échantillons [y, x, canal, valeur] d'une entrée size × size × 3 attendue.
    func assertSamples(_ input: [Float], size: Int, _ samples: [[Double]], accuracy: Double, file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertFalse(samples.isEmpty, file: file, line: line)
        for s in samples {
            let index = (Int(s[0]) * size + Int(s[1])) * 3 + Int(s[2])
            XCTAssertEqual(Double(input[index]), s[3], accuracy: accuracy, "échantillon \(s)", file: file, line: line)
        }
    }

    func testAncresDuDetecteur() {
        let a = FaceGeometry.anchors
        XCTAssertEqual(a.count, 896)
        XCTAssertEqual(a[0].x, 0.5 / 16, accuracy: 1e-12)
        XCTAssertEqual(a[1].x, 0.5 / 16, accuracy: 1e-12) // 2 ancres par cellule, identiques
        XCTAssertEqual(a[2].x, 1.5 / 16, accuracy: 1e-12)
        XCTAssertEqual(a[511].x, 15.5 / 16, accuracy: 1e-12)
        XCTAssertEqual(a[511].y, 15.5 / 16, accuracy: 1e-12)
        XCTAssertEqual(a[512].x, 0.5 / 8, accuracy: 1e-12)
        XCTAssertEqual(a[895].y, 7.5 / 8, accuracy: 1e-12)
    }

    func testCarreABandesNoires() {
        XCTAssertEqual(FaceGeometry.letterbox(width: 320, height: 400), .init(cx: 160, cy: 200, side: 400, rot: 0))
    }

    func testEntreeDuDetecteurCommeAndroid() throws {
        for name in ["face-frontal", "face-tilted"] {
            let f = try Self.load(name)
            let input = FaceGeometry.crop(rgb: f.rgb, width: f.width, height: f.height,
                                          roi: FaceGeometry.letterbox(width: f.width, height: f.height), size: 128, lo: -1, hi: 1)
            let detector = try XCTUnwrap(f.json["detector"] as? [String: Any])
            assertSamples(input, size: 128, try XCTUnwrap(detector["input_samples"] as? [[Double]]), accuracy: 1e-5)
        }
    }

    func testEntreeDuMaillageCommeAndroid() throws {
        for name in ["face-frontal", "face-tilted"] {
            let f = try Self.load(name)
            let r = try XCTUnwrap(f.json["roi"] as? [String: Double])
            let roi = FaceGeometry.Roi(cx: r["cx"]!, cy: r["cy"]!, side: r["side"]!, rot: r["rot"]!)
            let input = FaceGeometry.crop(rgb: f.rgb, width: f.width, height: f.height, roi: roi, size: 256, lo: 0, hi: 1)
            let landmarks = try XCTUnwrap(f.json["landmarks"] as? [String: Any])
            assertSamples(input, size: 256, try XCTUnwrap(landmarks["input_samples"] as? [[Double]]), accuracy: 1e-5)
        }
    }
}
