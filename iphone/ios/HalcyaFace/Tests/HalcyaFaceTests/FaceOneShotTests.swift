import Foundation
import XCTest
@testable import HalcyaFace

/// Une lecture à l'ouverture de l'app, comme `FaceOneShot.java` de la variante play : garde-fous, rafale, boîte,
/// compteurs du diagnostic. Caméra et modèles remplacés (portraits et sorties de référence d'Android).
final class FaceOneShotTests: XCTestCase {
    final class Camera: FaceCamera {
        var result: FaceCapture
        var calls = 0
        init(_ result: FaceCapture) { self.result = result }
        func capture(frames: Int) -> FaceCapture {
            calls += 1
            return result
        }
    }

    let now: Int64 = 1_760_000_000_000 // 9 octobre 2025, 08:53 UTC
    var dir: URL!
    var prefs: MemoryFacePrefs!

    override func setUpWithError() throws {
        dir = FileManager.default.temporaryDirectory.appendingPathComponent("face-oneshot-\(UUID().uuidString)")
        prefs = MemoryFacePrefs()
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: dir)
    }

    func pipeline() throws -> FacePipeline {
        let f = try FaceGeometryTests.load("face-frontal")
        return FacePipeline(detector: try FacePipelineTests.detector(f), landmarks: try FacePipelineTests.landmarks(f),
                            blendshapes: FacePipelineTests.Fixed(try FacePipelineTests.coefficients(f)))
    }

    func shot(_ camera: Camera, env: FaceEnvironment = FaceEnvironment(), clock: Int64? = nil) throws -> FaceOneShot {
        let p = try pipeline()
        let t = clock ?? now
        return FaceOneShot(prefs: prefs, inbox: FaceInbox(directory: dir), camera: camera, openPipeline: { p }, environment: { env },
                           clock: { t }, elapsed: { 0 }, timeZone: TimeZone(identifier: "Europe/Paris")!)
    }

    func portraits(_ count: Int = 3) throws -> FaceCapture {
        let f = try FaceGeometryTests.load("face-frontal")
        return FaceCapture(images: Array(repeating: f.rgb, count: count), width: f.width, height: f.height, openMs: 900)
    }

    func testOuvertureDeLAppVisageLuEtRangeDansLaBoite() throws {
        let camera = Camera(try portraits())
        XCTAssertEqual(try shot(camera).run(trigger: "app_open"), "face")
        XCTAssertEqual(camera.calls, 1)
        let items = FaceInbox(directory: dir).list()
        XCTAssertEqual(items.count, 1)
        XCTAssertTrue(items[0].json.hasPrefix("{\"v\":1,\"at\":1760000000000,\"trigger\":\"app_open\",\"frames\":3,\"valid\":3,\"values\":{\"smile\":"), items[0].json)
        XCTAssertEqual(prefs.long("lastAppOpenAt"), now)
        XCTAssertEqual(prefs.int("dayAppOpens"), 1)
        XCTAssertEqual(prefs.int("dayAppOpenFaces"), 1)
        XCTAssertEqual(prefs.long("sumCameraMs"), 900)
        XCTAssertEqual(prefs.int("n_face"), 1)
        XCTAssertEqual(prefs.string("lastOutcome"), "face")
        XCTAssertEqual(prefs.string("day"), "2025-10-09")
    }

    func testRouvrirLAppAvantUneDemiHeureNeRelitPas() throws {
        let camera = Camera(try portraits())
        _ = try shot(camera).run(trigger: "app_open")
        XCTAssertEqual(try shot(camera, clock: now + 10 * 60_000).run(trigger: "app_open"), "skip:too_soon")
        XCTAssertEqual(camera.calls, 1)
        XCTAssertEqual(FaceInbox(directory: dir).count(), 1)
        // le test (« Tester ») ignore l'intervalle et ne compte pas comme une ouverture
        XCTAssertEqual(try shot(camera, clock: now + 11 * 60_000).run(trigger: "manual"), "face")
        XCTAssertEqual(prefs.int("dayAppOpens"), 1)
    }

    func testGardeFousSansCamera() throws {
        let camera = Camera(try portraits())
        XCTAssertEqual(try shot(camera, env: FaceEnvironment(visible: false)).run(trigger: "app_open"), "skip:not_visible")
        XCTAssertEqual(try shot(camera, env: FaceEnvironment(cameraPermission: false)).run(trigger: "app_open"), "skip:no_permission")
        XCTAssertEqual(try shot(camera, env: FaceEnvironment(modelsAvailable: false)).run(trigger: "app_open"), "skip:no_models")
        XCTAssertEqual(try shot(camera, env: FaceEnvironment(inCall: true)).run(trigger: "app_open"), "skip:in_call")
        XCTAssertEqual(try shot(camera, env: FaceEnvironment(thermal: FaceSchedule.thermalHeadroom(.serious))).run(trigger: "app_open"), "skip:hot")
        XCTAssertEqual(camera.calls, 0)
        XCTAssertEqual(FaceInbox(directory: dir).count(), 0)
    }

    func testCameraRefuseeNoteeSansRafale() throws {
        let camera = Camera(FaceCapture(error: "camera_denied"))
        XCTAssertEqual(try shot(camera).run(trigger: "app_open"), "camera:camera_denied")
        XCTAssertEqual(FaceInbox(directory: dir).count(), 0)
        XCTAssertEqual(prefs.int("dayAppOpens"), 0)
    }

    func testImagesNoiresRafaleSansVisageGardeeAvecSesRejets() throws {
        let f = try FaceGeometryTests.load("face-frontal")
        let black = [UInt32](repeating: 0, count: f.rgb.count)
        let camera = Camera(FaceCapture(images: [black, black, black], width: f.width, height: f.height, openMs: 800))
        XCTAssertEqual(try shot(camera).run(trigger: "app_open"), "no_valid_frame")
        let json = FaceInbox(directory: dir).list().first?.json ?? ""
        XCTAssertTrue(json.contains("\"valid\":0,\"rejected\":{\"too_dark\":3}"), json)
        XCTAssertEqual(prefs.int("r_too_dark"), 3)
        XCTAssertEqual(prefs.int("dayAppOpens"), 1)
        XCTAssertEqual(prefs.int("dayAppOpenFaces"), 0)
    }

    func testNouveauJourCompteursRemisAZero() {
        prefs.set("day", "2025-10-08")
        prefs.set("dayAppOpens", 12)
        prefs.set("dayAppOpenFaces", 7)
        prefs.set("timed", 4)
        FaceOneShot.rollDay(prefs, now: now, timeZone: TimeZone(identifier: "Europe/Paris")!)
        XCTAssertEqual(prefs.string("day"), "2025-10-09")
        XCTAssertEqual(prefs.int("dayAppOpens"), 0)
        XCTAssertEqual(prefs.int("dayAppOpenFaces"), 0)
        XCTAssertEqual(prefs.int("timed"), 4)
    }

    func testJournalDesTentativesDouzeAuPlus() throws {
        var json: String?
        for i in 0..<15 {
            json = FaceOneShot.appendAttempt(json, at: Int64(i), trigger: "app_open", source: "app", retry: false, what: "skip:too_soon", detail: i == 14 ? "x\"y" : nil)
        }
        let items = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(json!.utf8)) as? [[String: Any]])
        XCTAssertEqual(items.count, 12)
        XCTAssertEqual(items.first?["at"] as? Int, 3)
        XCTAssertEqual(items.last?["detail"] as? String, "x\"y")
        XCTAssertEqual(items.last?["source"] as? String, "app")
        XCTAssertNil(items.last?["retry"])
    }
}
