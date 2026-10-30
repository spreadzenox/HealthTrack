# Run du 30/10/2026 10:33 (Paris, CET) — « Quand consulter » sans alarmer (POL-PLAY-60)

**Type** : 🎨 Code (polissage de la version play, conformité des textes)

## Constat au démarrage
- Main à `d5f763e` (#523), aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, non touchée).
- En tête du BACKLOG : POL-PLAY-60 (I198, run « idées » de 08:33).

## Fait
- `services/today.js` : `WHEN_TO_SEE_DOCTOR`, une seule source de texte (« Sang dans les selles, perte de poids sans
  raison, fièvre, réveils la nuit à cause du ventre, ou symptômes nouveaux après 50 ans : parlez-en rapidement à votre
  médecin. »).
- Carte « Votre ventre » (Accueil) : la phrase sous le chevron (mode détails), classe `gut-consult-note` (Figtree,
  0,75 rem, `--text-muted`, jamais en rouge). La carte n'existe qu'avec l'objectif « Mon ventre » ou des notes du
  ventre (`gutCardMode`) : rien ailleurs.
- Réintroduction guidée : l'ancienne phrase (« sang… perte de poids… diarrhée la nuit ») remplacée par la constante.
- Rapport PDF : `report.whenToConsult`, en petit gris au pied de la page 2, avant « Rapport créé le … ».
- Phrase fixe, jamais calculée depuis les données (pas de détection : ce serait une fonction médicale).

## Tests
- `TodayCards.test.jsx` : absente sans détails, présente avec, pas en mono.
- `buildReport.test.js` (`whenToConsult`), `renderPdf.test.js` (phrase dans le PDF vide), `Reintroduction.test.jsx`
  (texte mis à jour).

## Vérifications
- `npm run test` (2722 ✔), `npm run build`, `npm run lint` (6 erreurs, comme avant), `npm run visual -- --play`
  (complet) ; Accueil démo avec détails ouverts relu en clair et en sombre (lisible sur pêche, contraste OK).

## Données
- Aucune : texte seulement.

## Demandes iOS
- Commun aux deux plateformes : note de Nouveautés sans `variants`.

## Suite
- BACKLOG par impact (VEILLE-1 et TF-1/TF-2 attendent le propriétaire) : prochain audit POL-PLAY-12 ou point suivant.
