# Simulation du run « idées » du 19/10/2026 08:30 (journal/IDEES.md, I118).
# Outil de recherche hors app, pas du code de HealthTrack. Usage : python3 rafales-par-jour-sim.py [tirages]
#
# Question : la porte I112 (note du soir, |z| ≥ 3,29 à deux regards hebdomadaires consécutifs) a été simulée avec
# ≈ 32 rafales valides par jour. Les études donnent 30 à 110 déverrouillages par jour, et une partie des rafales est
# écartée (visage absent, trop sombre). Que devient le délai d'ouverture avec 4, 8, 16 ou 32 rafales valides par jour ?
# Réutilise le modèle de humeur-etiquettes-sim.py (mêmes fonctions), seul le nombre moyen de rafales change.
import importlib.util
import pathlib
import sys

import numpy as np

REPS = int(sys.argv[1]) if len(sys.argv) > 1 else 300
sys.argv = sys.argv[:1]
spec = importlib.util.spec_from_file_location('etiq', pathlib.Path(__file__).with_name('humeur-etiquettes-sim.py'))
etiq = importlib.util.module_from_spec(spec)
spec.loader.exec_module(etiq)
etiq.rng = np.random.default_rng(19)
rng = etiq.rng
DAYS, SLOTS, Z = etiq.DAYS, etiq.SLOTS, 3.29
REPORT = [42, 60, 90, 120]


def one_run(r_b, per_day):
    m, u = etiq.simulate_day_mood()
    beta = etiq.beta_for(r_b) * rng.choice([-1, 1])
    counts = rng.poisson(per_day / SLOTS, (DAYS, SLOTS))
    day_nuis = 0.3 * rng.standard_normal(DAYS)
    fsum = beta * u * counts + day_nuis[:, None] * counts + np.sqrt(counts) * rng.standard_normal((DAYS, SLOTS))
    answered = rng.random(DAYS) < 0.85
    fday = fsum.sum(1) / np.maximum(counts.sum(1), 1)
    nd = np.clip(np.round(3 + 0.9 * (u.mean(1) + 0.4 * rng.standard_normal(DAYS))), 1, 5)
    idx = np.where(answered & (counts.sum(1) > 0))[0]
    quality = abs(np.corrcoef(fday, m)[0, 1])
    opened, prev = np.inf, False
    for day in etiq.CHECKS:
        _, z = etiq.jackknife_z(idx, fday[idx], nd[idx], day)
        now = abs(z) >= Z
        if now and prev:
            opened = day
            break
        prev = now
    return opened, quality


print(f'{REPS} tirages par case ; note du soir 85 % ; porte |z| ≥ {Z} à deux regards consécutifs')
for r_b in [0.0, 0.2, 0.3]:
    print(f'\nr_b = {r_b:.1f}')
    print('  rafales/jour  ' + '  '.join(f'J{d:>3}' for d in REPORT) + '   qualité |corr(indice du jour, humeur)|')
    for per_day in [4, 8, 16, 32]:
        res = [one_run(r_b, per_day) for _ in range(REPS)]
        op = np.array([o for o, _ in res])
        q = np.median([qq for _, qq in res])
        cells = '  '.join(f'{np.mean(op <= d) * 100:4.0f}' for d in REPORT)
        print(f'  {per_day:>12}  {cells}  %   {q:.2f}')
