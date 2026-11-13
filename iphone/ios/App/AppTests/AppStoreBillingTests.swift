import StoreKit
import StoreKitTest
import XCTest
@testable import App

/// Abonnement App Store (étape I6), sans compte Apple : StoreKit Test, avec le fichier `Halcya.storekit` de cette
/// cible (Silver annuel et mensuel, essai gratuit de 2 semaines sur l'annuel ; Gold mensuel, au niveau au-dessus,
/// sans essai ; prix d'essai fictifs). Cible hébergée par l'app :
/// une session créée depuis un test d'interface, dans un autre processus, est refusée (`journal/RECHERCHE.md`, 28/10).
final class AppStoreBillingTests: XCTestCase {
    private var session: SKTestSession!

    override func setUpWithError() throws {
        let url = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "Halcya", withExtension: "storekit"))
        session = try SKTestSession(contentsOf: url)
        session.resetToDefaultState()
        session.disableDialogs = true
        session.clearTransactions()
    }

    /// Le fichier se charge de façon asynchrone : on redemande les formules quelques fois (essai du 28/10 : liste vide)
    private func formules(_ ids: [String]) async throws -> [Product] {
        for essai in 1...5 {
            let products = try await Product.products(for: ids)
            if !products.isEmpty { return products }
            print("StoreKit Test : aucune formule (essai \(essai)), transactions : \(session.allTransactions().count)")
            try await Task.sleep(nanoseconds: 1_000_000_000)
        }
        return []
    }

    func testFormulesLuesDansStoreKit() async throws {
        let products = try await formules(["halcya_premium_annuel", "halcya_premium_mensuel"])
        XCTAssertEqual(Set(products.map(\.id)), ["halcya_premium_annuel", "halcya_premium_mensuel"])
        let annuel = try XCTUnwrap(products.first { $0.id == "halcya_premium_annuel" })
        XCTAssertEqual(annuel.subscription?.subscriptionPeriod.unit, .year)
        XCTAssertEqual(annuel.subscription?.introductoryOffer?.paymentMode, .freeTrial)
        let eligible = await annuel.subscription?.isEligibleForIntroOffer
        XCTAssertEqual(eligible, true)
        // Gold (Android v681) : même groupe, mensuel, sans essai
        let gold = try await formules(["halcya_gold_mensuel"])
        let goldMensuel = try XCTUnwrap(gold.first)
        XCTAssertEqual(goldMensuel.subscription?.subscriptionGroupID, annuel.subscription?.subscriptionGroupID)
        XCTAssertEqual(goldMensuel.subscription?.subscriptionPeriod.unit, .month)
        XCTAssertNil(goldMensuel.subscription?.introductoryOffer)
    }

    /// Passer de Silver à Gold : un seul groupe, donc Apple remplace Silver par Gold ; l'app ne voit plus que Gold,
    /// rendu comme un achat Play de `halcya_gold` (pas de double facturation, le piège GOLD-b2 de Google Play)
    func testMonteeDeSilverAGoldUnSeulAbonnementEnCours() async throws {
        let silvers = try await formules(["halcya_premium_mensuel"]) // pas d'await dans XCTUnwrap
        let silver = try XCTUnwrap(silvers.first)
        guard case .success(let achatSilver) = try await silver.purchase() else { return XCTFail("achat Silver non abouti") }
        if case .verified(let t) = achatSilver { await t.finish() }
        let golds = try await formules(["halcya_gold_mensuel"])
        let gold = try XCTUnwrap(golds.first)
        guard case .success(let achatGold) = try await gold.purchase() else { return XCTFail("achat Gold non abouti") }
        if case .verified(let t) = achatGold { await t.finish() }
        let renduGold = await AppStoreBillingPlugin.purchase(achatGold) // pas d'await dans XCTUnwrap
        let rendu = try XCTUnwrap(renduGold)
        XCTAssertEqual(rendu["products"] as? [String], ["halcya_gold"])
        var enCours: [String] = []
        for await droit in Transaction.currentEntitlements {
            if let achat = await AppStoreBillingPlugin.purchase(droit) { enCours += (achat["products"] as? [String]) ?? [] }
        }
        XCTAssertEqual(enCours, ["halcya_gold"])
    }

    func testAchatDEssaiRenduCommeUnAchatPlayEtGardeDansLesAbonnementsEnCours() async throws {
        let compte = try XCTUnwrap(UUID(uuidString: "01234567-89ab-cdef-0123-456789abcdef"))
        let produits = try await formules(["halcya_premium_mensuel"]) // pas d'await dans XCTUnwrap
        let mensuel = try XCTUnwrap(produits.first)
        guard case .success(let resultat) = try await mensuel.purchase(options: [.appAccountToken(compte)]) else {
            return XCTFail("achat d'essai non abouti")
        }
        // Échec d'une fois (30/10, PR #77, iPhone 16e sous iOS 26.2) : conversion vide sans dire pourquoi ; le dire
        // Comme le plugin : la transaction est terminée avant d'être rendue (statut de l'abonnement à jour)
        if case .verified(let t) = resultat { await t.finish() }
        let rendu = await AppStoreBillingPlugin.purchase(resultat) // pas d'await dans XCTUnwrap
        if rendu == nil {
            switch resultat {
            case .unverified(let transaction, let erreur):
                print("StoreKit Test : transaction non vérifiée (\(transaction.productID)) : \(erreur)")
            case .verified(let transaction):
                print("StoreKit Test : transaction refusée (\(transaction.productID), révoquée : \(String(describing: transaction.revocationDate)))")
            @unknown default:
                print("StoreKit Test : résultat d'achat inconnu")
            }
        }
        let achat = try XCTUnwrap(rendu)
        XCTAssertEqual(achat["state"] as? String, "purchased")
        XCTAssertEqual(achat["products"] as? [String], ["halcya_premium"])
        XCTAssertEqual((achat["purchaseToken"] as? String)?.split(separator: ".").count, 3) // JWS signé
        // Renouvellement automatique et période de grâce, pour le relais (sinon « actif jusqu'au » au lieu de « renouvellement le »)
        if achat["renewalInfo"] == nil, case .verified(let t) = resultat {
            let statuts = (try? await Product.SubscriptionInfo.status(for: t.subscriptionGroupID ?? "")) ?? []
            print("StoreKit Test : pas de renewalInfo ; groupe \(t.subscriptionGroupID ?? "?"), \(statuts.count) statut(s)")
        }
        XCTAssertEqual((achat["renewalInfo"] as? String)?.split(separator: ".").count, 3) // JWS signé
        guard case .verified(let transaction) = resultat else { return XCTFail("transaction non vérifiée") }
        XCTAssertEqual(transaction.appAccountToken, compte)
        var enCours: [String] = []
        for await droit in Transaction.currentEntitlements {
            if case .verified(let t) = droit { enCours.append(t.productID) }
        }
        XCTAssertEqual(enCours, ["halcya_premium_mensuel"])
    }
}
