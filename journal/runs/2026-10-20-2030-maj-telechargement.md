# 2026-10-20 20:30 Paris (18:30 UTC) — Mise à jour en un clic : téléchargement visible et fiable (signalement 20/10 19:05)

**Type** : 🚑 correction (signalement du propriétaire du 20/10 19:05, traité en premier même sur un créneau « idées »)
·  **PR** : #235 (fusionnée, squash `063e9f1`) + #236 (journal : release notée)

## Pourquoi
- Main à `26dcbba` (#234). Signalement : bandeau « Une mise à jour est disponible (version 187) » bloqué sur le bouton
  grisé « Téléchargement… », sans pourcentage, ni taille, ni erreur (Galaxy A56, 4G).
- Créneau 20:30 = run « idées », mais le prompt impose de corriger d'abord ce signalement s'il ne l'est pas : la veille
  « idées » est reportée au prochain créneau 08:30.

## Diagnostic (cause)
- Taille de l'APK publiée : **6,8 Mo** (≤ v166) → **15,1 Mo** (v167–v179, LiteRT + modèles visage) → **33,6 Mo**
  (v180+, ONNX Runtime ajouté pour le modèle valence / éveil : `libonnxruntime.so` seul = 18,2 Mo).
- Le téléchargement depuis ici de la v187 (33,6 Mo, redirections GitHub suivies) aboutit : le serveur n'est pas en cause.
- L'ancien chemin (`installUpdate.js`) faisait `CapacitorHttp.get({ responseType: 'arraybuffer' })` : le natif
  charge **tout l'APK en mémoire**, l'encode en base64 (≈ 45 Mo de texte, ≈ 90 Mo en UTF-16 côté Java), le passe au
  WebView par le pont Capacitor, puis `Filesystem.writeFile` le renvoie au natif. Aucun délai d'expiration, aucune
  progression, et l'état « Téléchargement… » ne sortait que si la promesse se résolvait. Sur 4G + 33,6 Mo, le moindre
  blocage (connexion qui ne progresse plus, pression mémoire, WebView mis en pause en arrière-plan) laisse le bouton
  grisé indéfiniment. C'est cohérent avec le fait que la mise à jour marchait à 6,8 Mo.
- La redirection GitHub (`github.com/…/releases/download` → `release-assets.githubusercontent.com`) n'était pas en
  cause en soi ; la permission « Installer des applis inconnues » non plus (elle était vérifiée avant).

## Ce qui a été fait
- Natif `AppUpdatePlugin` (nouveau, enregistré dans `MainActivity`) : téléchargement par le **DownloadManager**
  d'Android dans `getExternalFilesDir(Download)` (pas de permission de stockage), notification système de progression
  (`VISIBILITY_VISIBLE`), données mobiles / itinérance autorisées, reprise automatique après coupure, redirections
  suivies. `status()` lit octets reçus / totaux, état et code de raison ; l'identifiant est mémorisé (SharedPreferences)
  pour reprendre le suivi après fermeture de l'app. `install()` **vérifie** avant d'ouvrir l'installateur : taille
  annoncée par GitHub, **empreinte SHA-256** (champ `digest` de l'asset de la release), APK lisible, même paquet, pas
  de rétrogradation (versionCode reste 1 en CI : seule une valeur plus basse est refusée), autorisation d'installer ;
  puis `ACTION_VIEW` via `FileProvider` (`external-files-path` ajouté à `file_paths.xml`).
- Paquet JVM `update/UpdateFile` (sans Android) : états du DownloadManager, lecture du `digest`, SHA-256, verdict ;
  ajouté à `npm run test:java`.
- JS `services/appUpdate.js` : `getApkAsset` (url, taille, empreinte), `progressLabel` (« 12,3 Mo / 33,6 Mo · 36 % ·
  1,4 Mo/s · encore ≈ 14 s »), débit sur 6 s glissantes, messages exacts des raisons de pause / d'échec du
  DownloadManager et des refus de vérification, `createUpdateRunner` (permission → téléchargement → vérification →
  installateur ; **blocage signalé après 45 s sans octet** sans annuler ; reprise d'un téléchargement en cours de la
  même version ; annulation). `openInBrowser` (AppLauncher) pour le secours.
- `UpdateBanner` : version installée et taille dans le bandeau ; étapes ; barre de progression (`role=progressbar`) ;
  « Vous pouvez quitter l'app : le téléchargement continue » ; « Réessayer » / « Annuler » ; « Télécharger depuis le
  navigateur » (lien direct de l'APK) au repos, en erreur, en blocage et après ouverture de l'installateur ;
  « Rouvrir l'installateur ». Hors app Android : ouvre le lien comme avant.
- Supprimé : `installUpdate.js` (+ test). Le paquet npm `@m430/capacitor-app-install` n'est plus importé (laissé dans
  `package.json` pour ne pas toucher au natif généré ce run ; à retirer plus tard).
- Visuel : `--update-banner=progress` et `--update-banner=stalled` (plugin `AppUpdate` simulé, lu seulement en dev).

## Vérifications
- Vitest : **1 640 verts** (+18 nouveaux : `appUpdate.test.js` 14, `UpdateBanner.test.jsx` 4 ; −8 de l'ancien
  `installUpdate.test.js`). JUnit : **118 verts** (+4 `UpdateFileTest`).
- `npm run build` ✅ ; `npm run lint` : 6 erreurs, identiques à main.
- `npm run visual` (complet), `--empty`, `--update-banner` (repos), `=progress`, `=stalled`, `--light` : sans erreur
  JS ; captures de l'accueil lues (bandeau repos, en cours 43 %, bloqué avec Réessayer / Annuler / navigateur).
- Le Java Android (`AppUpdatePlugin`) n'est compilé que par le check « Build APK » de la PR (pas de SDK ici).

## Ce que le propriétaire doit faire (une fois)
- Sa version installée a l'ancien code : elle restera bloquée. **Installer à la main la version publiée après ce run**
  depuis le navigateur du téléphone : https://github.com/spreadzenox/HealthTrack/releases/latest → « Assets » →
  `HealthTrack-vNNN.apk` → ouvrir → (autoriser le navigateur à installer si demandé) → « Mettre à jour ». Les données
  sont gardées (même signature, mise à jour par-dessus).
- Puis, à la release suivante, vérifier que le bandeau montre la progression et que l'installateur s'ouvre ; si ça
  bloque, envoyer une capture du bandeau (il affiche maintenant la cause).

## Risques connus
- Si One UI restreint le DownloadManager pour les données mobiles (« Wi-Fi seulement » imposé pour gros fichiers),
  le bandeau affiche « En attente du Wi-Fi » (raison 3) et propose le navigateur.
- Le DownloadManager peut annuler le téléchargement si l'utilisateur le balaie dans la notification : le bandeau
  affiche alors « annulé (depuis la notification ?) » avec « Réessayer ».

## Suite proposée
- Point (e) du signalement — **mesuré** (contenu de l'APK v187) : ce ne sont **pas les modèles** qui pèsent
  (assets/face ≈ 3,7 Mo ; les poids valence / éveil sont déjà téléchargés à part avec empreinte), mais
  **`libonnxruntime.so` = 18,2 Mo** (arm64, non compressé) + `libtensorflowlite_jni.so` 4,5 Mo + dex 5,3 Mo.
  Piste (I129) : convertir le second modèle (MobileFaceNet) en LiteRT pour **retirer ONNX Runtime** (−18 Mo, APK
  ≈ 15 Mo), ou une build ONNX Runtime « minimale » limitée aux opérateurs utilisés. Télécharger la bibliothèque native
  au premier lancement n'est pas possible proprement (code exécutable hors APK) : écarté.
- Reprendre ensuite la consigne du 19/10 au soir (I117 préparation / diagnostic de l'A56).

## Après le merge
- Checks de #235 tous verts (Frontend (Vitest), Build APK, Protocole montre (Java), Budget perf, émulateur A56 API 35
  et 36). **Release v188 publiée** : `HealthTrack-v188.apk` = **33 565 870 octets (33,6 Mo)**.
- La PR de journal #236 n'a **pas** publié de v189 : « Build & Release » ignore les changements du seul `journal/`
  (vérifié). La v189 viendra du prochain run de code ; c'est elle qui servira au propriétaire à tester le bouton
  depuis la v188.
