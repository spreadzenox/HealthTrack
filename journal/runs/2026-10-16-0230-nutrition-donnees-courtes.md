# 2026-10-16 02:30 Paris (00:30 UTC) — Nettoyage : Nutrition et Vos données plus courtes (D1)

**Type** : 🧹 D1  ·  **PR** : « [Auto] Nettoyage : Nutrition et Vos données plus courtes »

## Pourquoi
- Démarrage : main à `184dc52` (#175) ; « Tests », « Build & Release » (v139) et émulateur A56 verts. Aucune PR
  « [Auto] » ouverte (`cursor/*` #51 hors routine, non touchée). Aucun nouveau journal dans `journal/diagnostics/`.
- 02:30 Paris = run normal → D1 en tête du backlog. Restes D1 listés : page Données (paragraphe « Exporter » de 7
  lignes) et Nutrition à relire. Les captures avant le confirment : Données = 3 paragraphes (intro 5 lignes, export
  8 lignes dont le mode d'emploi navigateur, import 5 lignes) ; Nutrition = intro de 3 lignes + carte profil de 9
  lignes avant la première donnée.

## Ce qui a été fait
- **`BodyProfileCard`** (affichage seulement ; le formulaire ne change pas) : 7 lignes « Libellé : valeur » →
  2 lignes : `77,2 kg (Withings, 13/10) · 170 cm (par défaut) · IMC 26,7` puis
  `Homme (par défaut) · 30 ans (par défaut) · Modérément actif (≈ 7 042 pas/jour sur 14 jours) · ~2 619 kcal/jour`.
  Chaque valeur par défaut reste marquée « (par défaut) », l'avertissement reste. Séparateur ` · ` collé à la
  valeur précédente (une ligne repliée ne commence jamais par « · »), « IMC » insécable, date de pesée en jj/mm.
  « Non renseigné (par défaut : homme) » devient « Homme (par défaut) » (la valeur réellement utilisée).
- **`Nutrition`** : paragraphe d'introduction retiré ; son information est reprise dans la ligne de période
  (« Moyenne **par jour saisi** · 10 oct. – 16 oct. · 8 repas · 5 jours ») et dans la note du bas (« Repères ANSES
  pour un adulte, ajustés à votre profil… »).
- **`Data`** : intro 2 lignes ; export « Un fichier avec toutes vos entrées et votre profil, rangé dans
  **Documents**. » ; import « Vous verrez son contenu avant de choisir : ajouter (sans doublons) ou remplacer. »
  Le chemin exact (Fichiers > Téléphone > Documents) est donné **après** l'export, avec le nom du fichier, là où il
  sert. Le mode d'emploi navigateur disparaît de la page (le message après téléchargement navigateur reste).

### Retiré et pourquoi (D1)
| Retiré / fusionné | Pourquoi |
|---|---|
| Intro Nutrition (3 lignes) | Redit la ligne de période et la note du bas ; fusionnée dans les deux |
| Libellés « Poids : / Taille : / Sexe : / Âge : / Activité : / IMC : / Énergie : » | 7 lignes pour 7 nombres ; les unités suffisent à les lire |
| Paragraphe « Exporter » (8 lignes) | Mode d'emploi navigateur inutile sur Android ; le chemin est dit après l'export |
| Paragraphe « Importer » (5 lignes) | Le contexte « après une réinstallation » est déjà dans l'intro |

## Vérifications
- Vitest : **1280 ✅** (+2 : carte profil en 2 lignes sans libellés ni intro ; page Données sans mode d'emploi
  navigateur ; 3 tests ajustés au nouveau texte).
- Build ✅. Lint : **6 erreurs** (inchangé).
- `npm run visual` : 8 pages ok, aucune erreur JS ; relues `nutrition-1` (avant / après), `data-1` (avant / après) ;
  `--empty` (Nutrition « Compléter mon profil » : 2 lignes + lien Withings) et `--light` ok.

## Sécurité / vie privée
- Rien ne sort du téléphone ; aucune donnée ni schéma modifié ; export / import inchangés (seul le texte change).

## Apprentissages / décisions
- Pour les lignes « a · b · c » en français sur mobile : espace insécable avant « · » sinon la ligne suivante
  commence par un point.

## Suite proposée
1. 🧹 D1 : I85 ② (« Voyage » par fuseau, « Repas tardif » par repas saisis) ; relire Repas (`food-*`) et Analyses
   (titres et explications en double) ; avertissement « repas manquants » de Nutrition (4 lignes) à resserrer.
2. ⚡ D2 : lecture `heart_rate` partagée / par sous-type pour l'Accueil (12,5 k → ≈ 3 k enregistrements).
3. 🔁 D5 : I84 (« Stress » ressenti côté Y) + `ESTIMATOR_INPUTS` et test anti-circularité.
