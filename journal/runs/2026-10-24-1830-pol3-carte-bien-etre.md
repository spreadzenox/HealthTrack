# 2026-10-24 18:30 Paris (16:32 UTC) — POL-3 : carte « Bien-être estimé »

**Type** : 🧭 chantier produit (polissage du parcours, retours du propriétaire du 24/10 vers 15:00, point 3)

## Constat au démarrage
- Main à `169a0ec` (#327), workflows de main verts (Tests, émulateur ; Build & Release v254 et Play — AAB sur `ce45c6e`).
  Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).

## Ce qui a été fait
- **Geste « détails »** : `DetailsToggle` n'est plus un bouton texte « simple / détails » mais un **chevron** dans un
  rond discret (cible 44 px, `aria-expanded`, « Afficher / Masquer les détails »), qui pivote à l'ouverture (sans
  animation si « réduire les animations »). Il s'applique partout où il existait : cartes bien-être, ventre et pistes de
  l'Accueil, paywall (« En préparation »), profil Nutrition. Icônes `chevron` et `plus` ajoutées à `LineIcon`.
- **Détails visuels du bien-être** : la liste de texte (fourchette, n, moyenne, confiance, modèle + 3 phrases de
  `describeFaceMood`) devient : barre de la fourchette sur 0–5 (`MoodRange`, déjà là mais inutilisée), « entre x et y »,
  **badge de confiance** à trois points (faible 1, moyenne 2, bonne 3), pastilles « N lectures auj. » et « moy. x · N j »,
  le modèle en petit. La phrase simple reste sous les détails (ils s'ajoutent, ne remplacent plus). Les phrases
  détaillées (cadrage, éclairage, éveil) iront dans l'historique du bien-être (POL-2).
- **Bien-être manuel discret** : « + Noter moi-même » en bas de la carte (aussi dans l'état vide sans lecture du
  visage) ouvre la note 0–5 avec ses tags. Le bouton « Ajouter une note » sous la carte disparaît (doublon) ; les textes
  qui le citaient (Analyses, graphiques du bien-être) renvoient à « Noter moi-même ».
- **Fin de la demande automatique** : `WellbeingPrompt` n'a plus de mode « non contrôlé » (ouverture d'elle-même une
  fois par session) ; `Layout` ne la monte plus. Les notes du soir données depuis la notification restent importées par
  `useAutoSync` (vérifié). Option `--wellbeing-prompt` de `npm run visual` retirée (remplacée par
  `--click="Noter moi-même"`).
- Nouveauté `2026-10-24-1830-carte-bien-etre.json`.

## Vérifications
- Vitest 2 145 verts (tests mis à jour : chevron, détails visuels, « Noter moi-même » ×2, Dashboard, WellbeingPrompt
  ne s'ouvre plus seule), build OK, lint inchangé (6 erreurs préexistantes).
- Captures relues : Accueil démo clair (fermé), démo sombre détails ouverts (bien-être, tuiles, ventre), `--empty --play`
  (carte vide avec « Noter moi-même »), paywall play (chevron « En préparation »).

## Suite
- Prochain run de code : **POL-2** (historique du bien-être : ce que sortent les modèles, page jour / semaine / mois,
  ouverte depuis la carte — par exemple en touchant le chiffre ou la courbe).

## Après le merge (#328, `fd5f407`)
- Checks de la PR tous verts (Vitest, Build APK, Relais, montre Java, budget de lectures, émulateur API 35 et 36).
- « Build & Release » vert : **v255** publiée (APK 33 740 193 octets, 33,7 Mo) ; « Play — AAB » vert (envoi en test interne).
