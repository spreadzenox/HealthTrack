# Run 16/11 17:30 — REFONTE-UPG-1 : l'essai en cours sur l'Accueil

**Type** : run de code  ·  **Android** : main vert (Tests, Build & Release, Play — AAB, émulateur A56 sur be4f9f6)  ·
**TestFlight** : 1107.1107 chez « Testeurs Halcya » (inchangé ; la build du soir sera ajoutée après l'Alpha de 23:45)
·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions conforme (69177875…). Les quatre fichiers lus en entier.
- PR de la routine ouvertes : #1042 (outil `--legacy`, ouverte depuis plus de 90 min : à finir, il ne lui manquait
  que la build iOS) et #1043 (UPG-2, empilée sur #1042, ouverte depuis 46 min : laissée au run de 16:30, aucun
  fichier en commun avec ce run hors journal). #51 (cursor) pas touchée.

## Fait
1. **REFONTE-UPG-1** (TDD, PR #1044) : la carte « Agir » de l'Accueil dit l'essai en cours, sa consigne en titre
   (« Dormir au moins 7 h 30 ») et « Essai · jour 4 sur 10 · aujourd’hui, jour avec » (ou « jour sans », les mots
   d'Agir) ; deux essais : « 2 essais en cours · … » et le lien ouvre Agir. Un jour « avec », la carte remonte juste
   sous « Bien-être aujourd’hui ». Sans essai : inchangée. `homeTrial()` (services/trials.js) ne lit que les entrées
   `trial` (budget de lectures inchangé à l'échelle). Tests : `trials.test.js` (3), `Dashboard.test.jsx` (position).
2. Vérifications locales : 3 684 tests verts, lint sans erreur, build, `npm run visual` complet sans erreur ;
   captures de l'Accueil regardées : `--trial=4` (clair, jour avec, carte sous le bien-être), `--trial=3 --dark`
   (jour sans, carte en bas ; première version trop longue sur deux lignes, raccourcie), démo sans essai inchangée.
3. iPhone : aucun correctif de `iphone/patches/` ne touche `Dashboard.jsx`, `trials.js` ni `More.css` ; repris tel
   quel par la build iOS de la PR.
4. Nouveautés : `2026-11-16-1730-essai-accueil.json` (« Votre essai sur l’Accueil »).
5. **#1042 mergée** (squash, 32d6ade) : tous ses checks verts, build iOS comprise ; outillage seulement, aucun écran
   de l'app touché ; branche à jour sur main. Branche de #1044 mise à jour par un merge de main (pas de réécriture).

## Suite
- Merger #1044 après ses checks (build iOS et captures iPhone de l'Accueil comprises).
- #1043 (UPG-2, empilée sur #1042) : à mettre à jour sur main puis à finir. Sa note de Nouveautés et celle de ce
  run sont du même jour : vérifier que le bandeau met bien la navigation en avant quand elle est non lue.
- UPG-3 : passage complet des personas (installation neuve, et `--legacy`) avant le 22/11 ; puis Pilou (étape 8).
