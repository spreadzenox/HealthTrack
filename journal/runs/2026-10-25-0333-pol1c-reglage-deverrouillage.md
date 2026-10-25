# 2026-10-25 03:33 CET (02:33 UTC) — POL-1c : couper la lecture au déverrouillage depuis Paramètres

**Type** : 🧭 chantier produit (polissage du 24/10 15:00, point 1 : « réglage pour la couper à tout moment »)

## Constat au démarrage
- Main à `c60c170` (#346, journal v263), aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- « Build & Release » v263, « Tests » et « Play — AAB » verts ; émulateur du commit journal en cours.

## Ce qui a été fait
- `components/FaceUnlockSetting.jsx` : bloc **« Lecture au déverrouillage »** de Paramètres, affiché seulement si
  `describeFaceUnlock(status)` existe (play avec l'interrupteur de build et `unlockAvailable` ; rien en sideload ni
  dans les versions play publiées tant que l'interrupteur est coupé).
  - Active ou en pause : interrupteur (`role=switch`) « Active à chaque déverrouillage » / « En pause (arrêtée par
    Android) » → `stopFaceUnlock` seul (la lecture à l'ouverture continue, rien n'est effacé).
  - Coupée : une ligne « Coupée. Pour plus de lectures par jour, activez-la dans Sources → Lecture du visage »
    (lien). **On ne peut pas l'allumer d'ici** : l'activation reste derrière sa divulgation, dans la carte de Sources.
- Branché dans `pages/Settings.jsx` sous le bloc Abonnement.
- Pas d'entrée « Nouveautés » : rien de visible dans les versions publiées (interrupteur de build coupé).

## Vérifications
- Vitest **2 182** verts (4 nouveaux : rien sans plugin / sideload / sans interrupteur ; coupe active ; coupe en
  pause ; pas d'allumage d'ici) ; build OK ; lint inchangé (6 erreurs préexistantes).
- Captures relues : `--play --face --face-unlock=on` (clair), `=paused --dark`, `=off` sur `/settings` ; `npm run
  visual` complet (sideload, démo).

## Suite
- **P28 (propriétaire)** : déclaration FGS + vidéo (APK d'aperçu prêt).
- Après P28 : allumer `-PfaceUnlockPlay=true` dans « Play — AAB » (POL-1d). Ensuite M6b.

## Après le merge (#347, `05e9603`)
- Checks de la PR tous verts du premier coup (Vitest, Build APK, relais, protocole montre, émulateurs API 35 et 36).
- Sur main : « Tests », « Build & Release » (**v264**, APK 33 750 380 octets, 33,8 Mo) et « Play — AAB » (test
  interne) verts.
