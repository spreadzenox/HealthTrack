# 2026-10-11 12:30 UTC — Nutrition : niveau d'activité et profil dans la sauvegarde

**Type** : 🏗️  ·  **PR** : #PRNUM

## Pourquoi
- Démarrage : aucune PR [Auto] ouverte, « Build & Release » v93 (PR #101) vert, APK publié.
- Derniers runs : 🐛 🎨 🏗️ 🔭 🐛 → travail de fond, dans la suite directe du run 10:30 (« Suite proposée »).
- Deux limites laissées par le profil Nutrition :
  1. L'énergie recommandée valait toujours métabolisme de base × 1,55 (« modéré »), pour un sédentaire comme pour
     quelqu'un qui fait 12 000 pas par jour. L'écart va jusqu'à ±15 % (≈ ±350 kcal), et il se répercute sur les
     repères glucides, lipides, sucres et graisses saturées, qui découlent de l'énergie.
  2. Le profil saisi (sexe, année, taille) était en `localStorage` mais absent de la sauvegarde JSON : il était perdu
     à la réinstallation, alors que la sauvegarde est censée « tout » contenir.

## Ce qui a été fait
- `nutrientReferenceIntakes` : `ACTIVITY_LEVELS` (Sédentaire ×1,4 · Modérément actif ×1,55 · Actif ×1,7 ·
  Très actif ×1,85, facteurs PAL des repères EFSA/FAO) ; `activityFromSteps` (seuils Tudor-Locke : < 5 000,
  5 000, 7 500, 10 000 pas). `computeDailyEnergyKcal` applique `profile.activity` (×1,55 par défaut, comme avant).
- `bodySettings` : champ `activity` ; `sanitizeBodySettings` exporté (réutilisé pour les fichiers de sauvegarde).
- `getBodyProfile(entries, now)` : activité choisie > estimée d'après la **moyenne des pas des 14 jours précédant
  aujourd'hui** (journée en cours exclue, jours sans pas ignorés, ≥ 7 jours requis ; totaux par jour via
  `buildDailyJournal`, qui gère les doublons total/échantillons) > défaut. `origins.activity`, `meanSteps`, `stepsDays`.
- `BodyProfileCard` : ligne « Activité : Actif (≈ 8 538 pas/jour en moyenne sur 8 jours) » / « (par défaut) » ;
  formulaire : pastilles Automatique / Sédentaire / Modérément actif / Actif / Très actif, avec une phrase
  d'explication. L'activité par défaut ne déclenche pas l'avertissement « valeurs par défaut » (c'est une hypothèse
  raisonnable, pas une donnée manquante).
- Sauvegarde : `exportToJson` ajoute `profile` (s'il n'est pas vide, `version` reste 1 : les anciennes versions de
  l'app ignorent ce champ). `parseBackup` renvoie `profile` nettoyé (ou `null`). `importFromJson` : « Remplacer »
  restaure le profil du fichier (un ancien fichier sans profil garde le profil actuel) ; « Ajouter » ne complète que
  les champs vides. Le résultat indique `profileRestored`.
- Page Données : l'aperçu affiche « Profil : femme · née en 1990 · 163 cm · actif », et le message final « Profil
  (sexe, âge, taille, activité) restauré » ; le texte d'export mentionne le profil.

## Vérifications
- Tests : 743 ✅ (721 avant, +22 : bodySettings 2, repères 3, bodyProfile 4, page Nutrition 3, stockage 7,
  page Données 3, écrits avant le code) · Lint : 7 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : 8 pages en démo et 8 pages en `--empty`, sans erreur JS ni débordement. Nutrition en démo : « Activité :
  Modérément actif (≈ 7 042 pas/jour en moyenne sur 14 jours) », énergie ~2 619 kcal ; en vide : « (par défaut) »,
  ~2 507 kcal (inchangé). Formulaire (`--click="Modifier"`) : 5 pastilles ≥ 44 px sur 3 lignes, lisibles. Données :
  texte d'export à jour.

## Apprentissages / décisions
- Les pas sous-estiment le vélo, la natation et la musculation : c'est pourquoi le choix manuel existe et prime. Le
  facteur reste un **repère** ; la vraie dépense adaptative (TDEE à partir du poids et des apports, R#18) reste au
  backlog.
- Pas de migration IndexedDB : le profil reste en `localStorage`, la sauvegarde le transporte à côté des entrées.
- En mode « Ajouter », c'est le profil de l'appareil qui prime : une sauvegarde ancienne ne doit pas écraser une
  saisie récente.

## Suite proposée
- 🐛 Heure `datetime-local` sur l'A56 ; « Déconnecter Withings » affiché sans connexion (Paramètres).
- 🏗️ Régularité du sommeil étape 2 (variable des Analyses) ; effets décalés étape 2 ; Capacitor 8.4.
- 🏗️ TDEE adaptatif (R#18) quand poids et repas sont réguliers : comparer à l'estimation par l'activité.
