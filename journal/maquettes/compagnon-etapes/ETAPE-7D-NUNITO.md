# Étape 7d — Nunito et fond crème (préparée le 16/11 08:30, run « idées »)

Brief § 6 et § 10 (étape 7) : « Nunito et les tokens dans cette étape ou la suivante » ; `tokens.css` et
`journal/DESIGN.md` changent dans la même étape que la police. Le miel des habitudes est déjà fait (étape 4).
Reste : **la police** et **le fond crème**. Rien ne touche aux données : aucune migration.

## 1. Mesures (16/11, paquets `@fontsource-variable/*` 5.3.0)

| | Figtree (aujourd'hui) | Nunito |
|---|---|---|
| Licence | OFL 1.1 | OFL 1.1 (vérifiée sur npm) |
| Fichier latin, variable (woff2) | 20 Ko | 39 Ko |
| Fichier latin-ext (woff2) | 10 Ko | 36 Ko (chargé seulement si un caractère latin-ext est affiché) |
| Hauteur d'x / corps | 0,500 | 0,484 (un peu plus petite à taille égale) |
| Largeur d'une phrase type | 1 | 0,97 (un peu plus étroite) |
| Chiffres | proportionnels | **tabulaires** par défaut |
| Absents (latin + latin-ext) | ᵉ ʳ, espace fine insécable, espace fine, ≈ ≥ → ✓ ⁿ | ᵉ ʳ, espace fine insécable, ≈ ≥ → ✓ ⁿ |

Poids ajouté au premier lancement : ≈ +19 Ko (latin), +26 Ko si latin-ext sert. Les règles existantes tiennent
(POL-PLAY-101 : pas de « ᵉ » ni « ʳ » ; POL-PLAY-94 : `frenchSpacing` élargit l'espace des milliers).

## 2. Maquette : la vraie app, tokens changés à la main, puis remis (rien de commité)

`npm run visual` (données de démo, Galaxy A56), dossier [`7d/`](7d/) : `avant-<page>.png` (Figtree, blanc) et
`apres-<page>.png` (Nunito, crème) pour l'Accueil (`dashboard`), Ma journée, Objectifs et Tendances.
Valeurs essayées : `--color-bg #fff8f0`, `--color-surface #f8efe4`, `--color-border #eadfd1`, `--bg-rgb 255, 248, 240`.

Constats :
- Rendu propre, aucune erreur JS ; les cartes de thème (menthe, rose…) se détachent bien sur le crème ; la barre
  d'onglets et l'en-tête suivent `--bg` sans rien d'autre à toucher (aucun `#fff` codé en dur hors `tokens.css`).
- Les lignes sont un peu plus hautes (+≈ 2 % : carte « Vos données du jour » de 520 à 538 px). À regarder à 320 px et
  en grand texte.
- Le chevron texte « › » de la carte « Agir » est plus petit en Nunito : le remplacer par l'icône chevron déjà utilisée
  ailleurs (carte Bien-être) ou le laisser si Agir disparaît de l'Accueil (étape 10).

## 3. Contrastes (WCAG, sur le fond)

| Fond | encre | encre 2 | marque `#0b7a5e` | étiquette menthe | étiquette pêche | étiquette miel |
|---|---|---|---|---|---|---|
| `#ffffff` (aujourd'hui) | 16,4 | 6,93 | 5,30 | 6,48 | 7,79 | 6,92 |
| **`#fff8f0` (proposé)** | 15,6 | 6,58 | **5,04** | 6,15 | 7,40 | 6,57 |
| `#f6eee3` (surface proche) | 14,3 | 6,03 | 4,61 | 5,63 | 6,78 | 6,02 |

Tout reste ≥ 4,5:1. `tokens.test.js` les vérifie déjà (`color-bg` et `color-surface` contre encre, marque et
couleurs d'état) : il suffira d'y mettre les nouvelles valeurs. Le thème sombre ne change pas (le brief ne parle que
du clair).

## 4. Découpage proposé (un run de code, Android et iPhone dans la même PR)

1. `package.json` : `@fontsource-variable/nunito` à la place de `@fontsource-variable/figtree` ; `main.jsx` importe
   `nunito/wght.css` ; `--font-sans: 'Nunito Variable', 'Nunito', …`. Titres en 800 (aujourd'hui 9 règles en 800 ;
   le brief dit 800–900 : passer `h1` et les grands chiffres en 800, rien en 900 tant qu'une capture ne le demande).
2. `tokens.css` (clair) : `--color-bg`, `--color-surface`, `--color-border`, `--bg-rgb` aux valeurs du § 2 ;
   `--toggle-thumb` reste blanc. `tokens.test.js` à jour (rouge d'abord).
3. Rapport PDF : `scripts/fonts/woff-to-ttf.mjs` produit `nunito-400/700/800.ttf` depuis `@fontsource/nunito`
   (devDependency, à la place de `@fontsource/figtree`) ; `renderPdf.js` et `OFL-Nunito.txt`. Test du rapport.
4. Licences : `thirdPartyLicenses.js` (« Polices Nunito et IBM Plex Mono ») et son test ; écran Licences.
5. Fiche Play : `scripts/store/build-store-assets.mjs` (police des visuels).
6. iPhone : `iphone/overlay/app/public/confidentialite-iphone.html` et `conditions-iphone.html` (police et mention de
   licence). Aucun correctif de `iphone/patches/` ne cite Figtree.
7. Commentaires et noms de tests qui disent « Figtree » (`Ordinal.jsx`, `ordinalGlyphs.test.js`, `frenchSpacing`,
   `hintStyle.test.js`, `Recommendations.css`, `Reintroduction.test.jsx`) : remplacer par « la police de l'app ».
8. `journal/DESIGN.md` § 3 (fond crème) et § 4 (Nunito) ; leçon : la police n'a toujours pas ᵉ ni ʳ.
9. Note de Nouveautés (Android et iPhone : sans `variants`) : « Nouvelle police, plus ronde, et fond crème. »

Captures à regarder : toutes les pages en clair (`npm run visual`), `--dark` (rien ne doit changer sauf la police),
`--empty`, grand texte, 320 px ; côté iPhone `demo-clair-*` et `vide-*` de la PR.

## 5. Questions ouvertes

Aucune pour le propriétaire : fond crème et Nunito sont décidés (13 et 14/11). La teinte exacte (`#fff8f0`) est la
nôtre ; elle reprend le crème du kit (`#FFF6EC` du prototype, `#FFF9F2` des cartes de `comprendre.SPEC.md`) en restant
au-dessus de 5:1 pour la couleur de la marque.
