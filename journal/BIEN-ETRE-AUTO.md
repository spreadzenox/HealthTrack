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
   diagnostic ; le visage complète les jours sans note (I115).
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
