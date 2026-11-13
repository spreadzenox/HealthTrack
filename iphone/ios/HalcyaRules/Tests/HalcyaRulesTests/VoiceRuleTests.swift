import XCTest
@testable import HalcyaRules

/// Sonde vocale (étape I8) : ce que l'iPhone sait faire en reconnaissance vocale, sous la forme de la sonde
/// VoiceProbePlugin.java d'Android (`src/services/voiceProbe.js` › `voiceVerdict`). Aucun micro ouvert, aucune
/// permission demandée, aucun son.
final class VoiceRuleTests: XCTestCase {
    func testFrancaisSurLeTelephone() {
        let r = VoiceRule.result(available: true, onDevice: true, locales: ["fr-FR", "en-US"])
        XCTAssertEqual(r["language"] as? String, "fr-FR")
        XCTAssertEqual(r["available"] as? Bool, true)
        XCTAssertEqual(r["onDevice"] as? Bool, true)
        XCTAssertEqual(r["supportFrom"] as? String, "ios")
        let support = r["support"] as? [String: [String]]
        XCTAssertEqual(support?["installed"], ["fr-FR"])
        XCTAssertEqual(support?["online"], [])
    }

    /// En ligne seulement : le son partirait chez Apple ; voiceVerdict rend « online_only »
    func testEnLigneSeulement() {
        let r = VoiceRule.result(available: true, onDevice: false, locales: ["fr-FR"])
        let support = r["support"] as? [String: [String]]
        XCTAssertEqual(support?["installed"], [])
        XCTAssertEqual(support?["online"], ["fr-FR"])
        XCTAssertEqual(r["onDevice"] as? Bool, false)
    }

    func testPasDeFrancais() {
        let r = VoiceRule.result(available: false, onDevice: false, locales: ["en-US"])
        let support = r["support"] as? [String: [String]]
        XCTAssertEqual(support?["installed"], [])
        XCTAssertEqual(support?["online"], [])
        XCTAssertEqual(r["available"] as? Bool, false)
    }
}
