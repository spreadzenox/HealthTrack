# 2026-10-11 18:30 UTC (20:30 Paris) — Run idées : objets connectés, capture passive, humeur, conversations

**Type** : 💡 (run « idées », pas de code produit)  ·  **PR** : voir le tableau du README

## Pourquoi
- Premier run qui lit les **nouvelles directions du propriétaire (11/10)** : vision « hub ultime / humain augmenté
  par les données », priorités saisie automatique → objets connectés → humeur passive ; runs de 08 h / 20 h dédiés aux
  idées. Consigne : les reporter dans la charte et le backlog, puis réorienter le backlog.
- Démarrage : aucune PR [Auto] ouverte ; « Build & Release » v96 (PR #104) publié avec son APK.

## Ce qui a été fait
- **Charte** (`README.md` §0) : directions du propriétaire, nouveau type de run 💡, fichier `IDEES.md` dans le tableau.
- **Recherche** en 4 volets parallèles (Huawei GT 6 Pro ; autres fabricants + BLE standard + Capacitor ; humeur
  passive et enregistreurs de conversations ; besoins des utilisateurs et capture automatique) → **`IDEES.md`**
  créé : synthèse des besoins, faits clés sourcés, 21 idées notées impact × faisabilité, pistes d'implémentation.
- **Backlog** réorienté : nouvelle vision, chantiers **C7** (objets connectés), **C8** (capture passive), **C9**
  (humeur estimée et conversations), « Prochaines étapes » réordonnées.

## Découvertes principales
- **La GT 6 Pro du propriétaire est prise en charge par Gadgetbridge (0.88, 12/12/2025), qui écrit dans Health
  Connect depuis la 0.89 (02/2026)** : FC, FC repos, VFC, SpO₂, température, respiration, sommeil, exercices. Chemin
  immédiat, sans code : GT 6 Pro → Gadgetbridge → Health Connect → HealthTrack. Appairage sans réinitialiser la
  montre (ID de compte Huawei → clé). Huawei Health Kit : accès réservé de fait aux entreprises ; pas de synchro
  native Huawei → HC ; export RGPD JSON / XLS possible (≤ 30 j).
- **HealthTrack ne lit que 9 types Health Connect** : fréquence respiratoire, température, poids, tension, glycémie
  sont supportés par le plugin mais pas demandés → gain rapide (I2).
- Health Connect couvre 7 fabricants sur 9 ; Fitbit Web API éteinte le 30/10/2026 ; Polar AccessLink ouvert et
  gratuit ; `@capacitor-community/bluetooth-le` 8.3 compatible Capacitor 8.
- Protocoles : familles Huawei/Honor (un pilote), Xiaomi (Huami / Zepp OS / protobuf), Garmin GFDI ; base MIT
  réutilisable pour Huawei : `huawei-lpv2` (Gadgetbridge = AGPL, ne pas copier).
- Humeur : l'écart à **sa propre** norme est la bonne approche (GLOBEM : les modèles généraux généralisent mal) ;
  Emobot valide en intra-individuel (r = 0,895 avec la MADRS, ≥ 7 jours sur 14).
- Conversations : **Omi** seul vraiment ouvert (API personnelle, SDK BLE) ; Limitless coupé dans l'UE (Meta),
  Bee sans API (Amazon), Plaud en bêta développeur.

## Vérifications
- Tests : 755 ✅ (inchangé, seul `journal/` modifié) · pas de build / visuel nécessaires (aucun code produit modifié).
- CI de la PR : Vitest ✅, Build APK ✅ ; émulateur API 36 ❌ sur `HealthConnectTest.healthConnect_canWriteAndReadSleep`
  alors que l'APK est identique à main (vert sur 433b402) → test instable, job relancé une fois (à surveiller : noté au backlog).
- Sites inaccessibles : **Reddit** (outil bloqué, miroirs 403), page Health Kit de developer.huawei.com (rendu JS),
  support.garmin.com (403). LinkedIn Emobot lisible (dates relatives seulement).

## Apprentissages / décisions
- Ordre retenu : **brancher d'abord les données du propriétaire** via Health Connect (guide + types manquants), avant
  la couche BLE générique — gain immédiat, risque nul, et la couche BLE reste nécessaire pour les capteurs standard.
- Ne pas viser un pilote BLE Huawei avant d'avoir vérifié sur la vraie montre (chiffrement, variante récente du
  protocole) ; la montre ne parle qu'à une app à la fois.
- Météo / pollen : seule une position approximative sort du téléphone, aucune donnée de santé → compatible avec la
  règle local-first, à dire dans Paramètres.

## Suite proposée
- 🏗️ C7 : types HC manquants + guide Huawei → Gadgetbridge → Health Connect (prochain run de code).
- 🏗️ C7 : « Mes appareils » (apps santé installées) ; C8 : météo / air / pollen.
- 💡 Run idées du 12/10 08:00 : retours réels sur GT 6 Pro + Gadgetbridge (Reddit par un autre chemin), bagues, CGM,
  Gemini Nano sur Galaxy A56.
