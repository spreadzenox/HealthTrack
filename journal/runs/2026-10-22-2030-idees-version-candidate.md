# 2026-10-22 20:30 Paris (18:30 UTC) — Run « idées » : audit de la version candidate, testeurs sans paiement

**Type** : 💡 idées (pas de code produit) · **PR** : voir ci-dessous

## Pourquoi
- Main à `43f11d6` (#276), tous les workflows de main verts (Tests, émulateur A56, Play — AAB, Site, fiche du Store) ;
  « Play — sécurité des données » relancé par le propriétaire à 19:59 (vert). Aucune PR « [Auto] » ouverte.
- Run de 20:30 → run « idées ». Nouvelle décision du propriétaire (22/10 19:15) : version « presque prête pour la
  production » avant d'inviter les testeurs ; les runs « idées » peuvent auditer sans coder la variante play sur
  données vierges et ranger les défauts dans le BACKLOG.

## Ce qui a été fait
- `PRODUIT.md` : nouvelle section **§2 bis « Version candidate »** (ordre 6b → 6c → jalon 4 → passe VC ; 5 critères
  avec état et preuve attendue ; résultat de l'audit) ; actions P12, P13, P14, P16, P17, P18, P21 mises à jour d'après
  le prompt (gestes du propriétaire du 22/10 au soir) ; **P23** (testeurs sans paiement) ajoutée ; historique.
- Audit : `npm run visual -- --play --empty` (11 pages, 0 erreur JS, 0 débordement), puis `--dark` sur `/` et
  `/recommendations` ; chaque capture regardée. → `BACKLOG.md` section « 🎯 Version candidate » : VC-1 à VC-10.
- Veille : test de licence par groupe Google (aide Play Console, RevenueCat, Qonversion) → I151 ; évitement alimentaire
  chez les SII → I152. `IDEES.md` I149–I152.
- Résumé de la semaine : paragraphe du run + ligne du tableau.

## Vérifications
- Journal seulement ; `npm run test` lancé avant le merge (voir PR).

## Apprentissages / décisions
- Bug JSX récurrent à surveiller : `{APP_NAME}` en fin ou début de ligne perd l'espace (2 occurrences).
- Withings direct exige un identifiant / secret de développeur saisis par l'utilisateur : à masquer en play.
- Les testeurs de licence ont des renouvellements accélérés : bien pour tester l'achat, pas pour 14 jours de premium
  → d'où la « période de lancement » côté relais (option B).

## Suite proposée
- Run de code suivant : **6b** (vérification des achats par le relais) ; y prévoir l'interrupteur « période de
  lancement » si le propriétaire choisit l'option B (P23).
- Passe de finition VC après le jalon 4 ; I150 (test-garde « premier lancement play ») en même temps.
