# Run 24/11 19:30 — #1244 : la note de Nouveautés de l'iPhone ne parle plus d'Android

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 2fbd00d vert (Tests,
émulateur A56) · **TestFlight** : 1290.1290 chez « Testeurs Halcya » (pas relevé de nouveau) · **Parité** : 70 % (33/47)

## État de départ
- PR de la routine ouverte : #1244 (POLISH-SIM-72-iOS-c, run 18:30). Deux checks rouges, même cause :
  - « Tests d'Android avec les correctifs iOS » : `changelog.appstore.test.js` refuse la note
    `2026-11-24-1830-vfc-sans-sigle` (elle contenait « sauvegarde Android »).
  - « Build iOS (simulateur) et captures » : compilation et tests Xcode verts, mais le contrôle des textes a trouvé
    « Android » sur la page Nouveautés (`iphone-16e [texte] demo-clair-nouveautes : Android`).
- #51 (`cursor/*`) pas touchée.

## Correctif
- Note de Nouveautés de l'iPhone : « pour la distinguer de celle d’une ancienne sauvegarde importée » au lieu de
  « … d’une sauvegarde Android ». Aucun autre texte visible du changement ne nomme Android (seulement des commentaires).
- Vérifié localement : la note ne contient plus aucun des mots refusés (Google Play, Android, Health Connect, Huawei),
  JSON valide. Le contrôle complet de l'iPhone (`scripts/upstream.sh`) ne tourne pas dans ce conteneur (clone sans
  historique) : c'est le build de la PR qui le refait.
- Un seul push (règle CI économe : pousser seulement ce qui bloque la PR), donc un seul nouveau build iPhone.

## Suite
1. Run suivant : checks de #1244 (dont le build iPhone), capture iPhone de Tendances relue, merge.
2. FUSION-3 étape 3 : réponse de l'orchestrateur attendue.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.
