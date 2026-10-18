# Simulation du run « idées » du 18/10/2026 20:30 (journal/IDEES.md, I112–I116).
# Outil de recherche hors app, pas du code de HealthTrack. Usage : python3 humeur-etiquettes-sim.py [reps]
#
# Question : la porte d'entrée I110 n'active un signal du visage que s'il suit, chez l'utilisateur, ce qu'il déclare.
# Combien de jours faut-il pour que la porte s'ouvre (si le signal est réel) sans s'ouvrir par hasard (s'il ne l'est
# pas) ? Et vaut-il mieux une note le soir, ou 1 à 3 micro-notes d'un geste au déverrouillage, appariées aux rafales
# des 30–60 min précédentes ?
#
# Modèle (journée de 16 h en 32 créneaux de 30 min) :
#   humeur du jour m_d : AR(1) 0,4, écart type 1 ;
#   humeur du moment u = m_d + écart intra-jour (AR(1) 0,8 d'un créneau à l'autre, écart type 0,8) ;
#   rafales valides : Poisson(1) par créneau (≈ 32 / jour, après rejets) ;
#   indice du visage d'une rafale f = β·u + nuisance du jour (lumière, lunettes ; é.t. 0,3) + bruit (é.t. 1), β réglé
#   pour une corrélation rafale ↔ humeur du moment r_b (0 = signal inutile ; 0,1 ; 0,2 ; 0,3) ;
#   le sens de β est tiré au hasard (D6 : aucun sens présupposé, la porte teste les deux).
# Étiquettes :
#   soir     : une note 1–5 le soir (réponse 85 %), souvenir de la journée (moyenne de u + bruit 0,4), appariée à la
#              moyenne des rafales du jour ;
#   deverr-1 : 1 micro-note 1–5 au déverrouillage (réponse 75 %), humeur du moment + bruit 0,3, appariée aux rafales
#              du créneau et du précédent ;
#   deverr-3 : 3 micro-notes par jour (même règle) ;
#   mixte    : soir + deverr-1, tests combinés (la porte s'ouvre si l'un des deux passe à α/2).
# Porte : corrélation, erreur type par jackknife sur les jours (robuste à l'appariement de plusieurs notes par jour),
# |z| ≥ 2,81 (α ≈ 0,005 bilatéral, regardée chaque semaine), au moins 14 jours notés. Regard hebdomadaire de J14 à J120.
# Arguments : [tirages] [seuil z] [taux de réponse du soir].
# Variante soir×2 : deux regards hebdomadaires consécutifs au-dessus du seuil (contre l'optimisme du jackknife).
# Partie B (composition_bias) : voir sa docstring.
# Mesures : part des tirages où la porte est ouverte à J28 / J42 / J60 / J90 / J120 ; faux départs (r_b = 0) cumulés ;
# qualité de l'estimation une fois ouverte = corrélation entre l'indice moyen et la vraie humeur (du jour ou du moment).
import sys
import numpy as np

rng = np.random.default_rng(18)
REPS = int(sys.argv[1]) if len(sys.argv) > 1 else 400
DAYS, SLOTS = 120, 32
CHECKS = list(range(14, DAYS + 1, 7))
REPORT = [28, 42, 60, 90, 120]
Z_GATE = float(sys.argv[2]) if len(sys.argv) > 2 else 2.81
EVENING_RESPONSE = float(sys.argv[3]) if len(sys.argv) > 3 else 0.85


def simulate_day_mood():
    m = np.empty(DAYS)
    m[0] = rng.standard_normal()
    for d in range(1, DAYS):
        m[d] = 0.4 * m[d - 1] + np.sqrt(1 - 0.16) * rng.standard_normal()
    w = np.empty((DAYS, SLOTS))
    w[:, 0] = 0.8 * rng.standard_normal(DAYS)
    for s in range(1, SLOTS):
        w[:, s] = 0.8 * w[:, s - 1] + 0.8 * np.sqrt(1 - 0.64) * rng.standard_normal(DAYS)
    return m, m[:, None] + w


def beta_for(r_b):
    var_u = 1 + 0.64
    noise = 0.09 + 1.0
    if r_b == 0:
        return 0.0
    return r_b * np.sqrt(noise) / np.sqrt(var_u * (1 - r_b ** 2))


def jackknife_z(day_idx, x, y, n_days):
    """Corrélation x ↔ y et z = r / se, se par jackknife « un jour en moins » (statistiques suffisantes par jour)."""
    keep = day_idx < n_days
    d, x, y = day_idx[keep], x[keep], y[keep]
    days = np.unique(d)
    if len(days) < 14:
        return 0.0, 0.0
    S = np.zeros((5, n_days))
    for k, v in enumerate([np.ones_like(x), x, y, x * x, x * y]):
        np.add.at(S[k], d, v)
    yy = np.zeros(n_days)
    np.add.at(yy, d, y * y)
    tot = np.array([S[0].sum(), S[1].sum(), S[2].sum(), S[3].sum(), S[4].sum(), yy.sum()])

    def corr(n, sx, sy, sxx, sxy, syy):
        cov = sxy - sx * sy / n
        vx, vy = sxx - sx * sx / n, syy - sy * sy / n
        return cov / np.sqrt(np.maximum(vx * vy, 1e-12))

    r = corr(*tot[[0, 1, 2, 3, 4]], tot[5])
    sub = [tot[k] - S[k][days] for k in range(5)] + [tot[5] - yy[days]]
    r_loo = corr(*sub)
    g = len(days)
    se = np.sqrt((g - 1) / g * np.sum((r_loo - r_loo.mean()) ** 2))
    return r, (r / se if se > 0 else 0.0)


def one_run(r_b):
    m, u = simulate_day_mood()
    beta = beta_for(r_b) * rng.choice([-1, 1])
    counts = rng.poisson(1.0, (DAYS, SLOTS))
    day_nuis = 0.3 * rng.standard_normal(DAYS)
    # somme des indices des rafales par créneau (on garde sommes et comptes : moyennes exactes par fenêtre)
    fsum = beta * u * counts + day_nuis[:, None] * counts + np.sqrt(counts) * rng.standard_normal((DAYS, SLOTS))

    def note(v, noise):
        return np.clip(np.round(3 + 0.9 * (v + noise * rng.standard_normal(np.shape(v)))), 1, 5)

    out = {}
    # soir
    answered = rng.random(DAYS) < EVENING_RESPONSE
    fday = fsum.sum(1) / np.maximum(counts.sum(1), 1)
    nd = note(u.mean(1), 0.4)
    idx = np.where(answered & (counts.sum(1) > 0))[0]
    out['soir'] = (idx, fday[idx], nd[idx], np.corrcoef(fday, m)[0, 1])

    def momentary(k):
        di, fx, ly, truth_f, truth_u = [], [], [], [], []
        for d in range(DAYS):
            for s in rng.choice(np.arange(4, SLOTS), size=k, replace=False):
                c = counts[d, s] + counts[d, s - 1]
                if c == 0:
                    continue
                f = (fsum[d, s] + fsum[d, s - 1]) / c
                truth_f.append(f)
                truth_u.append(u[d, s])
                if rng.random() < 0.75:
                    di.append(d)
                    fx.append(f)
                    ly.append(note(u[d, s], 0.3))
        q = np.corrcoef(truth_f, truth_u)[0, 1]
        return np.array(di), np.array(fx), np.array(ly, dtype=float), q

    out['deverr-1'] = momentary(1)
    out['deverr-3'] = momentary(3)
    return out


def main():
    schemes = ['soir', 'deverr-1', 'deverr-3', 'mixte']
    print(f'{REPS} tirages par case ; porte |z| ≥ {Z_GATE}, regard hebdomadaire J14 → J{DAYS}')
    for r_b in [0.0, 0.1, 0.2, 0.3]:
        opened = {s: np.full(REPS, np.inf) for s in schemes + ['soir×2']}
        r_at_open = {s: [] for s in schemes}
        quality = {s: [] for s in ['soir', 'deverr-1', 'deverr-3']}
        for rep in range(REPS):
            o = one_run(r_b)
            for s in ['soir', 'deverr-1', 'deverr-3']:
                quality[s].append(abs(o[s][3]))
            prev_soir = False
            for day in CHECKS:
                zs = {}
                for s in ['soir', 'deverr-1', 'deverr-3']:
                    r, z = jackknife_z(o[s][0], o[s][1], o[s][2], day)
                    zs[s] = (r, z)
                    if abs(z) >= Z_GATE and opened[s][rep] == np.inf:
                        opened[s][rep] = day
                        r_at_open[s].append(abs(r))
                # soir×2 : la porte ne s'ouvre qu'après deux regards hebdomadaires consécutifs au-dessus du seuil
                now_soir = abs(zs['soir'][1]) >= Z_GATE
                if now_soir and prev_soir and opened['soir×2'][rep] == np.inf:
                    opened['soir×2'][rep] = day
                prev_soir = now_soir
                # mixte : soir + 1 micro-note, chaque test à α/2 (seuil bilatéral ≈ 3,02)
                if opened['mixte'][rep] == np.inf and (abs(zs['soir'][1]) >= 3.02 or abs(zs['deverr-1'][1]) >= 3.02):
                    opened['mixte'][rep] = day
        print(f'\nr_b = {r_b:.1f} (corrélation d\'une rafale avec l\'humeur du moment)')
        print('  schéma     ' + '  '.join(f'J{d:>3}' for d in REPORT) + '   |r| à l\'ouverture   qualité |corr(indice, vraie humeur)|')
        for s in schemes + ['soir×2']:
            cells = '  '.join(f'{np.mean(opened[s] <= d) * 100:4.0f}' for d in REPORT)
            ro = f'{np.median(r_at_open[s]):.2f}' if r_at_open.get(s) else '  — '
            qu = f'{np.median(quality[s]):.2f}' if s in quality else '  — '
            print(f'  {s:<9} {cells}  %      {ro:>6}               {qu}')


def composition_bias(reps=2000):
    """Partie B — biais de composition : des rafales prises pendant l'usage (contenu qui fait sourire) font-elles
    croire que les réseaux sociaux changent l'humeur ? Humeur du jour indépendante de la part de rafales prises sur
    les réseaux sociaux (≈ 40 % ± 15 % selon les jours) ; ces rafales ont un indice décalé de δ (rire devant une
    vidéo), sans rapport avec l'humeur. r_b = 0,2 ; 32 rafales / jour ; 120 jours."""
    beta = beta_for(0.2)
    print('\nPartie B — biais de composition (aucun vrai lien réseaux sociaux → humeur)')
    for delta in [0.0, 0.25, 0.5]:
        rs, ry = [], []
        for _ in range(reps):
            m = rng.standard_normal(DAYS)
            share = np.clip(rng.normal(0.4, 0.15, DAYS), 0.05, 0.95)
            social = rng.random((DAYS, 32)) < share[:, None]
            u = m[:, None] + 0.8 * rng.standard_normal((DAYS, 32))
            f = beta * u + delta * social + 0.3 * rng.standard_normal(DAYS)[:, None] + rng.standard_normal((DAYS, 32))
            fd = f.mean(1)
            rs.append(np.corrcoef(fd, share)[0, 1])
            ry.append(np.corrcoef(fd, m)[0, 1])
        print(f'  δ = {delta:.2f} : corr(indice du jour, part réseaux sociaux) = {np.mean(rs):.3f}'
              f' ; corr(indice, vraie humeur) = {np.mean(ry):.3f}')


if __name__ == '__main__':
    main()
    composition_bias()
