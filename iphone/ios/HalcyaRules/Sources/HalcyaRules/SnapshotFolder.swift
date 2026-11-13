import Foundation

/// Dossier de la copie de secours de la base (`src/ios/snapshot.js`) : dans Documents, donc visible dans Fichiers ›
/// Sur mon iPhone › Halcya, mais **exclu de la sauvegarde iCloud** (directive 5.1.3 (ii) d'Apple : pas de données de
/// santé personnelles dans iCloud ; décision du propriétaire du 1/11). Marquer le dossier exclut tout ce qu'il
/// contient, même un fichier réécrit d'un bloc par Capacitor (une écriture atomique perdrait la marque d'un fichier).
public enum SnapshotFolder {
    /// Même nom que `SNAPSHOT_DIR` de `snapshot.js` (vérifié par `snapshotFolder.test.js`).
    public static let name = "Copie de secours"

    /// Le dossier dans `documents`, créé s'il manque ; il est toujours marqué exclu de la sauvegarde, et ce qu'il
    /// contient est gardé.
    @discardableResult
    public static func prepare(in documents: URL) throws -> URL {
        var folder = documents.appendingPathComponent(name, isDirectory: true)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try folder.setResourceValues(values)
        return folder
    }
}
