import AVFoundation
import CallKit
import Capacitor
import Foundation
import HalcyaFace
import HalcyaFaceModels
import UIKit

/// Lecture du visage sur iPhone (étape I7) : même plugin, mêmes méthodes que `FaceSensePlugin.java` d'Android, dans le
/// mode de la variante play (« app_open » : à l'ouverture de Halcya ou pour « Tester », jamais en arrière-plan, que
/// l'iPhone n'autorise pas). Chaîne et modèles dans `ios/HalcyaFace` et `ios/HalcyaFaceModels`, mêmes scores qu'Android
/// sur ses vecteurs. Les images restent en mémoire et sont oubliées après l'inférence ; seul le JSON des scores est
/// déposé dans la boîte, que le JS importe puis vide. `status` ne rend jamais un score. Valence et éveil (HSEmotion)
/// ne sont pas branchés : licence de leurs poids à trancher (`journal/DEMANDES.md`).
@objc(FaceSensePlugin)
public class FaceSensePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FaceSensePlugin"
    public let jsName = "FaceSense"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopUnlock", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "test", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readNow", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "prepareAffect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "list", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestBatteryExemption", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openNeverSleep", returnType: CAPPluginReturnPromise),
    ]

    private let work = DispatchQueue(label: "fr.jpesquet.sante.face")
    private let prefs = UserDefaultsFacePrefs(suiteName: "face_sense")
    private let calls = CXCallObserver()
    /// Caméra des lectures ; remplaçable par la build de captures (le simulateur n'en a pas).
    static var camera: () -> FaceCamera = { FrontCamera() }

    static var inbox: FaceInbox {
        FaceInbox(directory: FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("Halcya/face-bursts"))
    }

    private var permission: Bool { AVCaptureDevice.authorizationStatus(for: .video) == .authorized }

    private func oneShot(visible: Bool) -> FaceOneShot {
        let env = FaceEnvironment(
            screenOn: visible, inCall: calls.calls.contains { !$0.hasEnded },
            thermal: FaceSchedule.thermalHeadroom(ProcessInfo.processInfo.thermalState), visible: visible,
            cameraPermission: permission, modelsAvailable: FaceModels.bundledDirectory != nil
        )
        return FaceOneShot(prefs: prefs, inbox: Self.inbox, camera: Self.camera(), openPipeline: {
            guard let dir = FaceModels.bundledDirectory else { throw FaceModels.Missing() }
            return try FaceModels(directory: dir).pipeline()
        }, environment: { env })
    }

    /// Lecture hors du fil principal ; l'état de l'app est lu avant, sur le fil principal.
    private func read(_ trigger: String, _ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let visible = UIApplication.shared.applicationState == .active
            let shot = self.oneShot(visible: visible)
            self.work.async { call.resolve(["outcome": shot.run(trigger: trigger)]) }
        }
    }

    @objc func status(_ call: CAPPluginCall) {
        work.async {
            var out: [String: Any] = [:]
            for key in self.prefs.keys {
                if let v = self.prefs.value(key), v is String || v is NSNumber { out[key] = v }
            }
            var outcomes: [String: Int] = [:], rejected: [String: Int] = [:]
            for key in self.prefs.keys {
                if key.hasPrefix("n_") { outcomes[String(key.dropFirst(2))] = self.prefs.int(key) }
                if key.hasPrefix("r_") { rejected[String(key.dropFirst(2))] = self.prefs.int(key) }
            }
            let enabled = self.prefs.int("enabled") == 1
            out.merge([
                "models": FaceModels.bundledDirectory != nil, "affectModel": false, "affectModel2": false,
                "affectDownloading": false, "running": false, "mode": "app_open", "enabled": enabled,
                "unlockAvailable": false, "unlock": false, "permission": self.permission, "batteryExempt": true,
                "sdk": ProcessInfo.processInfo.operatingSystemVersion.majorVersion,
                "release": UIDevice.current.systemVersion, "manufacturer": "Apple", "model": Self.machine(),
                "pending": Self.inbox.count(), "outcomes": outcomes, "rejected": rejected,
            ]) { _, new in new }
            call.resolve(out)
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        let enable = { (granted: Bool) in
            if granted { self.prefs.set("enabled", 1) }
            call.resolve(["started": granted, "permission": granted])
        }
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized: enable(true)
        case .notDetermined: AVCaptureDevice.requestAccess(for: .video) { granted in enable(granted) }
        default: enable(false)
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        prefs.set("enabled", 0)
        call.resolve()
    }

    @objc func stopUnlock(_ call: CAPPluginCall) {
        call.resolve() // pas de lecture au déverrouillage sur iPhone
    }

    @objc func test(_ call: CAPPluginCall) {
        read(FaceSchedule.triggerManual, call)
    }

    @objc func readNow(_ call: CAPPluginCall) {
        guard prefs.int("enabled") == 1 else {
            call.resolve(["outcome": "skip:off"])
            return
        }
        read(FaceSchedule.triggerAppOpen, call)
    }

    @objc func prepareAffect(_ call: CAPPluginCall) {
        call.resolve(["ready": false, "duo": false, "downloading": false]) // valence et éveil éteints sur iPhone
    }

    @objc func list(_ call: CAPPluginCall) {
        work.async {
            call.resolve(["bursts": Self.inbox.list().map { ["name": $0.name, "json": $0.json] }])
        }
    }

    @objc func remove(_ call: CAPPluginCall) {
        guard let names = call.getArray("names") as? [String] else {
            call.reject("noms de rafales invalides")
            return
        }
        work.async { call.resolve(["removed": Self.inbox.remove(names)]) }
    }

    @objc func requestBatteryExemption(_ call: CAPPluginCall) {
        call.reject("Indisponible dans cette version")
    }

    @objc func openNeverSleep(_ call: CAPPluginCall) {
        call.reject("Indisponible dans cette version")
    }

    private static func machine() -> String {
        var info = utsname()
        uname(&info)
        return withUnsafeBytes(of: &info.machine) { String(decoding: $0.prefix { $0 != 0 }, as: UTF8.self) }
    }
}

/// Réglages et compteurs de la lecture du visage dans des UserDefaults à part (« face_sense », comme Android).
final class UserDefaultsFacePrefs: FacePrefs {
    private let defaults: UserDefaults
    private let suiteName: String

    init(suiteName: String) {
        self.suiteName = suiteName
        defaults = UserDefaults(suiteName: suiteName) ?? .standard
    }

    func int(_ key: String) -> Int { defaults.integer(forKey: key) }
    func long(_ key: String) -> Int64 { (defaults.object(forKey: key) as? NSNumber)?.int64Value ?? 0 }
    func string(_ key: String) -> String? { defaults.string(forKey: key) }
    func value(_ key: String) -> Any? { defaults.object(forKey: key) }
    func set(_ key: String, _ value: Any?) {
        if let value { defaults.set(value, forKey: key) } else { defaults.removeObject(forKey: key) }
    }

    var keys: [String] { Array(defaults.persistentDomain(forName: suiteName)?.keys ?? [String: Any]().keys) }
}
