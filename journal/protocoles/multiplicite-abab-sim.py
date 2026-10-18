# Simulations du run « idées » du 18/10/2026 08:30 (journal/IDEES.md, I107–I111).
# Outil de recherche hors app, pas du code de HealthTrack. Usage : python3 multiplicite-abab-sim.py [reps]
#
# Partie A — combien de X tester sans noyer les vrais liens ?
#   40 facteurs X (dont un bloc « nutrition » de 12 variables corrélées entre elles à 0,6), 2 vrais liens r = 0,3,
#   tout en AR(1) 0,4. On compare les règles d'affichage d'un « sens chez vous » :
#     brut-BH20   : règle actuelle des pistes (p corrigé n_eff, Benjamini-Hochberg q < 0,2)
#     brut-BH05   : idem, q < 0,05 (« solide »)
#     I102-seul   : préblanchiment + a priori N(0 ; 0,2²) + P(sens) ≥ 97,5 %, variable par variable
#     I102-BH     : I102, puis BH sur les « p » a posteriori (1 − P(sens)) à 5 %
#     spike-slab  : a priori 90 % « aucun lien » + 10 % N(0 ; 0,3²), P(lien et bon sens) ≥ 0,9
#     I102-prim   : I102 seul, mais seulement sur 8 X « primaires » (ordre de la norme générale ; les 2 vrais y sont)
#   Mesures : part des tirages avec ≥ 1 faux sens affiché, faux sens moyens, puissance moyenne sur les 2 vrais liens.
#
# Partie B — auto-expérience ABAB : combien de jours pour trancher un lien « incertain » ?
#   Condition binaire tirée au sort par paires de blocs (A puis B ou B puis A), blocs de L jours, effet d (en écarts
#   types de Y), Y en AR(1) 0,4, 1er jour de chaque bloc à moitié d'effet (rémanence), observance 85 % (analyse en
#   intention de faire). Analyse : régression de Y sur la condition après préblanchiment (Cochrane-Orcutt),
#   deux règles : stricte (a priori N(0 ; 0,3²), sens si P ≥ 97,5 %) et « expérience » (N(0 ; 0,5²), P ≥ 95 % : un
#   seul test décidé d'avance, tiré au sort) ; « pas d'effet notable » si |m| + 1,64·s < 0,2.
import sys
import numpy as np
from math import erf, sqrt

rng = np.random.default_rng(7)
REPS = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
Phi = np.vectorize(lambda z: 0.5 * (1 + erf(z / sqrt(2))))


def ar1_matrix(n, k, phi):
    e = rng.standard_normal((n, k))
    x = np.empty((n, k))
    x[0] = e[0]
    for i in range(1, n):
        x[i] = phi * x[i - 1] + sqrt(1 - phi ** 2) * e[i]
    return x


def phi_hat(s):
    a, b = s[1:] - s[1:].mean(), s[:-1] - s[:-1].mean()
    return float(np.dot(a, b) / np.dot(b, b))


def prewhiten(s):
    return s[1:] - phi_hat(s) * s[:-1]


def bh(p):
    p = np.asarray(p)
    m = len(p)
    order = np.argsort(p)
    q = np.empty(m)
    prev = 1.0
    for rank in range(m, 0, -1):
        i = order[rank - 1]
        prev = min(prev, p[i] * m / rank)
        q[i] = prev
    return q


# ─── Partie A ────────────────────────────────────────────────────────────────
M, TRUE_IDX, R_TRUE, PHI = 40, [0, 1], 0.3, 0.4
NUTRI = list(range(20, 32))  # 12 variables corrélées (kcal, protéines, lipides…)
PRIMARY = list(range(8))


def draw_dataset(n):
    x = ar1_matrix(n, M, PHI)
    common = ar1_matrix(n, 1, PHI)[:, 0]
    for j in NUTRI:
        x[:, j] = sqrt(0.6) * common + sqrt(0.4) * x[:, j]
    noise = ar1_matrix(n, 1, PHI)[:, 0]
    signal = sum(x[:, j] for j in TRUE_IDX) * R_TRUE
    y = signal + sqrt(1 - len(TRUE_IDX) * R_TRUE ** 2) * noise
    return x, y


def corr_p_neff(x, y):
    """Corrélation brute, p bilatéral avec n effectif (Bartlett), comme analysisEngine."""
    n = len(y)
    r = np.corrcoef(x, y)[0, 1]
    rx, ry = phi_hat(x), phi_hat(y)
    neff = max(4.0, n * (1 - rx * ry) / (1 + rx * ry))
    z = r * sqrt(neff - 3)
    return r, 2 * (1 - float(Phi(abs(z))))


def i102(x, y, tau=0.2):
    xp, yp = prewhiten(x), prewhiten(y)
    b = np.corrcoef(xp, yp)[0, 1]
    se = 1 / sqrt(len(yp) - 3)
    v = 1 / (1 / tau ** 2 + 1 / se ** 2)
    m = v * b / se ** 2
    return b, se, m, sqrt(v), float(Phi(m / sqrt(v)))


def spike_slab(b, se, pi0=0.9, tau=0.3):
    """P(lien non nul et de signe s | b) pour un a priori π0·δ0 + (1 − π0)·N(0, τ²)."""
    def npdf(z, s):
        return np.exp(-0.5 * (z / s) ** 2) / s
    l0 = pi0 * npdf(b, se)
    l1 = (1 - pi0) * npdf(b, sqrt(se ** 2 + tau ** 2))
    p1 = l1 / (l0 + l1)
    v = 1 / (1 / tau ** 2 + 1 / se ** 2)
    m = v * b / se ** 2
    psign = float(Phi(m / sqrt(v)))
    return p1 * max(psign, 1 - psign), np.sign(m)


def part_a(n):
    rules = ['brut-BH20', 'brut-BH05', 'I102-seul', 'I102-BH', 'spike-slab', 'I102-prim']
    any_false = {r: 0 for r in rules}
    n_false = {r: 0.0 for r in rules}
    power = {r: 0.0 for r in rules}
    for _ in range(REPS):
        x, y = draw_dataset(n)
        raw = [corr_p_neff(x[:, j], y) for j in range(M)]
        post = [i102(x[:, j], y) for j in range(M)]
        q = bh([p for _, p in raw])
        qpost = bh([2 * (1 - max(ps, 1 - ps)) for *_, ps in post])
        shown = {r: [] for r in rules}  # (j, signe)
        for j in range(M):
            r, _ = raw[j]
            b, se, m, s, ps = post[j]
            if q[j] < 0.2:
                shown['brut-BH20'].append((j, np.sign(r)))
            if q[j] < 0.05:
                shown['brut-BH05'].append((j, np.sign(r)))
            if max(ps, 1 - ps) >= 0.975:
                shown['I102-seul'].append((j, np.sign(m)))
                if j in PRIMARY:
                    shown['I102-prim'].append((j, np.sign(m)))
            if qpost[j] < 0.05:
                shown['I102-BH'].append((j, np.sign(m)))
            pss, sg = spike_slab(b, se)
            if pss >= 0.9:
                shown['spike-slab'].append((j, sg))
        for rule in rules:
            wrong = [1 for j, sg in shown[rule] if j not in TRUE_IDX or sg < 0]
            hits = [1 for j, sg in shown[rule] if j in TRUE_IDX and sg > 0]
            any_false[rule] += 1 if wrong else 0
            n_false[rule] += len(wrong)
            power[rule] += len(hits) / len(TRUE_IDX)
    print(f'\nA — n = {n} jours, {M} X dont {len(TRUE_IDX)} vrais (r = {R_TRUE}), {REPS} tirages')
    print(f'{"règle":<11} {"≥1 faux":>8} {"faux moy.":>9} {"puissance":>9}')
    for rule in rules:
        print(f'{rule:<11} {any_false[rule] / REPS:>8.1%} {n_false[rule] / REPS:>9.2f} {power[rule] / REPS:>9.1%}')


# ─── Partie B ────────────────────────────────────────────────────────────────
def schedule(n, L):
    cond = []
    while len(cond) < n:
        pair = [1, 0] if rng.random() < 0.5 else [0, 1]
        for c in pair:
            cond += [c] * L
    return np.array(cond[:n], dtype=float)


def part_b_once(n, L, d, compliance=0.85, tau=0.3, thr=0.975):
    assigned = schedule(n, L)
    done = assigned * (rng.random(n) < compliance)
    first = np.r_[1.0, (assigned[1:] != assigned[:-1]).astype(float)]
    dose = done * np.where(first > 0, 0.5, 1.0)
    noise = ar1_matrix(n, 1, PHI)[:, 0]
    y = d * dose + noise
    # Cochrane-Orcutt : φ estimé sur les résidus d'une première régression, puis MCO sur séries quasi-différenciées
    X = np.c_[np.ones(n), assigned]
    beta = np.linalg.lstsq(X, y, rcond=None)[0]
    res = y - X @ beta
    ph = phi_hat(res)
    ys = y[1:] - ph * y[:-1]
    Xs = X[1:] - ph * X[:-1]
    beta, *_ = np.linalg.lstsq(Xs, ys, rcond=None)
    res = ys - Xs @ beta
    s2 = res @ res / (len(ys) - 2)
    cov = s2 * np.linalg.inv(Xs.T @ Xs)
    b, se = beta[1], sqrt(cov[1, 1])  # en unités de Y (écart type ≈ 1)
    v = 1 / (1 / tau ** 2 + 1 / se ** 2)
    m = v * b / se ** 2
    s = sqrt(v)
    p = float(Phi(m / s))
    if max(p, 1 - p) >= thr:
        return 'right' if d != 0 and np.sign(m) == np.sign(d) else 'wrong'
    if abs(m) + 1.64 * s < 0.2:
        return 'none'
    return 'unknown'


def part_b():
    days = [28, 56, 84, 112]
    for label, tau, thr in [('stricte (a priori 0,3 ; 97,5 %)', 0.3, 0.975), ('expérience (a priori 0,5 ; 95 %)', 0.5, 0.95)]:
        print(f'\nB — ABAB, règle {label}, observance 85 %, rémanence ½ le 1er jour, {REPS} tirages')
        print('L  d    ' + '  '.join(f'{n:>3} j bon/faux/aucun' for n in days))
        for L in [1, 3, 7]:
            for d in [0.0, 0.3, 0.5, 0.8]:
                cells = []
                for n in days:
                    c = {'right': 0, 'wrong': 0, 'none': 0, 'unknown': 0}
                    for _ in range(REPS):
                        c[part_b_once(n, L, d, tau=tau, thr=thr)] += 1
                    cells.append(f'{c["right"] / REPS:>4.0%}/{c["wrong"] / REPS:>4.1%}/{c["none"] / REPS:>3.0%}')
                print(f'{L}  {d:<3}  ' + '  '.join(f'{cell:>19}' for cell in cells))


if __name__ == '__main__':
    for n in [60, 120, 180]:
        part_a(n)
    part_b()
