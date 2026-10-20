# Générateur des vecteurs de test du modèle valence / éveil (com.healthtrack.app.face.FaceAffect, consigne du 19/10
# au soir, étape 2). Outil de recherche hors app : à partir des 478 points déjà figés dans face-*.json (sortie du
# Face Landmarker), il recadre le visage comme le Java (carré aligné sur les yeux, côté = 1,1 × la boîte des points
# dans le repère des yeux, 224 × 224, bilinéaire, normalisation ImageNet, ordre C × H × W), exécute HSEmotion
# `enet_b0_8_va_mtl.onnx` (ONNX Runtime) et écrit face/affect-vectors.json : ROI, échantillons du tenseur d'entrée,
# 10 sorties brutes (8 émotions + valence + éveil). Le .onnx n'est jamais committé (téléchargé sur le téléphone).
# Second modèle (I126, duo) : HSEmotion `mbf_va_mtl.onnx` (MobileFaceNet), même recadrage mais 112 × 112 et
# normalisation (x − 0,5) / 0,5 comme dans EmotiEffLib (facial_analysis.py) → face/affect-vectors-mbf.json.
# Usage : python3 -I visage-va-vecteurs.py <chemin du .onnx> <dossier des ressources face/>
# (le nom du fichier choisit le modèle : « mbf_ » → MobileFaceNet, sinon EfficientNet-B0)
import json, math, sys
import numpy as np
from PIL import Image
import onnxruntime as ort

SIZE = 224
SCALE = 1.1
MEAN = np.array([0.485, 0.456, 0.406])
STD = np.array([0.229, 0.224, 0.225])


def bilinear(arr, X, Y):
    H, W, _ = arr.shape
    x0 = np.floor(X).astype(int); y0 = np.floor(Y).astype(int)
    fx = (X - x0)[..., None]; fy = (Y - y0)[..., None]

    def px(x, y):
        ok = (x >= 0) & (x < W) & (y >= 0) & (y < H)
        return arr[np.clip(y, 0, H - 1), np.clip(x, 0, W - 1)] * ok[..., None]
    return (px(x0, y0) * (1 - fx) * (1 - fy) + px(x0 + 1, y0) * fx * (1 - fy)
            + px(x0, y0 + 1) * (1 - fx) * fy + px(x0 + 1, y0 + 1) * fx * fy)


def affect_roi(pts):
    # Rotation de la ligne des yeux (points 33 → 263), boîte des 478 points dans ce repère, centre ramené à l'image.
    p0, p1 = pts[33], pts[263]
    rot = math.atan2(p1[1] - p0[1], p1[0] - p0[0])
    c, s = math.cos(rot), math.sin(rot)
    u = c * pts[:, 0] + s * pts[:, 1]
    v = -s * pts[:, 0] + c * pts[:, 1]
    mu, mv = (u.min() + u.max()) / 2, (v.min() + v.max()) / 2
    side = max(u.max() - u.min(), v.max() - v.min()) * SCALE
    return dict(cx=c * mu - s * mv, cy=s * mu + c * mv, side=side, rot=rot)


def affect_input(arr, r):
    SIZE, MEAN, STD = SPEC['size'], SPEC['mean'], SPEC['std']
    j, i = np.mgrid[0:SIZE, 0:SIZE].astype(np.float64)
    u = ((i + 0.5) / SIZE - 0.5) * r['side']
    v = ((j + 0.5) / SIZE - 0.5) * r['side']
    c, s = math.cos(r['rot']), math.sin(r['rot'])
    rgb = bilinear(arr, r['cx'] + c * u - s * v - 0.5, r['cy'] + s * u + c * v - 0.5) / 255.0
    return ((rgb - MEAN) / STD).transpose(2, 0, 1).astype(np.float32)


SPEC = dict(size=SIZE, mean=MEAN, std=STD, name='enet_b0_8_va_mtl', out='affect-vectors.json')
MBF = dict(size=112, mean=np.array([0.5, 0.5, 0.5]), std=np.array([0.5, 0.5, 0.5]), name='mbf_va_mtl',
           out='affect-vectors-mbf.json')


def main(model, res):
    if 'mbf_' in model:
        SPEC.update(MBF)
    session = ort.InferenceSession(model, providers=['CPUExecutionProvider'])
    size = SPEC['size']
    out = {'model': SPEC['name'], 'size': size, 'scale': SCALE, 'images': {}}
    rng = np.random.default_rng(11)
    idx = sorted(int(k) for k in rng.choice(3 * size * size, 64, replace=False))
    for name in ('face-frontal', 'face-tilted'):
        d = json.load(open(f'{res}/{name}.json'))
        arr = np.asarray(Image.open(f"{res}/{d['image']}").convert('RGB')).astype(np.float64)
        pts = np.array(d['landmarks']['points'], dtype=np.float64).reshape(478, 3)
        r = affect_roi(pts)
        x = affect_input(arr, r)
        raw = session.run(None, {'input': x[None]})[0][0]
        flat = x.reshape(-1)
        out['images'][name] = {
            'roi': r,
            'input_samples': [[k, float(flat[k])] for k in idx],
            'input_mean': float(flat.mean()),
            'output': [float(v) for v in raw],
            'valence': float(raw[8]),
            'arousal': float(raw[9]),
        }
        print(name, 'valence %.3f éveil %.3f' % (raw[8], raw[9]))
    with open(f"{res}/{SPEC['out']}", 'w') as f:
        json.dump(out, f, indent=1)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
