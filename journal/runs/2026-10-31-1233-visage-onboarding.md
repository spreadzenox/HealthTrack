# Run du 31/10/2026 12:33 (Paris, CET) — Lecture au déverrouillage mise en avant dans l'onboarding (POL-PLAY-83)

**Type** : 🚀 produit (demande du propriétaire du 31/10 : diffuser la lecture au déverrouillage et la mettre en avant
dans l'onboarding avant la version candidate)

## Constat au démarrage
- Main à `82a82de` (#559, journal) ; v405 publiée. Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, non touchée).
- Nouvelle consigne lue dans le prompt : P28 traitée (30/10), lecture en arrière-plan vérifiée par le propriétaire sur
  son A56 le 31/10 ; `faceUnlockPlay` allumé dans toutes les versions play ; écran dédié dans l'onboarding.
  Jusqu'ici, la CI ne l'allumait qu'en test interne (`FACE_UNLOCK_INTERNAL`, alpha toujours coupée).

## Fait
- **Onboarding** (`Onboarding.jsx`, écran « Votre bien-être, estimé tout seul ») : quand la version play a la lecture
  au déverrouillage (statut natif `unlockAvailable`), l'écran montre le bénéfice en image (deux lignes de points :
  « Quand vous ouvrez l'app » quelques-uns, « À chaque déverrouillage » bien plus ; « Plus de lectures dans la
  journée, une estimation plus solide. » ; aucun chiffre de précision), les points clés (facultatif, IA sur le
  téléphone, aucune image, notification avec « Arrêter », pas un diagnostic), « Activer » en bouton principal et
  « Plus tard » en bouton secondaire pleine largeur, qui passe à l'écran suivant sans rien demander. « Continuer » est
  masqué tant qu'aucun choix n'est fait (un seul bouton plein). Les boutons n'apparaissent qu'une fois le statut natif
  lu (pas de clignotement entre les deux écrans). Sideload et play sans l'interrupteur : écran inchangé.
- **Divulgation** `camera_onboarding_unlock` (`permissionDisclosures.js`) : un seul « Activer » allume la lecture à
  l'ouverture ET au déverrouillage (`start({ unlock: true })` note les deux accords côté natif), donc la divulgation
  décrit les deux, plus la notification, l'arrêt, le redémarrage et « Envoyé par Halcya : rien ». Puis lecture d'essai
  par `startFaceUnlock` (qui demande aussi l'autorisation des notifications).
- **CI** (`play-bundle.yml`) : `FACE_UNLOCK_INTERNAL` devient `FACE_UNLOCK_PLAY`, appliqué à toutes les pistes (test
  interne et alpha) ; `PLAY_NO_REUSE` retiré (l'alpha peut reprendre l'AAB du test interne, identique) ; garde « test
  interne au seul propriétaire » retirée de l'appel (`publish-cli.mjs`). Frein d'urgence inchangé : passer
  `FACE_UNLOCK_PLAY` à `"false"`.

## Tests
- `Onboarding.face.test.jsx` : 5 cas nouveaux (mise en avant, rien de précoché, pas de « % » ; divulgation complète
  avant toute demande puis essai via `startFaceUnlock` ; « Pas maintenant » ; « Plus tard » passe à la suite ; play
  sans l'interrupteur : écran habituel).

## Vérifications
- `npm run test`, `npm run build`, `npm run lint` (6 erreurs, comme avant), `npm run visual` complet.
- Captures relues : `--play --face=off --face-unlock=off --routes=/bienvenue --onboarding=face` en clair et `--dark`,
  et `--click="Activer"` (divulgation).

## Données
- Aucune donnée, migration ni format d'export touché.

## Demandes iOS
- (3) note de Nouveautés marquée `"variants": ["play"]` (fonction propre à la variante play Android).

## Suite
- Rappel discret dans la carte Bien-être de l'Accueil pour qui a choisi « Plus tard » (au plus un, refus respecté).
- `journal/PLAY-CONFORMITE.md` §1 bis tenu à jour ; la prochaine version candidate alpha aura la lecture au
  déverrouillage (examen Google à surveiller : en cas de refus, erreur notée et `FACE_UNLOCK_PLAY` coupé).
