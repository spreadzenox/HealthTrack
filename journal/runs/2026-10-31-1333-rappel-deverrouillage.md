# Run du 31/10/2026 13:33 (Paris, CET) — Rappel discret de la lecture au déverrouillage (POL-PLAY-84)

**Type** : 🚀 produit (suite de la demande du propriétaire du 31/10 : « refus respecté, au plus un rappel discret plus
tard dans la carte Bien-être »)

## Constat au démarrage
- Main à `0e24a5a` (#561, journal) ; v406 publiée. Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, non touchée).

## Fait
- **Onboarding** : le bouton « Plus tard » de l'écran qui met en avant la lecture au déverrouillage note aussi
  `unlockLater: true`. Un « Pas maintenant » dans la divulgation (refus explicite) ne le note pas : jamais de rappel
  après un refus.
- **`settings/onboarding.js`** : `shouldShowUnlockReminder(s, unlock, now)` — seulement avec `unlockLater`, au moins
  2 jours après la fin de l'onboarding (`doneAt`), tant que la lecture au déverrouillage existe dans cette version et
  est coupée (`describeFaceUnlock` → `off`), et tant que le rappel n'a pas été fermé ou suivi
  (`dismissUnlockReminder` → `unlockReminderDone`). Les deux drapeaux s'ajoutent au diagnostic de l'onboarding
  (identifiants seulement).
- **Carte « Bien-être estimé »** (`MoodEstimateCard`) : une ligne sur fond blanc « À chaque déverrouillage, bien plus
  de lectures : une estimation plus solide. Voir dans Sources » et une croix (cible 44 px, « Ne plus afficher ce
  rappel »). Le lien mène à Sources, où l'activation reste derrière sa divulgation, et ferme aussi le rappel. Sans
  aucune lecture, le rappel remplace l'invitation générique (pas deux fois la même chose). Aucun chiffre de précision.
- **Accueil** (`Dashboard.jsx`) : lit le statut natif seulement si le rappel est possible (pas d'appel inutile au
  plugin pour les autres).
- **Visuel** : `--onboarding=unlock-later` (« Plus tard » il y a 3 jours), à combiner avec
  `--play --face=on --face-unlock=off`.

## Tests
- `onboarding.test.js` : 3 cas (délai, état de la lecture, version sans la lecture ; jamais après un refus ni sans
  onboarding fini ; une seule fois) + clés du diagnostic.
- `MoodEstimateCard.test.jsx` : 3 cas (absent par défaut ; ligne, lien, croix, pas de « % » ; remplace l'invitation).
- `Dashboard.test.jsx` : 2 cas (rappel fermé pour de bon ; aucun rappel si déjà activée).
- `Onboarding.face.test.jsx` : `unlockLater` noté par « Plus tard », pas par « Pas maintenant ».

## Vérifications
- `npm run test` (2 789 réussis), `npm run build`, `npm run lint` (6 erreurs, comme avant), `npm run visual` complet.
- Captures relues : `--play --face=on --face-unlock=off --routes=/ --onboarding=unlock-later` en clair (démo) et en
  `--dark --empty`.

## Données
- Deux clés de plus dans `healthtrack_onboarding` (localStorage) ; aucune donnée de santé, migration ni format
  d'export touché.

## Demandes iOS
- (3) note de Nouveautés marquée `"variants": ["play"]`.

## Suite
- Audit de l'Historique du bien-être (`/bien-etre`) en vierge et sombre, puis Nutrition en sombre (POL-PLAY-82).
