import Foundation
import XCTest
@testable import HalcyaFace

/// Boîte des rafales, comme `CaptureInbox.java` d'Android : noms, ordre, plafond, et jamais un autre fichier touché.
final class FaceInboxTests: XCTestCase {
    var dir: URL!

    override func setUpWithError() throws {
        dir = FileManager.default.temporaryDirectory.appendingPathComponent("face-bursts-\(UUID().uuidString)")
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: dir)
    }

    func testNomsDeCapture() {
        XCTAssertTrue(FaceInbox.isCaptureName("capture-1760000000000-000.json"))
        XCTAssertFalse(FaceInbox.isCaptureName("capture-1760000000000-000.json.tmp"))
        XCTAssertFalse(FaceInbox.isCaptureName("capture-176000000000-000.json"))
        XCTAssertFalse(FaceInbox.isCaptureName("capture-1760000000000-00a.json"))
        XCTAssertFalse(FaceInbox.isCaptureName("../capture-1760000000000-000.json"))
        XCTAssertFalse(FaceInbox.isCaptureName("notes.json"))
    }

    func testDeposeListeDansLOrdreEtRetire() throws {
        let inbox = FaceInbox(directory: dir)
        let a = try inbox.put("{\"v\":1,\"at\":2}", atMs: 2)
        let b = try inbox.put("{\"v\":1,\"at\":1}", atMs: 1)
        let c = try inbox.put("{\"v\":1,\"at\":1,\"n\":2}", atMs: 1)
        XCTAssertEqual(a, "capture-0000000000002-000.json")
        XCTAssertEqual(b, "capture-0000000000001-000.json")
        XCTAssertEqual(c, "capture-0000000000001-001.json") // même milliseconde : numéro suivant
        XCTAssertEqual(inbox.count(), 3)
        XCTAssertEqual(inbox.list().map(\.name), [b, c, a]) // de la plus ancienne à la plus récente
        XCTAssertEqual(inbox.list().first?.json, "{\"v\":1,\"at\":1}")
        XCTAssertEqual(inbox.remove([b, "notes.json"]), 1)
        XCTAssertEqual(inbox.list().map(\.name), [c, a])
    }

    func testPlafondLesPlusAnciennesPartent() throws {
        let inbox = FaceInbox(directory: dir, max: 2)
        try inbox.put("1", atMs: 1)
        try inbox.put("2", atMs: 2)
        let last = try inbox.put("3", atMs: 3)
        XCTAssertEqual(inbox.list().map(\.json), ["2", "3"])
        XCTAssertEqual(inbox.list().last?.name, last)
    }

    func testNeTouchePasAuxAutresFichiers() throws {
        let inbox = FaceInbox(directory: dir, max: 1)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try Data("garder".utf8).write(to: dir.appendingPathComponent("notes.json"))
        try inbox.put("1", atMs: 1)
        try inbox.put("2", atMs: 2)
        XCTAssertEqual(inbox.count(), 1)
        XCTAssertEqual(inbox.remove(["notes.json"]), 0)
        XCTAssertTrue(FileManager.default.fileExists(atPath: dir.appendingPathComponent("notes.json").path))
    }

    func testDossierExcluDeLaSauvegarde() throws {
        try FaceInbox(directory: dir).put("1", atMs: 1)
        XCTAssertEqual(try dir.resourceValues(forKeys: [.isExcludedFromBackupKey]).isExcludedFromBackup, true)
    }

    func testRafaleDeposeeLueParLImport() throws {
        // Le JSON d'une vraie rafale (FaceRecord) passe tel quel par la boîte
        let json = FaceRecord.json(at: 1_760_000_000_000, trigger: "app_open", frames: 3, burst: nil, rejections: ["no_face"], cameraMs: 900, inferenceMs: 0)
        let inbox = FaceInbox(directory: dir)
        let name = try inbox.put(json, atMs: 1_760_000_000_000)
        XCTAssertEqual(name, "capture-1760000000000-000.json")
        XCTAssertEqual(inbox.list(), [FaceInbox.Item(name: name, json: json)])
    }
}
