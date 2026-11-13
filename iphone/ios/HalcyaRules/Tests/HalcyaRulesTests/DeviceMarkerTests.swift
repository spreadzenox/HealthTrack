import XCTest
@testable import HalcyaRules

/// Repère hors sauvegarde (`restoreGuard.js`) : même comportement que BackupMarkerPlugin.java d'Android.
final class DeviceMarkerTests: XCTestCase {
    private var dir: URL!

    override func setUpWithError() throws {
        dir = FileManager.default.temporaryDirectory.appendingPathComponent("marker-\(UUID().uuidString)/Halcya")
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: dir.deletingLastPathComponent())
    }

    private func excluded() throws -> Bool? {
        let file = URL(fileURLWithPath: dir.appendingPathComponent(DeviceMarker.fileName).path)
        return try file.resourceValues(forKeys: [.isExcludedFromBackupKey]).isExcludedFromBackup
    }

    func testCreeUneFoisPuisRendLeMemeIdentifiantExcluDeLaSauvegarde() throws {
        let first = try DeviceMarker.id(in: dir)
        XCTAssertFalse(first.isEmpty)
        XCTAssertEqual(try DeviceMarker.id(in: dir) { "jamais-utilise" }, first)
        XCTAssertEqual(try excluded(), true)
    }

    /// Le fichier n'est pas dans la sauvegarde : après une restauration il manque, l'identifiant change
    func testFichierAbsentApresRestaurationDonneUnNouvelIdentifiant() throws {
        let before = try DeviceMarker.id(in: dir) { "ancien-telephone" }
        try FileManager.default.removeItem(at: dir.appendingPathComponent(DeviceMarker.fileName))
        XCTAssertNotEqual(try DeviceMarker.id(in: dir) { "nouveau-telephone" }, before)
    }

    func testFichierVideRemplace() throws {
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try Data(" \n".utf8).write(to: dir.appendingPathComponent(DeviceMarker.fileName))
        XCTAssertEqual(try DeviceMarker.id(in: dir) { "neuf" }, "neuf")
        XCTAssertEqual(try DeviceMarker.id(in: dir), "neuf")
        XCTAssertEqual(try excluded(), true)
    }
}
