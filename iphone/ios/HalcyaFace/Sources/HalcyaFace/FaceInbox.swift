import Foundation

/// Boîte de dépôt des rafales du visage, comme `CaptureInbox.java` d'Android (dossier `face-bursts`) : un fichier
/// JSON par rafale, en attendant que le JS les importe (`faceBursts.js`) puis les retire. Écriture atomique ; au plus
/// `max` fichiers gardés (les plus anciens partent) ; ne lit ni n'efface jamais un fichier qui n'a pas le nom d'une
/// capture. Sur iPhone, le dossier est dans Application Support, exclu de la sauvegarde iCloud.
public final class FaceInbox {
    public static let max = 3000

    /// Une rafale en attente : nom du fichier et JSON.
    public struct Item: Equatable {
        public let name: String
        public let json: String
    }

    public enum InboxError: Error {
        case directory, tooManyAtSameMillisecond, write
    }

    private let directory: URL
    private let max: Int
    private let lock = NSLock()

    public init(directory: URL, max: Int = FaceInbox.max) {
        self.directory = directory
        self.max = max
    }

    /// `capture-<13 chiffres>-<3 chiffres>.json`, comme sur Android.
    public static func isCaptureName(_ name: String) -> Bool {
        let parts = name.split(separator: "-", omittingEmptySubsequences: false)
        guard name.hasSuffix(".json"), parts.count == 3, parts[0] == "capture" else { return false }
        let ms = parts[1], n = parts[2].dropLast(5)
        return ms.count == 13 && n.count == 3 && (ms + n).allSatisfy { $0.isASCII && $0.isNumber }
    }

    private func names() -> [String] {
        let all = (try? FileManager.default.contentsOfDirectory(atPath: directory.path)) ?? []
        return all.filter(Self.isCaptureName).sorted()
    }

    /// Dépose une rafale ; rend le nom du fichier.
    @discardableResult
    public func put(_ json: String, atMs: Int64) throws -> String {
        lock.lock()
        defer { lock.unlock() }
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            var values = URLResourceValues()
            values.isExcludedFromBackup = true
            var dir = directory
            try? dir.setResourceValues(values)
        } catch {
            throw InboxError.directory
        }
        let ms = String(Swift.max(0, atMs))
        let stamp = String(repeating: "0", count: Swift.max(0, 13 - ms.count)) + ms
        guard let name = (0..<1000).lazy.map({ n -> String in
            let s = String(n)
            return "capture-\(stamp)-\(String(repeating: "0", count: 3 - s.count))\(s).json"
        }).first(where: { !FileManager.default.fileExists(atPath: self.directory.appendingPathComponent($0).path) }) else {
            throw InboxError.tooManyAtSameMillisecond
        }
        do {
            try Data(json.utf8).write(to: directory.appendingPathComponent(name), options: .atomic)
        } catch {
            throw InboxError.write
        }
        let all = names()
        for old in all.prefix(Swift.max(0, all.count - max)) {
            try? FileManager.default.removeItem(at: directory.appendingPathComponent(old))
        }
        return name
    }

    /// Nombre de rafales en attente (sans les lire).
    public func count() -> Int {
        lock.lock()
        defer { lock.unlock() }
        return names().count
    }

    /// Rafales en attente, de la plus ancienne à la plus récente (illisibles sautées).
    public func list() -> [Item] {
        lock.lock()
        defer { lock.unlock() }
        return names().compactMap { n in
            (try? String(contentsOf: directory.appendingPathComponent(n), encoding: .utf8)).map { Item(name: n, json: $0) }
        }
    }

    /// Retire les rafales importées ; rend le nombre de fichiers effacés.
    @discardableResult
    public func remove(_ names: [String]) -> Int {
        lock.lock()
        defer { lock.unlock() }
        var removed = 0
        for n in names where Self.isCaptureName(n) {
            if (try? FileManager.default.removeItem(at: directory.appendingPathComponent(n))) != nil { removed += 1 }
        }
        return removed
    }
}
