# 2026-10-20 06:30 Paris (04:30 UTC) — Visage : cause de l'arrêt et « Applis jamais en veille » (I123)

**Type** : 🔴🙂 bien-être automatique — point (c) du signalement du 19/10 15:05 (One UI)  ·  **PR** : voir ci-dessous

## Pourquoi
- Début de run : main à `3f40b4c` (#227) ; aucune PR « [Auto] » ouverte ; aucun diagnostic de l'A56 reçu
  (`journal/diagnostics/` : rien de nouveau depuis le 14/10).
- Le signalement du 15:05 avait trois pistes : (a) réception du déverrouillage et (b) accès caméra en arrière-plan,
  traitées au run du 19/10 16:30 (#221) ; **(c) One UI** restait ouverte. Samsung endort les applis peu ouvertes
  (« Applis en veille », « veille profonde ») **indépendamment** de l'exemption d'optimisation de batterie que le
  propriétaire a déjà accordée (« batterie sans restriction » dans sa capture). Le service tué ainsi ne se distinguait
  pas d'un arrêt par mise à jour ou redémarrage.
- Écarté : demander les deux autres (I124 sonde vocale, tags sur l'humeur estimée) — moins urgents que garder le
  service vivant, sans lequel aucun chiffre n'existe.

## Ce qui a été fait
- Natif `FaceSensePlugin` :
  - `status` ajoute `lastUpdateAt` (`PackageInfo.lastUpdateTime`) et `bootAt` (`currentTimeMillis − elapsedRealtime`).
  - `openNeverSleep()` : `com.samsung.android.sm.ACTION_OPEN_CHECKABLE_LISTACTIVITY`, paquet
    `com.samsung.android.lool`, `activity_type` 2 (Samsung seulement, si l'activité se résout) ; repli
    `ACTION_APPLICATION_DETAILS_SETTINGS` → `{ opened: 'samsung' | 'app_details' }`.
  - Manifeste : `<queries><package android:name="com.samsung.android.lool" />` (visibilité Android 11+).
- JS `services/faceSense.js` : `faceStopCause(status)` → `update` / `reboot` / `system` / null (activée, pas en
  marche, comparée à `startedAt` ; null pour un natif ancien) ; `isSamsungDevice` ; `openFaceNeverSleep` (ne lève
  jamais) ; `describeFaceSense` rend `cause` ; diagnostic **v4** : `service.stopCause`, `lastUpdateAt`, `bootAt`, ligne
  « Arrêt : … ».
- `FaceSenseCard` : texte de l'état « Arrêtée » selon la cause ; si cause `system` sur Samsung : explication +
  bouton « Applis jamais en veille » ; dans le Diagnostic, sur Samsung, le bouton (sauf s'il est déjà dans la carte)
  et une phrase qui explique la différence avec « sans restriction ».
- Visuel : `--face=stopped` simule un arrêt « téléphone » sur Samsung.

## Tests
- Vitest : **1 602 verts** (+5) — `faceSense.test.js` (+3 : causes et cas null, diagnostic v4 et ligne, Samsung /
  ouverture sans lever) ; `FaceSenseCard.test.jsx` (+2 : arrêt « téléphone » sur Samsung → cause + bouton, appel natif ;
  arrêt par mise à jour → bouton seulement dans le Diagnostic ; autre marque → jamais).
- `npm run lint` : 6 erreurs, identiques à main. `npm run build` ✅. `npm run visual` (toutes pages) et
  `--routes=/connectors --face`, `--face=stopped`, `--face=stopped --light` ✅ sans erreur JS ; captures lues
  (carte « Arrêtée » : cause, consigne « + » et bouton ; carte active inchangée).
- Natif : pas de SDK Android dans le conteneur → compilé et testé par le check « Build APK » de la PR (+ émulateur).

## Risques connus
- `activity_type` 2 = « Applis jamais en veille » d'après la doc Samsung (lue le 19/10) ; non vérifié sur One UI 8.
  Si la liste ouverte n'est pas la bonne, le propriétaire verra tout de même la page de gestion des applis en veille.
- `bootAt` varie de quelques ms d'un appel à l'autre : sans effet (comparé à des démarrages espacés de minutes).
- Un arrêt par « Forcer l'arrêt » de l'utilisateur est classé `system` (enabled reste vrai) : acceptable, la
  ligne du diagnostic dit « mise en veille des applis ? » avec un point d'interrogation.

## Pour le propriétaire (Galaxy A56)
Après la mise à jour : Plus → Connecteurs → Lecture du visage → Diagnostic → « Applis jamais en veille » → « + » →
cocher HealthTrack. Dites-moi si c'est bien la liste « Applis jamais en veille » qui s'ouvre. Le reste de la demande du
15:05 tient toujours (déverrouiller 2–3 fois, « Enregistrer le diagnostic », m'envoyer le fichier).

## Suite proposée
1. 📥 Diagnostic de l'A56 (déverrouillages, modèle, ligne « Arrêt »).
2. 💡 Run idées 08:30 : EmoNet (licence), modèles vocaux embarquables (étape 3).
3. 🙂 I124 sonde vocale ; habitudes (tags) et effets décalés sur l'humeur estimée.
