import XCTest
@testable import HalcyaRules

/// Rappel de la portion du jour (réintroduction guidée) : mêmes règles que PortionReminderPlugin.java et
/// gut/PortionSchedule.java d'Android, plus ce qui est propre à iOS (rappels programmés d'avance, toucher retenu).
final class PortionRuleTests: XCTestCase {
    private let h = 3_600_000.0

    func testRappelsGardesCommeAndroidAuPlus3AvecHeureEtTitre() {
        let items = PortionRule.items([
            ["at": 12 * h, "title": "Votre portion du jour", "body": "Jour 1 : lactose"],
            ["at": 0, "title": "sans heure"],
            ["at": 24 * h, "title": ""],
            ["at": 36 * h, "title": "Jour 2"],
            ["at": 60 * h, "title": "Jour 3"],
            ["at": 84 * h, "title": "Jour 4, de trop"],
        ])
        XCTAssertEqual(items.map(\.title), ["Votre portion du jour", "Jour 2", "Jour 3"])
        XCTAssertEqual(items[0].body, "Jour 1 : lactose")
        XCTAssertEqual(items[1].body, "")
    }

    /// iOS ne réveille pas l'app : tous les rappels encore à venir sont programmés d'avance, jamais un rappel passé
    func testSeulsLesRappelsAVenirSontProgrammes() {
        let items = PortionRule.items([["at": 12 * h, "title": "1"], ["at": 36 * h, "title": "2"], ["at": 60 * h, "title": "3"]])
        XCTAssertEqual(PortionRule.upcoming(items, nowMs: 11 * h).map(\.title), ["1", "2", "3"])
        XCTAssertEqual(PortionRule.upcoming(items, nowMs: 40 * h).map(\.title), ["3"])
        XCTAssertEqual(PortionRule.upcoming(items, nowMs: 61 * h), [])
    }

    final class Memory: KeyValueStore {
        var values: [String: Any] = [:]
        func object(forKey key: String) -> Any? { values[key] }
        func set(_ value: Any?, forKey key: String) { values[key] = value }
    }

    /// Notification touchée : l'app ouvre la réintroduction à sa prochaine vérification, une seule fois
    func testToucherRetenuUneSeuleFois() {
        let store = PortionStore(defaults: Memory())
        XCTAssertFalse(store.takeOpen())
        store.markOpen()
        XCTAssertTrue(store.takeOpen())
        XCTAssertFalse(store.takeOpen())
    }
}
