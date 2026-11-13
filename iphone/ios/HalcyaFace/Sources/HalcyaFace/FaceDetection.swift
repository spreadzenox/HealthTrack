import Foundation

/// Détecteur et maillage, comme `FaceGeometry.java` d'Android (visage.md §2.3 à §4.2) : décodage et fusion des boîtes
/// de BlazeFace, recadrage du visage (ROI), retour des 478 points dans l'image, entrée des blendshapes, taille et lacet.
public extension FaceGeometry {
    static let detectorSize = 128
    static let landmarkSize = 256
    static let points = 478
    static let minScore = 0.5
    static let nmsIou = 0.3
    static let roiScale = 1.5

    /// Les 146 points lus par le modèle de blendshapes (visage.md §4.1), dans cet ordre.
    static let subset: [Int] = [
        0, 1, 4, 5, 6, 7, 8, 10, 13, 14, 17, 21, 33, 37, 39, 40, 46, 52, 53, 54, 55, 58, 61, 63, 65, 66, 67, 70, 78, 80,
        81, 82, 84, 87, 88, 91, 93, 95, 103, 105, 107, 109, 127, 132, 133, 136, 144, 145, 146, 148, 149, 150, 152, 153,
        154, 155, 157, 158, 159, 160, 161, 162, 163, 168, 172, 173, 176, 178, 181, 185, 191, 195, 197, 234, 246, 249, 251,
        263, 267, 269, 270, 276, 282, 283, 284, 285, 288, 291, 293, 295, 296, 297, 300, 308, 310, 311, 312, 314, 317, 318,
        321, 323, 324, 332, 334, 336, 338, 356, 361, 362, 365, 373, 374, 375, 377, 378, 379, 380, 381, 382, 384, 385, 386,
        387, 388, 389, 390, 397, 398, 400, 402, 405, 409, 415, 454, 466, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477,
    ]

    /// Un visage trouvé par le détecteur, en pixels de l'image ; `keypoints` = 6 × (x, y), k0 et k1 = les yeux.
    struct Detection {
        public let score: Double
        public let boxes: Int
        public let cx: Double
        public let cy: Double
        public let w: Double
        public let h: Double
        public let keypoints: [Double]
    }

    /// Décode les sorties du détecteur (regressors 896 × 16, logits 896) et fusionne les boîtes qui se recouvrent
    /// (moyenne pondérée par le score). Rend le plus grand visage, ou nil si aucun.
    static func decode(regressors: [Float], logits: [Float], width: Int, height: Int) -> Detection? {
        var score = [Double](repeating: 0, count: anchorCount)
        var kept: [Int] = []
        for i in 0..<anchorCount {
            let logit = max(-100, min(100, Double(logits[i])))
            score[i] = 1 / (1 + exp(-logit))
            if score[i] >= minScore { kept.append(i) }
        }
        if kept.isEmpty { return nil }
        // Tri d'Android (stable) : score décroissant, puis ordre des ancres
        let sorted = kept.sorted { score[$0] != score[$1] ? score[$0] > score[$1] : $0 < $1 }
        var boxes = [Int: [Double]]()
        for i in sorted { boxes[i] = box(regressors, i) }

        var used = Set<Int>()
        var best: Detection?
        var bestArea = -1.0
        for top in sorted where !used.contains(top) {
            var sum = [Double](repeating: 0, count: 16)
            var weight = 0.0
            var count = 0
            for j in sorted where !used.contains(j) && iou(boxes[top]!, boxes[j]!) > nmsIou {
                used.insert(j)
                count += 1
                weight += score[j]
                for k in 0..<16 { sum[k] += boxes[j]![k] * score[j] }
            }
            for k in 0..<16 { sum[k] /= weight }
            let area = sum[2] * sum[3]
            if area > bestArea {
                bestArea = area
                best = toPixels(sum, score: score[top], count: count, width: width, height: height)
            }
        }
        return best
    }

    private static func box(_ reg: [Float], _ i: Int) -> [Double] {
        let a = anchors[i], o = i * 16
        var b = [Double](repeating: 0, count: 16)
        b[0] = Double(reg[o]) / 128 + a.x
        b[1] = Double(reg[o + 1]) / 128 + a.y
        b[2] = Double(reg[o + 2]) / 128
        b[3] = Double(reg[o + 3]) / 128
        for k in 4..<16 { b[k] = Double(reg[o + k]) / 128 + (k % 2 == 0 ? a.x : a.y) }
        return b
    }

    private static func iou(_ p: [Double], _ q: [Double]) -> Double {
        let ix = max(0, min(p[0] + p[2] / 2, q[0] + q[2] / 2) - max(p[0] - p[2] / 2, q[0] - q[2] / 2))
        let iy = max(0, min(p[1] + p[3] / 2, q[1] + q[3] / 2) - max(p[1] - p[3] / 2, q[1] - q[3] / 2))
        let inter = ix * iy
        let union = p[2] * p[3] + q[2] * q[3] - inter
        return union > 0 ? inter / union : 0
    }

    private static func toPixels(_ b: [Double], score: Double, count: Int, width: Int, height: Int) -> Detection {
        let side = Double(max(width, height))
        let ox = (side - Double(width)) / 2, oy = (side - Double(height)) / 2
        let kp = (0..<12).map { k in b[4 + k] * side - (k % 2 == 0 ? ox : oy) }
        return Detection(score: score, boxes: count, cx: b[0] * side - ox, cy: b[1] * side - oy, w: b[2] * side, h: b[3] * side, keypoints: kp)
    }

    /// ROI d'après le détecteur : centre de la boîte, angle des yeux, côté = max(w, h) × 1,5 (§3.1).
    static func roi(from d: Detection) -> Roi {
        let k = d.keypoints
        return roi(d.cx, d.cy, d.w, d.h, k[0], k[1], k[2], k[3])
    }

    /// ROI de l'image suivante d'une rafale, d'après les 478 points (x, y, z) de la précédente (§3.4).
    static func roi(fromPoints pts: [Double]) -> Roi {
        var minX = Double.greatestFiniteMagnitude, minY = Double.greatestFiniteMagnitude
        var maxX = -Double.greatestFiniteMagnitude, maxY = -Double.greatestFiniteMagnitude
        for i in 0..<points {
            minX = min(minX, pts[3 * i])
            maxX = max(maxX, pts[3 * i])
            minY = min(minY, pts[3 * i + 1])
            maxY = max(maxY, pts[3 * i + 1])
        }
        return roi((minX + maxX) / 2, (minY + maxY) / 2, maxX - minX, maxY - minY,
                   pts[3 * 33], pts[3 * 33 + 1], pts[3 * 263], pts[3 * 263 + 1])
    }

    private static func roi(_ cx: Double, _ cy: Double, _ w: Double, _ h: Double, _ x0: Double, _ y0: Double, _ x1: Double, _ y1: Double) -> Roi {
        Roi(cx: cx, cy: cy, side: max(w, h) * roiScale, rot: atan2(y1 - y0, x1 - x0))
    }

    /// Sortie du maillage (478 × 3, pixels du recadrage 256) → points (x, y, z) en pixels de l'image (§3.3).
    static func toImage(_ raw: [Float], roi: Roi) -> [Double] {
        var pts = [Double](repeating: 0, count: points * 3)
        let c = cos(roi.rot), s = sin(roi.rot)
        let size = Double(landmarkSize)
        for i in 0..<points {
            let dx = (Double(raw[3 * i]) / size - 0.5) * roi.side
            let dy = (Double(raw[3 * i + 1]) / size - 0.5) * roi.side
            pts[3 * i] = roi.cx + c * dx - s * dy
            pts[3 * i + 1] = roi.cy + s * dx + c * dy
            pts[3 * i + 2] = Double(raw[3 * i + 2]) / size * roi.side
        }
        return pts
    }

    /// Entrée du modèle de blendshapes : (x, y) en pixels des 146 points (§4.2, jamais normalisés par axe).
    static func blendshapeInput(_ pts: [Double]) -> [Float] {
        subset.flatMap { [Float(pts[3 * $0]), Float(pts[3 * $0 + 1])] }
    }

    /// Côté du visage en pixels (plus grand côté de la boîte englobante des 468 points du maillage).
    static func faceSize(_ pts: [Double]) -> Double {
        let xs = (0..<468).map { pts[3 * $0] }, ys = (0..<468).map { pts[3 * $0 + 1] }
        return max(xs.max()! - xs.min()!, ys.max()! - ys.min()!)
    }

    /// Lacet approché (degrés) : angle joue gauche (234) → joue droite (454) dans le plan (x, z), une fois la rotation
    /// dans le plan de l'image retirée. 0 = de face ; le signe dit le côté.
    static func yawDegrees(_ pts: [Double]) -> Double {
        let rot = atan2(pts[3 * 263 + 1] - pts[3 * 33 + 1], pts[3 * 263] - pts[3 * 33])
        let dx = pts[3 * 454] - pts[3 * 234], dy = pts[3 * 454 + 1] - pts[3 * 234 + 1]
        let along = dx * cos(rot) + dy * sin(rot)
        let dz = pts[3 * 454 + 2] - pts[3 * 234 + 2]
        return atan2(dz, along) * 180 / .pi
    }
}
