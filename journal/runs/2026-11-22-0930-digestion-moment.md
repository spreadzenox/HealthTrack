# Run du 22/11 09:30 — POLISH-SIM-139 à 141 (une seule PR)

**Type** : 🛠️ code · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main d59dd33 au départ.

## État de départ
- main vert sur d59dd33 (#1191) : Tests et émulateur verts ; aucune PR « [Auto] » ouverte. Rien de neuf du
  propriétaire dans le prompt.

## Ce qui a été fait
Les trois petits défauts du passage des personas de 08:30 dans **une seule PR**, pour un seul build iPhone (heures de
Mac, résumé du 22/11 04:30) :
- **POLISH-SIM-139** : `DayChecklist.jsx`, la ligne « Votre digestion ce soir » écrit une gêne du matin comme un
  moment, « Dans la journée : gêne à 08:34 » (avant « Noté à 08:34 : Gêne », lu comme le bilan fait).
  `CompanionHome.jsx`, la feuille de la bulle Digestion avant 18 h : « Le bilan de la journée se note le soir, à
  partir de 18 h. », « Une gêne ou une douleur se note à tout moment. » et un bouton « Noter un moment » (lien vers
  Ma journée, feuille Digestion ouverte, comme la bulle après 18 h). Règle et données inchangées.
- **POLISH-SIM-140** : `Onboarding.jsx`, « Cochez les habitudes qui vous parlent. » (une seule est cochée d'office).
- **POLISH-SIM-141**, **autrement que proposé** : `autoDetectedTagIds` dit ce que l'app sait repérer (des séances
  enregistrées ces derniers jours), pas qu'une séance a eu lieu ; écrire « Sport hier soir » aurait été faux un jour
  sans sport. La note de bien-être dit maintenant « Suivi sans vous, inutile de cocher : Sport le soir (séance après
  18 h). » au lieu de « Repéré sans vous : … ».
- Nouveautés : `2026-11-22-0930-digestion-moment.json`.

## Vérifications
- Tests écrits d'abord (rouges, puis verts) : `DayChecklist.test.jsx`, `CompanionHome.test.jsx`,
  `Onboarding.test.jsx`, `WellbeingPrompt.test.jsx`. Suite complète : 4 219 tests verts. Lint propre. Build OK.
- Captures lues : `/ma-journee --onboarding=gut --gut-moment --now=10:00` (« Dans la journée : gêne à 09:24 », « À
  partir de 18 h ») et `/ --onboarding=gut --now=10:00 --click="Digestion, à partir de"` (feuille entière, bouton
  lisible, rien de coupé). Un seul message console (avertissement WebGL de Chromium), aucune erreur.
- iPhone : les 40 correctifs s'appliquent dans l'ordre sur ce code (essai à blanc, dont 23 sur `Onboarding.jsx`).

## Suite proposée
1. Merger cette PR une fois les checks verts (build iPhone de PR compris) et la capture iPhone de l'Accueil regardée.
2. EXPORT-CSV (décision du 20/10), puis FUSION-3 : correctif 58.
3. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45.

## Pour le propriétaire
« 👉 PI2 prête » (inchangé) : dire à Claude dans Chrome « fais la mission PI2 », puis « Submit for Review ».
Parité iPhone : 70 %. TestFlight : 1244.1244 chez « Testeurs Halcya ».
