import CoreVideo
import XCTest
@testable import HalcyaFaceModels

/// La conversion des images de la caméra frontale (« 420f » de l'iPhone), sur une image fabriquée : le simulateur n'a
/// pas de caméra. Même rouge BT.601 que `FaceFramesTest.java` d'Android (Y = 76, Cb = 85, Cr = 255 → 0xfe0000).
final class FrontCameraTests: XCTestCase {
    func buffer(width: Int, height: Int, y: UInt8, cb: UInt8, cr: UInt8) throws -> CVPixelBuffer {
        var out: CVPixelBuffer?
        let status = CVPixelBufferCreate(kCFAllocatorDefault, width, height, kCVPixelFormatType_420YpCbCr8BiPlanarFullRange, nil, &out)
        XCTAssertEqual(status, kCVReturnSuccess)
        let b = try XCTUnwrap(out)
        CVPixelBufferLockBaseAddress(b, [])
        let yBase = try XCTUnwrap(CVPixelBufferGetBaseAddressOfPlane(b, 0)).assumingMemoryBound(to: UInt8.self)
        for i in 0..<(CVPixelBufferGetBytesPerRowOfPlane(b, 0) * height) { yBase[i] = y }
        let uvBase = try XCTUnwrap(CVPixelBufferGetBaseAddressOfPlane(b, 1)).assumingMemoryBound(to: UInt8.self)
        let uvBytes = CVPixelBufferGetBytesPerRowOfPlane(b, 1) * CVPixelBufferGetHeightOfPlane(b, 1)
        for i in stride(from: 0, to: uvBytes - 1, by: 2) {
            uvBase[i] = cb
            uvBase[i + 1] = cr
        }
        CVPixelBufferUnlockBaseAddress(b, [])
        return b
    }

    func testImage420fConvertieEnRvbCommeAndroid() throws {
        let rgb = try XCTUnwrap(FrontCamera.rgb(try buffer(width: 4, height: 2, y: 76, cb: 85, cr: 255)))
        XCTAssertEqual(rgb.width, 4)
        XCTAssertEqual(rgb.height, 2)
        XCTAssertEqual(rgb.pixels, [UInt32](repeating: 0xfe0000, count: 8))
    }

    func testGrisNeutre() throws {
        let rgb = try XCTUnwrap(FrontCamera.rgb(try buffer(width: 2, height: 2, y: 128, cb: 128, cr: 128)))
        XCTAssertEqual(rgb.pixels, [UInt32](repeating: 0x808080, count: 4))
    }

    func testAutreFormatRefuse() throws {
        var out: CVPixelBuffer?
        CVPixelBufferCreate(kCFAllocatorDefault, 2, 2, kCVPixelFormatType_32BGRA, nil, &out)
        XCTAssertNil(FrontCamera.rgb(try XCTUnwrap(out)))
    }
}
