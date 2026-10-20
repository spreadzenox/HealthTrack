# Collecte entièrement automatique du bien-être — état des lieux et plan

Consigne du propriétaire du **18/10/2026 au soir** (charte §00000) : « concentration maximale sur la collecte
entièrement automatique du bien-être ». Ce fichier est écrit **une fois** (run du 18/10 22:30) puis tenu à jour : la
case « Fait » de chaque étape, et les décisions. Le détail des idées est dans `IDEES.md`, les spécifications dans
`protocoles/visage.md`, le suivi fin dans `BACKLOG.md`.

## 1. État des lieux (18/10/2026 22:30, v167)

| Brique | Où | État |
|---|---|---|
| Entrées déclarées de l'estimateur (Y) | `app/src/services/mood/estimatorInputs.js` (`ESTIMATOR_INPUTS` : auto-déclaration, `face_*`, `voice_*`) | ✅ depuis le 16/10 (I92) |
| Test anti-circularité (Y ∉ X) | `app/src/services/mood/antiCircularity.test.js` | ✅ échoue si une entrée Y apparaît dans les facteurs, liens décalés ou tags |
| Ordre temporel (X avant Y) | analyses simple et avancée | ✅ 16/10 22:30 |
| Calibration personnelle (≥ 14 jours de notes) | `services/mood/calibration.js` | ✅ générique, sans entrée comportementale |
| Saisie bien-être | modale + Accueil, « Repéré sans vous » | ✅ allégée (17/10) ; jamais obligatoire ; pas de rappel |
| Visage : post-traitement Java | `face/FaceGeometry`, `FaceIndices`, `FacePipeline` | ✅ 18/10 14:30, vecteurs figés |
| Visage : modèles LiteRT dans l'APK | `FaceModels`, `LiteRtModel`, tâche Gradle `faceModels` | ✅ 18/10 18:30, testé sur émulateur |
| Visage : service « niveau 2 » + diagnostic | `FaceSenseService`, `FaceCamera`, `FaceSensePlugin`, carte `FaceSenseCard` | ✅ **18/10 22:30** (à valider sur l'A56) |
| Visage : import des rafales dans l'historique | `services/faceBursts.js`, entrée `face_burst` | ✅ **19/10 00:30** (I90) |
| Porte de calibration (affichage seulement si le visage suit les notes) | `services/mood/gate.js` | ✅ **19/10 02:30** (I112) ; carte « Calibration : N jours sur 30 » |
| Voix (prosodie maison, aucun audio gardé) | — | ⬜ I91 |
| Usage du téléphone / réseaux sociaux | `PhoneUsagePlugin` (écran allumé / éteint / déverrouillé, apps au premier plan) | ✅ écran ; ✅ temps par catégorie d'app (I116, 19/10 12:30, entrées `phone_apps`, facteurs X) |
| Restitution « estimation du jour » | — | ⬜ après la porte |

## 2. Décisions Y / X (règle D5 : une variable est l'un ou l'autre, jamais les deux)

- **Y (entrées de l'estimateur)** : expressions du visage (`face_*`), voix (`voice_*`), auto-déclaration (note de
  bien-être, tag « Stress » ressenti).
- **X (facteurs examinés par les Analyses)** : sommeil, activité, écran, alimentation, météo, contexte…, et :
  - **usage des réseaux sociaux / du téléphone = X** (décidé le 15/10, I73) : il peut expliquer l'humeur, il ne
    sert pas à l'estimer ;
  - **signaux physiologiques de la montre = X** (stress / VFC, fréquence cardiaque, sommeil) : ce sont des états du
    corps, pas des signaux émotionnels directs, et ils sont déjà des facteurs des Analyses ; les mettre en Y rendrait
    « VFC basse → humeur basse » tautologique. Une « émotion » calculée par une montre serait aussi un X.
- **Capture** (I114) : seules les rafales **du déverrouillage** comptent pour l'humeur. Une rafale déclenchée par
  l'ouverture d'une app ferait dépendre les images vues de l'usage du téléphone (un X) : biais de composition,
  simulé à r ≈ 0,1–0,2 sans aucun vrai lien. `FaceSchedule` refuse tout autre déclencheur que `unlock` et `manual`
  (test seulement) ; les rafales portent leur `trigger`, et `moodFaceBursts` (I90) ne garde en Y que `unlock`.

## 3. Plan (une étape testable et fusionnable par run)

1. ✅ État des lieux + plan (ce fichier).
2. ✅ Cœur Y / X et test anti-circularité (existant, vérifié ci-dessus).
3. 🟨 **Visage** : ✅ service caméra « niveau 2 » + diagnostic exportable (18/10 22:30) → ⬜ retour du diagnostic
   de l'A56 → ✅ **I90** import des rafales `face_burst` (19/10 00:30 ; scores seuls, `trigger`, test « composition ») →
   ✅ notification « Reprendre » si le service est tué (19/10 04:30 : tâche horaire + redémarrage / mise à
   jour) → ⬜ guide Shizuku / ADB (`appops set com.healthtrack.app CAMERA allow`) et détection du privilège (I89).
4. ⬜ **Voix** : prosodie (énergie, débit, hauteur, pauses) par un modèle local, aucun audio gardé ; service
   `microphone` sur le même modèle (I91). **Précisé le 19/10 08:30 (I117, I119)** : d'abord la dictée du soir, une
   seule prise de son lue deux fois (prosodie en direct + reconnaissance fr-FR sur le même flux, rien sur disque),
   texte → note et tags proposés par deux lexiques disjoints (ressenti = Y, contexte = X). Voix de fond en continu
   écartée pour l'instant (npj Digit. Med. 2026 : texte R² 0,34, audio 0,06, intra-personne ≈ hasard).
5. ✅ (19/10 12:30, I116) **Usage du téléphone** : temps au premier plan par app (`UsageStatsManager`), réseaux sociaux regroupés,
   comme **X** (voir §2) ; guide « paramètres restreints » d'Android 15+ (déjà dans `PhoneUsageCard`). **Spécifié le
   19/10 08:30 (I116)** : `ACTIVITY_RESUMED / PAUSED / STOPPED` dans `queryEvents`, catégories
   `ApplicationInfo.category`, entrée `phone_apps` par jour et par heure ; prochain run de code conseillé.
   Rafales : viser ≥ 12 rafales valides par jour (I118, simulé).
6. 🟨 **Porte et restitution** : ✅ `gate.js` (I112, 19/10 02:30), puis une ligne « estimation du jour » avec fourchette, jamais un
   diagnostic ; le visage complète les jours sans note (I115). ✅ Estimation du jour (19/10 22:30) ; ✅ **facteurs X
   comparés à l'humeur estimée** dans Analyses, sans aucune note (`mood/faceMoodDays.js`, 20/10 04:30).
7. ✅ Calibration optionnelle : note du soir d'un geste depuis une notification (I113, 19/10 06:30), jamais
   obligatoire ; interrupteur dans la saisie bien-être, heure = médiane des notes du soir, file native → historique.

## 4. À valider sur le Galaxy A56 (One UI) du propriétaire

Après la mise à jour qui contient la « Lecture du visage » :
1. Plus → Connecteurs → **Lecture du visage → « Activer la lecture du visage »**, accepter l'accès à l'appareil photo.
2. Toucher **« Sans restriction »** et accepter la boîte d'Android.
3. Utiliser le téléphone normalement quelques heures (le point vert doit s'allumer ~1 s après chaque déverrouillage,
   une notification « Lecture du visage active » reste dans le volet).
4. (Facultatif, accélère la calibration) Dans « Comment vous sentez-vous ? », toucher **« 🔔 Me la demander le
   soir »** et autoriser les notifications ; le soir, noter d'un geste depuis la notification.
5. Revenir sur la carte → **Diagnostic → « Enregistrer le diagnostic »** et renvoyer le fichier
   `Documents/healthtrack-visage-….json` (ni image ni score dedans), et dire si le point vert apparaît bien.

Ce que le diagnostic dira : la lecture tient-elle en arrière-plan sur One UI, combien de déverrouillages donnent un
visage, pourquoi les autres sont écartés (trop sombre, tête tournée…), le temps caméra / analyse, et la batterie.

## 5. Ce qui marche selon les versions d'Android (connu / à confirmer)

- Android 11+ : un service de premier plan de type `camera` **démarré app ouverte** garde l'accès à la caméra en
  arrière-plan ; il ne peut **pas** être démarré depuis l'arrière-plan (d'où « Relancer » dans l'app, et
  `START_NOT_STICKY`).
- Android 14+ : `FOREGROUND_SERVICE_CAMERA` obligatoire, permission caméra accordée avant le démarrage.
- One UI : « Applis en veille » / optimisation de batterie peuvent tuer le service → « Sans restriction » ; à
  confirmer par le diagnostic (`stoppedAt`, `startedAt`).

## Mise à jour du 19/10/2026 22:30 — consigne « 100 % auto, sans attendre la calibration »

La porte de calibration (I112) **ne conditionne plus l'affichage**. L'humeur estimée s'affiche dès la première
lecture du déverrouillage (`app/src/services/mood/faceMood.js`) : a priori général sur les blendshapes → visage
habituel de la personne → calibration facultative sur les notes. Restitution : carte « Humeur estimée » sur l'accueil
et dans « Lecture du visage », fourchette 0–5 et confiance. Prochaine étape : modèle valence / éveil embarqué (voir
`BACKLOG.md`, consigne du 19/10 au soir). Y / X inchangés.

## Modèle valence / éveil (20/10/2026 02:30, consigne du 19/10 au soir, étape 2)

**Choix : HSEmotion `enet_b0_8_va_mtl` (ONNX), téléchargé par le téléphone, exécuté par ONNX Runtime 1.22.**

| Modèle | Sorties | Précision publiée | Taille | Latence publiée | Licence | Verdict |
|---|---|---|---|---|---|---|
| **HSEmotion `enet_b0_8_va_mtl`** | 8 émotions + **valence + éveil** | AffectNet (validation) : 8 classes 61,9 %, **CCC valence 0,594, éveil 0,549** [T arXiv 2403.11590, famille MT-EmotiEffNet-B0 ; 61,93 % = la ligne `va_mtl` du README] | 16 Mo | 60 ± 32 ms / image, Snapdragon 888 CPU [V README EmotiEffLib] | Code Apache-2.0, README : « no limitation for both academic and commercial usage » ; pas de licence propre aux poids ; appris sur AffectNet (licence de recherche) | ✅ retenu, **pas dans l'APK** |
| HSEmotion `enet_b2_8` | 8 émotions | 63,0 % (8 classes) | 30 Mo | 191 ms | idem | ❌ pas de valence / éveil |
| HSEmotion-B0 LiteRT (`litert-community`) | 8 émotions | ≈ 61 % | 8 Mo | — | Apache-2.0 | ❌ pas de valence / éveil |
| EmoNet (Toisoul et al., Nat. Mach. Intell. 2021) | valence + éveil + 5/8 émotions | meilleure CCC sur AffectNet que B0 [H, chiffres à revérifier] | ≈ 50 Mo [H] | — | CC BY-NC-ND [H, à revérifier] : interdiction des œuvres dérivées (conversion) | ❌ licence |
| Blendshapes MediaPipe + a priori FACS (étape 1) | sourire, froncement… | aucune mesure de valence publiée | déjà embarqué | ≈ 40 ms | Apache-2.0 | ↩︎ repli si le modèle manque |

- **Licence et prudence** : les poids viennent d'un dépôt Apache-2.0 dont le README lève toute limite d'usage, mais
  ils ont été appris sur AffectNet, dont l'accord réserve les **images** à la recherche non commerciale. HealthTrack
  est gratuit et personnel ; par prudence, les poids ne sont **jamais redistribués** par nous (ni dans le dépôt, ni dans
  l'APK publié) : le téléphone les télécharge lui-même depuis la source officielle (`raw.githubusercontent.com`, dépôt
  actuel puis ancien), une fois, **SHA-256 vérifié** (`c43e056a…`), comme le fait la bibliothèque Python des auteurs.
  Aucune donnée de l'utilisateur dans la requête.
- **Moteur** : ONNX Runtime Android 1.22.0 (≈ 18 Mo arm64). Versions ≥ 1.27 écartées : leur AAR ajoute un
  `TelemetryInitializer` (client HTTP 1DS de Microsoft, infos de l'appareil) — interdit (rien ne sort du téléphone).
  Conversion en LiteRT écartée : elle produirait des poids dérivés qu'il faudrait héberger.
- **Consommation** : 3 images × ≈ 60–100 ms CPU de plus par lecture (≤ 0,3 s, ≤ 150 lectures / jour → ≤ 45 s de
  CPU / jour) ; à mesurer sur l'A56 : `timing.inferenceMsAvg` et `affect.loadMs` du diagnostic exporté. GPU / NNAPI :
  pas encore (NNAPI est déprécié depuis Android 15 ; XNNPACK à essayer si la latence déçoit).
- **Usage dans l'estimateur** (`mood/faceMood.js`) : la valence du modèle remplace l'a priori FACS quand la lecture en
  porte une ; on retire **la moitié** de la valence habituelle de la personne (28 jours) — hypothèse : un « air »
  constant tient pour moitié au visage, pour moitié à l'humeur qui dure ; erreur type 1,1 → 0,9 (contre 1,3 → 1,0 pour
  l'a priori), prudente parce que la CCC publiée compare des photos de personnes différentes, pas les jours d'une même
  personne (MoodCam / FacePsy : AUC 0,58–0,64 intra-personne). L'éveil est affiché (« plutôt calme / modéré / plutôt
  animé ») mais n'entre pas dans la note de bien-être. Les deux restent des entrées **Y** (signal émotionnel direct, D5).
- **Suite** : mesurer sur l'A56 (latence, chargement, taux d'échec) ; comparer valence du modèle et notes du soir
  quand il y aura des jours notés (la porte `gate.js` lit encore les indices blendshapes : y ajouter la valence) ;
  étape 3, fusion avec la voix.

### Révision du comparatif (run idées du 20/10/2026 08:30)

- HSEmotion publie aussi **`mbf_va_mtl.onnx`** (MobileFaceNet, 8,3 Mo, 112 px) et `mobilevit_va_mtl.onnx` (39 Mo).
  Sur des vidéos réelles sans réentraînement (Aff-Wild2), B0, MobileFaceNet, MobileViT et DDAMFN se valent
  (CCC valence ≈ 0,40–0,41) ; l'avance de DDAMFN sur AffectNet ne se transfère pas ; le lissage temporel apporte plus.
  Latence mesurée (x86, 1 fil) : 20 / 22 / 73 ms. **Décision** : garder B0, ajouter MobileFaceNet en duo (I126), leur
  désaccord alimentant la confiance ; MobileViT écarté.
- EmoNet : CC BY-NC-ND 4.0 **confirmé** sur le dépôt officiel → écarté.
- Voix : aucun modèle valence / éveil à la fois léger et sous licence permissive (I128) → l'étape 3 commence par la
  phrase du soir et la dictée. Détail et sources : `IDEES.md` (20/10 08:30).
