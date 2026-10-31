# Run du 31/10/2026 19:33 (Paris, CET) — Accueil : carte ventre (POL-PLAY-90)

**Type** : 🎨 polissage (audits prévus par le run de 18:33 : Accueil en vierge sombre, puis Paramètres en démo clair)

## Constat au démarrage
- Main à `cce2e40` (#573, journal) ; v412 publiée ; Tests, Build & Release, Play — AAB et émulateur A56 verts.
  Aucune PR « [Auto] » ouverte (#51 `cursor/*` non touchée).

## Audits (variante play)
- `/` vierge sombre et clair (19:33, donc bilan du soir affiché) : la carte pêche empilait « Votre ventre » (étiquette
  pêche, 700) et « Et votre ventre aujourd'hui, dans l'ensemble ? » (même couleur, 700) : deux titres sans hiérarchie.
- `/` démo clair : bien-être, tuiles, ventre, « Photo du repas » : rien d'autre à corriger.
- `/settings` démo clair : apparence, objectif, abonnement, IA, avis : rien à corriger (écran validé le 24/10).

## Fait
- `TodayCards.css` : `.gut-evening-title` en `--peach-text`, poids 600, taille 1rem (tient sur une ligne au format
  A56) ; `.gut-choice` : marge intérieure de 6 px et écart 6 px (« Douleur » moins serré sur les petits écrans).

## Tests
- `gutCardHierarchy.test.js` (2 cas) : couleur de la question ≠ couleur du titre ; poids plus léger.

## Vérifications
- `npm run test` (2 800 réussis), `npm run build`, `npm run lint` (6 erreurs, comme avant), `npm run visual --play`
  complet. Captures relues : `/` `--play --empty` sombre (avant / après) et clair, `/` et `/settings` démo clair.

## Données
- Aucune : affichage seulement.

## Demandes iOS
- Rien de propre à Android (note de Nouveautés sans `variants`).

## Suite
- Premium et paywall de l'onboarding en vierge sombre, puis Historique du bien-être en démo sombre (vue Mois).

## Après le merge (#574)
- Les 9 checks de la PR étaient verts (Vitest, Build APK, relais, Java, émulateurs…).
- Tests, Build & Release et Play — AAB verts sur main (`0504abf`) : release **v413** publiée (APK 34 523 114 octets) ;
  AAB play envoyé en test interne.
