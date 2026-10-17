# Prototype de référence du pipeline visage décrit dans journal/protocoles/visage.md
# (LiteRT seul + numpy + Pillow), comparé à MediaPipe Tasks (ref.json).
# Outil de recherche hors app (run « idées » du 17/10/2026 08:30), pas du code de HealthTrack.
# Usage (dans un dossier de travail hors dépôt) :
#   python -m venv venv && venv/bin/pip install ai-edge-litert numpy pillow mediapipe
#   curl -o fl.task https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task
#   mkdir -p dl/x && unzip fl.task -d dl/x   (les 3 .tflite, jamais committés)
#   ref.json = landmarks (normalisés) + blendshapes de MediaPipe Tasks sur la même image (voir visage.md §7)
#   venv/bin/python -I visage-reference.py portrait.jpg
# Les 146 indices et les 52 noms viennent de face_blendshapes_graph.cc (MediaPipe, Apache-2.0).
import json, math, sys, time
import numpy as np
from PIL import Image
from ai_edge_litert.interpreter import Interpreter

M = 'dl/x/'
IMG = sys.argv[1] if len(sys.argv) > 1 else 'img/portrait.jpg'
DET_RANGE = (-1.0, 1.0)
LMK_RANGE = (0.0, 1.0)

def interp(name):
    it = Interpreter(model_path=M + name + '.tflite', num_threads=1)
    it.allocate_tensors()
    return it

def run(it, x):
    it.set_tensor(it.get_input_details()[0]['index'], x.astype(np.float32))
    it.invoke()
    return [it.get_tensor(o['index']) for o in it.get_output_details()]

def anchors():
    out = []
    # couche 0 : stride 8 -> 16x16, 2 ancres ; couches 1-3 : stride 16 fusionnées -> 8x8, 6 ancres
    for fm, n in ((16, 2), (8, 6)):
        for y in range(fm):
            for x in range(fm):
                for _ in range(n):
                    out.append(((x + 0.5) / fm, (y + 0.5) / fm))
    return np.array(out, dtype=np.float32)

def affine_crop(img, cx, cy, w, h, rot, size, rng):
    """Recadre le rectangle (centre, taille en px, rotation rad) de img vers size x size, valeurs dans rng."""
    # transformation sortie -> entrée
    c, s = math.cos(rot), math.sin(rot)
    sx, sy = w / size, h / size
    a = c * sx; b = -s * sy; d = s * sx; e = c * sy
    tx = cx - a * size / 2 - b * size / 2
    ty = cy - d * size / 2 - e * size / 2
    # PIL attend (a,b,c,d,e,f) tel que in = (a*x+b*y+c, d*x+e*y+f) ; centre des pixels à +0.5
    ox = a * 0.5 + b * 0.5 - 0.5; oy = d * 0.5 + e * 0.5 - 0.5
    crop = img.transform((size, size), Image.AFFINE, (a, b, tx + ox, d, e, ty + oy),
                         resample=Image.BILINEAR, fillcolor=(0, 0, 0))
    x = np.asarray(crop, dtype=np.float32) / 255.0
    return (x * (rng[1] - rng[0]) + rng[0])[None]

def detect(img, det):
    W, H = img.size
    # letterbox : on garde le ratio, carré de côté max(W,H) centré
    side = max(W, H)
    x = affine_crop(img, W / 2, H / 2, side, side, 0.0, 128, DET_RANGE)
    reg, cls = run(det, x)
    reg, cls = reg[0], cls[0, :, 0]
    score = 1 / (1 + np.exp(-np.clip(cls, -100, 100)))
    i = int(np.argmax(score))
    A = anchors()
    r = reg[i] / 128.0
    ax, ay = A[i]
    cxn, cyn, wn, hn = r[0] + ax, r[1] + ay, r[2], r[3]
    kps = [(r[4 + 2 * k] + ax, r[5 + 2 * k] + ay) for k in range(6)]
    # pondération façon NMS « weighted » : moyenne des boîtes qui recouvrent la meilleure (IoU > 0.3, score >= 0.5)
    def box(j):
        q = reg[j] / 128.0; bx, by = A[j]
        return np.array([q[0] + bx, q[1] + by, q[2], q[3]] + list((q[4:] + np.tile(A[j], 6))))
    def iou(p, q):
        pa = [p[0] - p[2] / 2, p[1] - p[3] / 2, p[0] + p[2] / 2, p[1] + p[3] / 2]
        qa = [q[0] - q[2] / 2, q[1] - q[3] / 2, q[0] + q[2] / 2, q[1] + q[3] / 2]
        ix = max(0, min(pa[2], qa[2]) - max(pa[0], qa[0])); iy = max(0, min(pa[3], qa[3]) - max(pa[1], qa[1]))
        inter = ix * iy
        return inter / (p[2] * p[3] + q[2] * q[3] - inter)
    best = box(i)
    cand = [j for j in np.where(score >= 0.5)[0] if iou(best, box(j)) > 0.3]
    wsum = sum(score[j] for j in cand)
    avg = sum(box(j) * score[j] for j in cand) / wsum
    cxn, cyn, wn, hn = avg[:4]
    kps = [(avg[4 + 2 * k], avg[5 + 2 * k]) for k in range(6)]
    # retirer le letterbox : coordonnées normalisées du carré -> pixels de l'image
    off_x, off_y = (side - W) / 2, (side - H) / 2
    to_px = lambda u, v: (u * side - off_x, v * side - off_y)
    cx, cy = to_px(cxn, cyn)
    w, h = wn * side, hn * side
    k = [to_px(u, v) for u, v in kps]
    return dict(score=float(score[i]), n=len(cand), cx=cx, cy=cy, w=w, h=h, kps=k)

def rect_from(cx, cy, w, h, p0, p1, scale, square_long=True):
    rot = -math.atan2(-(p1[1] - p0[1]), p1[0] - p0[0])
    rot = (rot + math.pi) % (2 * math.pi) - math.pi
    if square_long:
        w = h = max(w, h)
    return cx, cy, w * scale, h * scale, rot

def landmarks(img, lmk, roi):
    cx, cy, w, h, rot = roi
    x = affine_crop(img, cx, cy, w, h, rot, 256, LMK_RANGE)
    out = run(lmk, x)
    pts = out[0].reshape(478, 3) / 256.0
    pres = 1 / (1 + np.exp(-float(out[1].ravel()[0])))
    c, s = math.cos(rot), math.sin(rot)
    res = []
    for u, v, z in pts:
        dx, dy = (u - 0.5) * w, (v - 0.5) * h
        res.append((cx + c * dx - s * dy, cy + s * dx + c * dy, z * w))
    return np.array(res), pres

SUBSET = [0, 1, 4, 5, 6, 7, 8, 10, 13, 14, 17, 21, 33, 37, 39, 40, 46, 52, 53, 54, 55, 58, 61, 63, 65, 66, 67, 70, 78, 80,
          81, 82, 84, 87, 88, 91, 93, 95, 103, 105, 107, 109, 127, 132, 133, 136, 144, 145, 146, 148, 149, 150, 152, 153, 154, 155, 157, 158, 159, 160,
          161, 162, 163, 168, 172, 173, 176, 178, 181, 185, 191, 195, 197, 234, 246, 249, 251, 263, 267, 269, 270, 276, 282, 283, 284, 285, 288, 291, 293, 295,
          296, 297, 300, 308, 310, 311, 312, 314, 317, 318, 321, 323, 324, 332, 334, 336, 338, 356, 361, 362, 365, 373, 374, 375, 377, 378, 379, 380, 381, 382,
          384, 385, 386, 387, 388, 389, 390, 397, 398, 400, 402, 405, 409, 415, 454, 466, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477]
NAMES = ["_neutral", "browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft", "browOuterUpRight", "cheekPuff", "cheekSquintLeft", "cheekSquintRight", "eyeBlinkLeft", "eyeBlinkRight", "eyeLookDownLeft", "eyeLookDownRight", "eyeLookInLeft", "eyeLookInRight", "eyeLookOutLeft", "eyeLookOutRight", "eyeLookUpLeft", "eyeLookUpRight", "eyeSquintLeft", "eyeSquintRight", "eyeWideLeft", "eyeWideRight", "jawForward", "jawLeft", "jawOpen", "jawRight", "mouthClose", "mouthDimpleLeft", "mouthDimpleRight", "mouthFrownLeft", "mouthFrownRight", "mouthFunnel", "mouthLeft", "mouthLowerDownLeft", "mouthLowerDownRight", "mouthPressLeft", "mouthPressRight", "mouthPucker", "mouthRight", "mouthRollLower", "mouthRollUpper", "mouthShrugLower", "mouthShrugUpper", "mouthSmileLeft", "mouthSmileRight", "mouthStretchLeft", "mouthStretchRight", "mouthUpperUpLeft", "mouthUpperUpRight", "noseSneerLeft", "noseSneerRight"]

def main():
    img = Image.open(IMG).convert('RGB')
    W, H = img.size
    det, lmk, bsm = interp('face_detector'), interp('face_landmarks_detector'), interp('face_blendshapes')
    t0 = time.perf_counter()
    d = detect(img, det)
    roi = rect_from(d['cx'], d['cy'], d['w'], d['h'], d['kps'][0], d['kps'][1], 1.5)
    pts, pres = landmarks(img, lmk, roi)
    # 2e passe façon « suivi » : ROI recalculée sur les points (33 -> 263), x1.5, carré
    xs, ys = pts[:, 0], pts[:, 1]
    roi2 = rect_from((xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2, xs.max() - xs.min(), ys.max() - ys.min(),
                     pts[33], pts[263], 1.5)
    pts2, pres2 = landmarks(img, lmk, roi2)
    bs = run(bsm, pts[SUBSET, :2][None])[0]
    t1 = time.perf_counter()
    ref = json.load(open('ref.json'))
    R = np.array(ref['lm']); Rpx = R[:, :2] * [W, H]
    err = np.abs(pts[:, :2] - Rpx).max(axis=1)
    err2 = np.abs(pts2[:, :2] - Rpx).max(axis=1)
    iod = np.linalg.norm(Rpx[33] - Rpx[263])
    print('détection score %.3f (%d boîtes fusionnées), présence %.3f, %.1f ms' % (d['score'], d['n'], pres, (t1 - t0) * 1e3))
    print('points 1re passe : écart médian %.2f px, max %.2f px (distance inter-yeux %.0f px)' % (np.median(err), err.max(), iod))
    print('points 2e passe  : écart médian %.2f px, max %.2f px' % (np.median(err2), err2.max()))
    diffs = {n: abs(float(bs[i]) - ref['bs'][n]) for i, n in enumerate(NAMES)}
    print('blendshapes depuis nos points : écart max %.4f (%s), moyen %.4f' % (max(diffs.values()), max(diffs, key=diffs.get), np.mean(list(diffs.values()))))
    # blendshapes depuis les points de référence : isole le modèle de blendshapes
    bs_ref = run(bsm, Rpx[SUBSET][None])[0]
    d2 = [abs(float(bs_ref[i]) - ref['bs'][n]) for i, n in enumerate(NAMES)]
    print('blendshapes depuis les points MediaPipe (px) : écart max %.5f' % max(d2))
    bs_norm = run(bsm, R[SUBSET, :2][None])[0]
    d3 = [abs(float(bs_norm[i]) - ref['bs'][n]) for i, n in enumerate(NAMES)]
    print('  ... mêmes points en coordonnées normalisées [0,1] : écart max %.5f' % max(d3))
    bs_sc = run(bsm, (Rpx[SUBSET] * 0.37 + [40, -12])[None])[0]
    d4 = [abs(float(bs_sc[i]) - ref['bs'][n]) for i, n in enumerate(NAMES)]
    print('  ... mêmes points mis à l\'échelle x0,37 et décalés : écart max %.5f' % max(d4))
    for n in ('mouthSmileLeft', 'browDownLeft', 'eyeBlinkLeft', 'jawOpen'):
        print('   %-16s ref %.3f  nous %.3f' % (n, ref['bs'][n], bs[NAMES.index(n)]))

main()
