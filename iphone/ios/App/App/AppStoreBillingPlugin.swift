import Capacitor
import Foundation
import HalcyaRules
import StoreKit

/// Abonnement App Store, sur iPhone (étape I6) : StoreKit 2, rendu sous la même forme que le plugin PlayBilling
/// d'Android (`src/services/playBilling.js` : `getProducts`, `purchase`, `queryPurchases`, événement
/// `purchasesUpdated`) ; conversion dans `HalcyaRules` › `BillingRule`. Le jeton d'achat envoyé au relais est la
/// transaction signée par Apple (`jwsRepresentation`) : l'app ne décide jamais seule d'un droit. Inactif côté JS tant
/// que `FEATURES.billing` est faux pour la variante appstore (le relais doit d'abord vérifier les achats d'Apple).
@objc(AppStoreBillingPlugin)
public class AppStoreBillingPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppStoreBillingPlugin"
    public let jsName = "AppStoreBilling"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "queryPurchases", returnType: CAPPluginReturnPromise),
    ]
    private var updates: Task<Void, Never>?

    /// Achats qui se terminent hors du parcours d'achat (paiement en attente confirmé, achat fait ailleurs) : comme
    /// l'écoute `purchasesUpdated` de Play Billing.
    override public func load() {
        updates = Task { [weak self] in
            for await result in Transaction.updates {
                if case .verified(let transaction) = result { await transaction.finish() }
                let purchase = await AppStoreBillingPlugin.purchase(result)
                guard let self else { return }
                self.notifyListeners("purchasesUpdated", data: ["code": 0, "purchases": [purchase].compactMap { $0 }])
            }
        }
    }

    deinit {
        updates?.cancel()
    }

    /// `getProducts({ productIds })` comme Play Billing : un produit par abonnement de Google Play demandé (Silver
    /// `halcya_premium`, Gold `halcya_gold`), avec ses formules ; un abonnement sans formule chez Apple est omis.
    @objc func getProducts(_ call: CAPPluginCall) {
        let wanted = call.getArray("productIds", String.self) ?? [BillingRule.productId]
        Task {
            do {
                let storeIds = BillingRule.storeIds(for: wanted)
                let products = try await Product.products(for: storeIds)
                var byProduct: [String: [[String: Any]]] = [:]
                for storeId in storeIds {
                    guard let product = products.first(where: { $0.id == storeId }), let subscription = product.subscription,
                          let productId = BillingRule.productId(storeId: storeId) else { continue }
                    // Comme Google, l'essai n'est proposé qu'à qui y a droit
                    let intro = subscription.introductoryOffer
                    let eligible = await subscription.isEligibleForIntroOffer
                    let trial = eligible && intro?.paymentMode == .freeTrial ? intro.map { Self.period($0.period) } : nil
                    if let offer = BillingRule.offer(
                        storeId: product.id, displayPrice: product.displayPrice, price: product.price,
                        currency: product.priceFormatStyle.currencyCode, period: Self.period(subscription.subscriptionPeriod), trial: trial
                    ) {
                        byProduct[productId, default: []].append(offer)
                    }
                }
                let result = wanted.compactMap { id in byProduct[id].map { BillingRule.product(id, offers: $0) } }
                call.resolve(["products": result])
            } catch {
                call.reject("formules indisponibles")
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        let storeId = call.getString("offerToken") ?? ""
        let account = BillingRule.accountToken(call.getString("obfuscatedAccountId") ?? "")
        Task {
            do {
                guard let product = try await Product.products(for: [storeId]).first else {
                    call.reject("formule inconnue")
                    return
                }
                var options: Set<Product.PurchaseOption> = []
                if let account { options.insert(.appAccountToken(account)) }
                switch try await product.purchase(options: options) {
                case .success(let result):
                    if case .verified(let transaction) = result { await transaction.finish() }
                    let purchase = await Self.purchase(result)
                    call.resolve(["status": "ok", "purchases": [purchase].compactMap { $0 }])
                case .pending:
                    call.resolve(["status": "pending", "purchases": []])
                case .userCancelled:
                    call.resolve(["status": "cancelled", "purchases": []])
                @unknown default:
                    call.resolve(["status": "error", "purchases": []])
                }
            } catch {
                call.reject("achat impossible")
            }
        }
    }

    /// « Restaurer un achat » et relecture à l'ouverture : les abonnements en cours de ce compte Apple.
    @objc func queryPurchases(_ call: CAPPluginCall) {
        Task {
            var purchases: [[String: Any]] = []
            for await result in Transaction.currentEntitlements {
                if let purchase = await Self.purchase(result) { purchases.append(purchase) }
            }
            call.resolve(["purchases": purchases])
        }
    }

    /// Achat sous la forme de Play ; `purchaseToken` = la transaction signée par Apple, vérifiée par le relais ;
    /// `renewalInfo` = les informations de renouvellement signées par Apple (renouvellement automatique, période de
    /// grâce), que le relais d'Android lit à côté de la transaction (v689, `body.renewalInfo`).
    static func purchase(_ result: VerificationResult<Transaction>) async -> [String: Any]? {
        // Un abonnement remplacé par une montée de formule (Silver → Gold) n'est plus un droit : Apple ne facture que Gold
        guard case .verified(let transaction) = result, let productId = BillingRule.productId(storeId: transaction.productID),
              transaction.revocationDate == nil, !transaction.isUpgraded else { return nil }
        var purchase: [String: Any] = ["state": "purchased", "products": [productId], "purchaseToken": result.jwsRepresentation]
        if let renewal = await renewalInfo(for: transaction) { purchase["renewalInfo"] = renewal }
        return purchase
    }

    /// Informations de renouvellement de l'abonnement de cette transaction (même `originalID`), telles que signées par
    /// Apple ; nil si StoreKit ne les donne pas (le relais déduit alors les droits de la seule transaction).
    static func renewalInfo(for transaction: Transaction) async -> String? {
        if #available(iOS 17.0, *), let status = await transaction.subscriptionStatus {
            return status.renewalInfo.jwsRepresentation
        }
        guard let group = transaction.subscriptionGroupID,
              let statuses = try? await Product.SubscriptionInfo.status(for: group) else { return nil }
        for status in statuses {
            if case .verified(let current) = status.transaction, current.originalID == transaction.originalID {
                return status.renewalInfo.jwsRepresentation
            }
        }
        return nil
    }

    private static func period(_ period: Product.SubscriptionPeriod) -> BillingRule.Period {
        switch period.unit {
        case .day: return .init(value: period.value, unit: "D")
        case .week: return .init(value: period.value, unit: "W")
        case .month: return .init(value: period.value, unit: "M")
        case .year: return .init(value: period.value, unit: "Y")
        @unknown default: return .init(value: period.value, unit: "D")
        }
    }
}
