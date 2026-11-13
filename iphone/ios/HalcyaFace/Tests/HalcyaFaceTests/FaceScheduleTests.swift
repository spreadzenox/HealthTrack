import Foundation
import XCTest
@testable import HalcyaFace

/// Mêmes cas que `FaceScheduleTest.java` d'Android : quand prendre une rafale, et pourquoi la sauter.
final class FaceScheduleTests: XCTestCase {
    let now: Int64 = 1_760_000_000_000
    let unlock = FaceSchedule.triggerUnlock

    func decide(_ trigger: String?, last: Int64 = 0, today: Int = 0, screenOn: Bool = true, inCall: Bool = false, thermal: Double = .nan) -> FaceSchedule.Skip? {
        FaceSchedule.decide(trigger: trigger, now: now, lastBurstAt: last, burstsToday: today, screenOn: screenOn, inCall: inCall, thermal: thermal)
    }

    func testDeverrouillageNormal() {
        XCTAssertNil(decide(unlock))
        XCTAssertNil(decide(unlock, last: now - FaceSchedule.minIntervalMs, today: 10, thermal: 0.3))
    }

    func testDeuxDeverrouillagesRapprochesNeFontQuUneRafale() {
        XCTAssertEqual(decide(unlock, last: now - 30_000, today: 1), .tooSoon)
        // horloge reculée (changement d'heure manuel) : on ne bloque pas
        XCTAssertNil(decide(unlock, last: now + 60_000, today: 1))
    }

    func testGardeFous() {
        XCTAssertEqual(decide(unlock, screenOn: false), .screenOff)
        XCTAssertEqual(decide(unlock, inCall: true), .inCall)
        XCTAssertEqual(decide(unlock, thermal: 0.95), .hot)
        XCTAssertEqual(decide(unlock, today: FaceSchedule.maxPerDay), .dailyCap)
    }

    func testSeulsLeDeverrouillageLOuvertureDeLAppEtLeTestSontAcceptes() {
        XCTAssertEqual(decide("other_app"), .unknownTrigger)
        XCTAssertEqual(decide(nil), .unknownTrigger)
        XCTAssertNil(decide(FaceSchedule.triggerAppOpen))
    }

    func testOuvertureDeLAppUneLectureParDemiHeureEtDouzeParJour() {
        let open = FaceSchedule.triggerAppOpen
        XCTAssertEqual(decide(open, last: now - 10 * 60_000, today: 1), .tooSoon)
        XCTAssertNil(decide(open, last: now - FaceSchedule.appOpenMinIntervalMs, today: 1))
        XCTAssertEqual(decide(open, today: FaceSchedule.appOpenMaxPerDay), .dailyCap)
        XCTAssertEqual(decide(open, inCall: true), .inCall)
        XCTAssertFalse(FaceSchedule.shouldRetry(trigger: open, faceFound: false, alreadyRetried: false, sinceUnlockMs: 3000))
        XCTAssertEqual(FaceSchedule.Skip.tooSoon.rawValue, "too_soon")
    }

    func testLeTestIgnoreIntervalleEtPlafondMaisPasLaChaleur() {
        XCTAssertNil(decide(FaceSchedule.triggerManual, last: now - 1000, today: FaceSchedule.maxPerDay))
        XCTAssertEqual(decide(FaceSchedule.triggerManual, thermal: 0.9), .hot)
    }

    func testDeuxiemeEssaiUneSeuleFoisApresUneRafaleSansVisage() {
        XCTAssertTrue(FaceSchedule.shouldRetry(trigger: unlock, faceFound: false, alreadyRetried: false, sinceUnlockMs: 3000))
        XCTAssertFalse(FaceSchedule.shouldRetry(trigger: unlock, faceFound: true, alreadyRetried: false, sinceUnlockMs: 3000))
        XCTAssertFalse(FaceSchedule.shouldRetry(trigger: unlock, faceFound: false, alreadyRetried: true, sinceUnlockMs: 3000))
    }

    func testDeuxiemeEssaiToujoursProcheDuDeverrouillage() {
        let last = FaceSchedule.retryWindowMs - FaceSchedule.retryDelayMs
        XCTAssertTrue(FaceSchedule.shouldRetry(trigger: unlock, faceFound: false, alreadyRetried: false, sinceUnlockMs: last))
        XCTAssertFalse(FaceSchedule.shouldRetry(trigger: unlock, faceFound: false, alreadyRetried: false, sinceUnlockMs: last + 1))
        XCTAssertFalse(FaceSchedule.shouldRetry(trigger: unlock, faceFound: false, alreadyRetried: false, sinceUnlockMs: -1))
    }

    func testLeTestNEstJamaisRepris() {
        XCTAssertFalse(FaceSchedule.shouldRetry(trigger: FaceSchedule.triggerManual, faceFound: false, alreadyRetried: false, sinceUnlockMs: 0))
        XCTAssertFalse(FaceSchedule.shouldRetry(trigger: "app_open", faceFound: false, alreadyRetried: false, sinceUnlockMs: 0))
    }

    func testChaleurDeLiPhoneSurLEchelleDAndroid() {
        XCTAssertNil(decide(FaceSchedule.triggerAppOpen, thermal: FaceSchedule.thermalHeadroom(.fair)))
        XCTAssertEqual(decide(FaceSchedule.triggerAppOpen, thermal: FaceSchedule.thermalHeadroom(.serious)), .hot)
        XCTAssertEqual(decide(FaceSchedule.triggerAppOpen, thermal: FaceSchedule.thermalHeadroom(.critical)), .hot)
    }
}
