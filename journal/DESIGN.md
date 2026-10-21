# Identité visuelle — « Clair et précis » (validée par le propriétaire le 20/10/2026 au soir)

> Écrit au run du 21/10/2026 00:30 (Paris) depuis la section « IDENTITÉ VISUELLE » du prompt de la routine
> (conçue avec le propriétaire sur des maquettes interactives, dans une discussion séparée). Le prompt prime en cas
> de contradiction. Mise en œuvre par étapes testables, un run = une étape (voir § 8).

## 1. Ambiance

« **Clair et précis** » : la chaleur et les mots simples d'une mutuelle grand public bien faite (Alan sert de
référence d'**esprit**, rien n'en est copié — ni police, ni illustrations, ni couleurs), pour tout le monde ; et la
rigueur d'un labo de données pour qui la demande.

## 2. Principes

1. **Simple par défaut, détails sur demande** : un bouton « détails » révèle IC 95 %, n, moyenne, sources, modèles.
2. **Chaque chiffre dit d'où il vient** (montre, téléphone, estimation).
3. On dit **« piste »**, jamais « cause » ; ni diagnostic ni traitement ; on préfère attendre que se tromper.
4. **Un pastel par thème**, constant dans toute l'app : **menthe = bien-être**, **pêche = ventre**, **lilas = pistes**.

**Ton** : vouvoiement, phrases courtes, chaleureuses et concrètes (« Plutôt une bonne journée », « On préfère
attendre plutôt que de vous montrer de faux suspects »).

## 3. Couleurs (thème clair, par défaut)

Tous les couples texte / fond listés ont un contraste **≥ 4,5:1** (vérifié par `src/theme/tokens.test.js`).

| Rôle | Valeur | Token CSS |
|---|---|---|
| Fond | `#FFFFFF` | `--color-bg` |
| Surface neutre | `#F4F6F5` | `--color-surface` |
| Bordure | `#E3E8E6` | `--color-border` |
| Texte encre | `#10231D` | `--color-ink` |
| Texte secondaire (gris vert) | `#4A5E57` | `--color-ink-2` |
| Action / marque émeraude (texte blanc dessus) | `#0B7A5E` | `--color-brand` |
| Menthe — bien-être (fond / texte / étiquette) | `#E3F5EE` / `#3B5249` / `#0B6B53` | `--mint-bg`, `--mint-text`, `--mint-label` |
| Pêche — ventre | `#FFEBDD` / `#5A4033` / `#8A3A12` | `--peach-bg`, `--peach-text`, `--peach-label` |
| Lilas — pistes (fond / texte / barre) | `#ECE9FF` / `#3E3870` / `#4B3FC9` | `--lilac-bg`, `--lilac-text`, `--lilac-bar` |
| Orange (badges, texte blanc) | `#C2410C` | `--color-badge` |
| Ambre, menthe vive (accents graphiques, points de mesure — **jamais du texte**) | `#FFB84D`, `#5EE0B5` | `--accent-amber`, `--accent-mint` |
| Graphiques : barres secondaires, ligne de référence | `#B9DCCD`, `#6FA893` | `--chart-bar-2`, `--chart-ref` |

**Thème sombre** : optionnel (Paramètres → Apparence : Clair par défaut / Sombre / Comme le téléphone), recalé sur
ces tokens : fond encre, émeraude éclaircie, pastels assombris ; contrastes vérifiés par le même test.

## 4. Typographie

- **Figtree** pour tous les mots : titres 800, titres de cartes 700, texte 400 à 600.
- **IBM Plex Mono** pour les chiffres et les données (mesures, sources, délais, statistiques, étiquettes, dates
  courtes) — **jamais pour des phrases**.
- Licence **SIL OFL 1.1** pour les deux (usage commercial autorisé). Fichiers **embarqués dans l'app** (paquets
  `@fontsource-variable/figtree` et `@fontsource/ibm-plex-mono`, sous-ensembles latins), **aucun chargement depuis
  Google Fonts** (hors ligne, vie privée).

## 5. Formes

- Cartes : rayon **22 px**, **sans ombre**.
- Boutons pilule **52–56 px** de haut : principal émeraude plein ; secondaire contour encre 2 px.
- Choix / options : rayon **18 px**, bordure 2 px, rond radio.
- Étiquettes : rayon **10 px**, mono 11–12 px.
- Cibles tactiles **≥ 44 px** ; marges latérales **20 px**.

## 6. Icône « H nuit »

Sur fond encre `#10231D` : un H blanc à deux barres arrondies, dont la barre centrale est une **courbe menthe vive
qui monte**, avec un **point ambre** au milieu (un point de mesure). Référence (viewBox `0 0 108 108`, grille des
icônes adaptatives Android), sur un arrière-plan uni `#10231D` :

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">
  <rect width="108" height="108" fill="#10231D"/>
  <rect x="30" y="28" width="11" height="52" rx="5.5" fill="#FFFFFF"/>
  <rect x="67" y="28" width="11" height="52" rx="5.5" fill="#FFFFFF"/>
  <path d="M36 64 C46 64 46 50 54 50 C62 50 62 42 72 42" fill="none" stroke="#5EE0B5" stroke-width="7" stroke-linecap="round"/>
  <circle cx="54" cy="50" r="5.5" fill="#FFB84D"/>
</svg>
```

Déclinaisons : icône adaptative (avant-plan vectoriel + arrière-plan `#10231D`), couche **monochrome** (icônes à
thème d'Android 13+, même glyphe une couleur), **icône de notification blanche**, **écran de démarrage**, plus tard
512×512 pour la fiche Play. Glyphe dans la **zone sûre de 66 dp** (disque de rayon 33 autour de (54, 54)) : le coin d'une barre, (30, 28),
est à 35,4 du centre → il déborde ; réduit de 10 % autour du centre (`translate(54 54) scale(0.9)
translate(-54 -54)`), il passe à 31,9 ✔. Vérifier le rendu en masque rond et carré. Si le nom définitif ne commence pas par H, le propriétaire
fera adapter l'icône : ne pas l'anticiper.

## 7. Maquettes validées (structure et textes à reproduire, adaptés aux vraies données)

### Accueil « Aujourd'hui »
- Petite ligne mono « mar. 20 oct. · Bonjour <prénom> » ; titre-résumé en phrase (« Plutôt une bonne journée »).
- Carte **menthe** « Bien-être estimé » : grand chiffre « 3,4 / 5 » (Figtree 800), écart à la moyenne en mono,
  courbe des 14 derniers jours, « Un peu mieux que votre moyenne des 14 derniers jours. Une estimation, pas un
  diagnostic. » ; « détails » remplace la phrase par IC 95 %, n lectures, moyenne 14 j et modèles.
- Trois tuiles de mesures (sommeil, VFC nuit, pas ; chiffres en mono ; source en mode détails).
- Carte **pêche** « Votre ventre » : Calme / Gêne / Douleur en un geste, heure de la dernière saisie, bilan 7 jours en
  mode détails.
- Boutons « Photo du repas » (principal) et « Une note » (secondaire).
- Carte **lilas** « Vos pistes arrivent dans N jours » : barre X/21, « On préfère attendre plutôt que de vous montrer
  de faux suspects. » ; en détails : délais testés et correction des comparaisons multiples.
- Navigation **4 onglets** : Aujourd'hui, Journal, Pistes, Sources ; réglages via un bouton en haut à droite.

### Onboarding, premier écran
- Barre de progression + « 01/09 » en mono ; illustration douce sur carte menthe.
- « Comprenez ce qui va avec vos bons et mauvais jours » ; « Repas, sommeil, montres et bien-être, analysés sur votre
  téléphone. »
- Trois tuiles chiffres : « 0 Mo envoyé sans votre accord », « 2–48 h de délai entre repas et ventre », « 1 geste
  pour tout exporter ».
- « Qu'est-ce qui vous amène ? » : choix 01 / 02 / 03 — Mon ventre (SII, ballonnements, inconforts digestifs) ; Mon
  énergie et mon sommeil (fatigue, nuits, récupération) ; Tout comprendre de mes données (toutes mes montres, tout
  mesurer).
- Ligne cadenas « Local par défaut · l'IA seulement si vous le voulez » ; bouton « Continuer ».

### Pistes
- Ligne mono (« 42 jours · 61 repas · délais 2–48 h ») + titre « Vos pistes ».
- Encart « Des liens repérés dans vos données, pas des causes ni un diagnostic. Parlez-en à votre médecin. »
- Une carte dépliable par piste : étiquette de solidité (« piste solide » menthe, « à confirmer » pêche, « trop tôt
  pour dire » gris), titre « facteur → effet », délai principal ; dépliée : phrase simple (« Les jours où vous en
  mangez, gêne 2 fois sur 3. Les autres jours, 1 fois sur 4. »), barres de la force du lien selon le délai (2, 6, 12,
  24, 48 h, ligne « aucun lien »), statistiques mono (RR, IC 95 %, jours exposés, p ajusté), action « Vérifier avec
  une réintroduction guidée ».
- En bas : « Rapport PDF pour mon médecin ».

### Paywall
- Étiquette « premium » + bouton fermer (passable).
- « Passez de « je note » à « je comprends » » + phrase contextuelle (« Vous avez 21 jours de données. Voyons ce
  qu'elles racontent. »).
- Quatre bénéfices cochés : pistes personnelles avec délais de 2 à 48 h ; réintroduction FODMAP guidée ; rapport PDF
  pour le médecin ; analyse IA des repas sans compter.
- Encart « Toujours gratuit : journal, imports des montres, bien-être auto, graphiques et export de vos données. »
- Formules (radio) : **Annuel 29,99 €/an** « soit 2,50 € par mois », badge orange « −50 % », présélectionné ;
  Mensuel 4,99 €/mois.
  ⚠️ *Note du 21/10 08:30 (politique Play « Subscriptions »)* : mettre en avant le prix mensuel d'un annuel est une
  violation → « soit 2,50 € par mois » reste plus petit et secondaire que « 29,99 €/an », jamais dans le bouton
  (`IDEES.md` I136).
- Frise de l'essai : aujourd'hui tout est débloqué · jour 12 on vous prévient · jour 14 1er paiement, sauf si vous
  annulez.
- Bouton « Essayer 14 jours gratuitement » (mensuel choisi → sans essai, bouton et mention adaptés) ; « Puis 29,99 €
  par an. Rappel 2 jours avant la fin de l'essai. Annulable à tout moment dans Google Play. » ; liens restaurer un
  achat · conditions · confidentialité.
- Version finale : **prix lus dans Play Billing, jamais codés en dur**.

## 8. Mise en œuvre (un run = une étape ; captures claires ET sombres à chaque fois)

| Étape | Contenu | État |
|---|---|---|
| (i) | Tokens (variables CSS) + polices embarquées + thème clair par défaut ; thème sombre en option recalé | 🟡 21/10 00:30 — voir le compte rendu du run |
| (ii) | Icône adaptative Android + monochrome + icône de notification + écran de démarrage | ✅ 21/10 04:30 — glyphe réduit à 90 % (coin le plus éloigné à 31,8 dp du centre, zone sûre 33) ; logo de l'en-tête et icône Play 512 px générés par `app/scripts/brand/render-icons.mjs` |
| (iii) | Écran Accueil « Aujourd'hui » selon la maquette | ✅ 21/10 12:30 — `MoodEstimateCard` (menthe), `TodayCards` (tuiles, ventre pêche, pistes lilas), bouton « détails » unique pour la page (retenu) ; prénom à venir avec l'onboarding ; « VFC » sans « nuit » tant que la source ne distingue pas la nuit ; navigation 4 onglets = étape suivante (2c) |
| (iv+) | Chaque écran quand le chantier produit le touche (onboarding, pistes, paywall, Journal, Sources) | ⬜ |
