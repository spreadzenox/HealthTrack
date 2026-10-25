# Run du 25/10/2026 08:33 (Paris, CET) — idées : audit de la version candidate

**Type** : 💡 idées (run de 08 h : pas de code produit)

## Pourquoi
Le polissage demandé par le propriétaire le 24/10 vers 15:00 est livré (POL-2 à POL-8 ; POL-1 a/b/c côté app,
POL-1d attend P28). Les critères C1 à C5 de la version candidate sont presque verts : il fallait savoir ce qui reste
avant de publier en alpha et d'inviter les testeurs.

## Constat au démarrage
- Main à `be7e287` (#356, journal v268) ; tous les workflows de main verts ; aucune PR « [Auto] » ouverte (seule #51
  `cursor/*`, non touchée).

## Ce qui a été fait
- Audit en captures : `npm run visual -- --play --empty` (clair, 14 pages) et `--play --dark` sur données de démo
  (Accueil, Analyses, Sources, Journal) ; 0 erreur JS, 0 débordement. Défauts VC-22 à VC-27 + AVIS (`IDEES.md` I165,
  `BACKLOG.md` section « Version candidate », avec fichiers et lignes).
- Veille fin de test fermé (I166, sources tierces) → `INVITATION-TESTEURS.md` : consigne « ouvrir l'app tous les 2-3
  jours, ne pas quitter le test » et rappel du jour 7 ; VC-PUBLIER et P30 (formulaire d'accès à la production) au
  BACKLOG.
- Device recall de Play Integrity (piste ouverte le 24/10 pour les crédits après réinstallation) : bêta réservée à
  des partenaires → I167, CREDITS-INSTALLS (mesure seulement).
- Recommandation : POL-1d (déverrouillage en play) après la version candidate, dans une version séparée.
- PRODUIT.md (journal d'avancement, C2 en 🟡 le temps de VC-22 à VC-27), BACKLOG (prochaines étapes), résumé de la semaine.

## Vérifications
- Journal seul ; `npm run test` : 179 fichiers, **2 194** Vitest verts.

## Suite proposée
- Run de code suivant : VC-22 + VC-25 + VC-27 (textes), puis VC-23 + VC-24 (Analyses), VC-26 (Accueil vierge), AVIS,
  puis **VC-PUBLIER** (dates de la période de lancement, alpha, « 👉 Version candidate prête »).
- Run lundi 26/10 : archiver S43 dans `semaines/2026-S43.md`.
