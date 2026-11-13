import Foundation

/// Abonnement App Store (étape I6) : les produits de StoreKit 2 rendus sous la forme des ProductDetails réduits du
/// plugin PlayBilling d'Android (`src/services/playBilling.js` › `describePlans`). Google Play a deux abonnements :
/// Silver, `halcya_premium` (formules `annuel` et `mensuel`), et Gold, `halcya_gold` (formule `mensuel`, Android v681).
/// L'App Store n'a pas de formules dans un produit : un produit par durée, tous dans un même groupe d'abonnements (Gold
/// au niveau le plus haut, `store/app-store/abonnements.md`), rendus ici comme les formules de Google Play. L'offre
/// d'essai n'est rendue que si la personne y a droit, comme Google.
public enum BillingRule {
    /// Silver, l'abonnement historique d'Android
    public static let productId = "halcya_premium"
    /// Gold (Android v681, GOLD-b3)
    public static let goldProductId = "halcya_gold"
    /// Produit App Store → abonnement et formule de Google Play, dans l'ordre d'affichage.
    public static let plans: [(storeId: String, productId: String, basePlanId: String)] = [
        ("halcya_premium_annuel", "halcya_premium", "annuel"),
        ("halcya_premium_mensuel", "halcya_premium", "mensuel"),
        ("halcya_gold_mensuel", "halcya_gold", "mensuel"),
    ]
    public static var storeIds: [String] { plans.map(\.storeId) }

    /// Produits App Store des abonnements de Google Play demandés (`getProducts({ productIds })`).
    public static func storeIds(for productIds: [String]) -> [String] {
        plans.filter { productIds.contains($0.productId) }.map(\.storeId)
    }

    /// Abonnement de Google Play d'un produit App Store ; nil pour un produit qui n'est pas de Halcya.
    public static func productId(storeId: String) -> String? {
        plans.first(where: { $0.storeId == storeId })?.productId
    }

    /// Durée d'abonnement ou d'essai, `unit` : « D », « W », « M » ou « Y » (ISO 8601, comme Google Play).
    public struct Period {
        public let value: Int
        public let unit: String
        public init(value: Int, unit: String) {
            self.value = value
            self.unit = unit
        }

        public var iso: String { "P\(value)\(unit)" }
    }

    public static func micros(_ price: Decimal) -> Int {
        var scaled = price * 1_000_000
        var rounded = Decimal()
        NSDecimalRound(&rounded, &scaled, 0, .plain)
        return NSDecimalNumber(decimal: rounded).intValue
    }

    /// Une formule sous la forme d'une offre de Play ; nil pour un produit qui n'est pas une formule de Halcya.
    public static func offer(storeId: String, displayPrice: String, price: Decimal, currency: String, period: Period, trial: Period?) -> [String: Any]? {
        guard let basePlanId = plans.first(where: { $0.storeId == storeId })?.basePlanId else { return nil }
        var phases: [[String: Any]] = []
        if let trial {
            phases.append(["priceMicros": 0, "formattedPrice": "", "billingPeriod": trial.iso, "currency": currency])
        }
        phases.append(["priceMicros": micros(price), "formattedPrice": displayPrice, "billingPeriod": period.iso, "currency": currency])
        return ["basePlanId": basePlanId, "offerToken": storeId, "phases": phases]
    }

    public static func product(_ id: String = BillingRule.productId, offers: [[String: Any]]) -> [String: Any] {
        ["productId": id, "offers": offers]
    }

    /// `appAccountToken` d'Apple (un UUID) tiré de `obfuscatedAccountId` (empreinte SHA-256 en hexadécimal que l'app
    /// donne déjà à Google Play) : ses 32 premiers chiffres. Le relais devra faire de même pour relier l'achat.
    public static func accountToken(_ hex: String) -> UUID? {
        let digits = Array(hex.lowercased())
        guard digits.count >= 32, digits.prefix(32).allSatisfy(\.isHexDigit) else { return nil }
        let s = String(digits.prefix(32))
        let parts = [s.prefix(8), s.dropFirst(8).prefix(4), s.dropFirst(12).prefix(4), s.dropFirst(16).prefix(4), s.dropFirst(20)]
        return UUID(uuidString: parts.joined(separator: "-"))
    }
}
