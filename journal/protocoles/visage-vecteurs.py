# Générateur des vecteurs de test du pipeline visage Java (com.healthtrack.app.face, I100 ①).
# Outil de recherche hors app : il exécute les 3 modèles du Face Landmarker avec LiteRT (Python), applique le
# post-traitement décrit dans journal/protocoles/visage.md, se compare à MediaPipe Tasks (référence), puis écrit
# pour chaque image un JSON : sorties brutes des modèles (ce que LiteRT renverra au Java) + résultats attendus
# (détection, ROI, échantillons des tenseurs d'entrée, 478 points, 146 points, indices).
# Usage (dossier de travail hors dépôt, mêmes prérequis que visage-reference.py, + mediapipe pour la référence) :
#   venv/bin/python -I mpref.py face-frontal face-tilted      → img/<nom>.mp.json (MediaPipe Tasks 1.1.1)
#   venv/bin/python -I visage-vecteurs.py <dossier de sortie> face-frontal face-tilted
# Les .tflite ne sont jamais committés ; les images de test sont du domaine public (voir README des ressources).
import json, math, sys
import numpy as np
from PIL import Image
from ai_edge_litert.interpreter import Interpreter

M = 'dl/x/'
SUBSET = [0, 1, 4, 5, 6, 7, 8, 10, 13, 14, 17, 21, 33, 37, 39, 40, 46, 52, 53, 54, 55, 58, 61, 63, 65, 66, 67, 70, 78,
          80, 81, 82, 84, 87, 88, 91, 93, 95, 103, 105, 107, 109, 127, 132, 133, 136, 144, 145, 146, 148, 149, 150, 152,
          153, 154, 155, 157, 158, 159, 160, 161, 162, 163, 168, 172, 173, 176, 178, 181, 185, 191, 195, 197, 234, 246,
          249, 251, 263, 267, 269, 270, 276, 282, 283, 284, 285, 288, 291, 293, 295, 296, 297, 300, 308, 310, 311, 312,
          314, 317, 318, 321, 323, 324, 332, 334, 336, 338, 356, 361, 362, 365, 373, 374, 375, 377, 378, 379, 380, 381,
          382, 384, 385, 386, 387, 388, 389, 390, 397, 398, 400, 402, 405, 409, 415, 454, 466, 468, 469, 470, 471, 472,
          473, 474, 475, 476, 477]
NAMES = ["_neutral", "browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft", "browOuterUpRight", "cheekPuff",
         "cheekSquintLeft", "cheekSquintRight", "eyeBlinkLeft", "eyeBlinkRight", "eyeLookDownLeft", "eyeLookDownRight",
         "eyeLookInLeft", "eyeLookInRight", "eyeLookOutLeft", "eyeLookOutRight", "eyeLookUpLeft", "eyeLookUpRight",
         "eyeSquintLeft", "eyeSquintRight", "eyeWideLeft", "eyeWideRight", "jawForward", "jawLeft", "jawOpen",
         "jawRight", "mouthClose", "mouthDimpleLeft", "mouthDimpleRight", "mouthFrownLeft", "mouthFrownRight",
         "mouthFunnel", "mouthLeft", "mouthLowerDownLeft", "mouthLowerDownRight", "mouthPressLeft", "mouthPressRight",
         "mouthPucker", "mouthRight", "mouthRollLower", "mouthRollUpper", "mouthShrugLower", "mouthShrugUpper",
         "mouthSmileLeft", "mouthSmileRight", "mouthStretchLeft", "mouthStretchRight", "mouthUpperUpLeft",
         "mouthUpperUpRight", "noseSneerLeft", "noseSneerRight"]
# Convention du recadrage (§3.2 de visage.md, précisée par ce script) : le pixel de sortie (i, j) d'un recadrage
# size × size lit l'image (bilinéaire, centres des pixels aux entiers, extérieur noir) au point
#   P = centre + R(rot) · ((i + 0,5) / size − 0,5) × côté, …) − 0,5   (centres de pixels → indices)
HALF = 0.5


def interp(name):
    it = Interpreter(model_path=M + name + '.tflite', num_threads=1)
    it.allocate_tensors()
    return it


def run(it, x):
    it.set_tensor(it.get_input_details()[0]['index'], x.astype(np.float32))
    it.invoke()
    return [it.get_tensor(o['index']) for o in it.get_output_details()]


def bilinear(arr, X, Y):
    H, W, _ = arr.shape
    x0 = np.floor(X).astype(int); y0 = np.floor(Y).astype(int)
    fx = (X - x0)[..., None]; fy = (Y - y0)[..., None]

    def px(x, y):
        ok = (x >= 0) & (x < W) & (y >= 0) & (y < H)
        return arr[np.clip(y, 0, H - 1), np.clip(x, 0, W - 1)] * ok[..., None]
    return (px(x0, y0) * (1 - fx) * (1 - fy) + px(x0 + 1, y0) * fx * (1 - fy)
            + px(x0, y0 + 1) * (1 - fx) * fy + px(x0 + 1, y0 + 1) * fx * fy)


def crop(arr, cx, cy, side, rot, size, lo, hi):
    j, i = np.mgrid[0:size, 0:size].astype(np.float64)
    u = ((i + HALF) / size - 0.5) * side
    v = ((j + HALF) / size - 0.5) * side
    c, s = math.cos(rot), math.sin(rot)
    X = cx + c * u - s * v - 0.5
    Y = cy + s * u + c * v - 0.5
    return (bilinear(arr, X, Y) * (hi - lo) + lo).astype(np.float32)


def anchors():
    out = []
    for fm, n in ((16, 2), (8, 6)):
        for y in range(fm):
            for x in range(fm):
                for _ in range(n):
                    out.append(((x + 0.5) / fm, (y + 0.5) / fm))
    return np.array(out, dtype=np.float64)


def decode(reg, logits, W, H):
    A = anchors()
    score = 1 / (1 + np.exp(-np.clip(logits.astype(np.float64), -100, 100)))
    boxes = []
    for j in range(896):
        q = reg[j].astype(np.float64) / 128.0
        ax, ay = A[j]
        boxes.append([q[0] + ax, q[1] + ay, q[2], q[3]] + [q[4 + k] + (ax if k % 2 == 0 else ay) for k in range(12)])
    boxes = np.array(boxes)

    def iou(p, q):
        ix = max(0.0, min(p[0] + p[2] / 2, q[0] + q[2] / 2) - max(p[0] - p[2] / 2, q[0] - q[2] / 2))
        iy = max(0.0, min(p[1] + p[3] / 2, q[1] + q[3] / 2) - max(p[1] - p[3] / 2, q[1] - q[3] / 2))
        inter = ix * iy
        union = p[2] * p[3] + q[2] * q[3] - inter
        return inter / union if union > 0 else 0.0
    remaining = sorted([j for j in range(896) if score[j] >= 0.5], key=lambda j: -score[j])
    faces = []
    while remaining:
        top = remaining[0]
        cluster = [j for j in remaining if iou(boxes[top], boxes[j]) > 0.3]
        remaining = [j for j in remaining if j not in cluster]
        w = sum(score[j] for j in cluster)
        avg = sum(boxes[j] * score[j] for j in cluster) / w
        faces.append((score[top], len(cluster), avg))
    if not faces:
        return None
    sc, n, avg = max(faces, key=lambda f: f[2][2] * f[2][3])
    side = max(W, H)
    ox, oy = (side - W) / 2, (side - H) / 2
    kps = [(avg[4 + 2 * k] * side - ox, avg[5 + 2 * k] * side - oy) for k in range(6)]
    return dict(score=sc, n=n, cx=avg[0] * side - ox, cy=avg[1] * side - oy, w=avg[2] * side, h=avg[3] * side,
                kps=kps, faces=len(faces))


def roi(cx, cy, w, h, p0, p1):
    rot = -math.atan2(-(p1[1] - p0[1]), p1[0] - p0[0])
    rot = (rot + math.pi) % (2 * math.pi) - math.pi
    return dict(cx=cx, cy=cy, side=max(w, h) * 1.5, rot=rot)


def to_image(raw, r):
    pts = raw.reshape(478, 3).astype(np.float64) / 256.0
    c, s = math.cos(r['rot']), math.sin(r['rot'])
    out = []
    for u, v, z in pts:
        dx, dy = (u - 0.5) * r['side'], (v - 0.5) * r['side']
        out.append((r['cx'] + c * dx - s * dy, r['cy'] + s * dx + c * dy, z * r['side']))
    return np.array(out)


def roi_from_points(pts):
    xs, ys = pts[:, 0], pts[:, 1]
    return roi((xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2, xs.max() - xs.min(), ys.max() - ys.min(),
               pts[33], pts[263])


def samples(t, n=48, seed=7):
    rng = np.random.default_rng(seed)
    size = t.shape[0]
    out = []
    for _ in range(n):
        y, x, ch = int(rng.integers(size)), int(rng.integers(size)), int(rng.integers(3))
        out.append([y, x, ch, round(float(t[y, x, ch]), 6)])
    return out


def r6(a):
    return [round(float(v), 6) for v in np.ravel(a)]


def main():
    out_dir, names = sys.argv[1], sys.argv[2:]
    det, lmk, bsm = interp('face_detector'), interp('face_landmarks_detector'), interp('face_blendshapes')
    for name in names:
        img = Image.open('img/%s.png' % name).convert('RGB')
        W, H = img.size
        arr = np.asarray(img, dtype=np.float64) / 255.0
        side = max(W, H)
        x_det = crop(arr, W / 2, H / 2, side, 0.0, 128, -1.0, 1.0)
        reg, cls = run(det, x_det[None])
        reg, cls = reg[0], cls[0, :, 0]
        d = decode(reg, cls, W, H)
        r1 = roi(d['cx'], d['cy'], d['w'], d['h'], d['kps'][0], d['kps'][1])
        x_lmk = crop(arr, r1['cx'], r1['cy'], r1['side'], r1['rot'], 256, 0.0, 1.0)
        lo = run(lmk, x_lmk[None])
        raw_pts, pres_logit = lo[0].ravel(), float(lo[1].ravel()[0])
        pts = to_image(raw_pts, r1)
        sub = pts[SUBSET, :2]
        bs = run(bsm, sub[None].astype(np.float32))[0].ravel()
        r2 = roi_from_points(pts)
        # comparaison à MediaPipe Tasks
        ref = json.load(open('img/%s.mp.json' % name))
        R = np.array(ref['lm'])[:, :2] * [W, H]
        err = np.abs(pts[:, :2] - R).max(axis=1)
        dbs = [abs(float(bs[i]) - ref['bs'][n]) for i, n in enumerate(NAMES)]
        print('%s : score %.3f (%d boîtes), présence %.3f ; points vs MediaPipe médiane %.2f px max %.2f ; '
              'blendshapes moyen %.4f max %.4f ; sourire %.3f (MP %.3f)' % (
                  name, d['score'], d['n'], 1 / (1 + math.exp(-pres_logit)), np.median(err), err.max(),
                  np.mean(dbs), max(dbs), (bs[44] + bs[45]) / 2, (ref['bs']['mouthSmileLeft'] + ref['bs']['mouthSmileRight']) / 2))
        sparse = [[j, round(float(cls[j]), 5)] + r6(reg[j]) for j in range(896) if cls[j] > -8]
        fx = dict(
            image=name + '.png', width=W, height=H,
            detector=dict(sparse=sparse, input_samples=samples(x_det)),
            detection=dict(score=d['score'], boxes=d['n'], faces=d['faces'], cx=d['cx'], cy=d['cy'], w=d['w'],
                           h=d['h'], keypoints=r6(d['kps'])),
            roi=r1,
            landmarks=dict(raw=r6(raw_pts), presence_logit=pres_logit, input_samples=samples(x_lmk),
                           points=r6(pts)),
            subset=r6(sub),
            blendshapes=r6(bs),
            next_roi=r2,
            mediapipe=dict(blendshapes_mean_abs_diff=float(np.mean(dbs)), landmarks_median_px=float(np.median(err))),
        )
        json.dump(fx, open('%s/%s.json' % (out_dir, name), 'w'), separators=(',', ':'))


main()
