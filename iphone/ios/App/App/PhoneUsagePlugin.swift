import Capacitor
import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings
// Les segments (`activitySegments`, `categories`, `applications`) sont déclarés dans le recouvrement
// `_DeviceActivity_SwiftUI`, chargé seulement quand SwiftUI est importé aussi.
import SwiftUI

/// Temps d'écran sur iPhone (étape I8) : même nom de plugin que `PhoneUsagePlugin.java` d'Android, vu de
/// `src/services/phoneUsageSync.js` (correctif iOS) et d'`src/ios/phoneUsageIos.js`. Android lit les allumages d'écran
/// un à un ; l'iPhone donne des totaux par heure (`DeviceActivityData.activityData`, iOS 26.4+), seulement sur un
/// appareil de l'UE et avec l'accord de la personne (`approvedWithDataAccess`, droit « Family Controls App and Website
/// Usage » accordé à Halcya le 30/10). Rien ne sort du téléphone : les totaux vont à l'app, qui les range sur place.
@objc(PhoneUsagePlugin)
public class PhoneUsagePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PhoneUsagePlugin"
    public let jsName = "PhoneUsage"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "checkAccess", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openAccessSettings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "queryUsageSegments", returnType: CAPPluginReturnPromise),
    ]

    /// `{ granted, supported }`, comme sur Android : `supported` faux avant iOS 26.4.
    @objc func checkAccess(_ call: CAPPluginCall) {
        guard #available(iOS 26.4, *) else {
            call.resolve(["granted": false, "supported": false])
            return
        }
        call.resolve(["granted": AuthorizationCenter.shared.authorizationStatus == .approvedWithDataAccess, "supported": true])
    }

    /// Sur Android, ouvre le réglage « Accès aux données d'utilisation » ; sur iPhone, demande l'autorisation Temps
    /// d'écran de la personne (Face ID ou code), puis rend le nouvel état.
    @objc func openAccessSettings(_ call: CAPPluginCall) {
        guard #available(iOS 26.4, *) else {
            call.resolve(["granted": false, "supported": false])
            return
        }
        Task {
            do {
                try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                call.resolve(["granted": AuthorizationCenter.shared.authorizationStatus == .approvedWithDataAccess, "supported": true])
            } catch {
                call.reject("Temps d’écran non autorisé : \(error.localizedDescription)")
            }
        }
    }

    /// Segments horaires `{ start, end, activeMs, pickups, firstPickup }` (millisecondes) entre `start` et `end`.
    @objc func queryUsageSegments(_ call: CAPPluginCall) {
        guard #available(iOS 26.4, *) else {
            call.reject("Temps d’écran : iOS 26.4 ou plus")
            return
        }
        let now = Date().timeIntervalSince1970 * 1000
        let start = Date(timeIntervalSince1970: (call.getDouble("start") ?? now - 7 * 86_400_000) / 1000)
        let end = Date(timeIntervalSince1970: (call.getDouble("end") ?? now) / 1000)
        guard end > start else {
            call.resolve(["segments": []])
            return
        }
        let filter = DeviceActivityFilter(segment: .hourly(during: DateInterval(start: start, end: end)), users: .all, devices: .init([.iPhone]))
        let box = SegmentBox()
        let reading = Task {
            do {
                for try await data in DeviceActivityData.activityData(filteredBy: filter) {
                    let device = data.device.name ?? ""
                    for await segment in data.activitySegments {
                        var pickups = segment.totalPickupsWithoutApplicationActivity
                        // Apps de l'heure, avec la catégorie de Temps d'écran (`phoneAppsIos.js`) ; Apple peut taire le nom
                        var apps: [[String: Any]] = []
                        for await category in segment.categories {
                            let categoryName = category.category.localizedDisplayName
                            for await app in category.applications {
                                pickups += app.numberOfPickups
                                var entry: [String: Any] = ["ms": app.totalActivityDuration * 1000]
                                if let id = app.application.bundleIdentifier { entry["id"] = id }
                                if let label = app.application.localizedDisplayName { entry["label"] = label }
                                if let name = categoryName { entry["category"] = name }
                                apps.append(entry)
                            }
                        }
                        var item: [String: Any] = [
                            "start": segment.dateInterval.start.timeIntervalSince1970 * 1000,
                            "end": segment.dateInterval.end.timeIntervalSince1970 * 1000,
                            "activeMs": segment.totalActivityDuration * 1000,
                            "pickups": pickups,
                            "apps": apps,
                        ]
                        if let first = segment.firstPickup { item["firstPickup"] = first.timeIntervalSince1970 * 1000 }
                        box.put("\(device)|\(segment.dateInterval.start.timeIntervalSince1970)", item)
                    }
                }
                if let segments = box.finish() { call.resolve(["segments": segments]) }
            } catch {
                if box.finish() != nil { call.reject("Lecture du temps d’écran impossible : \(error.localizedDescription)") }
            }
        }
        // Si la suite d'Apple reste ouverte (mises à jour), on rend ce qui est lu au bout de 20 s.
        Task {
            try? await Task.sleep(nanoseconds: 20_000_000_000)
            if let segments = box.finish() {
                reading.cancel()
                call.resolve(["segments": segments])
            }
        }
    }
}

/// Segments lus, un par appareil et par heure (une mise à jour remplace l'ancien), rendus une seule fois : à la fin de
/// la lecture ou au délai, le premier des deux.
private final class SegmentBox: @unchecked Sendable {
    private let lock = NSLock()
    private var items: [String: [String: Any]] = [:]
    private var order: [String] = []
    private var done = false

    func put(_ key: String, _ item: [String: Any]) {
        lock.lock()
        defer { lock.unlock() }
        if items[key] == nil { order.append(key) }
        items[key] = item
    }

    func finish() -> [[String: Any]]? {
        lock.lock()
        defer { lock.unlock() }
        if done { return nil }
        done = true
        return order.compactMap { items[$0] }
    }
}
