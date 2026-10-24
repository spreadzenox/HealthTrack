# 2026-10-24 16:30 Paris (14:32 UTC) — SAUV : sauvegarde Android conservée

**Type** : 🧭🔒 chantier produit (décision du propriétaire du 24/10 : garder la sauvegarde Android)

## Constat au démarrage
- Main à `e7d4346` (#323), tous les workflows de main verts (Tests, émulateur, Build & Release v252, Relais, Play — AAB).
  Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).

## Ce qui a été fait
- (c) Règles explicites : `res/xml/data_extraction_rules.xml` (cloud-backup + device-transfer) et `backup_rules.xml`,
  déclarées dans le manifeste ; elles excluent les préférences natives propres au téléphone :
  `healthtrack_watch_vault` (clé de la montre scellée par une clé du Keystore, illisible ailleurs),
  `healthtrack_companion` (association compagnon), `healthtrack_watch_background` (adresse de la montre),
  `app_update` (téléchargement en cours). Tout le reste (IndexedDB, localStorage, réglages) reste sauvegardé.
- Les règles ne peuvent pas viser une clé du localStorage de la WebView : `BackupMarkerPlugin.java` garde un
  identifiant dans `getNoBackupFilesDir` (jamais sauvegardé ni transféré) et `restoreGuard.js` en garde une copie
  dans le localStorage. Copie différente ⇒ restauration ⇒ retrait de `healthtrack_gemini_api_key`,
  `healthtrack_watch_keys`, `healthtrack_withings_tokens`, `healthtrack_withings_credentials`, `halcya_purchase_token`.
  Appelé dans `main.jsx` avant le premier rendu (délai max 2 s, ne lève jamais ; no-op hors de l'app).
  Première ouverture après la mise à jour (aucun repère des deux côtés) : rien n'est retiré.
- (d) Restauration : identifiant d'installation **gardé** (il porte les crédits IA durables côté relais) ; jeton
  d'achat relu dans Google Play par `syncEntitlement` au démarrage ; montre : clé retirée ⇒ nouvel appairage (PIN),
  les constantes publiques du premier appairage restent. Limite : une sauvegarde faite par une version antérieure
  (sans repère) restaurée ailleurs ne déclenche pas le retrait (la clé de montre native y est déjà inutilisable).
- (a) Textes : politique de confidentialité (puce du résumé + § « Sauvegarde Android » + mention dans « Supprimer »),
  conditions §6, Données (intro), onboarding « 0 Mo envoyé à Halcya sans votre accord ».
- (b) Sécurité des données : rien à ajouter (sauvegarde faite par le système, chiffrée de bout en bout depuis
  Android 9) → pas de relance P21 ; raisonnement et réserve (juriste P5) dans PLAY-CONFORMITE §5.
- Nouveauté `2026-10-24-1630-sauvegarde-android.json` (deux variantes).

## Vérifications
- Vitest 2 144 verts (+10 : `restoreGuard.test.js` 5, `backupRules.android.test.js` 4, politique +1), build OK,
  lint inchangé (6 erreurs préexistantes), `npm run visual -- --empty` vert ; relu `data-1` et `bienvenue-1`
  (texte seul, aucun style touché). Java compilé par le check « Build APK » de la PR.

## Suite
- Prochain run de code : POL-5 + POL-4.
- À vérifier un jour sur téléphone : après restauration, l'auto-synchro de la montre ne doit pas lancer un
  réappairage sans geste (sinon rendre le réappairage explicite).

## Après le merge (#324, `1a10188`)
- Checks de la PR tous verts (Vitest, Build APK, Relais, montre Java, budget de lectures, émulateur API 35 et 36).
- « Build & Release » vert : **v253** publiée (APK 33 738 877 octets, 33,7 Mo) ; « Play — AAB » vert (envoi en test interne).
