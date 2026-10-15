# 2026-10-15 02:30 Paris (00:30 UTC) — Montre : cœur Java du client « synchro seule » (D3 d quater ③ a)

**Type** : ⌚ D3 (priorité absolue)  ·  **PR** : « [Auto] Montre : cœur Java de la synchro app fermée (identique au pilote JS) »

## Pourquoi
- Démarrage : main à `afe6d61` (#162), **v130 publiée** (Build & Release, Tests, émulateur A56 verts). Aucune PR
  « [Auto] » ouverte (seule `cursor/*` #51, non touchée). Aucun nouveau journal du propriétaire (`journal/diagnostics/`
  inchangé depuis v124) : rien de neuf à décoder.
- Étape suivante de D3 : (d quater ③), relire la montre **app tuée**. Sans WebView, le pilote JS ne tourne pas : il
  faut un client natif. C'est le plus gros morceau restant ; ce run en livre le socle, testable seul et sans risque
  (rien n'est encore branché, donc aucun changement de comportement sur le téléphone).

## Ce qui a été fait
- **Paquet Java sans Android** `com.healthtrack.app.huawei`, écrit depuis la spec (§2, §3, §4, §6.1–§6.5, jamais
  depuis Gadgetbridge) :
  - `LinkCodec` : trame, CRC-16, entiers variables, TLV, tranches, rassemblage (octets parasites, trames coupées).
  - `LinkCipher` : corps chiffré 0x7C/0x7D/0x7E, IV aléatoire 16 o (type 4) ou 12 + compteur ; HMAC, HKDF, GCM, CBC.
  - `IsoAuth` : authentification ISO (opération 2 **seulement** : jamais de PIN ni de liaison en arrière-plan),
    erreurs typées `key_rejected` / `watch_error` / `format`.
  - `WatchLink` : session bloquante (fil de lecture, délai par requête, messages non demandés mis de côté).
  - `WatchHandshake` : 1/1 → 1/0x16 → 1/0x33 → 1/0x28 ×3 → chiffrement → batterie 1/8.
  - `MiniJson` : lecture tolérante du JSON + NUL de la GT 6 Pro (§6.9).
- `RfcommTransport` (Android) : socket RFCOMM vers la montre, même UUID et même délai que `BtClassicPlugin`.
- **Équivalence prouvée avec le pilote JS** (celui qui marche sur la vraie GT 6 Pro) : `javaVectors.test.js` génère
  `android/app/src/test/resources/huawei/link-vectors.json` (trames, tranches, rassemblage, chiffrement × 3 modes,
  authentification, et **transcription complète d'une reconnexion** à une fausse GT 6 Pro type 4 / GCM / IV
  aléatoire / JSON + NUL, aléa de la montre rendu déterministe). Les tests JUnit exigent les **mêmes octets** ; le
  test Vitest échoue si le fichier n'est plus à jour (`UPDATE_VECTORS=1` pour le régénérer).
- `npm run test:java` (javac + JUnit 4, sans SDK Android ni Gradle ; refuse tout `import android.` dans le paquet) et
  nouveau job CI **« Protocole montre (Java) »** dans `tests.yml`.
- Spec : `protocoles/huawei.md` §9 (tableau) et **§9.1** (architecture du client, règles en arrière-plan, suite).
  Décision : le Java ne décodera pas les mesures ; il écrira les **corps déchiffrés bruts** dans un tampon que le JS
  importe à l'ouverture avec son analyseur existant → une seule implémentation du décodage santé à maintenir.

## Vérifications
- Java : **13 tests JUnit ✅** ; deux mutations (info HKDF, retour du compteur d'IV) les font bien échouer.
  `RfcommTransport` compilé contre des stubs Android (pas de SDK dans la session) ; compilation réelle = check
  « Build APK » de la PR.
- Vitest : **1220 ✅** (95 fichiers, +1). Build ✅. Lint : **6 erreurs** (baseline inchangée).
- `npm run visual` (démo, 8 pages) : aucune erreur JS ; captures Connecteurs et Accueil relues, inchangées (aucun
  changement visible → pas d'entrée « Nouveautés »).

## Apprentissages / décisions
- Faire générer les vecteurs par le JS validé sur la montre plutôt que les écrire à la main : toute divergence de
  sérialisation (ordre des champs JSON, IV, tranches) est attrapée avant d'avoir un téléphone sous la main.
- La fausse montre JS tire son aléa de `crypto.getRandomValues` : un `vi.spyOn` à graine fixe suffit à rendre la
  transcription reproductible, sans toucher à la fausse montre.

## Suite proposée
1. ⌚ Lire le prochain journal (v129+) : mesures reçues ou non (`sync.services`), présence vue ou non.
2. ⌚ D3 (d quater ③ c) : le JS confie au natif, après chaque connexion réussie, l'identifiant et la clé longue durée
   (chiffrés par une clé Android Keystore) ; (③ d) lectures 7/0x0A–0x0B, 7/0x0C–0x0D, 7/0x03 en Java vers un tampon
   brut importé par `watchSync` ; (③ e) démarrage par `WatchPresenceService` quand le JS ne répond pas.
3. ⚡ D2 : `WellbeingCharts` par agrégats ; 🧹 D1 avec I65 ; 🔁 D5 avec I70.
