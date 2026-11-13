import Capacitor
import HalcyaRules
import UserNotifications

/// Rappels du soir sur iPhone (étape I5) : mêmes plugins, mêmes méthodes que la version Android
/// (`GutEveningPlugin.java`, `EveningNotePlugin.java`), vus de `src/services/gutEvening.js` et `eveningNote.js`. Les
/// règles et la boîte sont dans `HalcyaRules` (testées par XCTest) ; ici, la colle avec Capacitor et
/// `UNUserNotificationCenter`.
///
/// iOS ne réveille pas l'app le soir : `configure` programme d'avance les prochains soirs (une notification par soir,
/// sans aujourd'hui si la réponse du jour est donnée), et un geste sur une réponse est rangé sans ouvrir l'app
/// (`EveningNotifications.answer`, appelé par le délégué de l'app).
public class EveningPlugin: CAPPlugin {
    /// Le rappel servi par la sous-classe.
    var evening: EveningNotifications { fatalError("rappel du soir à définir par la sous-classe") }

    static var methods: [CAPPluginMethod] {
        var methods: [CAPPluginMethod] = [
            CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
            CAPPluginMethod(name: "configure", returnType: CAPPluginReturnPromise),
            CAPPluginMethod(name: "list", returnType: CAPPluginReturnPromise),
            CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise),
            CAPPluginMethod(name: "requestNotifications", returnType: CAPPluginReturnPromise),
        ]
        #if DEBUG
        methods.append(CAPPluginMethod(name: "testNotification", returnType: CAPPluginReturnPromise))
        #endif
        return methods
    }

    @objc func status(_ call: CAPPluginCall) {
        evening.status { call.resolve($0) }
    }

    /// { enabled, minuteOfDay, noteDay } → reprogramme les soirs ; rend le nouvel état.
    @objc func configure(_ call: CAPPluginCall) {
        let evening = self.evening
        evening.store.configure(enabled: call.getBool("enabled"), minuteOfDay: call.getInt("minuteOfDay"),
                                noteDay: call.getString("noteDay"))
        evening.reschedule {
            evening.status { call.resolve($0) }
        }
    }

    @objc func list(_ call: CAPPluginCall) {
        call.resolve(["notes": evening.store.inbox().map { ["name": $0.name, "json": $0.json] }])
    }

    /// Retire les réponses importées : { names: [...] } → { removed }.
    @objc func remove(_ call: CAPPluginCall) {
        guard let names = call.getArray("names", String.self) else {
            call.reject("noms de réponses invalides")
            return
        }
        call.resolve(["removed": evening.store.remove(names: names)])
    }

    #if DEBUG
    /// Build de captures seulement (configuration Debug, jamais livrée) : la notification du soir dans `delay` s (3 par
    /// défaut), en bannière si `banner` (sinon discrète comme la vraie), pour la capturer et y répondre sur simulateur
    /// (`src/ios/captureMode.js`).
    @objc func testNotification(_ call: CAPPluginCall) {
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: Double(call.getInt("delay") ?? 3), repeats: false)
        let content = evening.content()
        if call.getBool("banner") ?? false { content.interruptionLevel = .active }
        // hors du préfixe des soirs programmés : une reprogrammation (`reschedule`) ne la retire pas
        let request = UNNotificationRequest(identifier: "essai-" + evening.category, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request) { error in
            if let error {
                call.reject(error.localizedDescription)
            } else {
                call.resolve()
            }
        }
    }
    #endif

    @objc func requestNotifications(_ call: CAPPluginCall) {
        NotificationAuthorization.request(call)
    }
}

/// Autorisation des notifications de Halcya, partagée par les rappels du soir et le rappel de portion.
enum NotificationAuthorization {
    static func allowed(_ settings: UNNotificationSettings) -> Bool {
        settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional
    }

    /// Demande l'autorisation (une seule fois, iOS ne la redemande plus) ; rend { asked, notifications }.
    static func request(_ call: CAPPluginCall) {
        let center = UNUserNotificationCenter.current()
        center.getNotificationSettings { settings in
            guard settings.authorizationStatus == .notDetermined else {
                call.resolve(["asked": false, "notifications": allowed(settings)])
                return
            }
            center.requestAuthorization(options: [.alert]) { granted, _ in
                call.resolve(["asked": true, "notifications": granted])
            }
        }
    }
}

/// Bilan digestif du soir : « Et votre digestion aujourd'hui ? », Calme / Gêne / Douleur (Android, AUJ-7).
@objc(GutEveningPlugin)
public class GutEveningPlugin: EveningPlugin, CAPBridgedPlugin {
    public let identifier = "GutEveningPlugin"
    public let jsName = "GutEvening"
    public let pluginMethods: [CAPPluginMethod] = EveningPlugin.methods
    override var evening: EveningNotifications { .gut }
}

/// Note du soir d'un geste : « Votre soirée ? », les 5 notes de bien-être (1 à 5).
@objc(EveningNotePlugin)
public class EveningNotePlugin: EveningPlugin, CAPBridgedPlugin {
    public let identifier = "EveningNotePlugin"
    public let jsName = "EveningNote"
    public let pluginMethods: [CAPPluginMethod] = EveningPlugin.methods
    override var evening: EveningNotifications { .note }
}

/// Notifications d'un rappel du soir : catégorie à actions, programmation des soirs, gestes.
final class EveningNotifications {
    /// Bilan digestif : Calme / Gêne / Douleur.
    static let gut = EveningNotifications(
        kind: .gut, category: "gut-evening", title: "Et votre digestion aujourd’hui ?", body: "Dans l’ensemble, d’un geste.",
        actions: Array(zip(GutEveningRule.levels, GutEveningRule.labels)))
    /// Note du soir : les 5 notes (1 à 5), comme les boutons d'Android (`notification_evening_note.xml`, v855).
    static let note = EveningNotifications(
        kind: .note, category: "evening-note", title: "Votre soirée ?", body: "1 = très bas, 5 = très bien",
        actions: EveningNoteRule.scores.map { ("\($0)", "\($0)") })
    static let all = [gut, note]

    let category: String
    let requestPrefix: String
    let store: EveningStore
    private let title: String
    private let body: String
    /// (réponse rangée, titre du bouton), dans l'ordre des boutons.
    private let actions: [(String, String)]

    private init(kind: EveningKind, category: String, title: String, body: String, actions: [(String, String)]) {
        self.category = category
        requestPrefix = category + "-"
        store = EveningStore(defaults: UserDefaults.standard, kind: kind)
        self.title = title
        self.body = body
        self.actions = actions
    }

    /// Les réponses, sans ouvrir l'app (pas d'option `.foreground`).
    var notificationCategory: UNNotificationCategory {
        let buttons = actions.map { answer, label in
            UNNotificationAction(identifier: requestPrefix + answer, title: label, options: [])
        }
        return UNNotificationCategory(identifier: category, actions: buttons, intentIdentifiers: [], options: [])
    }

    /// Discrète comme le canal « bas » d'Android, avec les réponses en actions.
    func content() -> UNMutableNotificationContent {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.categoryIdentifier = category
        content.interruptionLevel = .passive
        return content
    }

    /// Retire les soirs programmés, puis programme ceux de `store.plan` (rien si éteint).
    func reschedule(_ done: @escaping () -> Void) {
        let center = UNUserNotificationCenter.current()
        center.getPendingNotificationRequests { [self] pending in
            let old = pending.map(\.identifier).filter { $0.hasPrefix(requestPrefix) }
            center.removePendingNotificationRequests(withIdentifiers: old)
            let calendar = Calendar.current
            let dates = store.plan(now: Date(), calendar: calendar)
            store.nextAt = dates.first.map { $0.timeIntervalSince1970 * 1000 } ?? 0
            for date in dates {
                let parts = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: date)
                let trigger = UNCalendarNotificationTrigger(dateMatching: parts, repeats: false)
                let id = requestPrefix + EveningRule.dayKey(date, calendar: calendar)
                center.add(UNNotificationRequest(identifier: id, content: content(), trigger: trigger))
            }
            done()
        }
    }

    /// Geste sur la notification. Vrai s'il s'agissait d'une réponse à ce rappel.
    func answer(_ response: UNNotificationResponse) -> Bool {
        guard response.notification.request.content.categoryIdentifier == category,
              response.actionIdentifier.hasPrefix(requestPrefix) else { return false }
        let answer = String(response.actionIdentifier.dropFirst(requestPrefix.count))
        store.answer(answer, answeredAt: Date(), askedAt: response.notification.date, calendar: Calendar.current)
        return true
    }

    func status(_ done: @escaping ([String: Any]) -> Void) {
        UNUserNotificationCenter.current().getNotificationSettings { [self] settings in
            done([
                "enabled": store.enabled,
                "minuteOfDay": store.minuteOfDay,
                "nextAt": store.nextAt,
                "notifications": NotificationAuthorization.allowed(settings),
                "pending": store.inbox().count,
                "answers": store.answers,
                "noteDay": store.noteDay ?? NSNull(),
            ])
        }
    }
}

/// Reçoit les gestes sur les notifications de Halcya, qu'ils arrivent avant le chargement de Capacitor (app lancée en
/// arrière-plan par le geste : délégué posé par `AppDelegate`) ou après (relayés par le `NotificationRouter` de
/// Capacitor, qui devient alors le délégué).
final class HalcyaNotificationHandler: NSObject, UNUserNotificationCenterDelegate, NotificationHandlerProtocol {
    static let shared = HalcyaNotificationHandler()

    func willPresent(notification: UNNotification) -> UNNotificationPresentationOptions {
        [.banner, .list]
    }

    func didReceive(response: UNNotificationResponse) {
        if PortionReminderNotifications.opened(response) { return }
        if TrialReminderNotifications.opened(response) { return }
        _ = EveningNotifications.all.contains { $0.answer(response) }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler(willPresent(notification: notification))
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        didReceive(response: response)
        completionHandler()
    }
}
