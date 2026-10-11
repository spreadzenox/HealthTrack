# 2026-10-11 10:30 UTC — Nutrition : repères calculés pour la bonne personne

**Type** : 🐛  ·  **PR** : #101

## Pourquoi
- Démarrage : aucune PR [Auto] ouverte, « Build & Release » v92 (PR #100) vert sur main.
- Derniers runs : 🐛 🐛 🔭 🏗️ 🎨 → chasse aux bugs (≥ 1 run sur 4, le dernier 🐛 remontait à 4 runs).
- Vérification visuelle complète (démo + `--empty`) : 8 pages sans erreur JS ni débordement. En mode vide, la page
  Nutrition affichait « Poids : 70 kg · Taille : 170 cm · ~2 507 kcal/jour » comme des données réelles.
- En remontant le calcul (`bodyProfile.js` → `nutrientReferenceIntakes.js`) :
  1. **Sexe Withings inversé** : `withingsApi` lisait `gender === 1` comme homme ; l'API Withings documente 0 = homme,
     1 = femme. Un homme connecté à Withings recevait les repères d'une femme (fer 16 mg au lieu de 11, magnésium 300
     au lieu de 380, zinc 9,4 au lieu de 11, énergie −166 kcal), et inversement.
  2. **Valeurs par défaut silencieuses** : sans Withings, tout était calculé pour un homme de 30 ans, 70 kg, 170 cm,
     sans aucun moyen de le changer (seul message : « connectez votre balance Withings »).

## Ce qui a été fait
- `withingsUserToProfile` (pur, testé) : 0 = homme, 1 = femme. Le profil Withings mis en cache porte désormais `v: 2` ;
  un profil enregistré par l'ancienne version (sans `v`) voit son sexe inversé **une seule fois** à la lecture, puis
  réécrit — sinon la correction n'aurait touché que les nouvelles connexions (le profil n'est relu qu'à l'OAuth).
- `settings/bodySettings.js` : profil saisi dans l'app (sexe, année de naissance, taille) en `localStorage`, valeurs
  invalides écartées (année 15–110 ans, taille 100–250 cm).
- `getBodyProfile` : priorité profil saisi > Withings > défaut, avec `origins` par champ (`manual` / `withings` /
  `default`) ; la pesée la plus récente **de toute source** (Withings ou saisie `app_weight`).
- `components/BodyProfileCard.jsx` (page Nutrition) : « Votre profil » avec la provenance de chaque valeur
  (« (Withings, 08/10/2026) », « (saisi le …) », « (par défaut) », « non renseigné (par défaut : homme) »), message
  si une valeur est par défaut, bouton « Compléter mon profil » / « Modifier » → formulaire (Femme / Homme en pastilles
  ≥ 44 px, année, taille, poids avec virgule, erreurs claires). Un nouveau poids crée une entrée `weight` source
  `app_weight` (pesée du jour, supprimable dans « Vos derniers jours », comptée dans les analyses et la sauvegarde) ;
  une valeur Withings non modifiée reste « Withings ».

## Vérifications
- Tests : 721 ✅ (703 avant ; +5 bodySettings, +4 profil Withings, +5 bodyProfile, +4 page Nutrition — écrits avant
  le code pour le profil et la page) · Lint : 7 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : 8 pages démo + 8 pages `--empty` sans erreur JS ni débordement ; Nutrition démo (Withings poids, reste par
  défaut), vide (4 « par défaut » + lien Withings), formulaire ouvert (`--click="Compléter mon profil"`).
- Parcours réel (Playwright, script ad hoc) : saisie Femme / 1990 / 163 cm / 58,4 kg → carte « 58,4 kg (saisi le
  11/10/2026) · Femme · 36 ans · ~1 956 kcal » ; tableau de bord : « 10:39 Poids 58,4 kg — Supprimer ». Aucune erreur JS.

## Apprentissages / décisions
- Profil (sexe, année, taille) en `localStorage` et pas dans IndexedDB : pas de migration de schéma ; **limite** : il
  n'est pas dans la sauvegarde JSON (le poids, lui, y est). Noté au backlog.
- Le niveau d'activité reste fixé à ×1,55 (modéré) : à rendre réglable ou à déduire des pas plus tard.
- Le « 1675 mg/j » sans espace des captures n'est pas un bug : Intl met une espace fine insécable (U+202F) que la police
  rend très étroite à côté d'un « 1 ». Doublon retiré du backlog.

## Suite proposée
- 🏗️ Profil dans la sauvegarde JSON (champ optionnel `settings`, anciens fichiers toujours acceptés) ; niveau d'activité.
- 🐛 Heure `datetime-local` sur l'A56 ; « Déconnecter Withings » affiché sans connexion (Paramètres).
- 🏗️ Régularité du sommeil étape 2 (variable des Analyses) ; Capacitor 8.4.
