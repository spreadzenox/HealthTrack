import Capacitor
import HalcyaRules
import UserNotifications

/// Rappel de la portion du jour pendant une réintroduction guidée, sur iPhone (étape I5) : même plugin, mêmes
/// méthodes que `PortionReminderPlugin.java` d'Android, vu de `src/services/fodmapReminder.js`. Les rappels restants
/// sont programmés d'avance (iOS ne réveille pas l'app) ; toucher la notification ouvre l'app, qui demande ensuite
/// `takeOpen` pour aller à la réintroduction.
@objc(PortionReminderPlugin)
public class PortionReminderPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PortionReminderPlugin"
    public let jsName = "PortionReminder"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "schedule", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestNotifications", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "takeOpen", returnType: CAPPluginReturnPromise),
    ]

    /// { items: [{ at, title, body }] } remplace les rappels prévus (liste vide = tout annuler, notification affichée
    /// comprise) ; rend { count, notifications }.
    @objc func schedule(_ call: CAPPluginCall) {
        let input = (call.getArray("items", JSObject.self) ?? []).map { $0.mapValues { $0 as Any } }
        let items = PortionRule.items(input)
        PortionReminderNotifications.schedule(items) { notifications in
            call.resolve(["count": items.count, "notifications": notifications])
        }
    }

    @objc func requestNotifications(_ call: CAPPluginCall) {
        NotificationAuthorization.request(call)
    }

    @objc func takeOpen(_ call: CAPPluginCall) {
        call.resolve(["open": PortionReminderNotifications.store.takeOpen()])
    }

    /// iOS transmet le toucher après le retour de l'app au premier plan, quand la page a déjà vérifié : on le lui
    /// signale (`src/ios/portionOpen.js`), elle refait la même vérification.
    override public func load() {
        PortionReminderNotifications.onOpen = { [weak self] in
            self?.bridge?.triggerWindowJSEvent(eventName: "halcya-portion-open")
        }
    }
}

/// Notifications du rappel de portion : une par rappel à venir, sans action (le toucher ouvre l'app).
enum PortionReminderNotifications {
    static let category = "portion-reminder"
    static let requestPrefix = "portion-reminder-"
    static let store = PortionStore(defaults: UserDefaults.standard)
    /// Signal à la page qu'un toucher vient d'être retenu (posé par le plugin une fois Capacitor chargé).
    static var onOpen: (() -> Void)?

    static func schedule(_ items: [PortionRule.Item], _ done: @escaping (Bool) -> Void) {
        let center = UNUserNotificationCenter.current()
        center.getPendingNotificationRequests { pending in
            center.removePendingNotificationRequests(withIdentifiers: pending.map(\.identifier).filter { $0.hasPrefix(requestPrefix) })
            if items.isEmpty {
                center.getDeliveredNotifications { delivered in
                    center.removeDeliveredNotifications(withIdentifiers: delivered.map(\.request.identifier)
                        .filter { $0.hasPrefix(requestPrefix) })
                }
            }
            let now = Date()
            for item in PortionRule.upcoming(items, nowMs: now.timeIntervalSince1970 * 1000) {
                let content = UNMutableNotificationContent()
                content.title = item.title
                content.body = item.body
                content.categoryIdentifier = category
                // regroupés dans le centre de notifications (Android n'en affiche qu'une, remplacée à chaque rappel)
                content.threadIdentifier = category
                let trigger = UNTimeIntervalNotificationTrigger(timeInterval: item.at / 1000 - now.timeIntervalSince1970,
                                                                repeats: false)
                center.add(UNNotificationRequest(identifier: requestPrefix + String(Int64(item.at)), content: content,
                                                 trigger: trigger))
            }
            center.getNotificationSettings { done(NotificationAuthorization.allowed($0)) }
        }
    }

    /// Toucher sur la notification : l'app ouvrira la réintroduction. Vrai s'il s'agissait de ce rappel.
    static func opened(_ response: UNNotificationResponse) -> Bool {
        guard response.notification.request.content.categoryIdentifier == category else { return false }
        if response.actionIdentifier == UNNotificationDefaultActionIdentifier {
            store.markOpen()
            DispatchQueue.main.async { onOpen?() }
        }
        return true
    }
}
