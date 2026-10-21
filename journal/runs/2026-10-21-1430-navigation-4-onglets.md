# 2026-10-21 14:30 Paris (12:30 UTC) — Jalon 2c : navigation en 4 onglets

**Type** : 🛠️ code (jalons 2 et 2 bis) · **PR** : « [Auto] Navigation en 4 onglets (Aujourd'hui, Journal, Pistes, Sources) + réglages en haut à droite »

## Pourquoi
- Main à `4b2d571` (#251), tous les workflows verts (Tests, Build & Release v195, Play — AAB 337, émulateur A56),
  aucune PR « [Auto] » ouverte. Signalement du 20/10 19:05 déjà corrigé.
- 14:30 Paris → run de code. `PRODUIT.md` / `BACKLOG.md` : prochaine étape **2c** (navigation 4 onglets de la maquette).

## Ce qui a été fait
- **`TabBar`** : 4 onglets **Aujourd'hui** (`/`), **Journal** (`/food`, actif aussi sur `/nutrition`), **Pistes**
  (`/recommendations`), **Sources** (`/connectors`, actif aussi sur le retour Withings). Nouvelles icônes (soleil,
  carnet, courbe, montre). Aucune route changée : liens internes, retours Withings et tests e2e intacts.
- **`SettingsButton`** (roue, 44 px, en haut à droite de l'en-tête) → `/plus`, devenue **« Réglages »** (Données,
  Paramètres, Nouveautés ; Connecteurs retiré car devenu un onglet). Pastille « nouveautés non lues » déplacée de
  l'onglet Plus vers la roue. Aucun onglet actif sur les pages de réglages.
- **`JournalTabs`** : sous-onglets pilule **Repas | Nutrition** en tête des deux pages (Nutrition perd son onglet).
- Titres : « Connecteurs » → **« Vos sources »**, « Analyses » → **« Vos pistes »**. Textes qui renvoyaient à
  « Plus → Paramètres », « Plus → Nouveautés » ou « les Analyses » mis à jour.
- **`config/brand.js`** : `APP_NAME`, source unique du nom affiché dans l'en-tête (nom provisoire, décision du 20/10).
  À étendre aux autres textes qui contiennent « HealthTrack » quand le nom sera choisi.
- Données : rien ne change (aucune migration, export / import intacts).

## Vérifications
- `npm run test` : **1 730 verts** (135 fichiers) ; `npm run lint` : 6 erreurs (= main) ; `npm run build` ✅ ;
  `npm run perf -- --budget` ✅.
- `npm run visual` complet sans erreur JS + `--dark` sur accueil / journal / nutrition / réglages ; captures lues :
  accueil (sombre), Journal-Repas (sombre), Nutrition (sombre), Réglages (sombre, roue active), Sources et Pistes
  (clair, onglet actif menthe).

## Pas fait (volontairement, un run = une étape)
- Le « journal des jours » (« Vos derniers jours ») reste sur l'accueil : le déplacer dans l'onglet Journal (avec les
  notes du ventre) est la suite logique, avec 2b (inventaire chiffré des cartes de l'accueil).
- Écran Pistes de la maquette (cartes dépliables, délais) : jalon 5.

## Suite proposée
- 2b + 2c-2 : inventaire de l'accueil, « Vos derniers jours » → onglet Journal (Repas | Ventre | Nutrition ?), radar
  et graphiques plus bas ou dans Pistes.
- 3b-3 « Lecture rapide » play ; 3c dès P10/P11 ; jalon 4 onboarding.
