# 2026-10-14 10:30 Paris (08:30 UTC) — Montre : fin d'association côté montre + une seule carte

**Type** : ⌚🏗️ (priorité absolue D3)  ·  **PR** : « [Auto] Montre : fin d'association côté montre, une seule carte »

## Pourquoi
- Démarrage : main à `0f8aa14` (run idées 08:30 fusionné, #153). Aucune PR « [Auto] » rouge ou en conflit.
- Transmission du propriétaire (captures du 14/10 ≈ 09:35, v123) : **toute la chaîne HiChain passe sur la vraie GT 6 Pro**
  (authentification, trames AES-GCM, batterie 86 %), mais la montre reste sur « Association — scannez le QR code… » puis
  « Échec de l'association », et la lecture rend 0 mesure. Deux cartes pour la même montre sur l'écran Connecteurs.

## Ce qui a été fait
- **Recherche** (agent, Gadgetbridge master `bb7a1e83a2`, lecture seule, faits seulement) → `protocoles/huawei.md` §6.12 :
  pas de message « appairage terminé » chez [G] ; trois messages d'association (1/0x3E appareil principal, sans réponse ;
  1/0x30 accords ; 0x1A/0x05 compte, `00` sans compte) ; la montre peut demander 1/0x10 (infos du téléphone) et il faut
  répondre ; file complète (profil 7/0x02, seuils 7/0x0E, fuseau 1/0x32, langue 0x0C/0x01, format 1/0x04…).
- **Code** (écrit depuis la spec) : `devices/huawei/association.js` (messages + déroulé tolérant + réponse 1/0x10 +
  `associationState`), nouvelle étape `associate` dans `pairing.js` (heure → capacités élargies → file), capacités passées
  à la synchro (plus de double lecture), profil depuis `bodyProfile` (`watchAutoSync.watchProfile`), FC / SpO₂ auto une
  seule fois (`keys.configuredAt`). Fausse montre : accusés, `state.associated`, `askPhoneInfo`, `silentAssociation`.
- **Diagnostic** : `report.association` (`deviceStatus`, état de chaque message + code 0x7F, demandes 1/0x10 servies,
  `freshData`, `userSaw`) ; à l'écran, encadré « Fin d'association envoyée » + boutons « Son cadran » / « Encore
  « Association » » (réponse gardée dans le journal). `diagnostics/2026-10-14-0935-gt6pro.md` : résumé des captures.
- **Nettoyage (demande 3)** : une seule carte « Montre Huawei » ; connexion en tête ; un seul journal exporté
  (`healthtrack-watch-journal` v1 = `{ connect, diagnostic }`, `devices/huawei/journal.js`) ; test + « Libérer et
  appairer » sous « Dépannage » (replié une fois connectée). Retiré : le titre « Montre Huawei en direct », le titre
  « Connexion à la montre », les deux paires de boutons d'export (fusionnées).

## Vérifications
- Tests : **1170 ✅** (89 fichiers ; +17 : trames d'exemple 1/0x3E, 1/0x30, 7/0x02, 7/0x0E, 1/0x32, 1/0x10, déroulé,
  fausse montre). Build ✅. Lint : **6 erreurs** (baseline inchangée ; 2 nouvelles évitées en sortant les helpers des
  composants). `npm run visual` (démo, `--empty`, `--light`, et `--ble=watch --connect=done --devices`) : toutes les pages
  OK, aucune erreur JS ; captures `/connectors` relues avant / après (carte unique, encadré d'association, dépannage).

## Apprentissages / décisions
- 1/0x3E n'a jamais de réponse : envoyé sans attendre ; capacité 109 inconnue → envoyé quand même (inoffensif).
- Pas d'accusé d'association côté protocole → l'indicateur décisif est **la réponse du propriétaire en un geste**, plus
  les mesures fraîches. Hypothèse ❓ : 1/0x3E (+ 1/0x30) fait quitter l'écran d'association.
- Délai court (1,5 s) par message facultatif : une montre muette coûte ≈ 20 s au pire, sans rien bloquer.

## Suite proposée
1. ⌚ Lire le prochain journal (v124+) : `connect.association` (steps, phoneInfoRequests, userSaw, freshData), ligne
   « capacités » (109 ?). Si toujours « Échec de l'association » : réinitialisation + « Refaire l'appairage » pendant
   l'écran d'association, puis journal.
2. ⌚ Si la montre affiche son cadran mais 0 mesure : vérifier les comptes 7/0x0A (minutes) sur la période, puis stress /
   dictionnaire (§7.8).
3. ⌚ (d quater) arrière-plan, une fois les mesures réelles reçues.
