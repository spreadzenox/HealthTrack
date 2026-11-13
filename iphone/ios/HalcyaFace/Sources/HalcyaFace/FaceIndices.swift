import Foundation

/// Ce que Halcya garde d'une image puis d'une rafale, comme `FaceIndices.java` d'Android (visage.md §5 et §6) : une
/// dizaine d'indices nommés par unités d'action, le contrôle qualité avant tout calcul, et la médiane d'une rafale.
/// Aucun indice n'est « bon » ou « mauvais » : le sens vient plus tard. Ni image ni points ne sortent d'ici.
/// Les moyennes gauche / droite s'additionnent en Float avant la division, comme en Java, pour les mêmes chiffres.
public enum FaceIndices {
    public static let blendshapes = 52

    // Positions dans les 52 sorties du modèle de blendshapes (visage.md §4.3).
    static let browDownL = 1, browDownR = 2, browInnerUp = 3
    static let cheekSquintL = 7, cheekSquintR = 8
    static let eyeBlinkL = 9, eyeBlinkR = 10
    static let jawOpen = 25
    static let mouthFrownL = 30, mouthFrownR = 31
    static let mouthSmileL = 44, mouthSmileR = 45

    /// Indices gardés par image, dans l'ordre d'export.
    public static let names = ["smile", "duchenne", "browDown", "browInnerUp", "mouthFrown", "eyeOpen", "jawOpen", "asymmetry", "yaw"]

    // Contrôle qualité (§6).
    static let minPresence = 0.9
    static let minFacePx = 80.0
    static let maxYawDeg = 30.0
    static let minLuminance = 0.15
    static let maxLuminance = 0.9
    static let maxJawOpen: Float = 0.5

    /// Raisons de rejet d'une image, comptées dans le diagnostic.
    public enum Reject: String {
        case noFace = "no_face", lowPresence = "low_presence", tooSmall = "too_small", turned = "turned"
        case tooDark = "too_dark", tooBright = "too_bright", talking = "talking"
    }

    /// Les indices d'une image, d'après ses 52 coefficients et son lacet (degrés).
    public static func fromBlendshapes(_ bs: [Float], yawDeg: Double) -> [String: Double] {
        let smile = mean(bs[mouthSmileL], bs[mouthSmileR])
        return [
            "smile": smile,
            "duchenne": min(smile, mean(bs[cheekSquintL], bs[cheekSquintR])),
            "browDown": mean(bs[browDownL], bs[browDownR]),
            "browInnerUp": Double(bs[browInnerUp]),
            "mouthFrown": mean(bs[mouthFrownL], bs[mouthFrownR]),
            "eyeOpen": 1 - mean(bs[eyeBlinkL], bs[eyeBlinkR]),
            "jawOpen": Double(bs[jawOpen]),
            "asymmetry": Double(abs(bs[mouthSmileL] - bs[mouthSmileR])),
            "yaw": yawDeg,
        ]
    }

    private static func mean(_ a: Float, _ b: Float) -> Double {
        Double(a + b) / 2
    }

    /// Luminance moyenne (Rec. 601) d'un tenseur RVB dont les valeurs sont dans [0, 1].
    public static func luminance(_ rgb01: [Float]) -> Double {
        let n = rgb01.count / 3
        var sum = 0.0
        for i in 0..<n {
            sum += 0.299 * Double(rgb01[3 * i]) + 0.587 * Double(rgb01[3 * i + 1]) + 0.114 * Double(rgb01[3 * i + 2])
        }
        return n > 0 ? sum / Double(n) : 0
    }

    /// Raison de rejet avant le calcul des blendshapes (§6), ou nil si l'image est exploitable.
    public static func rejectBeforeBlendshapes(presence: Double, facePx: Double, yawDeg: Double, luminance: Double) -> Reject? {
        if presence < minPresence { return .lowPresence }
        if facePx < minFacePx { return .tooSmall }
        if abs(yawDeg) > maxYawDeg { return .turned }
        if luminance < minLuminance { return .tooDark }
        if luminance > maxLuminance { return .tooBright }
        return nil
    }

    /// Raison de rejet après les blendshapes (bouche ouverte : parole ou bâillement), ou nil.
    public static func rejectAfterBlendshapes(_ bs: [Float]) -> Reject? {
        bs[jawOpen] > maxJawOpen ? .talking : nil
    }

    /// Résultat d'une rafale : médiane de chaque indice sur les images valides, plus n et la mobilité. `keys` garde
    /// l'ordre d'export (celui du `LinkedHashMap` d'Android) : les indices, puis `mobility`, puis ce qu'on ajoute.
    public struct Burst {
        public private(set) var values: [String: Double]
        public private(set) var keys: [String]
        public let valid: Int
        public let frames: Int

        init(values: [String: Double], keys: [String], valid: Int, frames: Int) {
            self.values = values
            self.keys = keys
            self.valid = valid
            self.frames = frames
        }

        /// Ajoute (ou remplace) une valeur, à la fin de l'ordre d'export si elle est nouvelle.
        public mutating func set(_ key: String, _ value: Double) {
            if values[key] == nil { keys.append(key) }
            values[key] = value
        }
    }

    /// Agrège une rafale. `indices` / `blendshapes` = images valides seulement, dans l'ordre de capture ; `frames` =
    /// nombre d'images prises. `mobility` = écart absolu moyen des 52 coefficients entre images successives (absent sous
    /// 2 images valides). nil si aucune image valide.
    public static func burst(indices: [[String: Double]], blendshapes bs: [[Float]], frames: Int) -> Burst? {
        if indices.isEmpty { return nil }
        var out = Burst(values: [:], keys: [], valid: indices.count, frames: frames)
        for name in names { out.set(name, median(indices.map { $0[name]! })) }
        if bs.count >= 2 {
            var sum = 0.0
            for i in 1..<bs.count {
                for k in 0..<blendshapes { sum += Double(abs(bs[i - 1][k] - bs[i][k])) }
            }
            out.set("mobility", sum / (Double(bs.count - 1) * Double(blendshapes)))
        }
        return out
    }

    static func median(_ v: [Double]) -> Double {
        let s = v.sorted(), n = s.count
        return n % 2 == 1 ? s[n / 2] : (s[n / 2 - 1] + s[n / 2]) / 2
    }
}
