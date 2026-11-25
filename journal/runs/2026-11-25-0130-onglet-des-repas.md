# Run 25/11 01:30 — POLISH-SIM-162 : un repas noté depuis Ma journée garde l'onglet Ma journée

**Type** : 🔧 (code partagé) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
cd31c99 (#1249) · **TestFlight** : 1290.1290 chez « Testeurs Halcya » ; build du soir pas encore partie (cron en
retard, vers 04:50 UTC) · **Parité** : 70 % (33/47), inchangée

## État de départ
- Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, pas à la routine). main cd31c99 : Build & Release, Tests,
  Play — AAB et émulateur verts. Crons du soir (Alpha, build iPhone, TestFlight) pas encore partis : retard habituel.
- Tous les POLISH-SIM numérotés jusqu'à 161 sont faits ; pris dans « À étudier » le défaut vu par deux personas.

## Fait
- **POLISH-SIM-162** : la page Repas est rangée sous Données ; ouverte depuis Ma journée (cercles des repas, « Vos
  repas », repas déjà noté, bouton photo, « Autre chose › Décrire un repas ») ou depuis l'Accueil (bulle repas), la
  barre allumait « Données » et la page montrait « Tendances · Nutrition ». Désormais l'onglet d'origine voyage dans
  l'état de navigation (`state.tab`) : nouveau module `components/tabs.js` (`TABS`, `activeTab`, `useCurrentTab`),
  utilisé par `TabBar`, `JournalTabs` (absents hors de Données), `MealPhotoButton`, `AddStrip`, `DayChecklist` ;
  `Food.jsx` garde `tab` quand il efface l'état consommé. Ouverte depuis Données ou par son adresse : inchangée.
- Tests écrits d'abord (12 nouveaux, rouges puis verts) ; suite complète, lint des fichiers touchés et build.
- Captures relues : `/ma-journee` puis « Vos repas » en clair et en sombre (Ma journée allumé, pas de sous-onglets),
  `/food`, `/nutrition`, `/tendances` en direct (Données allumé, sous-onglets présents).
- Note de Nouveautés `2026-11-25-0130-onglet-des-repas.json` (code partagé : Android et iPhone). Aucun correctif
  iPhone touché (`iphone/patches/` vide).

## Suite proposée
1. PR passée en « prête » à la fin du run : build iPhone de PR (un seul), merge au run suivant après lecture des
   captures iPhone de Ma journée.
2. Soumission bêta de la build du soir au premier run qui la voit traitée par Apple, puis expiration des anciennes.
3. Run « idées » de 08:30 : maquette « cœur et oxygène de la montre dans Tendances ».

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.
