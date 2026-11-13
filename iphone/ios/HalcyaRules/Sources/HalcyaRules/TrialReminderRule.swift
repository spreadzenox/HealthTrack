import Foundation

/// Rappel de fin d'essai (`src/services/trialReminder.js`), porté de `TrialReminderPlugin.java` d'Android : une
/// notification locale 2 jours avant le premier paiement, promise par l'écran d'abonnement. L'app donne
/// `{ at, title, body, url }` d'après les droits vérifiés par le relais ; rien ne quitte le téléphone.
///
/// Sur iPhone, toucher la notification ouvre la page de gestion des abonnements d'Apple : seule une adresse
/// d'Apple est gardée (jamais une page quelconque passée par la page web).
public enum TrialReminderRule {
    public static let identifier = "halcya-trial-reminder"

    public struct Reminder: Equatable {
        public let at: Double
        public let title: String
        public let body: String
        public let url: URL?
    }

    /// Adresses ouvertes au toucher : la gestion des abonnements d'Apple (https, apps.apple.com).
    public static func manageURL(_ text: String?) -> URL? {
        guard let text, let url = URL(string: text), url.scheme == "https", url.host == "apps.apple.com" else { return nil }
        return url
    }

    /// Rappel reçu de l'app, comme Android : une heure (ms) et un titre ; sinon rien.
    public static func reminder(_ o: [String: Any]) -> Reminder? {
        let at = (o["at"] as? Double) ?? (o["at"] as? Int).map(Double.init) ?? 0
        let title = o["title"] as? String ?? ""
        guard at > 0, !title.isEmpty else { return nil }
        return Reminder(at: at, title: title, body: o["body"] as? String ?? "", url: manageURL(o["url"] as? String))
    }

    /// Délai avant la notification (secondes), ou nil si l'heure est passée : rien à programmer.
    public static func delay(_ reminder: Reminder, nowMs: Double) -> TimeInterval? {
        reminder.at > nowMs ? (reminder.at - nowMs) / 1000 : nil
    }
}
