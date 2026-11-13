import Foundation

/// Quand prendre une rafale, comme `FaceSchedule.java` d'Android. Sur iPhone, comme dans la variante play : à
/// l'**ouverture de Halcya** seulement (« app_open », une lecture au plus par demi-heure et 12 par jour), jamais à
/// l'ouverture d'une autre app ; « manual » (bouton « Tester ») ne sert qu'au diagnostic. Le déverrouillage (« unlock »)
/// garde la règle d'Android mais n'existe pas sur iPhone (pas de caméra en arrière-plan). Règle pure : nil (on y va) ou
/// la raison du saut, comptée dans le diagnostic.
public enum FaceSchedule {
    public static let triggerUnlock = "unlock"
    public static let triggerManual = "manual"
    public static let triggerAppOpen = "app_open"

    /// Deux déverrouillages rapprochés ne font qu'une rafale.
    public static let minIntervalMs: Int64 = 2 * 60 * 1000
    /// Plafond de sécurité par jour pour le déverrouillage.
    public static let maxPerDay = 150
    /// Ouverture de l'app : une lecture au plus toutes les 30 min…
    public static let appOpenMinIntervalMs: Int64 = 30 * 60 * 1000
    /// … et au plus 12 par jour.
    public static let appOpenMaxPerDay = 12
    /// Marge thermique (0 = froid, 1 = bridage imminent) au-delà de laquelle on ne lance rien.
    public static let maxThermalHeadroom = 0.8

    /// 2e essai d'une rafale de déverrouillage sans visage : 2 s plus tard, dans les 10 s du déverrouillage.
    public static let retryDelayMs: Int64 = 2000
    public static let retryWindowMs: Int64 = 10_000

    public enum Skip: String {
        case tooSoon = "too_soon", dailyCap = "daily_cap", screenOff = "screen_off", inCall = "in_call", hot = "hot"
        case unknownTrigger = "unknown_trigger"
    }

    /// - Parameters:
    ///   - lastBurstAt: heure de la dernière rafale du même déclencheur (ms, 0 si aucune)
    ///   - burstsToday: rafales du même déclencheur déjà prises aujourd'hui
    ///   - thermal: marge thermique (NaN si inconnue ; sur iPhone, `thermalHeadroom(_:)`)
    public static func decide(trigger: String?, now: Int64, lastBurstAt: Int64, burstsToday: Int, screenOn: Bool,
                              inCall: Bool, thermal: Double) -> Skip? {
        let manual = trigger == triggerManual, appOpen = trigger == triggerAppOpen
        if !manual && !appOpen && trigger != triggerUnlock { return .unknownTrigger }
        if !screenOn { return .screenOff }
        if inCall { return .inCall }
        if !thermal.isNaN && thermal > maxThermalHeadroom { return .hot }
        if manual { return nil }
        if burstsToday >= (appOpen ? appOpenMaxPerDay : maxPerDay) { return .dailyCap }
        let interval = appOpen ? appOpenMinIntervalMs : minIntervalMs
        if lastBurstAt > 0 && now - lastBurstAt >= 0 && now - lastBurstAt < interval { return .tooSoon }
        return nil
    }

    /// Faut-il reprendre la rafale du déverrouillage qui n'a lu aucun visage ? Une fois, dans les 10 s ; jamais pour
    /// l'ouverture de l'app ni le test.
    public static func shouldRetry(trigger: String?, faceFound: Bool, alreadyRetried: Bool, sinceUnlockMs: Int64) -> Bool {
        if trigger != triggerUnlock || faceFound || alreadyRetried { return false }
        return sinceUnlockMs >= 0 && sinceUnlockMs + retryDelayMs <= retryWindowMs
    }

    /// Marge thermique de l'iPhone, sur l'échelle d'Android : `.serious` et `.critical` dépassent le seuil (on ne lance
    /// rien), `.nominal` et `.fair` non.
    public static func thermalHeadroom(_ state: ProcessInfo.ThermalState) -> Double {
        switch state {
        case .nominal: return 0
        case .fair: return 0.5
        case .serious: return 0.9
        case .critical: return 1
        @unknown default: return .nan
        }
    }
}
