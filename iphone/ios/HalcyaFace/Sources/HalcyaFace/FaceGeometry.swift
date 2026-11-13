import Foundation

/// Géométrie de la lecture du visage, comme `FaceGeometry.java` d'Android (spécification : `journal/protocoles/visage.md`
/// de HealthTrack, §2 et §3) : ancres du détecteur, carré à bandes noires, recadrage tourné. Calculs en Double, rendus en
/// Float comme les entrées des modèles d'Android, pour garder les mêmes scores sur les mêmes images.
public enum FaceGeometry {
    public static let anchorCount = 896

    /// Carré tourné dans l'image (pixels) : centre, côté, rotation en radians.
    public struct Roi: Equatable {
        public let cx: Double
        public let cy: Double
        public let side: Double
        public let rot: Double
        public init(cx: Double, cy: Double, side: Double, rot: Double) {
            self.cx = cx
            self.cy = cy
            self.side = side
            self.rot = rot
        }
    }

    /// Ancres du détecteur « courte portée » (§2.2) : 16 × 16 cellules × 2, puis 8 × 8 cellules × 6 ; (x, y) normalisés,
    /// ligne par ligne, puis colonne, puis ancre.
    public static let anchors: [(x: Double, y: Double)] = {
        var out: [(x: Double, y: Double)] = []
        out.reserveCapacity(anchorCount)
        for (grid, perCell) in [(16, 2), (8, 6)] {
            for y in 0..<grid {
                for x in 0..<grid {
                    for _ in 0..<perCell {
                        out.append((x: (Double(x) + 0.5) / Double(grid), y: (Double(y) + 0.5) / Double(grid)))
                    }
                }
            }
        }
        return out
    }()

    /// Carré centré qui contient toute l'image (bandes noires) : l'entrée du détecteur (§2.1).
    public static func letterbox(width: Int, height: Int) -> Roi {
        Roi(cx: Double(width) / 2, cy: Double(height) / 2, side: Double(max(width, height)), rot: 0)
    }

    /// Recadre le carré tourné vers size × size (RVB, NHWC), valeurs ramenées dans [lo, hi]. Le pixel de sortie (i, j)
    /// lit l'image en centre + R · (((i + 0,5) / size − 0,5) × côté, …), bilinéaire, extérieur noir.
    /// `rgb` = pixels 0xRRGGBB ligne par ligne.
    public static func crop(rgb: [UInt32], width: Int, height: Int, roi: Roi, size: Int, lo: Float, hi: Float) -> [Float] {
        var out = [Float](repeating: 0, count: size * size * 3)
        let c = cos(roi.rot), s = sin(roi.rot)
        let scale = Double(hi - lo) / 255
        var o = 0
        for j in 0..<size {
            let v = ((Double(j) + 0.5) / Double(size) - 0.5) * roi.side
            for i in 0..<size {
                let u = ((Double(i) + 0.5) / Double(size) - 0.5) * roi.side
                let px = sample(rgb, width, height, roi.cx + c * u - s * v - 0.5, roi.cy + s * u + c * v - 0.5)
                out[o] = Float(px.r * scale + Double(lo))
                out[o + 1] = Float(px.g * scale + Double(lo))
                out[o + 2] = Float(px.b * scale + Double(lo))
                o += 3
            }
        }
        return out
    }

    private static func sample(_ rgb: [UInt32], _ width: Int, _ height: Int, _ x: Double, _ y: Double) -> (r: Double, g: Double, b: Double) {
        let x0 = Int(floor(x)), y0 = Int(floor(y))
        let fx = x - Double(x0), fy = y - Double(y0)
        var acc = (r: 0.0, g: 0.0, b: 0.0)
        func add(_ x: Int, _ y: Int, _ w: Double) {
            guard x >= 0, y >= 0, x < width, y < height, w != 0 else { return }
            let p = rgb[y * width + x]
            acc.r += Double((p >> 16) & 0xff) * w
            acc.g += Double((p >> 8) & 0xff) * w
            acc.b += Double(p & 0xff) * w
        }
        add(x0, y0, (1 - fx) * (1 - fy))
        add(x0 + 1, y0, fx * (1 - fy))
        add(x0, y0 + 1, (1 - fx) * fy)
        add(x0 + 1, y0 + 1, fx * fy)
        return acc
    }
}
