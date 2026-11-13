import Foundation

/// Ce dont la mémoire a besoin d'un stockage clé-valeur : `UserDefaults` dans l'app, un dictionnaire dans les tests.
public protocol KeyValueStore: AnyObject {
    func object(forKey key: String) -> Any?
    func set(_ value: Any?, forKey key: String)
}

extension UserDefaults: KeyValueStore {}

/// Un rappel du soir : où ranger son état, son heure par défaut, ce que la boîte garde d'une réponse.
public struct EveningKind {
    /// Préfixe des clés dans `UserDefaults`.
    public let prefix: String
    public let defaultMinute: Int
    /// Début du nom des réponses dans la boîte.
    public let notePrefix: String
    /// Réponse (identifiant de l'action, sans préfixe) et heure retenue → JSON de la boîte ; nil si inconnue.
    public let record: (String, Date) -> String?

    /// Bilan du ventre du soir : Calme / Gêne / Douleur.
    public static let gut = EveningKind(prefix: "halcya.gutEvening.", defaultMinute: GutEveningRule.defaultMinute,
                                        notePrefix: "gut") { GutEveningRule.record(level: $0, at: $1) }
    /// Note du soir : 0 à 5.
    public static let note = EveningKind(prefix: "halcya.eveningNote.", defaultMinute: EveningNoteRule.defaultMinute,
                                         notePrefix: "note") { answer, at in
        Int(answer).flatMap { EveningNoteRule.record(score: $0, at: at) }
    }
}

/// Mémoire d'un rappel du soir sur iPhone, portée de `GutEveningPlugin.java`, `EveningNotePlugin.java` et de leurs
/// `…Notice.java` d'Android : l'état reçu de l'app (`configure`), la boîte des réponses données depuis la notification
/// (vidée par l'app à l'ouverture suivante, `src/services/eveningNote.js` › `drainNativeInbox`) et les soirs à
/// programmer d'avance.
public final class EveningStore {
    /// Réponses gardées au plus en attendant l'ouverture de l'app (comme `INBOX_MAX` d'Android).
    public static let inboxMax = 60

    private let defaults: KeyValueStore
    public let kind: EveningKind

    public init(defaults: KeyValueStore, kind: EveningKind) {
        self.defaults = defaults
        self.kind = kind
    }

    private func key(_ name: String) -> String { kind.prefix + name }

    public private(set) var enabled: Bool {
        get { defaults.object(forKey: key("enabled")) as? Bool ?? false }
        set { defaults.set(newValue, forKey: key("enabled")) }
    }

    public private(set) var minuteOfDay: Int {
        get { defaults.object(forKey: key("minuteOfDay")) as? Int ?? kind.defaultMinute }
        set { defaults.set(newValue, forKey: key("minuteOfDay")) }
    }

    /// Jour (AAAA-MM-JJ) de la dernière réponse connue, donnée dans l'app ou depuis la notification.
    public private(set) var noteDay: String? {
        get { defaults.object(forKey: key("noteDay")) as? String }
        set { defaults.set(newValue, forKey: key("noteDay")) }
    }

    public private(set) var answers: Int {
        get { defaults.object(forKey: key("answers")) as? Int ?? 0 }
        set { defaults.set(newValue, forKey: key("answers")) }
    }

    /// Premier soir programmé (ms depuis 1970), 0 si aucun.
    public var nextAt: Double {
        get { defaults.object(forKey: key("nextAt")) as? Double ?? 0 }
        set { defaults.set(newValue, forKey: key("nextAt")) }
    }

    /// État effectif reçu de l'app : allumé ou non, heure apprise (ramenée dans la soirée), jour du dernier bilan
    /// (le plus récent des deux : un bilan donné depuis la notification n'est peut-être pas encore importé).
    public func configure(enabled: Bool?, minuteOfDay: Int?, noteDay: String?) {
        if let enabled { self.enabled = enabled }
        if let minuteOfDay { self.minuteOfDay = EveningRule.clampMinute(minuteOfDay, fallback: kind.defaultMinute) }
        if let noteDay, noteDay.range(of: #"^\d{4}-\d{2}-\d{2}$"#, options: .regularExpression) != nil,
           self.noteDay.map({ noteDay > $0 }) ?? true {
            self.noteDay = noteDay
        }
    }

    /// Soirs à programmer d'avance (voir `EveningRule.plan`).
    public func plan(now: Date, calendar: Calendar) -> [Date] {
        EveningRule.plan(enabled: enabled, doneDay: noteDay, minuteOfDay: minuteOfDay,
                         fallback: kind.defaultMinute, now: now, calendar: calendar)
    }

    /// Geste depuis la notification (niveau du ventre, note) : rangé dans la boîte, compté comme réponse du soir
    /// demandé. Faux si la réponse est inconnue.
    @discardableResult
    public func answer(_ answer: String, answeredAt: Date, askedAt: Date, calendar: Calendar) -> Bool {
        let at = EveningRule.answerTime(answeredAt: answeredAt, askedAt: askedAt, calendar: calendar)
        guard let json = kind.record(answer, at) else { return false }
        var notes = storedNotes()
        let ms = Int64(at.timeIntervalSince1970 * 1000)
        notes.append(["name": "\(kind.notePrefix)-\(ms)-\(notes.count + answers)", "json": json])
        defaults.set(Array(notes.suffix(Self.inboxMax)), forKey: key("inbox"))
        let day = EveningRule.dayKey(at, calendar: calendar)
        if noteDay.map({ day > $0 }) ?? true { noteDay = day }
        answers += 1
        return true
    }

    /// Réponses en attente, de la plus ancienne à la plus récente.
    public func inbox() -> [(name: String, json: String)] {
        storedNotes().compactMap { note in
            guard let name = note["name"], let json = note["json"] else { return nil }
            return (name: name, json: json)
        }
    }

    /// Retire les réponses importées par l'app ; rend le nombre retirées.
    public func remove(names: [String]) -> Int {
        let notes = storedNotes()
        let kept = notes.filter { !names.contains($0["name"] ?? "") }
        defaults.set(kept, forKey: key("inbox"))
        return notes.count - kept.count
    }

    private func storedNotes() -> [[String: String]] {
        defaults.object(forKey: key("inbox")) as? [[String: String]] ?? []
    }
}
