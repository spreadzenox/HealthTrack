import XCTest
@testable import HalcyaRules

/// Mémoire des rappels du soir sur iPhone (bilan du ventre, note du soir) : mêmes règles que GutEveningPlugin.java et
/// EveningNotePlugin.java d'Android (configure, boîte vidée par l'app à l'ouverture), plus les soirs à programmer
/// d'avance.
final class EveningStoreTests: XCTestCase {
    final class Memory: KeyValueStore {
        var values: [String: Any] = [:]
        func object(forKey key: String) -> Any? { values[key] }
        func set(_ value: Any?, forKey key: String) { values[key] = value }
    }

    private let paris: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Europe/Paris")!
        return calendar
    }()

    private func date(_ day: Int, _ hour: Int, _ minute: Int = 0) -> Date {
        paris.date(from: DateComponents(year: 2026, month: 10, day: day, hour: hour, minute: minute))!
    }

    func testEteintParDefautA20h() {
        let store = EveningStore(defaults: Memory(), kind: .gut)
        XCTAssertFalse(store.enabled)
        XCTAssertEqual(store.minuteOfDay, 20 * 60)
        XCTAssertEqual(store.plan(now: date(28, 9), calendar: paris), [])
    }

    func testConfigureHeureRameneeEtJourDuBilanLePlusRecent() {
        let store = EveningStore(defaults: Memory(), kind: .gut)
        store.configure(enabled: true, minuteOfDay: 7 * 60, noteDay: "2026-10-27")
        XCTAssertTrue(store.enabled)
        XCTAssertEqual(store.minuteOfDay, 18 * 60)
        // un bilan donné depuis la notification n'est peut-être pas encore importé : on garde le plus récent
        store.configure(enabled: nil, minuteOfDay: nil, noteDay: "2026-10-25")
        XCTAssertEqual(store.noteDay, "2026-10-27")
        store.configure(enabled: nil, minuteOfDay: nil, noteDay: "pas une date")
        XCTAssertEqual(store.noteDay, "2026-10-27")
        store.configure(enabled: false, minuteOfDay: nil, noteDay: nil)
        XCTAssertFalse(store.enabled)
    }

    func testSoirsAProgrammerSansLeJourDuBilan() {
        let store = EveningStore(defaults: Memory(), kind: .gut)
        store.configure(enabled: true, minuteOfDay: 20 * 60, noteDay: "2026-10-28")
        XCTAssertEqual(store.plan(now: date(28, 9), calendar: paris).first, date(29, 20))
    }

    func testGesteRangeDansLaBoiteEtCompteCommeBilanDuJour() {
        let store = EveningStore(defaults: Memory(), kind: .gut)
        store.configure(enabled: true, minuteOfDay: 20 * 60, noteDay: nil)
        XCTAssertTrue(store.answer("pain", answeredAt: date(28, 20, 5), askedAt: date(28, 20), calendar: paris))
        XCTAssertFalse(store.answer("terrible", answeredAt: date(28, 20, 6), askedAt: date(28, 20), calendar: paris))
        XCTAssertEqual(store.noteDay, "2026-10-28")
        XCTAssertEqual(store.answers, 1)
        let notes = store.inbox()
        XCTAssertEqual(notes.count, 1)
        XCTAssertTrue(notes[0].json.contains("\"level\":\"pain\""))
        // le soir même n'est plus programmé : le prochain soir est demain
        XCTAssertEqual(store.plan(now: date(28, 20, 7), calendar: paris).first, date(29, 20))
    }

    func testRetirerLesBilansImportes() {
        let store = EveningStore(defaults: Memory(), kind: .gut)
        _ = store.answer("calm", answeredAt: date(27, 20, 1), askedAt: date(27, 20), calendar: paris)
        _ = store.answer("discomfort", answeredAt: date(28, 20, 1), askedAt: date(28, 20), calendar: paris)
        let names = store.inbox().map(\.name)
        XCTAssertEqual(names.count, 2)
        XCTAssertNotEqual(names[0], names[1])
        XCTAssertEqual(store.remove(names: [names[0], "inconnu"]), 1)
        XCTAssertEqual(store.inbox().map(\.name), [names[1]])
    }

    func testBoiteBornee() {
        let store = EveningStore(defaults: Memory(), kind: .gut)
        for i in 0..<(EveningStore.inboxMax + 5) {
            _ = store.answer("calm", answeredAt: Date(timeIntervalSince1970: Double(1_761_000_000 + i * 60)),
                             askedAt: Date(timeIntervalSince1970: Double(1_761_000_000 + i * 60)), calendar: paris)
        }
        XCTAssertEqual(store.inbox().count, EveningStore.inboxMax)
    }

    // Note du soir : mêmes règles, à 21 h, clés et boîte à part de celles du ventre

    func testNoteDuSoirA21hRangeeAPart() {
        let defaults = Memory()
        let gut = EveningStore(defaults: defaults, kind: .gut)
        let note = EveningStore(defaults: defaults, kind: .note)
        XCTAssertEqual(note.minuteOfDay, 21 * 60)
        note.configure(enabled: true, minuteOfDay: nil, noteDay: nil)
        XCTAssertFalse(gut.enabled)
        XCTAssertTrue(note.answer("4", answeredAt: date(28, 21, 2), askedAt: date(28, 21), calendar: paris))
        XCTAssertEqual(note.inbox().count, 1)
        XCTAssertEqual(gut.inbox().count, 0)
        XCTAssertTrue(note.inbox()[0].json.hasPrefix("{\"v\":2,\"choice\":4,"))
        XCTAssertEqual(note.noteDay, "2026-10-28")
        XCTAssertNil(gut.noteDay)
    }

    func testNoteHorsEchelleRefusee() {
        let note = EveningStore(defaults: Memory(), kind: .note)
        XCTAssertFalse(note.answer("0", answeredAt: date(28, 21, 2), askedAt: date(28, 21), calendar: paris)) // plus de 0 (v855)
        XCTAssertFalse(note.answer("6", answeredAt: date(28, 21, 2), askedAt: date(28, 21), calendar: paris))
        XCTAssertFalse(note.answer("calm", answeredAt: date(28, 21, 2), askedAt: date(28, 21), calendar: paris))
        XCTAssertEqual(note.inbox().count, 0)
        XCTAssertEqual(note.answers, 0)
    }
}
