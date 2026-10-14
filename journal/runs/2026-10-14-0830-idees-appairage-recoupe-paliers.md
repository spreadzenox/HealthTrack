# 2026-10-14 08:30 Paris (06:30 UTC) — Idées : appairage recoupé de bout en bout, paliers de confiance, contexte auto

**Type** : 💡⌚ (run « idées »)  ·  **PR** : journal seul, pas de code produit

## Pourquoi
- Démarrage : main à `6e5b255` (v123 publiée, PR #151 fusionnée, « Build & Release » vert). Aucune PR « [Auto] » ouverte
  en rouge ou en conflit.
- Run de 08:30 = run « idées ». Aucun nouveau journal de la GT 6 Pro depuis le correctif v120 (dernier : 13/10 20:42,
  v119). La part montre de la recherche a donc porté sur **les étapes qui suivent** la réponse 0x8001, pour que le
  prochain journal suffise à finir l'appairage.

## Ce qui a été fait
- **Montre** (`protocoles/huawei.md` §6.11, nouveau) : recoupement point par point avec Gadgetbridge master
  `bb7a1e83a2` (lecture seule, faits seulement, aucun code copié) — PIN (GCM seulement si méthode = 1, octets opaques,
  64 octets normal), clé de base, identifiants, jetons, `returnCodeMac`, clé de session, AAD, authentification 0x11–0x13,
  chiffrement des trames : **tout concorde**, aucun calcul à corriger à l'aveugle. Points à surveiller : compte Huawei
  envoyé après l'authentification (GB #6731), clé remplacée (#6978), reconnexion douce (PR #6367), arrière-plan
  (PR #6905, #6823). Constat dans le code : les erreurs des étapes 2–4 sont peu distinctes → I63.
- **Idées** (`IDEES.md`, 6 nouvelles, I63–I68) : I63 suite d'appairage lisible d'avance (25) ; I64 paliers de
  confiance bayésiens (20) ; I65 contexte détecté tout seul (20) ; I66 comportements en une phrase (12, absorbé par
  I60) ; I67 voix par prosodie maison (12) ; I68 archive / export FIT-CSV (12). **Une idée écartée** pour circularité
  (D5) : deviner « alcool / caféine » d'après la FC / VFC de nuit.
- **Faits D4** : MoodCam AUC 0,58–0,64 (visage) ; modèles d'émotion vocale sous licences NC → prosodie maison ;
  transcription système fr-FR non confirmée sur Samsung → repli Vosk small-fr (41 Mo, Apache-2.0) ; « paramètres
  restreints » d'Android 15 étendus à l'accès aux données d'utilisation.
- **Backlog** : « Prochaines étapes » n°2 (I63 à faire en attendant le journal), n°6 (faits D4), n°11 (nouvelles idées
  rattachées à D1 / D4 / D5), n°12 (sujets du prochain run idées).
- **Résumé hebdo** (`README.md`) : paragraphe pour le propriétaire, meilleures idées, ligne de run.
- Pas d'entrée « Nouveautés » : rien ne change dans l'app.

## Vérifications
- Tests : **1153 ✅** (88 fichiers) · Build ✅ · Lint : **6 erreurs** (baseline inchangée) · `npm run visual` : toutes
  les pages OK, aucune erreur JS ; capture `/connectors` relue (inchangée, aucun code produit modifié).

## Apprentissages / décisions
- Recherche parallèle en 3 volets (protocole, ML embarqué, besoins / marché) : efficace pour un run idées.
- Règle D5 appliquée aussi aux **suggestions** de tags : un X déduit de Y ne peut pas servir à expliquer Y.
- Sites inaccessibles : Reddit (direct et extraits), github.com en curl (403), page WHOOP, corps de l'article TechRadar.

## Suite proposée
1. ⌚ Lire le journal v120+ dès qu'il arrive.
2. ⌚ En attendant, I63 (erreurs typées des étapes 2–4, scénarios fausse montre, compte Huawei proposé si la montre coupe
   après l'authentification).
3. ⚡ D2 suite, puis D1 avec I65, D5 avec I64.
