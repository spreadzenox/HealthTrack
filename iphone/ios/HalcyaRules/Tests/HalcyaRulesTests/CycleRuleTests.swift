import XCTest
@testable import HalcyaRules

/// Cycle de l'app Santé (CYCLE-iOS-1) : ce que l'iPhone rend à l'app pour la brique partagée du cycle
/// (`src/services/cycle.js` d'Android, lu par `src/ios/cycleSante.js`).
final class CycleRuleTests: XCTestCase {
    func testReglesAvecFlux() {
        XCTAssertEqual(CycleRule.row(identifier: CycleRule.menstrualFlow, value: 3, startMs: 1000)?["flow"] as? String, "medium")
        XCTAssertEqual(CycleRule.row(identifier: CycleRule.menstrualFlow, value: 2, startMs: 1000)?["flow"] as? String, "light")
        XCTAssertEqual(CycleRule.row(identifier: CycleRule.menstrualFlow, value: 4, startMs: 1000)?["flow"] as? String, "heavy")
        let unspecified = CycleRule.row(identifier: CycleRule.menstrualFlow, value: 1, startMs: 1000)
        XCTAssertEqual(unspecified?["kind"] as? String, "period")
        XCTAssertEqual(unspecified?["flow"] as? String, "unknown")
        XCTAssertEqual(unspecified?["start"] as? Double, 1000)
    }

    /// « Aucun » flux noté dans Santé : pas un jour de règles
    func testAucunFlux() {
        XCTAssertNil(CycleRule.row(identifier: CycleRule.menstrualFlow, value: 5, startMs: 1000))
    }

    func testSaignementHorsDesRegles() {
        XCTAssertEqual(CycleRule.row(identifier: CycleRule.intermenstrualBleeding, value: 0, startMs: 1000)?["kind"] as? String, "spotting")
    }

    func testSymptomesPartages() {
        let cramps = CycleRule.row(identifier: "HKCategoryTypeIdentifierAbdominalCramps", value: 3, startMs: 1000)
        XCTAssertEqual(cramps?["kind"] as? String, "symptom")
        XCTAssertEqual(cramps?["symptom"] as? String, "cramps")
        XCTAssertEqual(CycleRule.row(identifier: "HKCategoryTypeIdentifierPelvicPain", value: 0, startMs: 1)?["symptom"] as? String, "pelvic_pain")
        XCTAssertEqual(Set(CycleRule.symptoms.values), ["cramps", "pelvic_pain", "bloating", "headache", "fatigue", "constipation", "diarrhea"])
        // constipation et diarrhée : dans la brique partagée depuis Android v979 (notre demande du 10/11)
        XCTAssertEqual(CycleRule.row(identifier: "HKCategoryTypeIdentifierConstipation", value: 2, startMs: 1)?["symptom"] as? String, "constipation")
        XCTAssertEqual(CycleRule.row(identifier: "HKCategoryTypeIdentifierDiarrhea", value: 0, startMs: 1)?["symptom"] as? String, "diarrhea")
    }

    /// Symptôme noté « absent » dans Santé, ou type que la brique partagée ne connaît pas encore : rien
    func testAbsentOuInconnu() {
        XCTAssertNil(CycleRule.row(identifier: "HKCategoryTypeIdentifierBloating", value: 1, startMs: 1000))
        XCTAssertNil(CycleRule.row(identifier: "HKCategoryTypeIdentifierNausea", value: 3, startMs: 1000))
    }

    func testTypesLus() {
        XCTAssertEqual(CycleRule.identifiers.count, 9)
        XCTAssertEqual(CycleRule.identifiers.first, CycleRule.menstrualFlow)
    }

    // CYCLE-iOS-2 : une seule feuille d'autorisation d'Apple pour les mesures de Santé et le cycle

    func testAutorisationAvecLeCycle() {
        let ids = CycleRule.authorizationIdentifiers(read: ["steps", "sleep", "bloodPressure", "workouts", "heartRateVariability"], cycle: true)
        XCTAssertTrue(ids.contains("HKQuantityTypeIdentifierStepCount"))
        XCTAssertTrue(ids.contains("HKCategoryTypeIdentifierSleepAnalysis"))
        XCTAssertTrue(ids.contains("HKQuantityTypeIdentifierBloodPressureSystolic"))
        XCTAssertTrue(ids.contains("HKQuantityTypeIdentifierBloodPressureDiastolic"))
        XCTAssertTrue(ids.contains("HKWorkoutTypeIdentifier"))
        XCTAssertTrue(ids.contains("HKQuantityTypeIdentifierHeartRateVariabilitySDNN"))
        XCTAssertTrue(ids.contains(CycleRule.menstrualFlow))
        XCTAssertTrue(ids.contains("HKCategoryTypeIdentifierBloating"))
        XCTAssertEqual(ids.count, Set(ids).count)
    }

    /// Sans « Mon cycle » : jamais les types du cycle ; un nom inconnu est ignoré (le module Santé le demandera lui-même)
    func testAutorisationSansLeCycle() {
        let ids = CycleRule.authorizationIdentifiers(read: ["steps", "inconnu"], cycle: false)
        XCTAssertEqual(ids, ["HKQuantityTypeIdentifierStepCount"])
    }

    /// Toutes les mesures lues par l'app sur iPhone (`READ_TYPES` du connecteur) ont leur type HealthKit
    func testToutesLesMesuresDuConnecteur() {
        for name in ["steps", "sleep", "heartRate", "restingHeartRate", "heartRateVariability", "oxygenSaturation", "calories",
                     "distance", "workouts", "respiratoryRate", "bodyTemperature", "bloodPressure", "bloodGlucose", "weight", "bodyFat"] {
            XCTAssertNotNil(CycleRule.readTypeIdentifiers[name], name)
        }
    }
}
