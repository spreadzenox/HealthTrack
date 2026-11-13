import XCTest
@testable import HalcyaFace

/// Mêmes cas que `FaceFramesTest.java` d'Android : couleurs BT.601, pas de ligne / de pixel, quatre rotations ; plus le
/// plan CbCr entrelacé de l'iPhone et l'arrondi de Java.
final class FaceFramesTests: XCTestCase {
    /// Image width × height en gris (U = V = 128), Y = 10 × (ligne + 1) + colonne.
    func gray(_ width: Int, _ height: Int, _ rotation: Int) -> FaceFrames.Rgb? {
        var y = [UInt8](repeating: 0, count: width * height)
        for r in 0..<height { for c in 0..<width { y[r * width + c] = UInt8(10 * (r + 1) + c) } }
        let uv = [UInt8](repeating: 128, count: (width / 2) * (height / 2))
        return FaceFrames.fromYuv420(y: y, yRowStride: width, u: uv, v: uv, uvRowStride: width / 2, uvPixelStride: 1, width: width, height: height, rotation: rotation)
    }

    func g(_ v: UInt32) -> UInt32 { v << 16 | v << 8 | v }

    func testSansRotationLeGrisResteLeGris() throws {
        let out = try XCTUnwrap(gray(4, 2, 0))
        XCTAssertEqual(out.width, 4)
        XCTAssertEqual(out.height, 2)
        XCTAssertEqual(out.pixels, [g(10), g(11), g(12), g(13), g(20), g(21), g(22), g(23)])
    }

    func testQuartDeTourHoraire() throws {
        // capteur : 10 11 12 13 / 20 21 22 23 → tourné de 90° : 2 colonnes, 4 lignes
        let out = try XCTUnwrap(gray(4, 2, 90))
        XCTAssertEqual(out.width, 2)
        XCTAssertEqual(out.height, 4)
        XCTAssertEqual(out.pixels, [g(20), g(10), g(21), g(11), g(22), g(12), g(23), g(13)])
    }

    func testTroisQuartsDeTourEtDemiTour() throws {
        XCTAssertEqual(try XCTUnwrap(gray(4, 2, 270)).pixels, [g(13), g(23), g(12), g(22), g(11), g(21), g(10), g(20)])
        XCTAssertEqual(try XCTUnwrap(gray(4, 2, -90)).pixels, [g(13), g(23), g(12), g(22), g(11), g(21), g(10), g(20)])
        XCTAssertEqual(try XCTUnwrap(gray(4, 2, 180)).pixels, [g(23), g(22), g(21), g(20), g(13), g(12), g(11), g(10)])
    }

    func testCouleursBt601PleinEcart() throws {
        let red = try XCTUnwrap(FaceFrames.fromYuv420(y: [76, 76, 76, 76], yRowStride: 2, u: [85], v: [255], uvRowStride: 1, uvPixelStride: 1, width: 2, height: 2, rotation: 0))
        XCTAssertEqual(red.pixels[0], 0xfe0000)
        let px = try XCTUnwrap(FaceFrames.fromYuv420(y: [255, 0, 0, 0], yRowStride: 2, u: [128], v: [128], uvRowStride: 1, uvPixelStride: 1, width: 2, height: 2, rotation: 0)).pixels
        XCTAssertEqual(px[0], 0xffffff)
        XCTAssertEqual(px[1], 0)
    }

    func testPasDeLigneEtPlansEntrelaces() throws {
        // Y de 2 × 2 avec 3 octets de bourrage par ligne ; U et V entrelacés (pas de pixel 2, comme NV21)
        let y: [UInt8] = [50, 60, 0, 0, 0, 70, 80, 0, 0, 0]
        let vu: [UInt8] = [128, 128]
        let out = try XCTUnwrap(FaceFrames.fromYuv420(y: y, yRowStride: 5, u: vu, v: vu, uvRowStride: 4, uvPixelStride: 2, width: 2, height: 2, rotation: 0))
        XCTAssertEqual(out.pixels, [g(50), g(60), g(70), g(80)])
    }

    func testPlanCbCrEntrelaceDeLiPhone() throws {
        // « 420f » : Cb puis Cr dans un seul plan ; même rouge que le cas BT.601 ci-dessus
        let cbcr: [UInt8] = [85, 255]
        let red = try XCTUnwrap(FaceFrames.fromYuv420(y: [76, 76, 76, 76], yRowStride: 2, u: cbcr, uOffset: 0, v: cbcr, vOffset: 1, uvRowStride: 2, uvPixelStride: 2, width: 2, height: 2, rotation: 0))
        XCTAssertEqual(red.pixels, [UInt32](repeating: 0xfe0000, count: 4))
    }

    func testArrondiDeJava() {
        XCTAssertEqual(FaceFrames.javaRound(2.5), 3)
        XCTAssertEqual(FaceFrames.javaRound(-2.5), -2) // `rounded()` de Swift donnerait −3
        XCTAssertEqual(FaceFrames.javaRound(-2.6), -3)
    }

    func testRotationDeLaCameraFrontale() {
        XCTAssertEqual(FaceFrames.frontRotation(sensorOrientation: 270, displayRotationDegrees: 0), 270)
        XCTAssertEqual(FaceFrames.frontRotation(sensorOrientation: 270, displayRotationDegrees: 90), 0)
        XCTAssertEqual(FaceFrames.frontRotation(sensorOrientation: 90, displayRotationDegrees: 0), 90)
    }

    func testRotationInvalide() {
        XCTAssertNil(gray(2, 2, 45))
    }
}
