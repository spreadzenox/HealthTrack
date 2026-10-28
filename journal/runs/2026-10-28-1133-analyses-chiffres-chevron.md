# Run du 28/10/2026 11:33 (Paris, CET) — Analyses : chiffres des liens derrière le chevron (POL-PLAY-22)

**Type** : 🎨 Polissage play / parcours (variantes play et sideload)

## Constat au démarrage
- Main à `5df256f` (#464). PR **#465** (run de 10:33, POL-PLAY-21) ouverte, 9 checks verts, à jour sur main, laissée
  non mergée (merge refusé par les permissions de cette session-là). PR #51 `cursor/*` hors routine, non touchée.
- **#465 mergée en squash** (`ae4be44`) : Build & Release **v336** publiée, APK **34,5 Mo** (34 491 105 octets).
- Run de code. Pris : **POL-PLAY-22** (suite prévue par le run précédent).

## Fait
- `Recommendations.jsx`, `LinkCard` (gabarit commun des liens « le jour même », « jours avec / sans », « avec délai ») :
  la ligne mono (« 30 jours avec · 44 sans · déduit de vos séances · week-end à part : +0,8 », « Lien modéré · r = +0,48
  · ≈ 63 jours indépendants ») n'apparaît plus qu'au chevron (`DetailsToggle`, le même que les pistes à tester). Vue
  simple : nom, une phrase, étiquette de solidité, « visage », « Se retrouve aussi… ».
- Corrélation du jour même : « plus c'est élevé, meilleur est votre bien-être » → « les jours où c'est plus élevé vont
  avec un meilleur bien-être » (corrélation, pas causalité).
- Légende : « « visage » : comparé à votre bien-être estimé par la caméra (29 jours) » → « Étiquette « visage » : lien
  repéré avec votre bien-être estimé par la caméra (29 jours). »
- En-tête mono : « · week-end pris en compte » retiré (« analyse sur 75 jours notés · 77 jours de données ») ; le
  week-end reste expliqué dans « Comment c'est calculé » et, par lien, au chevron (« week-end à part »).
- « Comment c'est calculé » était déjà en petit tout en bas (POL-7) : inchangé.

## Tests
- `Recommendations.test.jsx` : 6 tests adaptés (ouvrir le chevron avant de lire les chiffres) + assertion « r absent
  avant le chevron » ; 60 verts.

## Vérifications
- `npm run test` : 2 610 verts ; lint 6 erreurs (inchangé) ; build OK.
- `npm run visual -- --play --routes=/recommendations` clair et `--dark` (démo) relus : cartes « Variabilité
  cardiaque », « Sport le soir », « Alcool » sans ligne mono, chevron à droite ; contrastes corrects en sombre.

## Suite
- POL-PLAY-18 (couleurs et axe de l'historique du bien-être), 19 (écran Montre), puis 24 à 28.
