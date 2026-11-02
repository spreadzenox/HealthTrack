# Run du 02/11/2026 15:56 (Paris, CET) — audit Play sur données vierges, en clair

**Type** : 🔧 code (audit, journal seul)

## Constat au démarrage
- Main à `df3f8e5` (#630) ; « Tests », « Build & Release », « Play — AAB » et émulateur verts ; aucune PR « [Auto] »
  ouverte (seule la #51, brouillon Cursor, non touchée).
- Demandes reprises : **I6-RELAIS** (01/11) : tout le code est livré ; 5e attend **P38**. **GOLD-a3** attend P37,
  **GOLD-b6** attend P36. **Montre Huawei** (21/10) : attend des confirmations sur la vraie montre. Donc : polissage
  de la version Play (POL-PLAY-12, demande du 27/10), suite indiquée par le run de 14:48 (onboarding et Paramètres en clair).

## Fait
- Audit `npm run visual -- --play --empty` en clair, captures lues : onboarding écran 1 (objectif), 2 (suivis),
  3 (montre), 4 (premier geste ventre, après « Pas de montre »), 5 (paywall de fin, Silver annuel avec essai),
  Paramètres (2 écrans), page Premium avec Gold choisi (mensuel 9,99 €, « jusqu’à 20 par jour »).
- Rien à corriger : textes courts, compteur « 01/07 » puis « 04/05 » voulu (POL-PLAY-61), bouton « Continuer »
  désactivé lisible (POL-PLAY-58), prix dit une fois (POL-PLAY-96), quota Gold à 20 (POL-PLAY-95).
- Vérifié : l’attribution Ciqual 2025 (CC BY 4.0) est bien affichée en pied de la page Nutrition, et les sources
  FODMAP sous chaque repas : pas de manque de licence pour les données.
- Backlog : ligne « Paywall avant la version candidate » cochée (rappel d’essai, conditions publiées, bénéfices réels,
  phrase contextuelle : tout était livré). Idée **POL-PLAY-101** : « 1er » sans exposant à côté de « 21ᵉ ».

## Vérifications
- Aucun fichier de l’app modifié ; `npm run test` 2 864 verts (journal seul, aucun build ni capture à refaire).

## Suite
- POL-PLAY-12 : audit démo en clair de Sources et de Plus ; LICENCES-TIERCES (page des licences, sans nom de modèle
  dans la version Play).
- En attente du propriétaire : P36, P37, P38 ; confirmations montre.
