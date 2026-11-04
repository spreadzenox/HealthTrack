# 04/11 19:35 — Démarrage allégé : Nouveautés hors du fichier de démarrage (PERF-CHANGELOG)

Type : ⚡ performance (C4, « premier lancement rapide » ; BACKLOG « Code splitting »).

## Constat au démarrage
- main vert (`e6fb027`, #692) ; seule PR ouverte : #51 (cursor/*, non touchée) ; aucune autre exécution en cours.
- Priorités du prompt en attente du propriétaire (P42 Alpha, P37, P43, P44, P45) ; rien de neuf à traiter côté relais.
- Inventaire Huawei (§10.20) : plus de « ❌ » à coder hors exclusions volontaires ; la FC de la nuit, notée « pas
  affichée », est déjà dans le Journal (puce « FC nuit », `journalChips.js`).
- Composition du fichier principal (`index-*.js`, 902 Ko) mesurée par un greffon Vite jetable (scratchpad) :
  react-dom 532 Ko (non minifié), **journal des Nouveautés 197 Ko**, pilote Huawei 186 Ko, react-router 81 Ko,
  `analysisEngine.js` 77 Ko, `mood/` 63 Ko. Les Nouveautés n'y servaient qu'à la pastille des réglages et à la bannière.

## Fait
- `app/src/hooks/useChangelog.js` : le journal est importé dynamiquement après le premier affichage (liste vide en
  attendant ; un journal passé en propriété court-circuite le chargement).
- `SettingsButton.jsx`, `WhatsNewBanner.jsx` : plus d'import statique de `data/changelog`. Pages Nouveautés, Réglages
  et Onboarding inchangées (déjà en chargement différé).
- Résultat : `index-*.js` 902 → **696 Ko** (gzip 290 → **230 Ko**), nouveau morceau `changelog-*.js` 207 Ko.
- Test `hooks/useChangelog.test.jsx` : bannière et pastille après chargement, journal fourni utilisé tel quel, et
  verrou « aucun import direct du journal » dans `Layout.jsx`, `SettingsButton.jsx`, `WhatsNewBanner.jsx`.
- Nouveautés : `2026-11-04-1935-demarrage-allege.json`.

## Vérifications
- `npm run test` (3 018 verts), `npm run lint` (0 erreur), `npm run build`, `npm run visual` (toutes les pages ok ;
  Accueil et Réglages relus : rien ne change à l'écran).

## Suite
- **PERF-HUAWEI-LAZY** : `watchAutoSync.js` importe le pilote montre au démarrage pour tout le monde ; import
  dynamique seulement quand une montre est configurée (vérifier la synchro auto sur l'émulateur).
- TEST-ALPHA-1 (07–08/11, clic P42) avec `--font-scale=1.3` ; P37, P43, P44, P45 en attente du propriétaire.
