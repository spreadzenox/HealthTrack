# Veille — besoins, health tech, ML

> Mémoire de recherche de la routine. Chaque run 🔭 ajoute une section datée en tête (« ## AAAA-MM-JJ — sujet ») et
> reporte les idées actionnables dans `BACKLOG.md`. Les numéros d’idées (#n) ci-dessous sont repris dans le backlog.

---

## 2026-10-08 — HealthTrack — Recherche pour le backlog produit (octobre 2026)

> Contexte : app santé personnelle, local-first (IndexedDB, pas de backend), React + Vite + Capacitor, UI en français.
> Existant : journal photo → Gemini (`gemini-2.5-flash`), KPI nutrition vs apports de référence, bien-être 1–5,
> Health Connect (pas, sommeil, FC, FC repos, HRV, calories, activité), Withings Body Scan, compteur cigarettes,
> Recommandations (Pearson, OLS ridge + hold-out, lissage temporel des nutriments), widget de prédiction, export/import JSON.
> Les références `[n]` renvoient à la section « Sources ». « (éditeur) » = chiffre publié par l'entreprise elle-même, non vérifié.

---

### 1. Besoins réels des utilisateurs

#### 1.1 La friction de saisie, première cause d'abandon
- Seuls ~3 % de 190 000 téléchargements d'une app de journal alimentaire ont été utilisés au-delà d'une semaine, et beaucoup abandonnent avant d'en tirer un bénéfice (Cordeiro, CHI, cité par Big Think) [4].
- Une revue de König et al. recense 328 obstacles et facilitateurs pour les apps nutrition ; la mauvaise ergonomie arrive en tête, et noter chaque prise alimentaire coûte beaucoup de temps [5].
- Contre-intuitif : sur une semaine en conditions réelles, des adultes s'attendaient à ce que la photo soit plus simple. En pratique, ils l'ont trouvée plus difficile que le texte, ont moins noté et ont plus souvent abandonné [6]. → La photo seule ne suffit pas ; il faut aussi le texte, la dictée et « comme hier ».
- Les réseaux sociaux intégrés ne créent pas la boucle vertueuse espérée : certains utilisateurs partent quand leurs amis deviennent inactifs, d'autres se découragent face à des pairs qui progressent plus vite [4].
- Bearable : ses bénéfices dépendent d'une saisie régulière, ce qui est difficile pour les personnes peu motivées ou ayant des troubles des fonctions exécutives (revue clinique, mars 2026) [10].

#### 1.2 Données en silos
- La communauté QS décrit des données « dispersées dans des silos autonomes » et des tableaux de bord qui juxtaposent les métriques sans montrer leurs relations [2].
- CHI 2014 : les obstacles sont le manque de temps et de motivation, et la difficulté à intégrer puis interpréter les données. Les pièges classiques : suivre trop de choses, et ne pas noter les déclencheurs ni le contexte [3].
- Sur r/QuantifiedSelf, deux demandes reviennent : un tableau de bord unique (humeur, santé, habitudes) et une IA qui organise les données et en tire des enseignements [1].
- Samsung Health → Health Connect : la synchronisation se fait côté téléphone, quand la montre se reconnecte ou que l'app Samsung Health est ouverte [25]. Des développeurs signalent des types de données manquants ou incomplets [24].

#### 1.3 Des insights peu crédibles quand ils contredisent le ressenti
- Utilisateurs WHOOP : « 94 % de récupération » un jour d'épuisement, ou des séries de nuits « non récupérées » alors qu'ils se sentent en forme. Ils réclament depuis longtemps un check-in « comment je me sens » [12][13][14]. Wareable critique aussi la présentation, avec un badge tête de mort à 1 % [15].
- Ce que les utilisateurs d'Exist pensent de ses corrélations : « un mélange, certaines pas très utiles, d'autres curieuses » [36]. Exist rappelle lui-même que corrélation ≠ causalité [35].
- Test du Washington Post (janvier 2026) : à partir des mêmes données Apple Watch, ChatGPT Health a donné une note cardio passant de F à B selon les sessions ; des médecins ont jugé ces erreurs « totalement inacceptables » [16][17].
- Exploration visuelle : sur des données synthétiques à vérité connue, plus de 60 % des « insights » des utilisateurs étaient faux [85]. Comparer chaque personne à sa propre baseline évite certaines fausses conclusions [86].
- **Opportunité pour HealthTrack** : l'app recueille déjà le ressenti (bien-être 1–5). Elle peut donc calibrer ses scores sur ce que la personne vit, ce que WHOOP ne fait pas.

#### 1.4 Nutrition : bases peu fiables et paywalls
- MyFitnessPal : le passage du scan code-barres en payant (2022–2023) reste la plainte la plus forte ; 29 % des avis 1–3★ des apps calories portent sur les incitations à s'abonner [7][8].
- Les bases participatives contiennent des doublons contradictoires (« cheeseburger » donne plus de 200 entrées aux macros très différentes) [7][9].
- Cronometer se distingue par sa précision sur les micronutriments, avec un public « scientifique/biohacker » [7].

#### 1.5 Confiance et vie privée
- Mozilla : 18 des 25 apps et objets de santé reproductive ont des pratiques de confidentialité insuffisantes [19] ; 59 % des apps de santé mentale portent l'avertissement « Privacy Not Included » [18].
- **Directement pertinent pour HealthTrack** : avec une clé Gemini gratuite, les prompts et sorties peuvent servir à améliorer les produits Google et être relus par des humains. Google conseille de ne pas soumettre d'informations sensibles ou personnelles via les services gratuits [20].

#### 1.6 Usure de la motivation et effets pervers
- Environ un tiers des propriétaires de bracelets d'activité cessent de les utiliser dans les 6 mois (enquêtes Endeavour 2013–2014, anciennes) [21][22].
- HeartSteps (essai micro-randomisé) : une suggestion augmente d'abord les pas de 66 %, puis l'effet s'estompe au fil des 6 semaines [52].
- Orthosomnie : courir après le score de sommeil peut aggraver l'anxiété et l'insomnie, par exemple en restant plus longtemps au lit [23].
- Streaks : les preuves viennent surtout de données internes (Duolingo : 2,3× plus d'engagement après 7 jours de série, sans lien causal établi) [48]. Lally : automatisation médiane en 66 jours (18 à 254), et **un jour manqué ne compromet pas l'habitude** [47].

**Implications de conception** : 1) saisie en moins de 10 s, avec plusieurs modes (photo, texte, favoris) ; 2) tout comparer à la baseline personnelle ; 3) présenter les corrélations comme des hypothèses, avec un moyen de les tester ; 4) faire calculer les chiffres par l'app et laisser le LLM les raconter, sans jamais lui confier une note ou un diagnostic ; 5) ne jamais culpabiliser ; 6) être transparent sur ce qui part vers Gemini.

---

### 2. Ce qui marche en health tech (2025–2026)

| Pattern | Exemples | Preuves / chiffres | Leçon pour HealthTrack |
|---|---|---|---|
| Scores relatifs à la baseline personnelle | WHOOP Recovery (comparé à vos 30 derniers jours) [12] ; HRV4Training | HRV4Training : baseline = moyenne glissante de rMSSD sur 7 j, « plage normale » calculée sur 40–60 j, et coefficient de variation (CV) pour la variabilité jour à jour [26][27] | L'app synchronise déjà FC repos et HRV : afficher 7 j vs 60 j, z-score et CV |
| Alerte précoce « signes de maladie » | Oura Symptom Radar → Health Radar (juin 2026) [28][29] | Oura : écarts **simultanés de plusieurs métriques sur plusieurs jours** (température, fréquence respiratoire, FC repos, HRV), 3 niveaux, suggestion de « Rest Mode » [28][29]. Stanford : la FC repos a détecté le COVID avant ou au début des symptômes dans 63 % des cas (rétrospectif, ~31 cas) [30][31] | Faisable sans température : FC repos ↑ + HRV ↓ + sommeil ↓ |
| Journal de comportements → impact | WHOOP Journal [33][34], Bearable [11], Exist [35] | WHOOP exige ≥5 « oui » et ≥5 « non » par comportement sur 90 jours avant d'afficher un effet, présenté comme corrélation, confondants possibles [33] | Ajouter des tags oui/non à la saisie du bien-être |
| Régularité du sommeil | Samsung Bedtime Guidance (One UI 8 Watch) [39] | UK Biobank, 60 977 participants : les 4 quintiles les plus réguliers ont un risque de mortalité 20–48 % plus faible que le moins régulier [37] ; résultat confirmé par Pase et al. (eLife, 88 975 participants) [38]. Samsung calcule l'heure de coucher sur 3 nuits (pression de sommeil + rythme circadien) [39] | Indice de régularité calculable à partir des sessions de sommeil HC |
| Objectifs de pas fondés sur les données | — | Méta-analyse Lancet Public Health 2025 : 7 000 pas/j vs 2 000 → risque de mortalité toutes causes HR 0,53 ; inflexion vers 5 000–7 000 pas [40]. Le seuil de 10 000 pas est peu étayé [41] | Objectif par défaut 7 000, puis adaptatif |
| Bilan énergétique adaptatif | MacroFactor [42][43] | Dépense déduite de l'apport noté et de la tendance de poids pondérée ; selon l'éditeur, les formules classiques se trompent souvent de plus de 500 kcal (éditeur) [42][43] | Combiner nutrition et Withings → TDEE personnel |
| Auto-pesée | — | Méta-analyse : sans autre composante, pas de preuve d'effet ; intégrée à un programme, −1,7 kg ; pesée quotidienne ≈ hebdomadaire [44] | Courbe de tendance sans injonction quotidienne |
| Psychologie du changement | Noom (TCC, ACT, DBT) | 77,9 % de 35 921 utilisateurs ont déclaré une perte de poids ; le meilleur prédicteur était la **fréquence de saisie du dîner** (observationnel) [45]. Essai 2026 : −4,1 % vs +1,5 % pour le contrôle, données de l'éditeur [46] | Mesurer et encourager la régularité de saisie du soir |
| Habitudes et séries | Duolingo | Preuves faibles pour les streaks [48] ; Lally : un jour manqué ne casse pas l'habitude [47] | Séries « indulgentes » (jokers), sans honte |
| JITAI (intervention au moment opportun) | HeartSteps | Revue 2019 : preuves mixtes, aucune étude assez puissante [49]. Méta-analyse 2024 (13 études, 756 participants) : moins de périodes sédentaires et plus d'activité légère, pas d'effet sur l'activité modérée à vigoureuse [50]. Essai SNapp : coaching JITAI sans effet sur les pas [51] | Notifications rares, contextuelles et variées ; mesurer leur effet |
| Coachs IA | Oura Advisor [53], coach Gemini de Fitbit (preview oct. 2025) [54], WHOOP Coach (GPT-4, 2023) [55] | Oura : >60 % des bêta-testeurs l'utilisent plusieurs fois par semaine (éditeur) [53]. Fitbit : onboarding conversationnel de 5–10 min sur les objectifs [54]. WHOOP Advanced Labs : 65 biomarqueurs sanguins reliés aux données quotidiennes [56] | Onboarding par objectifs et « Demander au coach » ancrés sur des chiffres calculés localement |
| Arrêt du tabac | Smoke Free | Cochrane : apps seules RR 1,00 (5 essais) ; méta 2023 (9 ECR) : pas de supériorité des apps seules [65]. Smoke Free : pas d'effet de l'offre de l'app ; chez ceux qui l'ont téléchargée, 12,7 % vs 7,0 % d'abstinence (sous-groupe non randomisé) [66] | Le compteur sert surtout à **comprendre les déclencheurs**, en complément d'autres aides |
| Effets mesurables de l'alcool | WHOOP, Oura | ~21 000 utilisateurs (PLOS Digital Health 2026) : FC nocturne ↑, HRV ↓, sommeil plus court, effet dose-dépendant [67]. 2018 : score de récupération −9,3 / −24 / −39,2 points selon la dose [67] | Tag « alcool » + effet sur la nuit suivante |
| Caféine tardive | — | 400 mg pris 6 h avant le coucher → plus d'1 h de sommeil en moins, **sans que les sujets s'en aperçoivent** (n=12) [68] | Tag « café après 14 h », expérience N-of-1 |
| Qualité alimentaire au-delà des macros | Nutri-Score / NOVA | Revue parapluie BMJ 2024 : les aliments ultra-transformés sont associés à 32 issues de santé ; preuves « convaincantes » pour la mortalité cardiovasculaire (RR 1,50) et le diabète de type 2 [69] | % de calories ultra-transformées via Open Food Facts [70] |
| Réponse individuelle aux aliments | Zeevi (Cell 2015) | Glycémies post-repas très différentes d'une personne à l'autre pour un même repas ; prédiction par ML [73] | Raisonner en « effet chez moi » plutôt qu'en normes |
| Mesure validée du bien-être | WHO-5 | 213 articles : validité adéquate (dépistage de la dépression et critère d'essai) ; gratuit, traduit dans plus de 30 langues [71] | Questionnaire hebdo en 5 items pour ancrer le score 1–5 |
| Charge des questionnaires (EMA) | — | 477 études : en moyenne 6 sollicitations/j sur 7 j, 79 % de réponse ; le nombre de sollicitations n'est pas associé à la compliance [72] | Un prompt quotidien + des tags reste acceptable |

---

### 3. Avancées ML/IA exploitables

#### 3.1 Inférence causale sur une seule personne (N-of-1)
- **Cadre** : les données observationnelles d'une personne servent à **générer des hypothèses**, à confirmer ensuite par un essai N-of-1 randomisé. Ce dernier ne nécessite pas de méthode causale avancée grâce à son plan croisé simple [81].
- **APTE / g-formula** (Daza) : découper la série en périodes « traitées / non traitées » et modéliser l'autocorrélation, les tendances, les effets rémanents, l'apparition lente et la décroissance de l'effet [81]. **MoTR** (*Statistics in Medicine* 2025) : « randomisation par jumeau modèle », appliquée à ~8 ans de pas et de sommeil Fitbit des auteurs eux-mêmes [82].
- **Plateformes N-of-1** : StudyU / StudyMe (HPI, open source) permettent de concevoir soi-même un essai ABAB ; dans les tests, tous les participants ont réussi à créer leur propre essai [83].
- **Séries temporelles interrompues / BSTS** : CausalImpact construit un contrefactuel bayésien à partir de séries témoins. Il suppose que ces témoins ne sont pas affectés par l'intervention et que leur relation avec la série étudiée reste stable [84]. Pour un individu, il faut des témoins plausibles, par exemple météo ou jour de semaine.
- **Micro-randomisation** : c'est le plan utilisé pour mettre au point les JITAI (HeartSteps). Il peut s'adapter en « suggestion randomisée » pour estimer l'effet propre de chaque type de notification [52][81].
- **Comparaisons multiples** : tester des dizaines de facteurs garantit presque des faux positifs. Pistes : correction FDR (Benjamini-Hochberg), seuils plus stricts, validation sur des données non utilisées pour la découverte [85][86].

#### 3.2 Baselines personnelles et détection d'anomalies
- Une moyenne glissante sur 7 j, comparée à une plage normale sur ~60 j, avec un CV, sépare le signal du bruit pour l'HRV [26][27].
- Exiger un **consensus multi-métriques sur plusieurs jours** réduit les fausses alertes (logique d'Oura) [28][29]. L'algorithme de Stanford se décrit lui-même comme un « drapeau », pas comme un diagnostic [30].
- Health Connect expose `HeartRateVariabilityRmssdRecord` et `SkinTemperatureRecord`. Ce dernier dépend de la version de HC (`FEATURE_SKIN_TEMPERATURE`) et du capteur : selon un intégrateur tiers, la température cutanée vient des Galaxy Watch 6 et suivantes [96][97][101].

#### 3.3 Incertitude des prédictions personnelles
- Conformal prediction en séries temporelles : une validité « longitudinale » (pour un même individu dans le temps) sans hypothèse de distribution est **impossible**. CPTD est une méthode post-hoc et légère qui l'améliore [88]. En mHealth, la couverture garantie n'est qu'une borne inférieure qui dépend de la non-échangeabilité des données [89].
- → Pour le widget de prédiction : intervalle conformal « split » sur les résidus du hold-out, puis **affichage de la couverture empirique** (« 8 jours sur 10 dans l'intervalle »).

#### 3.4 Modèles de fondation wearables (sources d'inspiration, pas déployables tels quels)
- Google LSM : jusqu'à 40 M d'heures de données minute (FC, HRV, accéléromètre, température) de plus de 165 000 personnes ; lois d'échelle pour l'imputation et l'extrapolation [62]. LSM-2 (AIM) apprend directement sur des données **incomplètes** [63].
- Apple WBM (préprint) : modèle entraîné sur des **métriques comportementales** (pas, sommeil, HRV, VO₂max…) de 162 000 participants, évalué sur 57 tâches. Il est meilleur sur les tâches comportementales comme le sommeil, et encore meilleur combiné aux données capteurs brutes [64].
- Leçon : les agrégats journaliers que HealthTrack possède déjà sont informatifs. La gestion des données manquantes est un sujet à part entière.

#### 3.5 LLM santé : ancrage et agents
- **PH-LLM** (*Nature Medicine* 2025) : Gemini affiné sur des résumés de capteurs ; 79 % / 88 % aux examens sommeil / fitness, contre 76 % / 71 % pour les experts ; 857 études de cas [58].
- **PHIA** : un agent qui **génère du code** pour analyser les données wearables atteint ~84 % d'exactitude sur les questions numériques. Les LLM « nus » raisonnent mal sur les chiffres [59].
- **Personal Health Agent** (Google) : un orchestrateur répartit les questions entre un agent data science, un agent expert du domaine (vérification via des sources comme NCBI) et un agent coach [60][61].
- **GPTCoach** (CHI 2025) : entretien motivationnel + programme Active Choices + outils de requête sur les données HealthKit, avec des prompts chaînés pour rester dans le programme [57].
- **Anti-modèle** : la note cardio instable de ChatGPT Health [16][17]. → Les chiffres sont calculés localement, puis transmis au LLM via un schéma JSON ; le LLM ne fait que commenter et citer les chiffres fournis.

#### 3.6 Journal alimentaire multimodal : précision réelle
- Sur 52 photos pesées : erreur ~36–37 % pour GPT-4o et Claude 3.5, 64–110 % pour Gemini 1.5 Pro ; tous sous-estiment, d'autant plus que la portion est grande [74].
- Gemini 2.5 Flash (glucides) : l'erreur passe de 56,6 % à 39,5 % avec une estimation du poids, et à 20,2 % avec le poids réel. **Le poids de la portion est le goulot d'étranglement** [75].
- Fournir du contexte (menu) aide beaucoup ; les sauces et plats ambigus sont les plus durs [79]. Le sodium est systématiquement sous-estimé [80]. ChatGPT-5 : la précision baisse sans image, même avec la liste d'ingrédients [76].
- Texte seul : NutriBench (11 857 descriptions) donne des LLM comparables aux nutritionnistes sur les glucides, mais bien plus rapides [77]. Gemma-3 27B local : erreur moyenne de 108 kcal par repas, jugée insuffisante par les auteurs [78].
- → Garder une table de nutriments locale (déjà présente : `ingredientsNutrition.json`) et laisser le LLM se limiter à **identifier les ingrédients et estimer les grammes**. Les grammes restent modifiables et un indice de confiance est affiché.

#### 3.7 Gemini côté client : état de l'API
- La page des modèles (mise à jour le 2026-10-06) liste `gemini-3.8-flash` comme dernier modèle stable et recommande 3.5 Flash-Lite ou 3.8 Flash pour les nouveaux projets. Les modèles 2.5 restent servis aux utilisateurs existants « jusqu'à nouvel ordre » [99].
- La sortie structurée (JSON + schéma) n'accepte qu'un sous-ensemble de JSON Schema et rejette les schémas trop imbriqués ; il faut toujours valider les valeurs côté app [100].

#### 3.8 IA on-device (téléphone Galaxy A56)
- Gemini Nano passe par AICore / ML Kit GenAI. Les listes d'appareils citent les Pixel 9/10, les Galaxy S25/S26 et le Z Fold7 [90]. Le Prompt API (alpha, oct. 2025) fonctionne au mieux sur Pixel 10 (nano-v3) [91]. **Aucune source ne confirme Gemini Nano sur le Galaxy A56** ; le Gemini accessible par le bouton latéral de l'A56 est le Gemini cloud [92].
- Gemma 3n / Gemma 4 via LiteRT-LM ou MediaPipe : ~2–3 Go de mémoire dynamique ; Gemma 3n E2B ≈ 3 Go sur disque, ~16 tokens/s en décodage sur Galaxy S24 Ultra ; au moins 6 Go de RAM conseillés [93]. C'est faisable mais lourd : chantier R&D.
- Navigateur : WebGPU est activé par défaut dans Chrome Android 121+ (Android 12+, GPU Qualcomm/ARM) [94a]. Le mode « compatibilité » WebGPU est prévu pour WebView vers M146 [94b]. Transformers.js v4 apporte un runtime WebGPU réécrit avec ONNX Runtime (fév. 2026) [94c]. → Petits modèles réalistes (embeddings, classification de texte) ; un LLM génératif dans la WebView est encore risqué.

#### 3.9 Health Connect : leviers techniques
- Lecture en arrière-plan : permission `READ_HEALTH_DATA_IN_BACKGROUND` + tâche WorkManager périodique (exemple Google : toutes les heures) [95][98].
- Historique : par défaut, accès limité à 30 jours avant la première autorisation ; la permission `READ_HEALTH_DATA_HISTORY` lève cette limite [95].

---

### 4. Idées classées (impact / effort)

Barème : **Impact** de 1 à 5 (valeur pour l'utilisateur) ; **Effort** de 1 à 5 (1 = une session d'agent de ~1–2 h, 2 = 2–3 sessions, 3 = ~1 semaine, 4–5 = gros chantier). **Score = I/E.** Toutes les idées respectent le local-first ; seul Gemini est appelé depuis le client.

#### 4.1 Quick wins (effort 1)

| # | Idée | I | E | Score | Esquisse d'implémentation | Appui |
|---|---|---|---|---|---|---|
| 1 | **Baselines personnelles FC repos / HRV** | 5 | 1 | 5,0 | Dans `services/`, `baselines.js` : moyenne 7 j vs plage normale 60 j (moyenne ± 1 ET, à affiner), z-score et CV 7 j ; cartes « dans / hors de ta norme » sur le Dashboard | [26][27][86] |
| 2 | **Tags de comportements en 1 tap** (alcool, café après 14 h, repas tardif, écran tard, stress, sport le soir, malade) | 5 | 1 | 5,0 | Chips sous `WellbeingPrompt` → entrées `behavior` dans IndexedDB ; analyse « jours avec / sans » (≥5/5) sur le bien-être du lendemain, FC repos et sommeil | [33][67][68][3] |
| 3 | **Rigueur statistique des Recommandations** | 4 | 1 | 4,0 | Benjamini-Hochberg sur les p-valeurs Pearson, n effectif corrigé de l'autocorrélation, IC par bootstrap par blocs, libellé « hypothèse » + bouton « tester » (→ #14) | [85][86][81] |
| 4 | **Analyse photo fiabilisée** | 4 | 1 | 4,0 | Sortie structurée JSON (schéma : ingrédient, grammes, confiance) + validation ; écran de correction des grammes avant sauvegarde ; macros calculées par la table locale ; question « portion : petite/moyenne/grande ou g ? » | [74][75][100] |
| 5 | **Saisie texte / dictée + « comme hier » + favoris** | 4 | 1 | 4,0 | Champ texte (la dictée du clavier Android suffit) → Gemini en texte → même pipeline que #4 ; boutons « dupliquer un repas » et « repas fréquents » (top 10 en local) | [6][77][4] |
| 6 | **Indice de régularité du sommeil** | 4 | 1 | 4,0 | Écart-type des heures de coucher et de lever sur 14 j + SRI simplifié (probabilité d'être dans le même état à 24 h d'intervalle, en tranches de 30 min) ; ajouté comme facteur dans les Recommandations | [37][38] |
| 7 | **Cigarettes avec contexte** | 4 | 1 | 4,0 | Le quick-add demande en option un déclencheur (café, stress, après repas, social, ennui) ; heatmap par heure ; lien avec FC repos et bien-être ; compteur « envie résistée » | [65][66][3] |
| 8 | **Tendance de poids lissée** | 3 | 1 | 3,0 | Moyenne mobile exponentielle (α≈0,1) sur les pesées Withings ; vitesse en kg/semaine ; pas d'alerte sur les variations quotidiennes | [42][44] |
| 9 | **Transparence Gemini + migration de modèle** | 3 | 1 | 3,0 | Modèle configurable (défaut 3.5 Flash-Lite ou 3.8 Flash) ; avertissement « clé gratuite = données potentiellement relues » ; retrait des EXIF/GPS avant envoi ; l'IA ne reçoit que des agrégats | [20][99] |
| 10 | **Objectif de pas fondé sur les preuves et adaptatif** | 3 | 1 | 3,0 | Défaut 7 000 ; objectif dynamique = médiane sur 14 j + 10 %, plafonné ; pas de série cassée sur un jour manqué | [40][41][47] |
| 11 | **WHO-5 hebdomadaire** | 3 | 1 | 3,0 | Questionnaire de 5 items le dimanche ; corrélation avec la moyenne 1–5 de la semaine, pour vérifier que le score quotidien mesure bien quelque chose | [71][72] |

#### 4.2 Moyen terme (effort 2–3)

| # | Idée | I | E | Score | Esquisse d'implémentation | Appui |
|---|---|---|---|---|---|---|
| 12 | **« Radar » signes de maladie / surmenage** | 5 | 2 | 2,5 | S'appuie sur #1 : niveau 1 si 2 métriques hors norme (FC repos > +1,5 ET, HRV < −1,5 ET, sommeil < −1 ET) ; niveau 2 si cela dure ≥2 nuits ; ajouter la température cutanée si HC la fournit ; message « priorise le repos », jamais de diagnostic | [28][29][30][31][96] |
| 13 | **Revue hebdo par IA, ancrée sur les chiffres** | 5 | 2 | 2,5 | Calcul local d'un JSON (tendances, écarts aux baselines, top tags, adhérence de saisie) → Gemini rédige 150 mots en français, chaque chiffre cité doit exister dans le JSON (vérification automatique), et termine par **une** expérience proposée | [59][60][16] |
| 14 | **Mode Expérience N-of-1** | 5 | 2 | 2,5 | Modèles : « pas de café après 14 h », « coucher avant 23 h », « 0 cigarette après le dîner » ; plan ABAB randomisé par blocs de 3–4 j sur 2–4 semaines ; analyse par test de permutation + différence moyenne avec IC ; verdict prudent | [81][82][83][68] |
| 15 | **Notifications locales intelligentes** | 4 | 2 | 2,0 | `@capacitor/local-notifications` : rappel bien-être à l'heure habituelle apprise, rappel de dîner (meilleur prédicteur chez Noom), conseil d'heure de coucher calculé sur 3 nuits ; ≤2 par jour, messages variés, effet mesuré | [45][39][52][50] |
| 16 | **Sync Health Connect en arrière-plan + historique complet** | 4 | 2 | 2,0 | Patch ou plugin natif : permissions `READ_HEALTH_DATA_IN_BACKGROUND` et `READ_HEALTH_DATA_HISTORY`, WorkManager toutes les heures, lecture de `SkinTemperatureRecord` si le flag est actif | [95][96][98] |
| 17 | **Scan code-barres Open Food Facts** | 4 | 2 | 2,0 | Plugin de scan → `GET /api/v2/product/{ean}.json` ; Nutri-Score, NOVA et nutriments pour 100 g ; KPI « % de calories ultra-transformées » ; cache local ; mention ODbL | [70][69][7] |
| 18 | **Dépense énergétique adaptative (TDEE)** | 4 | 2 | 2,0 | Fenêtre de 14–28 j : TDEE ≈ apport moyen − Δ(tendance de poids) × ~7 700 kcal/kg ; affiché seulement si ≥80 % des jours sont saisis ; IC selon la complétude | [42][43] |
| 19 | **Sauvegarde chiffrée automatique** | 4 | 2 | 2,0 | Export JSON chiffré par WebCrypto AES-GCM (clé dérivée d'une phrase de passe par PBKDF2) vers Filesystem/Documents, hebdomadaire, avec rotation ; import compatible | [18][19][20] |
| 20 | **Intervalles de prédiction honnêtes** | 3 | 2 | 1,5 | Conformal « split » sur les résidus du hold-out (quantile 80 %) ; affichage de la couverture empirique glissante ; message « pas assez de données » sous N jours | [88][89] |
| 21 | **Analyse avant / après d'un événement** | 4 | 3 | 1,3 | L'utilisateur marque une date (arrêt du tabac, nouveau sport) → régression segmentée avec effets jour de semaine et AR(1), ou BSTS léger ; affiche le contrefactuel et son incertitude | [84][81] |
| 22 | **« Demander à HealthTrack » (chat avec outils)** | 4 | 3 | 1,3 | Function calling Gemini sur des outils locaux (`getSeries`, `comparePeriods`, `correlate`, `listTags`) ; le LLM ne voit que les sorties des outils ; garde-fous : pas de notes, pas de diagnostic, renvoi vers un médecin | [57][59][60][16] |
| 23 | **Écrire les repas dans Health Connect** | 3 | 2 | 1,5 | Écrire un `NutritionRecord` par repas pour que les autres apps (Samsung Health…) voient la nutrition : on casse le silo dans l'autre sens | [2][97] |

#### 4.3 Paris long terme / ambitieux (effort 3–5)

| # | Idée | I | E | Score | Esquisse d'implémentation | Appui |
|---|---|---|---|---|---|---|
| 24 | **« Readiness » personnelle calibrée sur le ressenti** | 5 | 4 | 1,25 | Modèle espace d'état bayésien (filtre de Kalman) : état latent « forme » observé via le bien-être 1–5, la FC repos, l'HRV et le sommeil, avec lags ; donne un score avec incertitude, appris sur le ressenti de la personne, ce qui répond à la plainte « le score ne colle pas » | [12][13][64][88] |
| 25 | **Moteur causal à lags distribués + prochaine expérience suggérée** | 4 | 4 | 1,0 | Modèles à lags distribués (0–3 j) par facteur, avec FDR ; classement des hypothèses selon effet × incertitude ; propose automatiquement l'expérience N-of-1 la plus informative (#14) | [81][82][85] |
| 26 | **Import de bilans sanguins** | 3 | 3 | 1,0 | PDF ou photo du labo → Gemini en sortie structurée (biomarqueur, valeur, unité, plage du labo) → tendances et liens avec les habitudes ; pas d'interprétation clinique | [56][100] |
| 27 | **LLM on-device optionnel** | 3 | 4 | 0,75 | Plugin natif LiteRT-LM avec Gemma E2B (≈3 Go) pour l'analyse de texte de repas et une revue hebdo hors ligne ; Gemini Nano si AICore est un jour disponible ; repli cloud. Benchmarker l'A56 avant de s'engager | [90][92][93] |
| 28 | **« Jours similaires »** | 3 | 3 | 1,0 | Vecteur standardisé par jour (sommeil, pas, FC repos, HRV, nutrition, tags) → plus proches voisins → « après des jours comme aujourd'hui, ton lendemain était… » ; d'abord un kNN simple, des embeddings plus tard | [64][62] |

#### 4.4 Ordre conseillé (top 10)
1. #1 Baselines → 2. #2 Tags → 3. #3 Rigueur statistique → 4. #4 + #5 Saisie repas fiable et rapide → 5. #12 Radar (réutilise #1) → 6. #6 Régularité du sommeil → 7. #14 Expériences N-of-1 (réutilise #2 et #3) → 8. #13 Revue hebdo IA → 9. #15 Notifications → 10. #16 Sync en arrière-plan.
Logique : d'abord enrichir les données (tags, baselines), puis l'analyse (statistiques, radar), puis la restitution (revue, notifications).

#### 4.5 Pièges à éviter
- Ne pas laisser le LLM calculer des scores ou des « notes » de santé (instabilité démontrée) [16][17].
- Ne pas afficher de corrélation brute sans correction ni mention « hypothèse » [85].
- Ne pas punir les séries cassées ni pousser à « optimiser » le sommeil (orthosomnie) [23][47].
- Limiter les notifications : leur effet s'use [52][50].
- Ne pas envoyer de données de santé détaillées via une clé gratuite sans prévenir [20].

---

### 5. Sources

[1] GummySearch, r/QuantifiedSelf — https://gummysearch.com/r/QuantifiedSelf
[2] LQS 2014, préface (silos QS) — https://iris.unito.it/bitstream/2318/1663600/1/2014-LQS2014_Preface.pdf
[3] Choe et al., CHI 2014, *Understanding quantified-selfers' practices* — https://www.microsoft.com/en-us/research/publication/understanding-quantified-selfers-practices-collecting-exploring-personal-data/
[4] Big Think, abandon des apps de journal alimentaire (Cordeiro) — https://bigthink.com/ideafeed/why-so-many-people-quit-food-logging-apps-in-the-first-week
[5] Wageningen UR (revue König, obstacles) — https://edepot.wur.nl/636781
[6] Univ. Delaware, *Harder Than You Think: photos vs text* — https://udspace.udel.edu/handle/19716/34163
[7] Unstar, avis 1★ des apps calories 2026 — https://unstar.app/blog/calorie-tracking-apps-ranked-1-star-reviews-2026
[8] Kimola, retrait du scan code-barres gratuit de MFP — https://kimola.com/reports/myfitnesspal-removes-free-barcode-scanner-feature-140890
[9] Nutrola (éditeur concurrent), ce que dit Reddit sur MFP — https://nutrola.app/en/blog/what-do-reddit-users-say-about-myfitnesspal-2026
[10] Healthify NZ, revue clinique de Bearable — https://healthify.nz/apps/b/bearable-symptom-tracker-app
[11] Bearable (site) — https://bearable.app/
[12] Communauté WHOOP, « Recovery stats out of whack » — https://www.community.whoop.com/t/recovery-stats-out-of-whack/13375
[13] Communauté WHOOP, « Issues with WHOOP 5.0 » — https://www.community.whoop.com/t/issues-with-whoop-5-0-calculating-metrics/4588
[14] Forum TrainerRoad, WHOOP — https://www.trainerroad.com/forum/t/anyone-using-a-whoop/4491?page=16
[15] Wareable, *Why I'm falling out of love with Whoop* — https://wareable.com/wearable-tech/why-im-falling-out-of-love-with-whoop-and-the-two-things-it-needs-to-change
[16] 9to5Mac, test de ChatGPT Health avec des données Apple Watch — https://9to5mac.com/2026/01/26/apple-watch-user-gave-chatgpt-health-his-data-with-troubling-results/
[17] Newsweek, même test — https://newsweek.com/columnist-tests-chatgpt-health-with-personal-data-on-apple-watch-results-are-disturbing-11425448
[18] Mozilla Foundation, apps de santé mentale — https://www.mozillafoundation.org/en/blog/shady-mental-health-apps-inch-toward-privacy-and-security-improvements-but-many-still-siphon-personal-data/
[19] Popular Science, rapport Mozilla sur les apps de règles — https://www.popsci.com/technology/mozilla-period-app-privacy-report/
[20] Gemini API Additional Terms of Service — https://ai.google.dev/terms
[21] MobiHealthNews, un tiers des porteurs abandonnent en 6 mois — https://www.mobihealthnews.com/news/survey-one-third-wearable-device-owners-stopped-using-them-within-six-months
[22] arXiv 1904.13226, adoption et abandon des wearables — https://arxiv.org/pdf/1904.13226
[23] Baron et al. 2017, orthosomnie (JCSM) — https://pubmed.ncbi.nlm.nih.gov/27855740/
[24] Forum développeurs Samsung, sync HC peu fiable — https://forum.developer.samsung.com/t/syncing-data-is-unreliable-between-samsung-health-and-health-connect/24850
[25] Samsung Developers, Samsung Health via Health Connect — https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect
[26] HRV4Training, coefficient de variation — https://www.hrv4training.com/blog2/heart-rate-variability-coefficient-of-variation
[27] M. Altini, tendances long terme FC repos / HRV — https://marcoaltini.substack.com/p/long-term-trends-in-resting-heart
[28] Oura, Symptom Radar — https://ouraring.com/blog/symptom-radar/
[29] Oura Support, Health Radar — https://support.ouraring.com/en-us/articles/52627030482707-Health-Radar
[30] Stanford Medicine, une montre détecte des signes précoces de maladie — https://med.stanford.edu/news/all-news/2020/12/smartwatch-can-detect-early-signs-of-illness.html
[31] Mishra et al., préprint medRxiv — https://www.medrxiv.org/content/10.1101/2020.07.06.20147512v1
[33] WHOOP, insights sur les comportements — https://www.whoop.com/ch/en/thelocker/a-new-way-to-see-insights-on-which-behaviors-affect-your-recovery/
[34] WHOOP Journal — https://www.whoop.com/thelocker/the-whoop-journal/
[35] Exist, suivi de l'humeur — https://exist.io/about/mood/
[36] Revues d'Exist — https://ruk.ca/node/22955 ; https://alexstrick.com/personal/2016-10-11-exist.html
[37] Windred et al. 2023 (Sleep), SRI et mortalité — https://www.ukbiobank.ac.uk/publications/sleep-regularity-is-a-stronger-predictor-of-mortality-risk-than-sleep-duration-a-prospective-cohort-study/
[38] Pase et al., eLife 2023 — https://cdn.elifesciences.org/articles/94131/elife-94131-v1.pdf
[39] Samsung Newsroom, One UI 8 Watch (Bedtime Guidance) — https://news.samsung.com/global/new-features-on-one-ui-8-watch-help-users-build-healthier-habits
[40] Ding et al., Lancet Public Health 2025, pas et santé — https://pubmed.ncbi.nlm.nih.gov/40713949/
[41] Paluch et al. 2022, méta-analyse de 15 cohortes — https://pubmed.ncbi.nlm.nih.gov/35247352/
[42] MacroFactor, algorithmes — https://macrofactor.com/macrofactors-algorithms-and-core-philosophy/
[43] MacroFactor, précision de l'algorithme — https://macrofactor.com/algorithm-accuracy/
[44] Madigan et al. 2015, méta-analyse sur l'auto-pesée — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4546162/
[45] Chin et al. 2016, Scientific Reports (Noom) — https://link.springer.com/10.1038/srep34563
[46] Noom, communiqué sur l'essai 2026 — https://www.noom.com/in-the-news/noom-members-kept-losing-weight-a-full-year-after-the-program-ended-largest-ever-noom-randomized-clinical-trial-shows/
[47] Lally et al. (formation des habitudes), via BPS et Spring — https://bps.org.uk/research-digest/how-form-habit ; https://www.spring.org.uk/2023/01/form-a-habit.php
[48] Plotline, streaks — https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps
[49] Hardeman et al. 2019, revue des JITAI — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6448257/
[50] Méta-analyse JITAI 2024 — https://jfjhlzz.smmu.edu.cn/jfjhlzz/article/abstract/20250424
[51] Essai SNapp, JITAI et pas — https://www.dare.uva.nl/id/fde1d7a3-3ce6-4aba-b0ec-7d9989be5b4a
[52] Klasnja et al. 2018, HeartSteps — https://www.pubmed.ncbi.nlm.nih.gov/30192907/ ; https://arxiv.org/pdf/2410.15049
[53] Oura Advisor — https://ouraring.com/blog/oura-advisor ; https://www.digitalhealthnews.com/oura-launches-ai-powered-health-feature-oura-advisor-for-personalized-wellness-insights
[54] Google, coach santé Fitbit en preview — https://blog.google/products-and-platforms/devices/fitbit/personal-health-coach-public-preview/ ; https://techcrunch.com/2025/10/27/fitbits-revamped-app-with-gemini-powered-health-coach-rolls-out-to-premium-users/
[55] WHOOP Coach (OpenAI) — https://www.whoop.com/us/en/press-center/whoop-unveils-the-new-whoop-coach-powered-by-openai/
[56] WHOOP Advanced Labs — https://www.whoop.com/us/en/press-center/whoop-launches-clinician-reviewed-advanced-labs
[57] Jörke et al., GPTCoach (CHI 2025) — https://arxiv.org/pdf/2405.06061
[58] Google Research, PH-LLM (Nature Medicine 2025) — https://research.google/pubs/a-personal-health-large-language-model-for-sleep-and-fitness-coaching/
[59] PHIA, arXiv 2406.06464 — https://arxiv.org/abs/2406.06464
[60] Google, *The anatomy of a personal health agent* — https://research.google/blog/the-anatomy-of-a-personal-health-agent/ ; https://arxiv.org/pdf/2508.20148v2
[61] Google, *How we are building the personal health coach* — https://research.google/blog/how-we-are-building-the-personal-health-coach/
[62] Narayanswamy et al., *Scaling Wearable Foundation Models* (LSM) — https://arxiv.org/pdf/2410.13638
[63] Google, LSM-2 — https://research.google/blog/lsm-2-learning-from-incomplete-wearable-sensor-data/
[64] Erturk et al., Apple WBM, arXiv 2507.00191 — https://arxiv.org/pdf/2507.00191
[65] JMIR 2023, méta-analyse des apps d'arrêt du tabac (et Cochrane) — https://jmir.org/2023/1/e43242/PDF
[66] Jackson et al., essai Smoke Free (JMIR 2024) — https://jmir.org/2024/1/e50963/PDF ; https://medrxiv.org/content/10.1101/2023.01.12.23284463.full.pdf
[67] Alcool et données wearables : PLOS Digital Health 2026 — https://movendi.ngo/wp-content/uploads/2026/03/journal.pdig_.0001284.pdf ; JMIR Mental Health 2018 — https://mental.jmir.org/2018/1/e23/PDF
[68] Drake et al. 2013, caféine 0, 3 ou 6 h avant le coucher — https://pmc.ncbi.nlm.nih.gov/articles/PMC3805807/
[69] Lane et al., BMJ 2024, aliments ultra-transformés — https://bmj.com/content/384/bmj-2023-077310
[70] Open Food Facts, données et API — https://world-sk.openfoodfacts.org/data
[71] Topp et al. 2015, revue sur le WHO-5 — https://pubmed.ncbi.nlm.nih.gov/25831962/
[72] Wrzus & Neubauer, méta-analyse EMA — https://heibib.ub.uni-heidelberg.de/search/Record/1839595345 ; Williams et al. 2021 — https://www.jmir.org/2021/3/E17023
[73] Zeevi et al., Cell 2015 — https://www.wisdom.weizmann.ac.il/~eran/zeevi_cell_2015.pdf
[74] Trois LLM pour estimer la nutrition à partir de photos (PMC) — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12513282/
[75] Benchmark de modèles multimodaux pour la nutrition, arXiv 2507.07048 — https://arxiv.org/pdf/2507.07048
[76] ChatGPT-5, estimation énergétique à partir d'images (Nutrients 2025) — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12655113/
[77] NutriBench (ICLR 2025) — https://arxiv.org/abs/2407.12843
[78] Gemma-3 sur des repas péruviens (medRxiv 2025) — https://www.medrxiv.org/content/10.1101/2025.10.21.25338310
[79] Univ. de Turku, modèles de vision pour la reconnaissance d'aliments — https://www.utupub.fi/handle/11111/61987
[80] Nutrients 17:3044, diététiciens vs IA (sodium) — https://mdpi-res.com/d_attachment/nutrients/nutrients-17-03044/article_deploy/nutrients-17-03044.pdf
[81] Daza 2018, études observationnelles N-of-1 — https://pmc.ncbi.nlm.nih.gov/articles/PMC6087468 ; https://arxiv.org/pdf/1901.03423
[82] Daza et al., Model-Twin Randomization (MoTR) — https://arxiv.org/html/2208.00739v7
[83] StudyU / StudyMe (HPI) — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9297132/ ; https://hpi.de/lippert/projects/studyu
[84] CausalImpact (CRAN) — https://cran.ma.imperial.ac.uk/web/packages/CausalImpact/index.html
[85] *Visual Belief Elicitation Reduces False Discovery*, arXiv 2301.12512 — https://arxiv.org/pdf/2301.12512
[86] Fausses conclusions en suivi santé personnalisé, arXiv 1711.05635 — https://arxiv.org/pdf/1711.05635
[88] Lin et al., *Conformal Prediction Intervals with Temporal Dependence* (TMLR 2022) — https://arxiv.org/pdf/2205.12940
[89] Bose & Dempsey, intervalles conformal pour les effets individuels en mHealth — https://arxiv.org/html/2512.08828v1
[90] Présentation des API ML Kit GenAI — https://developers.google.com/ml-kit/genai?authuser=1
[91] Android Developers, Prompt API en alpha (oct. 2025) — https://android-developers.googleblog.com/2025/10/ml-kit-genai-prompt-api-alpha-release.html
[92] Galaxy A56 et Gemini (cloud) — https://www.croma.com/unboxed/samsung-gives-galaxy-a56-gets-gemini-support ; https://r1.community.samsung.com/t5/galaxy-s/please-enable-gemini-nano-on-supported-devices/m-p/32897076/highlight/true
[93] Gemma 3n via LiteRT-LM — https://huggingface.co/google/gemma-3n-E4B-it-litert-lm ; https://developers.googleblog.com/blazing-fast-on-device-genai-with-litert-lm/ ; https://www.analyticsvidhya.com/blog/2025/08/run-gemma-3n-mobile/
[94a] OSnews, WebGPU dans Chrome 121 pour Android — https://www.osnews.com/story/138330/webgpu-comes-to-chrome-121-for-android/
[94b] Chromium, Intent to Ship : WebGPU Compatibility mode — https://groups.google.com/a/chromium.org/g/blink-dev/c/N3RlLGCOTJ4/m/loneRTlPBwAJ
[94c] Transformers.js v4 et WebGPU — https://awesomeagents.ai/news/transformers-js-v4-webgpu-browser-ml/
[95] Health Connect, lecture des données brutes — https://developer.android.com/health-and-fitness/health-connect/read-data
[96] Health Connect, température cutanée — https://developer.android.com/health-and-fitness/health-connect/features/skin-temperature
[97] Health Connect, liste des records (HRV RMSSD, Nutrition…) — https://developer.android.com/reference/androidx/health/connect/client/records/package-summary
[98] Android Authority, lecture en arrière-plan et historique Health Connect — https://www.androidauthority.com/health-connect-historical-background-reads-3443726
[99] Gemini API, modèles (mis à jour le 2026-10-06) — https://ai.google.dev/gemini-api/docs/models
[100] Gemini API, sorties structurées — https://ai.google.dev/gemini-api/docs/structured-output
[101] Open Wearables, connecter Samsung Health — https://openwearables.io/blog/how-to-connect-samsung-health-to-your-app
