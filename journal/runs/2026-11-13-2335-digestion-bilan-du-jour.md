# Run 13/11 23:35 — Digestion : le bilan du jour visible (POLISH-SIM-68) ; PR iPhone #953 finie

**Type** : code (mode polish, bug) et suivi iPhone  ·  **Android** : v1032 sur main après ce run  ·
**TestFlight** : **1030.1031** (version 893) envoyée le 13/11 à 23:49 par le merge de #953, envoi accepté par Apple,
traitement en cours ; 1024.1028 envoyée le 13/11 à 21:34 ; 1024.523 (ancien dépôt) chez les testeurs externes ; 844.344 intacte  ·
**Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme.
- Main 174f589 vert (Tests, Build & Release, Play — AAB, émulateur A56). PR #953 du run précédent ouverte, session
  précédente arrêtée, « iOS — build simulateur » encore en cours : priorité (b), la finir. #51 (`cursor/*`) non touchée.
- L'envoi Alpha du soir (cron de 23:45) n'était pas encore parti à 23:45 (il part souvent avec 3 h de retard).

## Fait
1. **PR #953 finie et mergée** (3d749af) : 16 checks verts, dont « Build iOS (simulateur) et captures » (57 min).
   Captures `captures/pr-953` regardées (iPhone 16e, clair : Sources, Journal, Aujourd'hui) : rien de changé, aucun
   texte propre à Android ; `achat-essai.txt` : TEST SUCCEEDED. Le merge a lancé « iOS — TestFlight » : « Version 893, build 1030.1031 », archive et envoi réussis
   (« Upload succeeded », 23:49).
2. **POLISH-SIM-68** (persona Ventre sans technique, J45) : après « Bilan de la journée : Gêne », rien ne le montrait
   sur Aujourd'hui, et la fenêtre « Ma digestion » disait encore « Dernière note : Douleur, hier ».
   - `DigestBlock.jsx` : une ligne « Bilan du jour : Gêne » au-dessus de « Noter ma digestion » quand le bilan du
     jour existe (`gutEveningCheck`, la même source que la fenêtre). Le bilan n'a pas d'heure : il ne va pas dans le
     graphique des moments.
   - `TodayCards.jsx` (`GutCard`) : une fois le bilan du jour fait, la note d'un autre jour n'est plus affichée comme
     « Dernière note » ; une note d'un moment précis du jour le reste.
   - Nouveautés : `2026-11-13-2335-digestion-bilan-du-jour.json` (code partagé : vaut pour Android et l'iPhone).

## Vérifs
- Tests écrits d'abord (rouges, puis verts) : `DigestBlock.test.jsx` (+1), `TodayCards.test.jsx` (+1).
  `npm run test` (3507 verts, 44 ignorés), `npm run lint` (0 erreur), `npm run build`, `npm run visual` complet (18
  pages) sans erreur.
- Parcours de la persona sur les données de démo, variante play, le soir (« Noter ma digestion », « Gêne » pour la
  journée, fermer) : [fenêtre](captures/2026-11-13-2335-bilan-du-jour-fenetre.png),
  Aujourd'hui en [clair](captures/2026-11-13-2335-bilan-du-jour-accueil-clair.png) et en
  [sombre](captures/2026-11-13-2335-bilan-du-jour-accueil-sombre.png).

## Limites
- Dans la fenêtre, après le bilan, la rangée Calme / Gêne / Douleur (note d'un moment) reste sans titre et sans
  bouton marqué : c'est exact (aucun moment noté), mais une persona peut encore s'y tromper. Non changé à ce run.
- Sur iPhone, ce correctif arrivera quand `iphone/upstream.json` avancera (prochain run) : pas de capture iPhone.
- `iphone/journal/README.md` : § 3, § 4, § 7 et § 8 lus ; PARITE.md, les deux BACKLOG, PRODUIT.md et la charte lus
  par sections, pas en entier (plus de 1 Mo).
- Soumission bêta de la nuit non lancée : l'Alpha du soir n'était pas partie et la build TestFlight de la v1030
  venait d'être envoyée. À faire au premier run où elle est traitée.

## Suite
- Nuit : après l'envoi Alpha, `ios-store-beta-submit.yml` sur main pour la build 1030.1031 dès
  qu'Apple l'a traitée, puis `ios-store-beta-expire.yml` (nettoyage) et `ios-store-push.yml` ; le dire en tête du
  résumé, ou dire qu'aucune build de ce dépôt n'est traitée.
- Suivi iPhone : `scripts/upstream.sh --latest` (v1032, ce correctif), puis FUSION-2.
- POLISH-SIM-69 (Analyses sans lien net : liste hachurée lue comme un résultat), 70, 71 ; CYCLE-3a-2.
