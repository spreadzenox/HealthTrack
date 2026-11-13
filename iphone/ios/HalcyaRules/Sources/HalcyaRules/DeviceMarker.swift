import Foundation

/// Repère propre à ce téléphone (`src/services/restoreGuard.js`), comme `BackupMarkerPlugin.java` d'Android : un
/// identifiant aléatoire dans un fichier exclu de la sauvegarde iCloud. Après une restauration (nouvel iPhone, ou le
/// même restauré depuis une sauvegarde), il est neuf alors que le localStorage restauré garde l'ancien : le JS retire
/// alors les secrets propres à l'ancien téléphone.
public enum DeviceMarker {
    public static let fileName = "device_marker"

    /// L'identifiant rangé dans `directory`, créé s'il manque ; le fichier est toujours marqué exclu de la sauvegarde.
    public static func id(in directory: URL, make: () -> String = { UUID().uuidString.lowercased() }) throws -> String {
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        var file = directory.appendingPathComponent(fileName)
        let stored = (try? String(contentsOf: file, encoding: .utf8))?.trimmingCharacters(in: .whitespacesAndNewlines)
        let id = stored.flatMap { $0.isEmpty ? nil : $0 } ?? make()
        if stored != id { try Data(id.utf8).write(to: file, options: .atomic) }
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try file.setResourceValues(values)
        return id
    }
}
