import XCTest
@testable import HalcyaFace

/// Mêmes cas que `FaceRecordTest.java` d'Android : indices arrondis, rejets comptés, jamais de valeur non finie.
final class FaceRecordTests: XCTestCase {
    func testRafaleValide() throws {
        var idx = Dictionary(uniqueKeysWithValues: FaceIndices.names.map { ($0, 0.0) })
        idx["smile"] = 0.123456
        let bs = [Float](repeating: 0, count: FaceIndices.blendshapes)
        let burst = try XCTUnwrap(FaceIndices.burst(indices: [idx, idx], blendshapes: [bs, bs], frames: 3))
        let json = FaceRecord.json(at: 1_760_000_000_000, trigger: "unlock", frames: 3, burst: burst, rejections: ["no_face"], cameraMs: 812, inferenceMs: 95)
        XCTAssertTrue(json.hasPrefix("{\"v\":1,\"at\":1760000000000,\"trigger\":\"unlock\",\"frames\":3,\"valid\":2,\"values\":{\"smile\":0.1235,"), json)
        XCTAssertTrue(json.contains("\"mobility\":0.0000"), json)
        XCTAssertTrue(json.hasSuffix(",\"rejected\":{\"no_face\":1},\"ms\":{\"camera\":812,\"inference\":95}}"), json)
        // ordre d'export d'Android : les indices, puis la mobilité
        XCTAssertTrue(json.contains("\"asymmetry\":0.0000,\"yaw\":0.0000,\"mobility\":0.0000}"), json)
    }

    func testRafaleSansVisage() {
        let json = FaceRecord.json(at: 5, trigger: "manual", frames: 3, burst: nil, rejections: ["too_dark", "no_face", "too_dark"], cameraMs: 0, inferenceMs: 0)
        XCTAssertEqual(json, "{\"v\":1,\"at\":5,\"trigger\":\"manual\",\"frames\":3,\"valid\":0,"
            + "\"rejected\":{\"no_face\":1,\"too_dark\":2},\"ms\":{\"camera\":0,\"inference\":0}}")
    }

    func testValeursNonFiniesOmises() throws {
        var idx = Dictionary(uniqueKeysWithValues: FaceIndices.names.map { ($0, 0.5) })
        idx["yaw"] = .nan
        let burst = try XCTUnwrap(FaceIndices.burst(indices: [idx], blendshapes: [[Float](repeating: 0, count: 52)], frames: 1))
        let json = FaceRecord.json(at: 1, trigger: "unlock", frames: 1, burst: burst, rejections: nil, cameraMs: 1, inferenceMs: 1)
        XCTAssertFalse(json.contains("yaw"), json)
        XCTAssertFalse(json.contains("NaN") || json.contains("nan"), json)
    }

    func testEchappement() {
        XCTAssertEqual(FaceRecord.quote("a\"b\\c\n"), "\"a\\\"b\\\\c\\u000a\"")
    }

    /// `%.4f` de Java : écriture décimale la plus courte, arrondie au plus proche, les milieux loin de zéro.
    func testQuatreDecimalesCommeJava() {
        XCTAssertEqual(FaceRecord.fixed4(0.123456), "0.1235")
        XCTAssertEqual(FaceRecord.fixed4(0), "0.0000")
        XCTAssertEqual(FaceRecord.fixed4(2), "2.0000")
        XCTAssertEqual(FaceRecord.fixed4(-4.5), "-4.5000")
        XCTAssertEqual(FaceRecord.fixed4(0.03125), "0.0313") // milieu exact : Java arrondit loin de zéro (printf : 0.0312)
        XCTAssertEqual(FaceRecord.fixed4(0.00005), "0.0001")
        XCTAssertEqual(FaceRecord.fixed4(-0.00001), "-0.0000")
        XCTAssertEqual(FaceRecord.fixed4(1e-7), "0.0000")
        XCTAssertEqual(FaceRecord.fixed4(12.99996), "13.0000")
    }
}
