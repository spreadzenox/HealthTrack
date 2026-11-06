# 06/11 09:35 — Relais : requêtes du réseau de test de Google reconnues (INSTALLS-21c-1)

Type : 🧰 run de code (relais, bilan du déploiement, une phrase de confidentialité).

## Constat au démarrage
- main `1e39212` vert. Deux PR « [Auto] » ouvertes : **#748** (WEEKS-MIDLINE, run de 07:35, 11 checks verts depuis
  la levée de P47) et **#749** (run « idées » de 08:35, empilée sur #748).
- **#748 mergée** (squash, `2a58432`). #749 ne se mettait plus à jour seule (conflit entre les commits d'origine de
  #748 et leur squash) : commit de fusion avec main dont l'arbre est exactement « main + journal de #749 » (pas de
  force-push), checks relancés, puis mergée par ce run une fois verte (09:45, `6ad56a5`).

## Fait (INSTALLS-21c-1, `IDEES.md` I223)
- `relay/src/testLabNet.js` : blocs d'adresses de Firebase Test Lab en constante datée (relevé du 06/11/2026, source
  citée), `isTestLabAddress` (IPv4 CIDR ; IPv6, vide ou invalide → faux), `clientAddress`, `fromTestLabNetwork(req)`.
- **Écart avec la proposition du run « idées »** : on lit le **dernier** élément de `X-Forwarded-For`, pas le premier.
  Cloud Run ajoute l'adresse qu'il voit après ce que le client a pu écrire lui-même : le premier élément est donc au
  choix du client, le dernier non. Indispensable avant 21c-3 (sinon n'importe qui se ferait passer pour un robot pour
  échapper à `enforce`). Test : « 108.177.6.20, 90.12.34.56 » → pas un robot.
- Booléen `testnet` dans les journaux `first_credit` (toujours présent) et `integrity` (missing, passed, rejected,
  not_android), sur les routes d'analyse ; la route « Votre avis » le passe aussi au contrôle Integrity. **Aucune
  adresse écrite** : test qui vérifie qu'aucune des deux adresses n'apparaît dans les journaux.
- Bilan « Relais — déploiement » : « dont N depuis le réseau de test de Google (M sans ce détail) », répartition par
  jour dans le journal de l'étape, origine « réseau de test Google » dans le tableau Play Integrity, exclue de la
  liste GOLD-a3 (empreinte du téléphone du propriétaire).
- Garde-fou annuel : un test du relais échoue quand le relevé a plus de 13 mois (relire la page de Firebase).
- Politique de confidentialité (`app/public/privacypolicy.html`, aussi publiée sur GitHub Pages) : « Le serveur les
  reconnaît aussi à l'adresse IP de la requête, comparée aux adresses que Google publie pour ses appareils de test :
  elle n'est ni enregistrée ni conservée. » Test dans `privacyPolicy.test.js`. Sécurité des données : traitement
  éphémère, rien à déclarer (pas de relance du workflow).
- Aucun droit ne change : `testnet` n'est lu que par les bilans. 21c-3 (Flash-Lite pour ce réseau, `testnet` hors de
  la règle `enforce`) attend la lecture 21c-2.

## Vérifications
- Relais : `npm test` 223 verts (6 nouveaux sur `testLabNet`, 1 Integrity, et le test serveur des premiers crédits étendu).
- App : `npm run test` 3 188 verts, build OK, lint 0 erreur ; `npm run visual -- --play --routes=/` (Accueil
  inchangé). La politique est une page HTML statique : seul un paragraphe existant gagne une phrase.
- Expressions `jq` du bilan essayées sur un échantillon synthétique (1 testnet, 1 non, 1 ancien journal).

## Suite
- **INSTALLS-21c-2** (08–09/11) : relire le bilan du déploiement (étape « Nouvelles installations » et tableau Play
  Integrity). Si les `error:-9` et les premiers crédits inexpliqués tombent en `testnet`, l'hypothèse est confirmée ;
  si `testnet` reste à 0 partout, vérifier d'abord que Cloud Run n'ajoute pas une adresse interne après celle du client.
- Alpha : 100811 jusqu'à la porte de 24 h (vers 16:30 UTC).

## Après le merge (#750, `dbfae0f`)
- Build & Release : **v530**, APK 34 560 645 octets. Tests, émulateur A56, Play — AAB, GitHub Pages (politique à
  jour) : verts. Play — Alpha : une exécution annulée par la suivante (concurrence normale), la porte de 24 h garde
  100811 jusque vers 16:30 UTC.
- Relais — déploiement : vert. Le relais sert toujours Gold offert jusqu'au **30/11 23:00 UTC** (Android) et jusqu'au
  06/11 23:00 UTC (iPhone). Bilan : 40 premiers crédits sur 7 jours, **0 `testnet` et 40 « sans ce détail »**, ce qui
  est attendu puisque tous ces journaux datent d'avant ce relais. La lecture utile (21c-2) se fera dans 2 ou 3 jours.
