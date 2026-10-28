# Run du 28/10/2026 08:33 (Paris, CET) — Idées : audit écran par écran de la version Play

**Type** : 💡 Idées (run de 08 h : pas de code produit)

## Constat au démarrage
- Main à `7704c62` (#461). Aucune PR « [Auto] » ouverte (seule la PR #51 `cursor/*`, hors routine, non touchée).
- Priorité du propriétaire (27/10 13:00) : polir la version Play avant d'inviter les testeurs. Sujet choisi : audit
  écran par écran (POL-PLAY-12 « nouvel audit »), pour donner aux runs de code une liste de défauts prête.

## Fait
- `npm ci`, puis `npm run visual -- --play --empty` (thème clair, 20 captures) et `npm run visual -- --play --dark`
  (données de démo, 29 captures), sans erreur JS. Captures relues : Accueil, Journal (Jours, Repas, Tendances),
  Analyses, Sources, Montre, Historique du bien-être, Premium, Paramètres, Onboarding.
- Vérifications dans le code des points douteux : `evidenceLevel(q)` (statistics.js) ne regarde que q, alors que les
  pistes ventre exigent `MIN_EXPOSED_DAYS = 8` ; phrases « sur cet appareil » repérées (Connectors.jsx:500,
  BodyProfileCard.jsx, Premium.jsx:127) ; encart météo (WeatherCard.jsx:176) ; liens doublons (Dashboard.jsx:129).
- `IDEES.md` : I186 à I188. `BACKLOG.md` : **POL-PLAY-21 à 28**. `PRODUIT.md` et résumé de la semaine à jour.

## Défauts rangés (par impact)
21 pistes non annoncées sur l'Accueil · 22 statistiques visibles dans la vue simple d'Analyses · 23 « piste solide »
sur 6 jours exposés · 24 boutons de deux formes · 25 « tout reste sur cet appareil » vs sauvegarde Android · 26 encart
météo ambre (norme générale) · 27 petits défauts Accueil / Journal · 28 titre Health Connect, texte visage.

## Vérifications
- Journal seul. `npm run test` : 2 597 verts ; un premier passage avait signalé 1 erreur non attrapée (sans test rouge), absente au second : flake à surveiller.

## Suite
- Runs de code : POL-PLAY-21, 23, 22, puis POL-PLAY-18, 19, 24 à 28 ; POL-PLAY-11 (alpha) quand Android vitals le permet.
