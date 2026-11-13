import XCTest
@testable import HalcyaRules

/// Rappel de fin d'essai : mêmes entrées que `TrialReminderPlugin.java` d'Android, adresse d'Apple seulement.
final class TrialReminderRuleTests: XCTestCase {
    private let manage = "https://apps.apple.com/account/subscriptions"

    func testRappelRecuDeLApp() throws {
        let r = try XCTUnwrap(TrialReminderRule.reminder(["at": 1_700_000_000_000.0, "title": "Votre essai gratuit se termine dans 2 jours",
                                                         "body": "Premier paiement jeudi 13 novembre, sauf si vous annulez.", "url": manage]))
        XCTAssertEqual(r.at, 1_700_000_000_000)
        XCTAssertEqual(r.title, "Votre essai gratuit se termine dans 2 jours")
        XCTAssertEqual(r.url?.absoluteString, manage)
        XCTAssertEqual(TrialReminderRule.reminder(["at": 1_700_000_000_000, "title": "Entier accepté"])?.at, 1_700_000_000_000)
    }

    func testSansHeureNiTitreRien() {
        XCTAssertNil(TrialReminderRule.reminder(["title": "Sans heure"]))
        XCTAssertNil(TrialReminderRule.reminder(["at": 1_700_000_000_000.0, "title": ""]))
        XCTAssertNil(TrialReminderRule.reminder(["at": 0.0, "title": "Heure nulle"]))
    }

    /// Toucher la notification n'ouvre que la gestion des abonnements d'Apple
    func testAdresseDAppleSeulement() {
        XCTAssertEqual(TrialReminderRule.manageURL(manage)?.host, "apps.apple.com")
        XCTAssertNil(TrialReminderRule.manageURL("https://play.google.com/store/account/subscriptions"))
        XCTAssertNil(TrialReminderRule.manageURL("http://apps.apple.com/account/subscriptions"))
        XCTAssertNil(TrialReminderRule.manageURL("https://apps.apple.com.exemple.fr/"))
        XCTAssertNil(TrialReminderRule.manageURL(nil))
        XCTAssertNil(TrialReminderRule.reminder(["at": 1.0, "title": "t", "url": "javascript:alert(1)"])?.url)
    }

    func testDelaiAvantLaNotification() throws {
        let r = try XCTUnwrap(TrialReminderRule.reminder(["at": 10_000.0, "title": "t"]))
        XCTAssertEqual(TrialReminderRule.delay(r, nowMs: 4_000), 6)
        XCTAssertNil(TrialReminderRule.delay(r, nowMs: 10_000))
        XCTAssertNil(TrialReminderRule.delay(r, nowMs: 20_000))
    }
}
