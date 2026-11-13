import Capacitor
import Foundation
import HalcyaRules

/// Repère propre à ce téléphone, sur iPhone (étape I3) : même plugin, même méthode que `BackupMarkerPlugin.java`
/// d'Android, vu de `src/services/restoreGuard.js`. Le fichier est dans Library/Application Support/Halcya, exclu de
/// la sauvegarde iCloud ; le reste des données de l'app (IndexedDB, localStorage) suit la sauvegarde du téléphone.
@objc(BackupMarkerPlugin)
public class BackupMarkerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BackupMarkerPlugin"
    public let jsName = "BackupMarker"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "marker", returnType: CAPPluginReturnPromise),
    ]

    static var directory: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("Halcya")
    }

    @objc func marker(_ call: CAPPluginCall) {
        do {
            call.resolve(["id": try DeviceMarker.id(in: Self.directory)])
        } catch {
            call.reject("repère indisponible")
        }
    }
}
