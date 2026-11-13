import Foundation

/// Cycle noté dans l'app Santé (CYCLE-iOS-1, décision du propriétaire du 10/11 vers 18:50, « Ok cycle ») : un
/// échantillon de HealthKit (identifiant du type, valeur brute, début) rendu sous la forme que range la brique partagée
/// d'Android (`src/services/cycle.js`), par `src/ios/cycleSante.js` : `{ kind, flow?, symptom?, start }`. Pas d'import
/// de HealthKit ici : la correspondance se teste par `swift test` sur le runner macOS. Rien ne sort du téléphone.
///
/// Valeurs brutes d'Apple : règles (`HKCategoryValueVaginalBleeding`, ex-`HKCategoryValueMenstrualFlow`) 1 non
/// précisé, 2 léger, 3 moyen, 4 abondant, 5 aucun ; symptômes (`HKCategoryValueSeverity`) 0 non précisé, 1 absent,
/// 2 léger, 3 modéré, 4 sévère ; saignement hors des règles : 0 (sans valeur).
public enum CycleRule {
    public static let menstrualFlow = "HKCategoryTypeIdentifierMenstrualFlow"
    public static let intermenstrualBleeding = "HKCategoryTypeIdentifierIntermenstrualBleeding"
    /// Symptômes de Santé qui ont leur équivalent dans la brique partagée (`SYMPTOMS` de `cycle.js`) ; constipation et
    /// diarrhée ajoutées par Android à notre demande (CYCLE-1b, v979).
    public static let symptoms: [String: String] = [
        "HKCategoryTypeIdentifierAbdominalCramps": "cramps",
        "HKCategoryTypeIdentifierPelvicPain": "pelvic_pain",
        "HKCategoryTypeIdentifierBloating": "bloating",
        "HKCategoryTypeIdentifierHeadache": "headache",
        "HKCategoryTypeIdentifierFatigue": "fatigue",
        "HKCategoryTypeIdentifierConstipation": "constipation",
        "HKCategoryTypeIdentifierDiarrhea": "diarrhea",
    ]
    /// Les types lus, dans un ordre stable.
    public static var identifiers: [String] { [menstrualFlow, intermenstrualBleeding] + symptoms.keys.sorted() }

    private static let flows = [1: "unknown", 2: "light", 3: "medium", 4: "heavy"]
    private static let symptomAbsent = 1

    /// La ligne rendue à l'app, ou nil quand l'échantillon ne dit rien du cycle (« aucun » flux, symptôme absent,
    /// type inconnu).
    public static func row(identifier: String, value: Int, startMs: Double) -> [String: Any]? {
        switch identifier {
        case menstrualFlow:
            guard let flow = flows[value] else { return nil }
            return ["kind": "period", "flow": flow, "start": startMs]
        case intermenstrualBleeding:
            return ["kind": "spotting", "start": startMs]
        default:
            guard let symptom = symptoms[identifier], value != symptomAbsent else { return nil }
            return ["kind": "symptom", "symptom": symptom, "start": startMs]
        }
    }

    // MARK: Autorisation (CYCLE-iOS-2)

    /// Nom de mesure de `@capgo/capacitor-health` (`READ_TYPES` du connecteur) → type(s) HealthKit, comme le module les
    /// demande (`HealthDataType.sampleType()` ; la tension en deux types). Sert à demander le cycle **dans la même
    /// feuille** d'Apple que les autres mesures : après elle, la demande du module ne montre plus rien.
    public static let readTypeIdentifiers: [String: [String]] = [
        "steps": ["HKQuantityTypeIdentifierStepCount"],
        "sleep": ["HKCategoryTypeIdentifierSleepAnalysis"],
        "heartRate": ["HKQuantityTypeIdentifierHeartRate"],
        "restingHeartRate": ["HKQuantityTypeIdentifierRestingHeartRate"],
        "heartRateVariability": ["HKQuantityTypeIdentifierHeartRateVariabilitySDNN"],
        "oxygenSaturation": ["HKQuantityTypeIdentifierOxygenSaturation"],
        "calories": ["HKQuantityTypeIdentifierActiveEnergyBurned"],
        "distance": ["HKQuantityTypeIdentifierDistanceWalkingRunning"],
        "workouts": ["HKWorkoutTypeIdentifier"],
        "respiratoryRate": ["HKQuantityTypeIdentifierRespiratoryRate"],
        "bodyTemperature": ["HKQuantityTypeIdentifierBodyTemperature"],
        "bloodPressure": ["HKQuantityTypeIdentifierBloodPressureSystolic", "HKQuantityTypeIdentifierBloodPressureDiastolic"],
        "bloodGlucose": ["HKQuantityTypeIdentifierBloodGlucose"],
        "weight": ["HKQuantityTypeIdentifierBodyMass"],
        "bodyFat": ["HKQuantityTypeIdentifierBodyFatPercentage"],
    ]

    /// Les identifiants à demander en une fois : les mesures `read` (noms inconnus ignorés : le module les demandera
    /// lui-même) et, si « Mon cycle » est coché, les types du cycle. Sans doublon, ordre stable.
    public static func authorizationIdentifiers(read: [String], cycle: Bool) -> [String] {
        var out: [String] = []
        for id in read.flatMap({ readTypeIdentifiers[$0] ?? [] }) + (cycle ? identifiers : []) where !out.contains(id) {
            out.append(id)
        }
        return out
    }
}
