# 2026-10-13 20:30 Paris (18:30 UTC) — Idées + analyse du journal GT 6 Pro de 17:03

**Type** : 💡⌚ (run « idées » + transmission du propriétaire)  ·  **PR** : voir ci-dessous (journal seul, pas de code produit)

## Pourquoi
- Démarrage : main à `1fe1354` (v118 publiée, PR #142 fusionnée). Aucune PR « [Auto] » ouverte en rouge ou en conflit.
- Run de 20:30 = run « idées » (pas de code produit). Le propriétaire a en plus transmis un **2e journal de sa
  GT 6 Pro** (app v118, 13/10 17:03 UTC) à enregistrer, comparer et analyser, avec le correctif à préparer pour le run
  de code de 22:30.

## Ce qui a été fait
- **Journal enregistré tel quel** : `journal/diagnostics/2026-10-13-1703-gt6pro.json` (ni clé, ni PIN, ni adresse
  complète ; JSON validé).
- **Comparaison avec 09:04 (v114)** : déroulé identique à l'octet près (10 trames, 695 → 835 octets à l'étape
  « bind ») ; seule la lisibilité du journal a changé. La v118 est bien le code actuel de main (aucun correctif
  de décodage livré après).
- **Analyse (spec `protocoles/huawei.md` §6.9, nouveau)** :
  1. La réponse est une **réponse de début ISO classique** (`message` 0x8001 ; `isoSalt` 16 o, `peerAuthId` 64 o,
     `token` 32 o + enveloppe de groupe), **pas** le « New Auth Protocol » (SPEKE) supposé par les runs 11:04 → 18:30
     → hypothèse réfutée ; §6.8 annoté (valable pour Honor seulement), (c ter) mis en attente.
  2. **Cause exacte** : JSON reconstitué avec ces noms / tailles = **804 caractères**, étiquette 1 = **805 octets** →
     **1 octet après l'objet** (NUL terminal probable). `findEmbeddedJson` lit l'objet à l'offset 0, `JSON.parse`
     strict échoue. Gadgetbridge (lecture seule) : `getString` = UTF-8 sans retrait, puis `new JSONObject(...)`,
     et le `org.json` d'Android ignore ce qui suit l'objet → même trame, pas de problème chez eux.
  3. Calcul du jeton de Gadgetbridge (PSK, ordre des HMAC) **identique** au nôtre → prochaine embûche éventuelle :
     casse de l'hex du PIN ou format de notre identifiant (`token_mismatch`).
- **Backlog** : « Prochaines étapes » n°1 = correctif (a quinquies) détaillé pour 22:30 (fonction
  `decodeHichainJson` unique, `trailingBytes`, trame d'exemple 804 + `0x00`, variantes, fausse montre « JSON + NUL »
  sur tout le parcours, libellé sans « New Auth », ne pas ajouter de NUL à nos envois) ; (a quinquies) ajouté, (c ter)
  en pause ; faits D4 ajoutés ; nouvelles idées (n°10) et sujets du prochain run idées (n°11).
- **Idées** (`IDEES.md`, 6 nouvelles, I57–I62) : I57 lecture HiChain tolérante + diagnostic du jeton (25) ;
  I58 « Ma nuit en un coup d'œil » absorbée par le briefing I51 (Samsung Vitals) (20) ; I60 traitements =
  expériences avant / après (16) ; I59 import d'analyses par OCR local (12) ; I62 bruit ambiant comme X (12) ;
  I61 pilote Omi direct (BLE MIT documenté) + transcription locale (9).
- **Résumé hebdo** (`README.md`) : paragraphe pour le propriétaire sur le journal de 17:03, correction de la piste
  « même Gadgetbridge ne sait pas », meilleures idées, priorités réécrites, ligne de run.
- Pas d'entrée « Nouveautés » : rien ne change dans l'app.

## Vérifications
- Tests : **1100 ✅** (81 fichiers) · Build ✅ · Lint : **6 erreurs** (baseline inchangée) · `npm run visual` : toutes
  les pages OK, aucune erreur JS ; capture `/connectors` relue (inchangée, aucun code produit modifié).

## Apprentissages / décisions
- **Reconstituer la longueur** à partir des noms et tailles (sans valeurs) a suffi à trouver la cause : l'instrument
  des runs 14:30 / 18:30 a payé, mais pas pour la raison prévue.
- Leçon de méthode : avant de supposer un nouveau protocole, vérifier qu'un analyseur **tolérant** ne lit pas déjà la
  trame (ici `findEmbeddedJson` le faisait à l'offset 0 dès le run 14:30).
- Sites inaccessibles : Reddit (toujours), pages Samsung Newsroom / Wareable / eMarketer (403) → résumés de recherche.

## Suite proposée
1. Run 22:30 : (a quinquies) lecture tolérante + tests sur la trame d'exemple, puis demander un nouveau journal.
2. Selon ce journal : jeton accepté → 0x8002 / 0x8003 ; sinon variante de calcul nommée (I57).
