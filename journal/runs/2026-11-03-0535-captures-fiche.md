# Run du 03/11/2026 05:35 (Paris, CET) — Captures de la fiche Play refaites avant les testeurs

**Type** : 🔧 run de code (fiche du Store et script des captures ; rien ne change dans l'app).

## Constat au démarrage
- Main à `6dd5e1a`, tous les workflows verts (Build & Release, Play — AAB 100729 en test interne, Tests, émulateur).
  Aucune PR [Auto] ouverte, aucun autre run en cours.
- Priorités du 02/11 : faites ou en attente du propriétaire (Alpha 100721 en examen chez Google, invitation P41 ;
  `until` 27/11 et `iosUntil` 06/11 servis ; App Attest en observation ; P36 livrée ; GOLD-a3 attend P37). L'état
  d'examen d'Alpha n'est pas lisible par l'API (la piste dit « completed » pendant l'examen) : rien à recaler tant que
  le propriétaire n'a pas dit le jour de l'invitation.

## Fait
- **Captures de la fiche Play** (`app/store/listing/fr-FR/phone-screenshots/`) : celles en ligne dataient du 22/10
  (onglet « Pistes », sélecteur « Analyse simple / avancée », boutons « détails », refrain « pas un diagnostic »),
  c'est-à-dire ce que les testeurs verraient sur la fiche en arrivant. Refaites sur la version actuelle, variante
  play, abonnement Gold factice (pas d'aperçu flouté sur la fiche), données de démo synthétiques, 1080 × 1920 :
  01 Aujourd'hui, 02 Analyses, 03 Repas, 04 Historique du bien-être, 05 Réintroduction guidée, 06 Jours.
  L'image de présentation est inchangée (rendu identique à l'œil, octets différents : gardée pour ne rien renvoyer).
- Liste des captures sortie dans `scripts/store/screenshots.mjs` (sans dépendance) + test-garde
  `scripts/store/build-store-assets.test.mjs` : fichiers commités = liste, 1080 × 1920, routes existantes, aucun nom
  d'onglet périmé, variante play avec abonnement.
- Envoi : le workflow « Play — fiche du Store » se déclenche au merge (chemins `app/store/**`) ; il remplace les
  captures seulement si leurs empreintes changent.

## Vérifications
- Voir la PR (tests, build, visuel, lint du script). Captures relues une à une.

## Suite
- Après le merge : vérifier que « Play — fiche du Store » est vert (captures remplacées).
- Quand le propriétaire dit le jour de l'invitation : recaler `until` si J ≠ 03/11. 07/11 : bilan du relais
  (`premium=false` pour l'iPhone). GOLD-a3 attend P37.
