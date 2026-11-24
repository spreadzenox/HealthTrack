# Run 24/11 16:30 — « Cœur » au lieu de « FC », code mort de l'appareil photo retiré

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main a8d02a7 vert (Tests,
émulateur A56) · **TestFlight** : 1290.1290 chez « Testeurs Halcya » (pas relevé de nouveau ce run) · **Parité** :
70 % (33/47)

## État de départ
- Aucune PR de la routine ouverte ; #51 (`cursor/*`) pas touchée. main vert.

## POLISH-SIM-86b
- Un seul nom pour la fréquence cardiaque, comme Sources : plus aucun « FC » dans les textes de `src/`.
  « Cœur » (fourchette du jour), « Cœur la nuit », « Cœur, moyenne du jour », « Cœur debout (balance) », « Cœur
  debout », « cœur 135 bpm en moyenne » (séances de la montre), « cœur à … bpm en moyenne » (capteur Bluetooth),
  « fréquence cardiaque » dans le guide Health Connect, le journal technique et l'association de la montre.
- Test de garde écrit d'abord dans `measureNames.test.js` (rouge sur 9 fichiers, puis vert) ; tests existants mis à
  jour (`journalChips`, `dailyJournal.ios`, `format`, `huawei/coverage`).
- Onboarding : le cas spécial `startsWith('FC')` de « Pas mesuré par vos appareils » ne servait plus (aucun libellé ne
  commence par « FC ») ; retiré.

## Code mort retiré (FUSION / CI économe)
- `app/src/ios/cameraPermission.js`, son test, et `requestCamera` de `FaceSensePlugin.swift` (rien d'autre ne
  l'appelait depuis le retrait de `PermissionsStep.jsx` le 08/11). Le build iPhone de cette PR le vérifie.

## Vérifications
- `npm run test` : 4 642 verts ; `npm run lint` : 0 erreur ; `npm run build` vert ; `npm run visual` (voir PR).
- Note de Nouveautés `2026-11-24-1630-coeur-au-lieu-de-fc.json` (code partagé, Android et iPhone).

## Suite
1. Run suivant : checks de la PR (dont le build iPhone, qui compile le plugin sans `requestCamera`), captures, merge.
2. FUSION-3 étape 3 : réponse de l'orchestrateur attendue.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.
