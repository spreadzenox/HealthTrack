# 2026-10-19 10:30 Paris (08:30 UTC) — Carte « Lecture du visage » visible (signalement du 19/10 08:37)

**Type** : 🚑 régression bloquante signalée par le propriétaire, chantier bien-être (§00000)  ·  **PR** : voir ci-dessous

## Pourquoi
- Démarrage : main à `301e847` (#217), dernière release v172 (APK présent). Aucune PR « [Auto] » ouverte.
- Signalement du propriétaire (08:37) : « Je ne vois pas la carte pour la lecture du visage dans connecteur ». Sa
  capture : Mes appareils, puis Montre Huawei, aucune carte visage.

## Cause
- `connectorsLayout.splitSourcesByStatus` ne classait `face` parmi les sources actives (en tête) que si
  `faceSenseEnabled` — le miroir local de l'interrupteur. Le propriétaire n'a jamais activé la lecture (il ne voyait
  pas la carte pour le faire) : elle tombait dans `toConnect`, rendu dans le `<details>` **replié**
  « Brancher une autre source » (replié dès qu'une source envoie, ici la montre), tout en bas de la page.
- Le compte rendu du run 18/10 22:30 disait « source `face` en tête de Connecteurs » : vrai seulement une fois
  activée ; les captures avaient été relues avec `--face` (actif) et `--face=stopped`, où la carte est bien en tête.
  `--face=off` n'avait pas été relu avec une autre source active.
- Plugin natif : bien enregistré (`MainActivity.registerPlugin(FaceSensePlugin.class)`), service et permissions
  dans le manifeste — pas en cause. Détection native : `faceSensePlugin()` → `Capacitor.isNativePlatform()`.

## Ce qui a été fait
- `connectorsLayout` : nouvelle entrée `faceSenseAvailable` (plugin natif présent) ; `face` est la **première**
  source active dès qu'elle est disponible ou activée (avant la montre). Nouveau `nothingSending` : la carte épinglée
  mais pas activée n'envoie rien, donc « Sources à brancher » reste ouvert au premier lancement.
- `Connectors.jsx` passe `isFaceSenseAvailable()` et utilise `nothingSending`.
- `FaceSenseCard` : plugin présent mais `status()` en échec (état `unavailable`) → « Le module de lecture du visage
  ne répond pas. Vérifiez que l'app est à jour (Plus → Nouveautés), puis réessayez. » + bouton « Réessayer » (avant :
  intro seule, aucun bouton, aucune explication).
- Nouveauté `2026-10-19-1030-carte-visage-visible.json`.

## Tests (TDD : écrits d'abord, rouges sur main)
- `connectorsLayout.test.js` : Android → `['face', 'watch']` actifs, `face` jamais dans `toConnect` ;
  `nothingSending`.
- `Connectors.test.jsx` : **Android natif simulé** (`window.Capacitor.isNativePlatform → true`) : titre
  « Lecture du visage » présent, hors du volet replié, avant les connecteurs actifs, sans « Disponible dans l'app
  Android ».
- `FaceSenseCard.test.jsx` : `status()` rejeté une fois → « ne répond pas », « Réessayer » → bouton « Activer ».

## Vérifications
- `npm run test` : **1 486 verts**. Lint **6 erreurs** (inchangé). Build ✅.
- `npm run visual` ✅ (toutes pages) ; `--routes=/connectors --face=off --devices --ble=watch --connect=done
  --companion=on` (cas du propriétaire : carte juste sous Mes appareils, puis Montre Huawei) ; `--empty --face=off`
  (carte puis « Sources à brancher » ouvert) ; `--light --face=off`. Sans erreur JS, captures relues.

## Pour le propriétaire
- Version installée : Plus → Nouveautés, « Version installée : … ». La carte existe depuis v168 ; la correction
  arrive dans la release qui suit ce run.
- Après mise à jour : Plus → Connecteurs → la carte « Lecture du visage » doit être juste sous « Mes appareils ».

## Leçon (ajoutée à la charte §000000)
Une carte « en tête » se vérifie dans l'état par défaut de l'utilisateur (non activée, autre source active).

## Suite
Reprendre le plan bien-être : **temps par app comme facteur (I116)**, puis lectures du visage par jour dans le
diagnostic (I118), guide Shizuku / ADB, dictée du soir.
