import Foundation

/// Rappel de la portion du jour pendant une réintroduction guidée (`src/services/fodmapReminder.js`), porté de
/// `PortionReminderPlugin.java` et `gut/PortionSchedule.java` d'Android : l'app donne les rappels restants
/// ({ at, title, body }, heures croissantes, au plus 3). Aucune note du ventre ici.
///
/// Différence d'iOS : aucune alarme ne réveille l'app pour afficher un rappel puis programmer le suivant ; tous les
/// rappels encore à venir sont programmés d'avance (`upcoming`).
public enum PortionRule {
    public static let maxItems = 3

    public struct Item: Equatable {
        public let at: Double
        public let title: String
        public let body: String
    }

    /// Rappels reçus de l'app, gardés comme Android : une heure (ms) et un titre, au plus 3.
    public static func items(_ input: [[String: Any]]) -> [Item] {
        var items: [Item] = []
        for o in input where items.count < maxItems {
            let at = (o["at"] as? Double) ?? (o["at"] as? Int).map(Double.init) ?? 0
            let title = o["title"] as? String ?? ""
            guard at > 0, !title.isEmpty else { continue }
            items.append(Item(at: at, title: title, body: o["body"] as? String ?? ""))
        }
        return items
    }

    /// Rappels à programmer : ceux encore à venir.
    public static func upcoming(_ items: [Item], nowMs: Double) -> [Item] {
        items.filter { $0.at > nowMs }
    }
}

/// Mémoire du rappel de portion : la notification a-t-elle été touchée depuis la dernière vérification de l'app ?
public final class PortionStore {
    private let defaults: KeyValueStore
    private let key = "halcya.portionReminder.open"

    public init(defaults: KeyValueStore) {
        self.defaults = defaults
    }

    public func markOpen() {
        defaults.set(true, forKey: key)
    }

    /// Vrai une fois après un toucher (l'oublie en répondant, comme Android).
    public func takeOpen() -> Bool {
        let open = defaults.object(forKey: key) as? Bool ?? false
        if open { defaults.set(false, forKey: key) }
        return open
    }
}
