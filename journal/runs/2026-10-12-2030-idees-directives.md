# 2026-10-12 20:30 Paris (18:30 UTC) — Idées : montre en direct, visage / voix, science personnelle

**Type** : 💡 (run « idées » de 20 h, pas de code produit ; + 1 test instable corrigé)  ·  **PR** : « [Auto] Run idées 12/10 20:30 »

## Pourquoi
- Démarrage : seule PR ouverte = #51 (`cursor/*`, pas à la routine, non touchée). main vert (4f1e243), Build & Release
  v107 OK. Mais le workflow **Tests** avait été rouge une fois sur le commit #119 (run 309) : un test de la page
  Analyses (`Recommendations.test.jsx`), vert au commit suivant → test instable.
- Run de 20 h Paris → run « idées ». Premier run idées depuis les directives du 12/10 : recherche ciblée sur D2–D6 et
  sur ce qui **simplifie** (consigne du propriétaire), plus les points « À creuser » du run de 08:30.

## Ce qui a été fait
- **Test instable corrigé** : le test attendait la disparition de « Chargement », ce qui peut se produire *avant*
  que le chargement commence ; il attend désormais l'analyse elle-même. Code de test seulement, aucune modification de l'app.
- `IDEES.md` : nouvelle section en tête — signaux utilisateurs, faits clés datés et sourcés, **10 idées (I39–I48)**
  notées impact × faisabilité, toutes rattachées à un chantier D, pistes d'implémentation, liste « à creuser ».
  I7 / I31 (humeur comportementale) marquées abandonnées (D5) ; I24 et I26 fusionnées dans I47 / I41.
- `BACKLOG.md` : pistes concrètes ajoutées dans D2 (I43), D3 (cause probable, I39), D4 (I40–I42), D5 (I46), D6 (I44),
  C6 (test instable ✓, I48) ; « Prochaines étapes » : point 7 consolidé (un seul flux du jour), point 8 = run idées suivant.
- `README.md` : résumé de la semaine (idées, point d'attention mis à jour sur la vérification des développeurs, ligne du run).
- Pas d'entrée « Nouveautés » : rien de visible dans l'app.

## Faits marquants
- **GT 6 Pro** : l'échec de connexion « même avec Gadgetbridge » correspond très probablement à l'erreur documentée
  « Authentication key negotiation failed » d'une montre **liée à Huawei Santé**. Le chemin le plus simple :
  réinitialiser la montre et l'appairer à une seule app. Les modèles récents utilisent l'authentification « HiChain »,
  **sans documentation publique sous licence permissive** ; `huawei-lpv2` (MIT) couvre LPv2, de façon incomplète.
  → l'écran de diagnostic D3 doit d'abord lire le mode d'authentification annoncé par la montre.
- **Visage** : HSEmotion-B0 en LiteRT, 8 Mo, Apache-2.0, ~2–13 ms ; étude 2025 (233 personnes, 405 000 clips) : le
  **sourire** pendant l'usage du téléphone suit le bien-être (r = 0,80–0,92) → viser sourire + valence, pas 8 émotions.
- **Android 14+** : impossible de démarrer caméra / micro depuis l'arrière-plan (au déverrouillage) ; possible pendant
  l'usage de l'app, ou via un service de premier plan démarré depuis l'app (voyant + notification).
- **Vérification des développeurs** : compte « distribution limitée » gratuit, sans pièce d'identité, ≤ 20 appareils ;
  ou « parcours avancé » unique avec attente de 24 h → la mise à jour en 1 clic reste possible pour le propriétaire.
- **Statistiques** : ~90 jours pour détecter des associations fortes ; préblanchir les séries avant les tests de
  permutation ; seules des expériences alternées (ABAB) permettent de parler de cause.

## Vérifications
- Tests : 971 ✅ (68 fichiers) · Lint : 6 erreurs, 1 warning (inchangé) · Build / visuel : sans objet (aucun
  changement de l'app).

## Suite
- Prochain run hors idées (22:30) : **D2 performance — mesurer d'abord**, puis index / plages (I43).
- Ensuite D3 : écran de diagnostic GT 6 Pro + export des journaux (I39).
