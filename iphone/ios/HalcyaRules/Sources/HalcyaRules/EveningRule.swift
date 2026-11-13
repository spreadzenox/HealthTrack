import Foundation

/// Règles des rappels du soir de Halcya sur iPhone (étape I5), portées de la version Android de HealthTrack
/// (`mood/EveningNote.java`, `gut/GutEvening.java`) : l'heure apprise reste dans la soirée, jamais sans le choix de
/// la personne, jamais si le bilan du jour est déjà fait.
///
/// Différence d'iOS : aucune alarme ne réveille l'app le soir pour décider. Les notifications des prochains soirs
/// sont programmées d'avance (`plan`) et reprogrammées à chaque ouverture de l'app et à chaque bilan.
public enum EveningRule {
    public static let earliestMinute = 18 * 60
    public static let latestMinute = 23 * 60
    /// Soirs programmés d'avance (iOS garde au plus 64 notifications en attente par app).
    public static let plannedDays = 7

    /// Minute du jour ramenée dans la soirée (18 h – 23 h) ; valeur absurde → `fallback`.
    public static func clampMinute(_ minuteOfDay: Int, fallback: Int) -> Int {
        guard (0..<(24 * 60)).contains(minuteOfDay) else { return fallback }
        return min(latestMinute, max(earliestMinute, minuteOfDay))
    }

    /// Jour local AAAA-MM-JJ (même forme que `localDateKey` côté JavaScript).
    public static func dayKey(_ date: Date, calendar: Calendar) -> String {
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    /// Soirs à programmer, à l'heure prévue en heure locale (20 h reste 20 h le jour du changement d'heure) :
    /// aujourd'hui si l'heure est encore à venir et que le bilan du jour n'est pas fait, puis les soirs suivants.
    /// Rien si le rappel est éteint.
    public static func plan(enabled: Bool, doneDay: String?, minuteOfDay: Int, fallback: Int, now: Date,
                            calendar: Calendar, days: Int = plannedDays) -> [Date] {
        guard enabled, days > 0 else { return [] }
        let minute = clampMinute(minuteOfDay, fallback: fallback)
        let today = calendar.startOfDay(for: now)
        var dates: [Date] = []
        for offset in 0...days where dates.count < days {
            guard let day = calendar.date(byAdding: .day, value: offset, to: today),
                  let at = calendar.date(bySettingHour: minute / 60, minute: minute % 60, second: 0, of: day)
            else { continue }
            if at <= now.addingTimeInterval(30) || dayKey(at, calendar: calendar) == doneDay { continue }
            dates.append(at)
        }
        return dates
    }

    /// Heure retenue pour un geste sur la notification : celle du geste, ou la dernière seconde du soir demandé si
    /// le geste vient après minuit. Android retire la notification à minuit ; iOS ne sait pas la retirer d'elle-même.
    public static func answerTime(answeredAt: Date, askedAt: Date, calendar: Calendar) -> Date {
        guard let nextDay = calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: askedAt)) else {
            return answeredAt
        }
        return min(answeredAt, nextDay.addingTimeInterval(-1))
    }
}

/// Bilan du ventre du soir (`src/services/gutEvening.js`) : « Et votre ventre aujourd'hui ? », Calme / Gêne / Douleur.
public enum GutEveningRule {
    public static let defaultMinute = 20 * 60
    public static let recordVersion = 1
    /// Les trois niveaux, dans l'ordre des boutons (mêmes identifiants que `GUT_LEVELS` côté JavaScript).
    public static let levels = ["calm", "discomfort", "pain"]
    public static let labels = ["Calme", "Gêne", "Douleur"]

    /// Ce que la boîte garde d'un bilan : le niveau et l'heure du geste (ms), rien d'autre ; nil si niveau inconnu.
    public static func record(level: String, at: Date) -> String? {
        guard levels.contains(level) else { return nil }
        let ms = Int64((at.timeIntervalSince1970 * 1000).rounded())
        return "{\"v\":\(recordVersion),\"level\":\"\(level)\",\"at\":\(ms)}"
    }
}

/// Note du soir d'un geste (`src/services/eveningNote.js`) : « Votre soirée ? », les 5 notes de bien-être affichées
/// (1 = très bas, 3 = moyen, 5 = très bien ; Android v855, TESTEUR-2c), comme `mood/EveningNote.java` d'Android.
public enum EveningNoteRule {
    public static let defaultMinute = 21 * 60
    /// v2 : « choice » 1 à 5, que l'app convertit dans son échelle interne (`mood/wellbeingScale.js`) ; v1 gardait
    /// « score » 0 à 5 et reste lue par l'app (une note laissée dans la boîte avant la mise à jour n'est pas perdue).
    public static let recordVersion = 2
    /// Les cinq notes affichées, dans l'ordre des boutons.
    public static let scores = Array(1...5)

    /// Ce que la boîte garde d'une note : la note affichée et l'heure du geste (ms), rien d'autre ; nil hors échelle.
    public static func record(score: Int, at: Date) -> String? {
        guard scores.contains(score) else { return nil }
        let ms = Int64((at.timeIntervalSince1970 * 1000).rounded())
        return "{\"v\":\(recordVersion),\"choice\":\(score),\"at\":\(ms)}"
    }
}
