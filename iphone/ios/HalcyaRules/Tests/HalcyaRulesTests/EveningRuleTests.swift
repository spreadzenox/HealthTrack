import XCTest
@testable import HalcyaRules

/// Mêmes cas que les tests d'Android (mood/EveningNote, gut/GutEvening), plus ce qui est propre à iOS : les soirs
/// programmés d'avance et le geste donné après minuit.
final class EveningRuleTests: XCTestCase {
    private let paris: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Europe/Paris")!
        return calendar
    }()

    private func date(_ year: Int, _ month: Int, _ day: Int, _ hour: Int, _ minute: Int = 0) -> Date {
        paris.date(from: DateComponents(year: year, month: month, day: day, hour: hour, minute: minute))!
    }

    func testHeureRameneeDansLaSoiree() {
        XCTAssertEqual(EveningRule.clampMinute(7 * 60, fallback: 1200), 18 * 60)
        XCTAssertEqual(EveningRule.clampMinute(23 * 60 + 30, fallback: 1200), 23 * 60)
        XCTAssertEqual(EveningRule.clampMinute(20 * 60 + 15, fallback: 1200), 20 * 60 + 15)
        XCTAssertEqual(EveningRule.clampMinute(-5, fallback: 1200), 1200)
        XCTAssertEqual(EveningRule.clampMinute(24 * 60, fallback: 1200), 1200)
    }

    func testJourLocalCommeLeJavaScript() {
        XCTAssertEqual(EveningRule.dayKey(date(2026, 3, 7, 23, 30), calendar: paris), "2026-03-07")
    }

    func testEteintRienAProgrammer() {
        let plan = EveningRule.plan(enabled: false, doneDay: nil, minuteOfDay: 1200, fallback: 1200,
                                    now: date(2026, 10, 28, 9), calendar: paris)
        XCTAssertEqual(plan, [])
    }

    func testAujourdhuiPuisLesSoirsSuivants() {
        let plan = EveningRule.plan(enabled: true, doneDay: nil, minuteOfDay: 20 * 60, fallback: 1200,
                                    now: date(2026, 10, 28, 9), calendar: paris, days: 3)
        XCTAssertEqual(plan, [date(2026, 10, 28, 20), date(2026, 10, 29, 20), date(2026, 10, 30, 20)])
    }

    func testSeptSoirsParDefaut() {
        let plan = EveningRule.plan(enabled: true, doneDay: nil, minuteOfDay: 20 * 60, fallback: 1200,
                                    now: date(2026, 10, 28, 9), calendar: paris)
        XCTAssertEqual(plan.count, EveningRule.plannedDays)
    }

    func testBilanDuJourFaitOuHeurePasseeCommenceDemain() {
        let noted = EveningRule.plan(enabled: true, doneDay: "2026-10-28", minuteOfDay: 20 * 60, fallback: 1200,
                                     now: date(2026, 10, 28, 9), calendar: paris, days: 2)
        XCTAssertEqual(noted, [date(2026, 10, 29, 20), date(2026, 10, 30, 20)])
        let late = EveningRule.plan(enabled: true, doneDay: nil, minuteOfDay: 20 * 60, fallback: 1200,
                                    now: date(2026, 10, 28, 21), calendar: paris, days: 1)
        XCTAssertEqual(late, [date(2026, 10, 29, 20)])
    }

    func testChangementDHeureLHeureLocaleReste() {
        // 25/10/2026 : passage à l'heure d'hiver à Paris ; 20 h reste 20 h
        let plan = EveningRule.plan(enabled: true, doneDay: nil, minuteOfDay: 20 * 60, fallback: 1200,
                                    now: date(2026, 10, 24, 21), calendar: paris, days: 2)
        XCTAssertEqual(plan.map { paris.component(.hour, from: $0) }, [20, 20])
        XCTAssertEqual(plan.map { EveningRule.dayKey($0, calendar: paris) }, ["2026-10-25", "2026-10-26"])
    }

    func testGesteApresMinuitComptePourLeSoirDemande() {
        let asked = date(2026, 10, 28, 20)
        let sameEvening = date(2026, 10, 28, 22, 10)
        let nextMorning = date(2026, 10, 29, 7)
        XCTAssertEqual(EveningRule.answerTime(answeredAt: sameEvening, askedAt: asked, calendar: paris), sameEvening)
        let kept = EveningRule.answerTime(answeredAt: nextMorning, askedAt: asked, calendar: paris)
        XCTAssertEqual(EveningRule.dayKey(kept, calendar: paris), "2026-10-28")
        XCTAssertLessThan(kept, nextMorning)
    }
}

final class GutEveningRuleTests: XCTestCase {
    func testTroisNiveauxDansLOrdreDesBoutons() {
        XCTAssertEqual(GutEveningRule.levels, ["calm", "discomfort", "pain"])
        XCTAssertEqual(GutEveningRule.labels, ["Calme", "Gêne", "Douleur"])
        XCTAssertEqual(GutEveningRule.defaultMinute, 20 * 60)
    }

    /// Même JSON que la boîte d'Android, lu par parseGutEvening (src/services/gutEvening.js)
    func testBoiteLeNiveauEtLHeureRienDAutre() {
        let at = Date(timeIntervalSince1970: 1_761_678_000.5)
        XCTAssertEqual(GutEveningRule.record(level: "discomfort", at: at),
                       "{\"v\":1,\"level\":\"discomfort\",\"at\":1761678000500}")
        XCTAssertNil(GutEveningRule.record(level: "terrible", at: at))
    }
}

final class EveningNoteRuleTests: XCTestCase {
    /// Mêmes valeurs que mood/EveningNote.java (Android v855) : 21 h par défaut, notes de 1 à 5 dans l'ordre des boutons
    func testCinqNotesDe1A5A21h() {
        XCTAssertEqual(EveningNoteRule.scores, [1, 2, 3, 4, 5])
        XCTAssertEqual(EveningNoteRule.defaultMinute, 21 * 60)
    }

    /// Même JSON que la boîte d'Android (v2, « choice »), lu par parseEveningNote (src/services/eveningNote.js)
    func testBoiteLaNoteEtLHeureRienDAutre() {
        let at = Date(timeIntervalSince1970: 1_761_678_000.5)
        XCTAssertEqual(EveningNoteRule.record(score: 4, at: at), "{\"v\":2,\"choice\":4,\"at\":1761678000500}")
        XCTAssertNil(EveningNoteRule.record(score: 0, at: at))
        XCTAssertNil(EveningNoteRule.record(score: 6, at: at))
        XCTAssertNil(EveningNoteRule.record(score: -1, at: at))
    }
}
