# Idées — le hub de santé et de vie ultime

> Alimenté par les runs « idées » (08 h et 20 h, heure de Paris). Chaque idée : **besoin servi**, **impact** (1–5),
> **faisabilité** (1–5, 5 = facile), **pistes d'implémentation**, **sources** (datées). Les meilleures entrent dans
> `BACKLOG.md`. Notation : [V] vérifié sur la source, [T] source tierce / commerciale, [H] hypothèse.
>
> Question de départ, à se reposer à chaque run : *« pour un hub qui suit ma santé et ma vie, de quoi aurais-je besoin,
> qu'est-ce qui me changerait vraiment la vie ? »*

---

## Run du 11/10/2026 20:30 (Paris) — objets connectés, capture passive, humeur, conversations

### Ce que veulent les gens (synthèse)

1. **Fin des silos** : « tried every integration tool, and still struggle to get our data to "talk to each other" »
   (fil r/QuantifiedSelf cité sur le forum QS) ; chaque fabricant garde son silo, synchros à sens unique (Garmin → HC
   en écriture seule, mars 2026). Google lance « Google Health » (ex-Fitbit, mai 2026) comme hub + coach Gemini à
   9,99 $/mois → **notre créneau : hub multi-marques, local, gratuit, au-delà de la santé physique**.
2. **Moins de saisie** : Bearable est jugé bon pour ceux « qui ne craignent pas les check-ins manuels » — c'est
   précisément la limite. Complexité de saisie = cause n° 1 d'abandon (déjà noté RESEARCH V3).
3. **Des actions, pas des graphiques** (Bevel, Whoop Coach, Oura Advisor).
4. **Saisir une intensité**, pas seulement oui / non (critique d'Exist sur le forum QS).
5. **Être prévenu tôt** d'une maladie (Oura Symptom Radar ; FC repos ↑, VFC ↓, respiration ↑ jusqu'à ~1 semaine avant
   les symptômes).
6. **Relier le médical** (bilans sanguins : Whoop Advanced Labs, Guava).
7. **Maîtrise de ses données** (EFF, juillet 2026 : les wearables n'ont pas de protection santé particulière).

*Reddit inaccessible depuis la session (blocage de l'outil, miroirs en 403) : besoins tirés du forum Quantified Self,
de la presse, d'avis et d'études. À retenter au prochain run idées.*

### Faits clés trouvés ce soir

- **Huawei Watch GT 6 Pro (montre du propriétaire)** — [V] prise en charge par **Gadgetbridge depuis la 0.88.0
  (12/12/2025)**, « Mostly supported », appairage possible **sans réinitialiser** la montre (ID de compte Huawei à
  17 chiffres → clé d'authentification ; retirer les permissions de Huawei Health **sans désappairer** la montre).
  Données : FC, FC repos, VFC (selon appareil), SpO₂, stress, température cutanée, sommeil (phases avec HarmonyOS 5+),
  pas, calories, VO2max, séances avec GPS. [V] **Gadgetbridge écrit dans Health Connect depuis la 0.89 (10/02/2026)** :
  pas, distance, FC, FC repos, VFC, SpO₂, température, fréquence respiratoire, sommeil, VO2max, exercices (stress non
  écrit). Dernière version 0.94 (17/09/2026). → **chemin immédiat sans code : GT 6 Pro → Gadgetbridge → Health
  Connect → HealthTrack.**
  - Alternatives : Health Sync (Appyhapps, payant, HMS Core requis, couverture partielle — phases de sommeil / SpO₂
    souvent perdues) ; Huawei Health Kit = revue manuelle Huawei, dossier d'entreprise → irréaliste pour nous ; **pas
    de synchro native Huawei → Health Connect** en 2026 ; **export RGPD** (Privacy Center, XLS + JSON, ≤ 30 j,
    page du 18/05/2026) pour l'historique.
  - Protocole : Gadgetbridge (AGPL) ne documente pas le protocole Huawei ; base réutilisable **sous licence MIT** :
    `zyv/huawei-lpv2` (Python, « Huawei BLE Link Protocol v2 ») + conférence eh19. Les montres récentes semblent
    passer à une variante (LPv3 ? chiffrement réglable dans GB 0.92) [H]. Huawei et Honor = un seul pilote dans
    Gadgetbridge → une famille [H].
- **Autres fabricants** : Health Connect couvre 7 marques sur 9 (Samsung, Garmin en écriture seule depuis 07/2025,
  Fitbit/Pixel, Zepp (26 types, 01/2025), Mi Fitness, Withings, Oura, Polar, Coros). **Fitbit Web API éteinte le
  30/10/2026**, Google Health API fermée aux nouveaux projets [V]. Garmin Connect Developer = entreprises approuvées.
  OAuth ouverts à un particulier : **Polar AccessLink (gratuit)** [V], **Whoop API v2** (abonnement) [V], Oura v2
  (OAuth, ≤ 10 utilisateurs sans validation) [T].
- **Gadgetbridge, familles de protocoles** [V] : Huawei/Honor (un pilote) ; Xiaomi : **Huami** (Mi Band ≤ 7,
  Amazfit anciens), **Zepp OS** (Balance, Bip 5, GTR/GTS 3–4…), **Xiaomi protobuf** (Mi Band 8–10, Redmi Watch 2–6,
  Watch S1–S4) ; Garmin **GFDI/protobuf** (+59 modèles en 0.94). Tous (sauf vieux Bip / Mi Band 3) exigent une clé
  d'authentification issue de l'app officielle.
- **BLE standard** : FC 0x180D (+ intervalles RR → VFC RMSSD), balance 0x181D / 0x181B, tensiomètre 0x1810,
  glycémie 0x1808 / CGM 0x181F, oxymètre 0x1822, thermomètre 0x1809, RSC / CSC / puissance / Fitness Machine.
  Appareils réels : ceintures Polar H10 / Garmin / Wahoo, montres Garmin en « diffusion FC », Omron (mesure courante
  en standard, historique propriétaire), balances Mi / Chipsea (données dans l'annonce, sans connexion). GHS (Generic
  Health Sensor, 2023) : pas encore de produit grand public trouvé.
- **Capacitor** : `@capacitor-community/bluetooth-le` **8.3.0** (28/09/2026, compatible Capacitor 8) : filtres
  services / nom / données fabricant / service data, `getBondedDevices()` ; pas d'arrière-plan (→ service natif).
  Companion Device Manager (Android 16 : `startObservingDevicePresence`) → réveil quand l'appareil revient à portée,
  plugin natif à écrire. Apps installées : `<queries>` par package + `PackageManager` (pas de `QUERY_ALL_PACKAGES`).
- **Humeur** : Emobot (CentraleSupélec, 2022) — voix, visage, mouvement, usage de l'écran, sommeil, activité ;
  validation intermédiaire ASCP 2026 : r = 0,895 avec la MADRS en intra-individuel, ≥ 7 jours valides sur 14 ;
  annonce de « Weekly Insights » (résumé en langage simple de la semaine). Réalité hors labo : AUC ~0,6–0,75 ; GLOBEM
  (UW, 2022) : les modèles généralisent mal d'une cohorte à l'autre → **l'écart à sa propre ligne de base** est la
  bonne approche. Mobilité GPS = meilleur signal passif (r ≈ −0,45 à −0,6 avec le PHQ-9, Saeb 2015). Kintsugi (voix)
  a fermé en 02/2026 en publiant ses modèles.
- **Conversations** : **Omi** = seul vraiment ouvert (open source, API REST `api.omi.me/v1/dev` avec clé
  personnelle, webhooks, SDK BLE autonome, transcription illimitée sur le téléphone en gratuit). **Plaud** : Developer
  Platform en bêta (05/2026), CLI, exports TXT/SRT/DOCX/PDF. **Limitless** racheté par Meta (12/2025), coupé dans
  l'UE. **Bee** racheté par Amazon, pas d'API. Micro du téléphone : service de premier plan `microphone` (Android 14+),
  lancé depuis l'app, notification permanente ; transcription locale (`SpeechRecognizer` hors ligne, Whisper.cpp,
  Vosk FR ~50 Mo). Droit FR : art. 226-1 Code pénal → rappel simple, sans bloquer.

### Idées classées (impact × faisabilité)

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I1 | **Guide « Montre Huawei → Gadgetbridge → Health Connect »** dans Connecteurs + détection des apps installées | Objets connectés, zéro saisie | 5 | 5 | 25 |
| I2 | **Lire plus de types Health Connect** (fréquence respiratoire, température, poids, tension, glycémie, VO2max ?) | Données brutes, radar maladie | 4 | 5 | 20 |
| I3 | **Assistant « Mes appareils »** : apps santé installées (`<queries>`) → connecteur conseillé + étapes | Autodétection | 5 | 4 | 20 |
| I4 | **Contexte automatique : météo, pression, qualité de l'air, pollen** (Open-Meteo, sans clé) | Déclencheurs (migraine, énergie, allergies) | 4 | 5 | 20 |
| I5 | **Radar maladie étape 2** : + respiration et température, « signes mineurs / nets », mode repos | Être prévenu tôt | 5 | 4 | 20 |
| I6 | **Temps d'écran et « téléphone au lit »** (UsageStatsManager) | Sommeil, humeur, zéro saisie | 5 | 4 | 20 |
| I7 | **Humeur estimée** : écart à la norme (sommeil, VFC, activité, écran, régularité) calibré sur les check-ins | Priorité n° 3 | 5 | 4 | 20 |
| I8 | **Couche BLE générique, étape 1 : profils standard** (FC + RR → VFC, balance, tensiomètre, thermomètre, oxymètre) | Données brutes, compatibilité large | 5 | 3 | 15 |
| I9 | **Résumé de la semaine en langage simple** (local, Gemini optionnel pour la rédaction) | Des actions, pas des graphiques | 4 | 4 | 16 |
| I10 | **Import Omi** (clé perso → conversations / mémoires → journal, repas évoqués, stress) | Conversations | 4 | 3 | 12 |
| I11 | **Calendrier → charge de la journée** (CalendarContract) | Stress / énergie | 4 | 4 | 16 |
| I12 | **Repas détectés dans la galerie** (nouvelles photos → « repas à 12 h 40 ? ») | Zéro saisie repas | 4 | 3 | 12 |
| I13 | **Tags avec intensité** (douleur 0–10, nombre de verres) + check-in depuis une notification / un widget | Saisie en un geste | 3 | 4 | 12 |
| I14 | **Import des exports constructeurs** (Huawei JSON RGPD, Garmin FIT, Samsung CSV, Oura CSV, Zepp CSV) | Historique, silos | 4 | 3 | 12 |
| I15 | **Mobilité / temps dehors** (activity recognition, nb de lieux, rayon, sans coordonnées précises) | Humeur (meilleur signal passif) | 4 | 3 | 12 |
| I16 | **Bilans sanguins par photo / PDF** (Gemini → biomarqueurs, courbes) | Relier le médical | 4 | 4 | 16 |
| I17 | **Journal vocal** (dictée → transcription locale → résumé, sentiment) | Conversations / humeur | 4 | 3 | 12 |
| I18 | **« Jours similaires »** (kNN sur le vecteur du jour, « et le lendemain ? ») | Comprendre | 3 | 5 | 15 |
| I19 | **Bilan pour le médecin** (PDF 30 / 90 jours, local) | Utilité concrète | 3 | 5 | 15 |
| I20 | **Pilote BLE Huawei direct** (à partir de `huawei-lpv2`, MIT) | Données brutes sans app tierce | 4 | 1 | 4 |
| I21 | **Recommandations matériel** : ceinture FC (Polar H10, RR → VFC fiable), tensiomètre BLE standard, balance | Mieux mesurer | 3 | 5 | 15 |

### Détail et pistes d'implémentation

**I1 — Guide Huawei → Health Connect (zéro code natif).**
Dans Plus → Connecteurs, une carte « Montre Huawei / Honor » : « Votre montre n'écrit pas dans Health Connect. Solution
gratuite : Gadgetbridge. » Étapes : (1) installer Gadgetbridge (F-Droid) ; (2) récupérer l'ID de compte Huawei
(17 chiffres) ; (3) retirer les permissions de Huawei Health **sans désappairer la montre** ; (4) appairer dans
Gadgetbridge avec la clé ; (5) Réglages → Intégrations → Health Connect, cocher les types, « Sync after device sync » ;
(6) revenir dans HealthTrack → synchroniser. Contreparties affichées : on quitte l'app Huawei au quotidien, le stress ne
passe pas, une mise à jour du firmware peut casser des fonctions. Liens externes via `@capacitor/app-launcher` (déjà
présent). Variante payante : Health Sync. Même schéma pour Xiaomi / Amazfit (Zepp et Mi Fitness écrivent déjà dans HC →
simple « activez Health Connect dans Zepp »).

**I2 — Types Health Connect manquants.** `@capgo/capacitor-health` 8.4.5 lit déjà `respiratoryRate`,
`bodyTemperature`, `basalBodyTemperature`, `weight`, `bodyFat`, `bloodPressure`, `bloodGlucose`, `height`
(vérifié dans `definitions.d.ts`), mais `READ_TYPES` n'en demande que 9. Ajouter les types, les entrées et la carte du
journal ; `SkinTemperatureRecord` (température cutanée nocturne, écrite par Gadgetbridge / Samsung / Oura) n'est pas
exposé par le plugin → petit ajout natif ou PR au plugin. Attention : demander de nouvelles permissions HC → la
synchro existante ne doit pas échouer si l'utilisateur refuse les nouvelles (tester).

**I3 — « Mes appareils » (autodétection).** Plugin natif minimal `InstalledApps.check(packages[])` +
`<queries>` dans le manifeste pour ~15 packages (Huawei Health `com.huawei.health`, Samsung Health, Garmin Connect,
Fitbit, Zepp, Zepp Life, Mi Fitness, Withings, Oura, Polar Flow, Whoop, Gadgetbridge, Health Sync, Health Connect —
**noms à vérifier**). Table `appCatalog` : package → écrit-il dans HC ? quels types ? connecteur conseillé + guide.
Écran : « Détecté : Huawei Health → vos données n'arrivent pas dans Health Connect → [Guide] ». Plus tard :
`getBondedDevices()` (BLE) pour lister montres / balances appairées au téléphone.

**I4 — Contexte environnemental.** Open-Meteo (gratuit, sans clé) : température, pression, humidité, ensoleillement,
`european_aqi`, pollens (`air-quality-api`). Position **approximative** (ville, arrondie à 0,1°) choisie une fois, un
appel par jour + historique (`archive-api`) → variables des Analyses (« pression en baisse », « pollen élevé »). Seul
une position grossière sort du téléphone, aucune donnée de santé → conforme à la règle local-first ; le dire dans
Paramètres.

**I5 — Radar maladie étape 2.** Ajouter respiration (HC `respiratoryRate`, souvent nocturne) et température aux
signaux de `radar.js` ; niveaux « signes légers / nets » à la manière d'Oura ; proposer « journée calme » ; jamais de
diagnostic. Dépend d'I2.

**I6 — Écran et téléphone au lit.** Plugin `@capgo/capacitor-android-usagestatsmanager` (à vérifier) ou natif ;
permission spéciale accordée dans les réglages Android (guide en un écran). Variables : temps d'écran / j, après
22 h, après l'heure de coucher (sommeil HC), dernier usage avant l'endormissement, premier usage au réveil (→ sommeil
estimé sans montre), catégories (réseaux sociaux, jeux). Études : usage au lit ↔ latence d'endormissement et VFC.

**I7 — Humeur estimée (style Emobot, sur l'appareil).** Score quotidien « humeur estimée » = régression personnelle
(Ridge déjà disponible) des check-ins sur l'écart à la norme de : sommeil, régularité, VFC, FC repos, pas, temps
dehors, écran tard, météo ; affiché avec une fourchette et « estimation, pas un diagnostic » ; ≥ 7 jours valides /14
(seuil Emobot) ; sert aussi à **pré-remplir le check-in** (un tap pour confirmer → saisie en un geste). Étapes
suivantes : sentiment du journal / des conversations, prosodie (plus tard, fiabilité faible).

**I8 — Couche BLE générique.** `@capacitor-community/bluetooth-le` 8.3. Architecture :
`DeviceDriver { id, kind, match(fingerprint) → score, capabilities, requirements, connect, sync(since), stream }` ;
registre ordonné (BLE standard par service SIG → pilotes fabricant → « app installée → HC » → cloud OAuth) ; empreinte
= nom, UUID de services annoncés / découverts, company ID, service data, DIS (0x180A), état d'appairage ; garde-fou :
**ne jamais se connecter à une montre gérée par son app officielle** ; appareil inconnu → empreinte stockée en local
(sans adresse MAC) + export JSON pour ajouter un pilote. Étape 1 = FC 0x180D (mesure + RR → VFC RMSSD sur 5 min, idéal
avec une ceinture), puis balance / tensiomètre / thermomètre (indications, RACP pour l'historique). Tester le parsing
avec des trames d'octets en TDD (pas besoin d'appareil).

**I9 — « Votre semaine en clair ».** Agrégats calculés localement (moyennes vs norme, tags, liens solides) → texte
gabarit en français ; Gemini (clé utilisateur) seulement pour reformuler, chiffres vérifiés (déjà R#13).

**I10 — Import Omi.** Clé développeur personnelle saisie dans Paramètres, `GET /v1/dev/user/conversations` (≈ 60
lectures / h), stockage local (titre, résumé, horodatage, catégories) → carte « Conversations » du journal ; extraction
optionnelle (repas évoqués, sport, stress) ; rappel « l'enregistrement d'autrui peut nécessiter leur accord ».
Plaud : attendre la sortie de bêta du SDK ; en attendant, import de fichiers TXT exportés.

**I14 — Imports de fichiers constructeurs.** Garmin FIT (format documenté, SDK FIT officiel), Huawei JSON (RGPD,
schéma à découvrir sur un vrai export du propriétaire), Samsung CSV, Oura CSV. Aperçu avant import (même UX que
l'import sûr), dédoublonnage avec HC.

**I20 — Pilote BLE Huawei.** Seulement après I1/I3/I8 ; partir de `huawei-lpv2` (MIT) et de la conférence eh19,
vérifier sur la GT 6 Pro (chiffrement, LPv3 ?) ; jamais de code Gadgetbridge (AGPL). Contrainte : la montre ne parle
qu'à une app à la fois → mode « HealthTrack remplace Huawei Health ».

### Sources (consultées le 11/10/2026)

- Gadgetbridge : https://gadgetbridge.org/blog/release-0_88_00/ (12/12/2025) ; https://gadgetbridge.org/basics/topics/huawei-honor/ ; https://gadgetbridge.org/basics/pairing/huawei-honor-pairing/ ; https://gadgetbridge.org/basics/integrations/health-connect/ ; https://gadgetbridge.org/blog/release-0_94_00/ (17/09/2026) ; https://gadgetbridge.org/basics/topics/xiaomi-protobuf/ ; https://codeberg.org/Freeyourgadget/Gadgetbridge/issues/5428 (28/09/2025)
- Huawei : https://healthsync.app/f-a-q/ ; https://www.fitmesh.fit/en/blog/huawei-health-health-connect-sync (20/06/2026, éditeur intéressé) ; https://consumer.huawei.com/ie/support/data-act/ (18/05/2026) ; https://github.com/zyv/huawei-lpv2 (MIT) ; https://media.ccc.de/v/eh19-186-all-your-fitness-data-belongs-to-you-reverse-engineering-the-huawei-health-android-app
- Fabricants : https://developers.google.com/health/reference/rest/v4beta/users ; https://developer.samsung.com/health/data/release-note.html ; https://developer.garmin.com/gc-developer-program/overview ; https://www.polar.com/accesslink-api/ ; https://developer.whoop.com/docs/developing/overview ; https://support.ouraring.com/hc/en-us/articles/360025441594 ; https://gadgetsandwearables.com/2025/01/24/zepp-health-connect/
- BLE / Android : https://github.com/capacitor-community/bluetooth-le ; https://developer.android.com/develop/connectivity/bluetooth/companion-device-pairing ; https://developer.android.com/training/package-visibility/declaring ; https://www.bluetooth.com/specifications/specs/generic-health-sensor-profile/ ; https://dcrainmaker.com/2020/06/tidbit-bluetooth-broadcasting.html
- Humeur : https://www.biospace.com/press-releases/nrx-pharmaceuticals-nasdaq-nrxp-strategic-partner-emobot-presents-late-breaking-clinical-validation-of-the-emocare-depression-thermometer-at-ascp-2026 (28/05/2026) ; https://www.linkedin.com/company/emobot/ ; https://ubicomplab.cs.washington.edu/publications/globem ; https://peerj.com/articles/2537 ; https://mental.jmir.org/2026/1/e85319 ; https://bhbusiness.com/2026/02/11/mental-health-voice-biomarker-kintsugi-closes-makes-all-technology-and-research-public/ ; https://docs.sahha.ai/docs/products/scores/mental ; https://pmc.ncbi.nlm.nih.gov/articles/PMC9643910/
- Conversations : https://docs.omi.me/doc/developer/api/overview ; https://www.omi.me/pricing ; https://docs.plaud.ai/plaud-mcp-cli/cli ; https://www.neowin.net/news/meta-acquires-ai-startup-limitless-ending-sales-of-its-popular-pendant-wearable ; https://www.retaildive.com/news/amazon-acquires-ai-wearables-company-bee/753810/ ; https://developer.android.google.cn/develop/background-work/services/fg-service-types ; https://developers.google.com/ml-kit/genai
- Besoins / apps : https://forum.quantifiedself.com/t/personal-dashboards-for-self-tracking-data/8202?page=5 ; https://forum.quantifiedself.com/t/improving-my-mental-and-physical-health-through-data-where-to-start/8686 ; https://www.sensai.fit/blog/wearable-apple-health-integration-what-syncs-oura-whoop-garmin ; https://techcrunch.com/2026/05/07/googles-9-99-per-month-ai-health-coach-launches-may-19/ ; https://www.techadvisor.com/article/2575433/oura-symptom-radar-i-should-have-listened-to-new-smart-ring-feature.html ; https://bmjopen.bmj.com/content/12/6/e058274 ; https://www.wareable.com/health-and-wellbeing/whoop-advanced-labs-blood-test-uploads-global-rollout-official ; https://open-meteo.com/en/docs/air-quality-api ; https://kb.exist.io/article/55-will-exist-find-correlations-across-multiple-days ; https://www.eff.org/deeplinks/2026/07/most-smart-watches-rings-and-bands-lack-basic-transparency-reports-and-key-privacy

### À creuser au prochain run idées

- Reddit (r/Huawei, r/Gadgetbridge, r/QuantifiedSelf) par un autre chemin : retours réels sur GT 6 Pro + Gadgetbridge.
- Noms de packages exacts (Huawei Health, Health Sync) et liste des types HC écrits par Samsung / Mi Fitness.
- Gemini Nano (ML Kit GenAI) sur Galaxy A56 : disponible ou non ? (conditionne résumé / sentiment hors ligne).
- Règles Google Play pour `PACKAGE_USAGE_STATS` (sans objet tant que l'APK est distribué via GitHub).
- Bagues (Oura, RingConn, Ultrahuman, Samsung Ring), CGM grand public (Stelo, Lingo) : accès aux données brutes.
