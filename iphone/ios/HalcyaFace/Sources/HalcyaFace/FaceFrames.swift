import Foundation

/// Image de la caméra → pixels RVB à l'endroit, comme `FaceFrames.java` d'Android (visage.md §8). La caméra frontale
/// livre du YUV 4:2:0 (sur iPhone : « 420f », plan Y plein et plan CbCr entrelacé) dans le sens du capteur ; on convertit
/// en 0xRRGGBB (BT.601 plein écart) en tournant dans le même passage, avec l'arrondi de `Math.round` de Java. Rien n'est
/// gardé : l'appelant jette le résultat après l'inférence.
public enum FaceFrames {
    /// Pixels 0xRRGGBB d'une image à l'endroit.
    public struct Rgb: Equatable {
        public let pixels: [UInt32]
        public let width: Int
        public let height: Int
    }

    /// Convertit une image YUV 4:2:0 de width × height (sens du capteur), tournée de `rotation` degrés dans le sens
    /// horaire (0, 90, 180 ou 270, ou leurs équivalents). `u` et `v` peuvent être le même plan entrelacé (CbCr de
    /// l'iPhone : `uOffset` 0, `vOffset` 1, `uvPixelStride` 2). nil si la rotation n'est pas un quart de tour.
    public static func fromYuv420(y: [UInt8], yRowStride: Int, u: [UInt8], uOffset: Int = 0, v: [UInt8], vOffset: Int = 0,
                                  uvRowStride: Int, uvPixelStride: Int, width: Int, height: Int, rotation: Int) -> Rgb? {
        let r = ((rotation % 360) + 360) % 360
        guard r % 90 == 0 else { return nil }
        let swap = r == 90 || r == 270
        let outW = swap ? height : width, outH = swap ? width : height
        var out = [UInt32](repeating: 0, count: width * height)
        for row in 0..<height {
            let yBase = row * yRowStride
            let uvBase = (row >> 1) * uvRowStride
            for col in 0..<width {
                let lum = Int(y[yBase + col])
                let uvIndex = uvBase + (col >> 1) * uvPixelStride
                let cb = Int(u[uOffset + uvIndex]) - 128
                let cr = Int(v[vOffset + uvIndex]) - 128
                let red = clamp(lum + javaRound(1.402 * Double(cr)))
                let green = clamp(lum - javaRound(0.344136 * Double(cb) + 0.714136 * Double(cr)))
                let blue = clamp(lum + javaRound(1.772 * Double(cb)))
                let (dx, dy): (Int, Int) = switch r {
                case 90: (height - 1 - row, col)
                case 180: (width - 1 - col, height - 1 - row)
                case 270: (row, width - 1 - col)
                default: (col, row)
                }
                out[dy * outW + dx] = UInt32(red << 16 | green << 8 | blue)
            }
        }
        return Rgb(pixels: out, width: outW, height: outH)
    }

    /// Rotation à appliquer à une image de la caméra frontale : capteur + écran (degrés, sens horaire).
    public static func frontRotation(sensorOrientation: Int, displayRotationDegrees: Int) -> Int {
        ((sensorOrientation + displayRotationDegrees) % 360 + 360) % 360
    }

    /// `Math.round` de Java : le plus proche, les milieux vers le haut (−2,5 → −2), pas loin de zéro comme `rounded()`.
    static func javaRound(_ x: Double) -> Int {
        Int((x + 0.5).rounded(.down))
    }

    private static func clamp(_ c: Int) -> Int {
        c < 0 ? 0 : min(c, 255)
    }
}
