import Foundation

/// Ce que le plugin dépose pour une rafale, comme `FaceRecord.java` d'Android (visage.md §5) : l'heure, le
/// déclencheur, les indices médians et leur nombre d'images, les rejets par raison et les temps. Jamais d'image ni de
/// points. Le JS l'importe tel quel (entrée `face_burst`) : même texte qu'Android, au caractère près.
public enum FaceRecord {
    public static let version = 1

    /// - Parameters:
    ///   - burst: agrégat de la rafale, ou nil si aucune image valide (les rejets sont alors gardés seuls)
    ///   - rejections: raisons de rejet, une par image rejetée
    public static func json(at: Int64, trigger: String, frames: Int, burst: FaceIndices.Burst?, rejections: [String]?,
                            cameraMs: Int64, inferenceMs: Int64) -> String {
        var sb = "{\"v\":\(version),\"at\":\(at),\"trigger\":\(quote(trigger)),\"frames\":\(frames),\"valid\":\(burst?.valid ?? 0)"
        if let burst {
            let values = burst.keys.compactMap { key -> String? in
                guard let v = burst.values[key], v.isFinite else { return nil }
                return "\(quote(key)):\(fixed4(v))"
            }
            sb += ",\"values\":{\(values.joined(separator: ","))}"
        }
        var counts = [String: Int]()
        for r in rejections ?? [] { counts[r, default: 0] += 1 }
        // TreeMap d'Android : clés triées comme des chaînes Java (unités UTF-16)
        let sorted = counts.keys.sorted { Array($0.utf16).lexicographicallyPrecedes(Array($1.utf16)) }
        sb += ",\"rejected\":{\(sorted.map { "\(quote($0)):\(counts[$0]!)" }.joined(separator: ","))}"
        sb += ",\"ms\":{\"camera\":\(cameraMs),\"inference\":\(inferenceMs)}}"
        return sb
    }

    /// `String.format(Locale.ROOT, "%.4f", v)` de Java : l'écriture décimale la plus courte du nombre, arrondie à
    /// 4 décimales au plus proche, les milieux loin de zéro (HALF_UP), signe moins gardé (« -0.0000 »).
    static func fixed4(_ v: Double) -> String {
        var exact = Decimal(string: "\(abs(v))", locale: Locale(identifier: "en_US_POSIX")) ?? 0
        var rounded = Decimal()
        NSDecimalRound(&rounded, &exact, 4, .plain)
        let scaled = NSDecimalNumber(decimal: rounded * 10000).int64Value
        let digits = String(scaled % 10000)
        return "\(v.sign == .minus ? "-" : "")\(scaled / 10000).\(String(repeating: "0", count: 4 - digits.count))\(digits)"
    }

    static func quote(_ s: String?) -> String {
        guard let s else { return "null" }
        var out = "\""
        for c in s.unicodeScalars {
            switch c.value {
            case 0x22, 0x5C: out += "\\" + String(c)
            case ..<0x20:
                let hex = String(c.value, radix: 16)
                out += "\\u" + String(repeating: "0", count: 4 - hex.count) + hex
            default: out.unicodeScalars.append(c)
            }
        }
        return out + "\""
    }
}
