# 2026-10-15 06:30 Paris (04:30 UTC) — Montre : clé confiée au coffre natif (D3 d quater ③ c)

**Type** : ⌚ D3 (priorité absolue)  ·  **PR** : « [Auto] Montre : clé de la montre confiée au coffre natif (Keystore) »

## Pourquoi
- Démarrage : main à `f042e7b` (#163 fusionnée par le propriétaire), **Build & Release v131 vert**, Tests et
  émulateur A56 verts. Aucune PR « [Auto] » ouverte (seule `cursor/*` #51, non touchée). Aucun nouveau journal
  du propriétaire dans `journal/diagnostics/` (dernier : v124) : rien de neuf à décoder.
- Étape suivante de la synchro app fermée (§9.1) : (③ c) le client Java a besoin de la clé longue durée et de
  l'identifiant du téléphone, aujourd'hui gardés seulement dans le `localStorage` de la WebView, illisible app tuée.

## Ce qui a été fait
- **`huawei/WatchVault.java`** (pur Java, testé sur JVM) : scelle `{authId, authToken, name, savedAt}` en AES-GCM ;
  IV tiré par le fournisseur (exigé par le Keystore) ; données associées « healthtrack-watch-vault-v1|ADRESSE »
  (une copie ne s'ouvre que pour sa montre) ; validation stricte (adresse, identifiant imprimable ≤ 64, clé 16–64 o),
  messages d'erreur sans jamais la valeur.
- **`WatchVaultPlugin.java`** (plugin Capacitor « WatchVault ») : `store`, `status` (gardée ou non + date, jamais
  la clé), `clear` ; clé AES-256 GCM créée dans l'**AndroidKeyStore** (alias `healthtrack_watch_vault`), non
  exportable ; copie dans les préférences `healthtrack_watch_vault`. Une copie restaurée d'une sauvegarde sur un
  autre téléphone ne s'ouvre pas : `status` l'efface. `read(context, adresse)` pour le futur client Java.
- **`src/services/watchVault.js`** + branchement dans `connectBondedWatch` (manuel et automatique) : dépôt après
  `connected`, retrait après `key_rejected` ; l'état (`stored`, `cleared`, `unavailable`, `error`) est consigné dans
  le rapport (`nativeKey`), donc dans le journal exportable. Ne lève jamais : une ancienne APK sans le plugin donne
  `unavailable`.
- Spec `protocoles/huawei.md` §9 (tableau) et §9.1 (format du coffre, règles).

## Vérifications
- Java : **21 tests JUnit ✅** (+8 : aller-retour, clé jamais en clair, IV frais, autre montre / autre clé /
  altération refusées, formats invalides, validation, échappement du nom, adresse normalisée).
  `WatchVaultPlugin` non compilable ici (pas de SDK Android) : compilation réelle = check « Build APK ».
- Vitest : **1228 ✅** (96 fichiers, +8 tests). Build ✅. Lint : **6 erreurs** (baseline inchangée).
- `npm run visual` (démo, 8 pages) : aucune erreur JS ; capture Connecteurs relue, inchangée (aucun changement visible → pas d'entrée « Nouveautés »).

## Merge
- Voir la PR : fusion en squash si « Frontend (Vitest) », « Build APK » et « Protocole montre (Java) » sont verts.

## Sécurité / vie privée
- La clé était déjà en clair dans le stockage de la WebView ; la copie native est **plus** protégée (Keystore).
- Rien ne sort du téléphone ; le JS ne relit jamais la clé depuis le natif.

## Suite proposée
1. ⌚ Lire le prochain journal (v129+) : mesures reçues ou non (`sync.services`), présence vue, `nativeKey`.
2. ⌚ D3 (③ d) : lectures 7/0x0A–0x0B, 7/0x0C–0x0D, 7/0x03 en Java → tampon de corps déchiffrés bruts importé par
   `watchSync` à l'ouverture (vecteurs générés par le pilote JS, comme pour ③ a) ; (③ e) démarrage par
   `WatchPresenceService` quand le JS ne répond pas.
3. ⚡ D2 : `WellbeingCharts` par agrégats ; 🧹 D1 avec I65 ; 🔁 D5 avec I70.
