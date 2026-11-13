import XCTest
@testable import HalcyaRules

/// Copie de secours hors de la sauvegarde iCloud (directive 5.1.3 (ii), décision du 1/11).
final class SnapshotFolderTests: XCTestCase {
    private var documents: URL!

    override func setUpWithError() throws {
        documents = FileManager.default.temporaryDirectory.appendingPathComponent("documents-\(UUID().uuidString)")
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: documents)
    }

    private func excluded(_ url: URL) throws -> Bool? {
        try URL(fileURLWithPath: url.path).resourceValues(forKeys: [.isExcludedFromBackupKey]).isExcludedFromBackup
    }

    func testCreeLeDossierDansDocumentsExcluDeLaSauvegarde() throws {
        let folder = try SnapshotFolder.prepare(in: documents)
        XCTAssertEqual(folder.lastPathComponent, "Copie de secours")
        XCTAssertEqual(folder.deletingLastPathComponent().standardizedFileURL.path, documents.standardizedFileURL.path)
        var isDirectory: ObjCBool = false
        XCTAssertTrue(FileManager.default.fileExists(atPath: folder.path, isDirectory: &isDirectory))
        XCTAssertTrue(isDirectory.boolValue)
        XCTAssertEqual(try excluded(folder), true)
    }

    /// À chaque lancement : la copie déjà là est gardée, le dossier reste exclu
    func testRelanceGardeLaCopieEtLaMarque() throws {
        let folder = try SnapshotFolder.prepare(in: documents)
        let copy = folder.appendingPathComponent("Halcya-copie-de-secours.json")
        try Data("{\"entries\":[]}".utf8).write(to: copy, options: .atomic)
        XCTAssertEqual(try SnapshotFolder.prepare(in: documents).path, folder.path)
        XCTAssertEqual(try String(contentsOf: copy, encoding: .utf8), "{\"entries\":[]}")
        XCTAssertEqual(try excluded(folder), true)
    }

    /// Dossier supprimé à la main (Fichiers) : recréé et marqué au lancement suivant
    func testDossierSupprimeRecreeEtMarque() throws {
        let folder = try SnapshotFolder.prepare(in: documents)
        try FileManager.default.removeItem(at: folder)
        try SnapshotFolder.prepare(in: documents)
        XCTAssertEqual(try excluded(folder), true)
    }
}
