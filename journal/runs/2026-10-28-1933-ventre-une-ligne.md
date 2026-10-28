# Run du 28/10/2026 19:33 (Paris, CET) — Carte ventre : gestes facultatifs sur une ligne (POL-PLAY-29)

**Type** : 🎨 UI (variantes play et sideload, code commun avec l'app iPhone)

## Constat au démarrage
- Main à `4672609` (#481), v344 verte (Build & Release, Play — AAB, Tests ; émulateur A56 vert sur `41ae7d3`, en cours
  sur `4672609`, journal seul). Aucune PR « [Auto] » ouverte (PR #51 `cursor/*` non touchée). Run de 19:33 : run de code.

## Audit POL-PLAY-12 (`--play --empty`, puis `--play --dark` démo : Accueil, Analyses, Journal)
- Accueil, Journal, Tendances, Analyses, Sources, Premium relus : rien de cassé.
- Défaut retenu (POL-PLAY-29) : carte « Votre ventre », le soir, « Noter un moment précis » (sans « + ») et « + Selles »
  (« + » texte) empilés sur deux lignes de 44 px, avec un vide qui ressemblait à un trou ; style différent de
  « + Noter moi-même » de la carte bien-être.
- Noté, non traité : la carte lilas de l'Accueil (démo) dit encore « Assez de jours… voyez l'onglet Analyses » tant
  qu'Analyses n'a pas été ouvert une fois (comportement voulu de POL-PLAY-21 : le résumé est écrit par Analyses).

## Fait (POL-PLAY-29)
- `TodayCards.jsx` : le lien du moment précis sort du bloc du bilan du soir et rejoint `StoolLine` dans une ligne
  `.gut-card-actions` (flex, retour à la ligne ; la ligne des selles ouverte prend toute la largeur).
- `StoolLine.jsx` / `TodayCards.jsx` : icône `LineIcon` « plus » (16 px) devant « Noter un moment précis » et
  « Selles » (le « + » texte disparaît ; nom accessible « Selles »).
- `TodayCards.css` : liens en `inline-flex` avec l'icône, cible tactile 44 px inchangée.

## Tests
- `TodayCards.test.jsx` : nouveau test POL-PLAY-29 (les deux boutons dans `.gut-card-actions`, deux icônes) ; tests des
  selles mis à jour (nom « Selles »). Rouges avant le changement, verts après.

## Vérifications
- `npm run test` : vert (2 627) ; lint 6 erreurs (inchangé) ; build OK.
- `npm run visual -- --play` complet OK ; captures relues : `--play --empty --routes=/` (clair, soir : une ligne
  « + Noter un moment précis   + Selles ») et `--play --dark --routes=/ --click="Selles"` (ligne des selles ouverte,
  pleine largeur).

## Demandes iOS
- Note de Nouveautés commune (carte ventre partagée) : pas de `variants`.

## Suite
- POL-PLAY-12 : poursuivre l'audit écran par écran (Paramètres, Données, Onboarding en sombre).

## Après le merge (#482, `d38475c`)
- Checks de la PR verts (Vitest, Build APK, relais, protocole montre, budget de lectures, bord à bord API 34,
  émulateur A56 API 35 et 36).
- Sur main : Build & Release **v345** publiée, APK **34,5 Mo** (34 492 841 octets) ; Play — AAB (test interne) vert ;
  Tests verts.
