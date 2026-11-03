# Run du 03/11/2026 13:35 (Paris, CET) — Rapport PDF : semaines d'avant le journal et « 1er » (POL-PLAY-105)

**Type** : 🎨 code (polissage de la version Play, audit POL-PLAY-12 du rapport PDF)

## Constat au démarrage
- Main à `5b19498` (#654), Tests / Build & Release / Play — AAB verts, émulateur en cours ; aucune PR « [Auto] »
  ouverte (la #51, hors routine, n'est pas touchée).
- Priorités du prompt : Alpha 100721 en place, `until` 27/11 et fin iPhone 06/11 servis (vérifiés aux runs
  précédents) ; GOLD-a3 attend P37, VITALS attend P43, INSTALLS-21b-2 attend 2–3 versions. Étape indépendante choisie :
  revoir le rapport PDF tel qu'un testeur l'enverrait à son médecin (dernier audit visuel le 29/10, avant SLOP-1 et
  POL-PLAY-99).

## Audit
- Rapport rendu hors navigateur (test jetable, non commité) sur les données de démo (4 et 12 semaines, bien-être
  inclus), sur 90 jours simulés avec une piste, et sur un journal vide ; pages converties en PNG (`pdftoppm`) et relues ;
  tous les textes passés à `SLOP_WORDING` : rien.
- Défaut 1 : un testeur qui note depuis 2 semaines et choisit « 12 semaines » obtient 10 rangées « 0 – – – » en tête
  de « Semaine par semaine » : du bruit pour le médecin.
- Défaut 2 : « 26 août – 1 sept. », « 1 nov. 2026 » : POL-PLAY-99 (« 1er » partout) n'avait pas touché `frDate` du PDF.
- Le reste (calendrier, FODMAP par sous-groupe, aliments, sources, « quand consulter ») : rien à redire.
- Note : dans le simulateur sans `realNames`, « Oignon » n'est pas reconnu comme riche en fructanes (nom court, pas
  un nom Ciqual) ; artefact du banc, pas de l'app (les analyses de repas renvoient des noms Ciqual).

## Fait (POL-PLAY-105)
- `renderPdf.js` : les semaines d'avant la première semaine notée ne font plus de rangées ; une ligne grise « Aucune
  note avant la semaine du 21 oct. » les remplace. Une semaine vide entre deux semaines notées reste une rangée en
  tirets (le trou se voit). Données du rapport (`buildReport`) inchangées.
- `frDate` : « 1er » pour le premier du mois (en-tête, semaines, défis, date de création). Les numéros du calendrier
  restent des chiffres.

## Tests
- `renderPdf.test.js` : « 1er févr. », « 1er nov. 2026 », « 11 nov. » ; 12 semaines avec notes à J−20 et J0–J−2 → 3 à
  5 rangées, la phrase, un trou en tirets, jamais « .. » ; le test POL-PLAY-44 mis à jour (plus de rangée vide en tête).
  Rouges avant, verts après.

## Vérifications
- `npm run test` (242 fichiers verts), `npm run lint` (7 erreurs, comme avant), `npm run build` OK,
  `npm run visual -- --play --routes=/data` OK (carte du rapport inchangée) ; pages PDF avant / après relues.

## Données
- Aucune : rendu seulement.

## Demandes iOS
- Aucune ; comportement commun aux deux plateformes (note de Nouveautés sans `variants`).

## Suite
- P43 puis lecture des plantages ; TEST-ALPHA-1 (07–08/11) ; INSTALLS-21b-2 ; `shrinkResources` (POL-PLAY-11).
