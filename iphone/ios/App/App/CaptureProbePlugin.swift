#if DEBUG
import Capacitor
import Foundation
import HalcyaFace
import HalcyaRules
import ImageIO

/// Build de captures seulement (configuration Debug, jamais livrée) : ce que la sauvegarde iCloud du téléphone
/// emporterait des données de l'app (`src/ios/captureMode.js` › `probeBackup`). La sauvegarde prend Documents et
/// Library, sauf Library/Caches et ce qui est marqué « exclu de la sauvegarde » (l'élément ou un dossier parent).
@objc(CaptureProbePlugin)
public class CaptureProbePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CaptureProbePlugin"
    public let jsName = "CaptureProbe"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "backupStatus", returnType: CAPPluginReturnPromise),
    ]

    /// Lecture du visage sur le simulateur, qui n'a pas de caméra (I7) : si le script de captures a déposé un portrait
    /// (`Documents/capture/visage.png`, portrait du domaine public des tests d'Android), il remplace la caméra frontale.
    override public func load() {
        let portrait = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("capture/visage.png")
        if FileManager.default.fileExists(atPath: portrait.path) {
            FaceSensePlugin.camera = { PortraitCamera(url: portrait) }
        }
    }

    /// { items: [{ path, excluded, bytes, files }] } : Documents, Library/WebKit, chaque dossier IndexedDB trouvé
    /// sous Library, le repère propre au téléphone (`BackupMarkerPlugin`) et le dossier de la copie de secours
    /// (`SnapshotFolder`, exclu depuis le 1/11), chemins relatifs au conteneur de l'app.
    @objc func backupStatus(_ call: CAPPluginCall) {
        let fm = FileManager.default
        let home = URL(fileURLWithPath: NSHomeDirectory()).standardizedFileURL
        let library = fm.urls(for: .libraryDirectory, in: .userDomainMask)[0]
        var targets = [fm.urls(for: .documentDirectory, in: .userDomainMask)[0], library.appendingPathComponent("WebKit")]
        if let walk = fm.enumerator(at: library, includingPropertiesForKeys: [.isDirectoryKey]) {
            for case let url as URL in walk where url.lastPathComponent == "IndexedDB" { targets.append(url) }
        }
        targets.append(BackupMarkerPlugin.directory.appendingPathComponent(DeviceMarker.fileName))
        targets.append(fm.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent(SnapshotFolder.name))
        let items: [[String: Any]] = targets.filter { fm.fileExists(atPath: $0.path) }.map { url in
            let (bytes, files) = Self.size(of: url)
            return [
                "path": Self.relative(url, to: home),
                "excluded": Self.excluded(url, below: home),
                "bytes": bytes,
                "files": files,
            ]
        }
        call.resolve(["items": items])
    }

    private static func relative(_ url: URL, to home: URL) -> String {
        let path = url.standardizedFileURL.path
        return path.hasPrefix(home.path + "/") ? String(path.dropFirst(home.path.count + 1)) : path
    }

    /// Exclu de la sauvegarde : l'élément ou l'un de ses dossiers parents jusqu'au conteneur, ou sous Library/Caches.
    private static func excluded(_ url: URL, below home: URL) -> Bool {
        var current = url.standardizedFileURL
        while current.path.count > home.path.count {
            if current.path.hasSuffix("/Library/Caches") { return true }
            if (try? current.resourceValues(forKeys: [.isExcludedFromBackupKey]))?.isExcludedFromBackup == true { return true }
            current = current.deletingLastPathComponent()
        }
        return false
    }

    private static func size(of url: URL) -> (Int, Int) {
        if let values = try? url.resourceValues(forKeys: [.fileSizeKey, .isRegularFileKey]), values.isRegularFile == true {
            return (values.fileSize ?? 0, 1)
        }
        guard let walk = FileManager.default.enumerator(at: url, includingPropertiesForKeys: [.fileSizeKey, .isRegularFileKey])
        else { return (0, 0) }
        var bytes = 0, files = 0
        for case let file as URL in walk {
            let values = try? file.resourceValues(forKeys: [.fileSizeKey, .isRegularFileKey])
            guard values?.isRegularFile == true else { continue }
            bytes += values?.fileSize ?? 0
            files += 1
        }
        return (bytes, files)
    }
}

/// « Caméra » des captures : le même portrait, lu en octets bruts (sans correction de couleur), pour chaque image.
final class PortraitCamera: FaceCamera {
    let url: URL

    init(url: URL) {
        self.url = url
    }

    func capture(frames: Int) -> FaceCapture {
        guard let source = CGImageSourceCreateWithURL(url as CFURL, nil), let image = CGImageSourceCreateImageAtIndex(source, 0, nil),
              image.bitsPerComponent == 8, let bytes = image.dataProvider?.data as Data? else {
            return FaceCapture(error: "camera_error", detail: "portrait")
        }
        let step = image.bitsPerPixel / 8
        let first = [.first, .premultipliedFirst, .noneSkipFirst].contains(image.alphaInfo) ? 1 : 0
        var rgb = [UInt32](repeating: 0, count: image.width * image.height)
        for y in 0..<image.height {
            for x in 0..<image.width {
                let p = y * image.bytesPerRow + x * step + first
                rgb[y * image.width + x] = UInt32(bytes[p]) << 16 | UInt32(bytes[p + 1]) << 8 | UInt32(bytes[p + 2])
            }
        }
        return FaceCapture(images: Array(repeating: rgb, count: frames), width: image.width, height: image.height, openMs: 0)
    }
}
#endif
