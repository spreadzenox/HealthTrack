# Run 08/11 15:35 — Avant les premiers résultats (POLISH-SIM-5)

**Type** : code (polish, constat des personas POLISH-SIM-5).

## Contexte
- Main verte (Build & Release, Play — AAB, Tests, émulateur de #834) ; aucune PR « [Auto] » ouverte.
- Pas de nouvelle correction du propriétaire dans le prompt depuis le run précédent. Onboarding non touché (chantier accueil).

## Fait
- Analyses (Bien-être et Digestion) : « Vos premiers résultats arrivent dans N jours » → « Encore N jours notés avant vos
  premiers résultats » (le compte recule à chaque jour noté, pas avec le calendrier : 4 personas ne le comprenaient pas).
  La phrase exacte du propriétaire est inchangée.
- Aujourd'hui (DigestBlock) : « Encore N jours notés avant vos analyses digestives », même logique.
- Digestion : « Il faut aussi 4 jours de plus avec une gêne… » → « Il faut aussi 5 jours avec une gêne ou une douleur
  notée : vous en avez 1. » (`resultsView` expose `symptoms: { have, need }`). La persona se demandait si sa gêne comptait.
- Agir vide : « Quand vos analyses repèrent une piste, vous pourrez l'essayer ici quelques jours pour voir si elle compte
  pour vous. » et un lien « Où en sont vos analyses » (→ /recommendations). « Essai » n'apparaît plus sans explication.
- Tests : Recommendations, DigestBlock, Act mis à jour (TDD : rouges avant le code).
- Vérifs : suite complète, build, lint ; captures `--empty` Agir clair/sombre, Analyses › Digestion, Aujourd'hui, regardées
  (`journal/maquettes/agir-tendances/comparaison/agir-vide-*.png`, `analyses-digestion-attente-clair.png`).
- Nouveautés : `2026-11-08-1535-attente-analyses.json`.

## Suite
- POLISH-SIM-12 (PDF depuis Agir, période bornée aux jours d'usage), POLISH-SIM-2 (c) « Pas · hier ».
- Envoi Alpha de ce soir 23:45 (version des testeurs ; peut partir en retard chez GitHub).
