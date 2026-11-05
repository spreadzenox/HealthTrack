# 05/11 05:35 — Historique du bien-être : remonter le temps (BE-HISTO-DETAIL-2)

Type : 🎨 run de code (05:35 Paris). Priorité : retours du 04/11, point (6), fin.

## Constat au démarrage
- Aucune PR « [Auto] » ouverte, main vert. Bilan du merge de #708 (run de 04:35) : release **v503** publiée
  (APK 34 543 030 octets) ; « Play — AAB » et « Play — Alpha (livraison continue) » de `ac76ae8` réussis (un passage
  annulé puis relancé, normal avec la file d'attente du workflow) ; émulateur Galaxy A56 vert.

## Fait
- `wellbeingHistory.js` : `viewEnd(period, now, offset)` (fin du dernier jour de la période `offset` crans plus tôt,
  1, 7 ou 30 jours, sans chevauchement) ; le résultat porte `earliest` (première lecture ou note connue).
- `WellbeingHistory.jsx` : rangée de navigation au-dessus de la carte : flèche « Semaine précédente », titre (« Ces
  7 jours », « du 23 au 29 octobre », « vendredi 23 octobre », « du 26 août au 24 septembre », année ajoutée si ce
  n'est pas l'année en cours, « 1er » écrit à la française), flèche « Semaine suivante » grisée au présent. Balayage
  horizontal de la carte (≥ 60 px, nettement plus horizontal que vertical ; `touch-action: pan-y`) : vers la droite
  recule, vers la gauche revient. Arrêt quand la période commence avant la première lecture. Changer de période revient
  au présent et referme le détail. Les phrases (« Aucune lecture du … », « Moyennes du … », nom accessible de la courbe)
  suivent la période affichée. Le toucher d'un point (BE-HISTO-DETAIL-1) marche aussi sur les périodes passées.

## Vérifications
- TDD : 2 tests service + 3 tests page rouges puis verts ; `npm run test` vert (3068 + 5) ; lint 0 erreur ; build OK.
- Captures relues : semaine précédente en clair et en sombre (« du 23 au 29 octobre », flèches menthe), données
  vides (flèches grisées, « Ces 7 jours », état vide inchangé). `npm run visual` complet : voir la PR.
- Rien de collecté en plus, rien d'envoyé ; règle 5 inchangée (entrées Y seulement). Lecture IndexedDB inchangée
  (toutes les rafales étaient déjà lues).

## Suite
- BE-BIAIS (retour (5)) : mesurer le biais du visage neutre lu triste ou méprisant, recalage personnel, calibration de
  départ. Puis ANALYSES-ONGLETS-3 (trois horizons).
