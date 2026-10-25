# Run du 25/10/2026 17:33 (Paris, CET) — CREDITS-INSTALLS : nouvelles installations comptées

**Type** : 🧭 chantier produit (relais, suivi de l'abus par réinstallation)

## Constat au démarrage
- Main à `987781f` (#373), tous les workflows verts (v276). Aucune PR « [Auto] » ouverte ; #51 `cursor/*` non
  touchée. POL-1d attend toujours P28 → étape indépendante ouverte : **CREDITS-INSTALLS** (I167).

## Ce qui a été fait
- `relay/src/credits.js` : une installation absente du registre Firestore à sa première relecture est notée
  « jamais vue » ; `take()` rend `firstUse: true` pour son premier crédit si l'app ne rapporte aucun crédit déjà pris.
  Sans registre durable, toujours faux (on ne sait pas). Un crédit rendu (analyse sans coût) remet l'installation à
  compter.
- `relay/src/server.js` : après une analyse réussie, `log({ event: 'first_credit', plan })` (aucune empreinte ni
  identifiant) ; l'analyse de test du workflow (`ci-smoke-<run>`, neuve à chaque déploiement) n'est pas comptée ;
  `firstUse` n'est pas renvoyé à l'app.
- `relay-deploy.yml` : étape non bloquante « Nouvelles installations » → résumé « Nouvelles installations qui prennent
  leur 1er crédit IA (7 derniers jours) : N (AAAA-MM-JJ : n, …) ».

## Vérifications
- Relais : 81 tests verts (3 nouveaux, rouges avant le correctif). App : Vitest 2 207 verts, build OK, lint 6 erreurs
  (inchangé), `npm run visual` 0 erreur JS (aucun écran touché). YAML relu, commande jq essayée sur un exemple.

## Suite
- Lire le résumé du workflow relais après le merge (le compteur part de zéro : seules les installations jamais vues
  après ce déploiement sont comptées ; pendant la période de lancement, `plan` vaut `premium`).
- POL-1d dès P28 ; sinon jalon 5 / M suivants.

## Après le merge (#374, `8c7b7f8`)
- Sur la PR, le job émulateur API 35 a échoué une fois (« premier écran non affiché après 90 s », variante play) alors
  que la PR ne touche pas l'app ; relancé une fois → vert. Aléa de l'émulateur, à surveiller s'il revient.
- Main : Tests, Build & Release, Play — AAB, émulateur et **Relais — déploiement** verts ; release **v277** publiée
  (`HealthTrack-v277.apk`, 33 771 664 octets ≈ 33,8 Mo). Résumé du relais : Firestore 0 échec ; « Nouvelles
  installations : 0 sur 7 jours » (le compteur démarre à ce déploiement).
