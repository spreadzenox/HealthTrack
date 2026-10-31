# Run du 31/10/2026 10:33 (Paris, CET) — Montre : une ligne par type absent (POL-PLAY-81)

**Type** : 🎨 polissage (audit Premium et Montre, variante play, clair et sombre, vierge et démo, 360 px)

## Constat au démarrage
- Main à `7d36824` (#555, journal) : Tests, émulateur A56, Build & Release v403 et Play — AAB verts. Aucune PR
  « [Auto] » ouverte (seule #51, `cursor/*`, non touchée). Plantage du visage du 30/10 corrigé (#531) : retest du
  propriétaire toujours attendu.

## Audit
- Premium (`--play --empty` clair, `--play --dark`) : titre, bénéfices (lilas), « Toujours gratuit » (menthe),
  formules (annuel présélectionné, badge −50 %), frise de l'essai, bouton, mentions, liens et « Plus tard » : conformes
  à la maquette, contrastes corrects en sombre. Rien à corriger.
- Montre (`--play`, démo, clair et sombre) : 9 types sur 13 affichaient chacun une carte « Rien reçu depuis 30 jours. »
  (deux écrans et demi, types reçus noyés).

## Fait
- `WatchData.jsx` : un type `none` sans valeur ni issue de lecture → ligne compacte (`watch-data-row--compact`,
  libellé + étiquette « rien ») ; légende unique en bas « « rien » : aucune mesure reçue depuis 30 jours. » ; un type
  avec issue de lecture garde sa carte complète (diagnostic du propriétaire préservé). Ordre inchangé.
- `WatchData.css` : marge réduite des lignes compactes.

## Tests
- `WatchData.test.jsx` : 11 lignes compactes, phrase répétée absente, légende présente (rouge avant) ; une ligne
  portant « dernière lecture : vide » n'est pas compacte.

## Vérifications
- `npm run test` (2 772 tests), `npm run build`, `npm run lint` (6 erreurs, comme avant), `npm run visual` complet.
- Captures relues : `--play --empty --routes=/premium`, `--play --dark --routes=/premium,/montre`, `--play --routes=/montre`.

## Données
- Aucune donnée, migration ni format d'export touché.

## Demandes iOS
- Aucune concernée (changement commun ; note de Nouveautés sans `variants`).

## Suite
- Retest du visage par le propriétaire ; POL-PLAY-11 (alpha) après une journée sans plantage dans Android vitals.
- Prochain audit : Sources (variante play) en `--empty` et sombre, puis Réintroduction en sombre.

## Après le merge (#556)
- Checks de la PR tous verts (Vitest, Build APK, relais, Java, budget, émulateur A56 API 35/36 et bord à bord API 34).
- Tests, Build & Release, Play — AAB et émulateur A56 verts sur main (`4acb997`) : release **v404** publiée
  (APK 34 519 398 octets).
