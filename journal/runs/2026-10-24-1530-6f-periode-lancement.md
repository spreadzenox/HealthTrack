# 2026-10-24 15:30 Paris (13:32 UTC) — 6f : période de lancement (P23 ②)

**Type** : 🧭💳 chantier produit (version candidate, critère C5)

## Constat au démarrage
- Main à `64ec31f` (#321). Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée). Derniers workflows de
  main verts (Tests, émulateur, Build & Release v251, Relais, Play — AAB).
- Nouvelles consignes du propriétaire (24/10 vers 15:00, polissage du parcours) pas encore au journal → consignées
  dans BACKLOG en POL-1…POL-8 avec un ordre proposé. Conflit de numéro : le run de 14:30 avait nommé P28 l'action IAM,
  alors que le prompt réserve P28 à la déclaration « services de premier plan » → IAM renuméroté **P29**.

## Ce qui a été fait
- Relais : `src/launch-period.json` (`from`, `until`, `off`) embarqué dans l'image (copié avec `src/`) ; `config.js`
  `readLaunchPeriod` + `launchPremium` (variables `LAUNCH_PREMIUM_FROM/UNTIL/OFF` prioritaires) ; `billing.js`
  `isLaunchPeriod({ from, until, off }, now)` : rien avant `from`, fin exclue, `off` coupe ; `index.js` branché.
  Le fichier est **vide** : aucune période tant que la version candidate n'est pas publiée.
- Workflow « Relais — déploiement » : résumé avec l'état de la période (lu dans le fichier) et la réponse du relais à
  une installation sans achat (`premium`, `source`, `launchUntil`).
- App : `describeEntitlement` → « Premium offert pendant le test, jusqu'au … : vous n'avez rien à payer. » ;
  `Premium.jsx` en période de lancement : titre « Premium offert pendant le test », phrase de remerciement, aucune
  formule, aucun achat, aucune restauration, bouton « Continuer » (aussi dans l'onboarding). À l'échéance,
  `getEntitlement` éteint le premium et le paywall revient (test).
- `journal/INVITATION-TESTEURS.md` : choix des dates, prolonger / couper (fichier sur GitHub, commit sur main),
  texte d'invitation (« le premium est offert pendant le test, vous n'avez rien à payer ») et chemin d'installation
  qui marche (lien de la fiche, « Non installées », vider le cache du Play Store).
- Nouveauté play `2026-10-24-1530-premium-test.json`.

## Vérifications
- Relais : `npm test` 78 verts (+2 : fenêtre début / fin / interrupteur ; fichier du dépôt cohérent et variables
  prioritaires).
- App : Vitest 2 134 verts (+3 Premium), build OK, lint inchangé (6 erreurs préexistantes), `npm run visual -- --play` vert ; `/premium` relu en `--subscription=launch` clair et sombre (titre, date, « Continuer », aucune formule).

## Suite
- Le jour de la version candidate : écrire `from` / `until` dans `relay/src/launch-period.json`, vérifier le résumé du
  workflow relais (« premium=true source=launch »), puis C5 ✅ après un coup d'œil sur la version play.
- Prochain run de code : **SAUV** (règles de sauvegarde Android), puis POL-5 + POL-4.
- Idée : exclure une seule installation (le propriétaire) au lieu du `off` global.

## Après le merge (#322, `7f5108a`)
- « Build & Release » vert : **v252** publiée (APK 33,7 Mo, 33 736 632 octets). Checks de la PR tous verts (Vitest,
  Build APK, Relais, montre Java, émulateur API 35 et 36).
- « Relais — déploiement » vert (run 40099848457) : analyse de test HTTP 200 (`gemini-3.5-flash-lite`), achats
  lisibles (404 sur faux jeton) ; période de lancement « aucune » (fichier vide, comme prévu).
