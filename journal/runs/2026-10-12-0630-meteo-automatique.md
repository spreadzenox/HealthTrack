# 2026-10-12 06:30 Paris (04:30 UTC) — Chasse aux bugs Bluetooth + météo / pression / air automatiques

**Type** : 🐛 (relecture critique de la couche BLE des 3 derniers runs) + 🏗️ (C8, I4 : capture passive du contexte)  ·  **PR** : #111

## Pourquoi
- Démarrage : aucune PR [Auto] ouverte ; Build & Release v101 ✅, Tests de main ✅ (le test instable de #110 est réglé).
- 4 runs de fond d'affilée sur le Bluetooth → un run 🐛 était dû (charte : « toujours après un gros chantier »).
  Visuel complet (`npm run visual`, `--empty`, `--light`) : rien d'anormal à l'écran (seule curiosité : « FC 68 à 82 »
  sous une FC repos de 60 → artefact de la démo, 3 relevés de FC par jour, pas un bug de l'app).
  J'ai donc fait relire en profondeur le code BLE par un agent (lecture seule), puis vérifié chaque constat moi-même.
- Priorité n° 1 (tout capter sans saisie) : la météo / pression / air (I4) était la « prochaine priorité » depuis 3 runs.
  Un geste, puis plus jamais rien à faire, et des variables classiques de ressenti (migraine, énergie, allergies).

## Ce qui a été fait
### Correctifs Bluetooth (tous avec un test qui échouait avant)
- **VFC bloquée** (`heartRate.js`) : chaque RR n'était comparé qu'au dernier RR *retenu* ; un premier battement aberrant
  (ou un changement de rythme > 20 %, en se levant) faisait rejeter tous les suivants → qualité « bruitée », aucune VFC.
  Désormais la référence se recale après 3 rejets plausibles d'affilée.
- **Horloge jamais réglée** (`measurements.js`) : un tensiomètre remis au 01/01/2000 enregistrait la mesure en 2000
  (invisible dans « Vos derniers jours »). Horodatage de plus d'un an → heure de réception ; bit « Device Clock is Not
  Set » de l'oxymètre (0x2A5E, bit 4) respecté.
- **SFLOAT / FLOAT** : les valeurs spéciales (NaN, NRes, ±INF) n'existent qu'avec l'exposant 0 ; une tension de 204,7
  codée avec l'exposant −1 était jetée.
- **Doublons sans horodatage** : les mesures en mémoire renvoyées à chaque connexion prenaient toutes l'heure de
  réception (clé de dédoublonnage différente à chaque fois) → seule la dernière de chaque type est gardée.
- **Abonnement refusé** (`bleService.js`) : la connexion restait ouverte et sa déconnexion tardive remplaçait l'erreur
  par un écran « Aucune fréquence cardiaque reçue ». Déconnexion avant de remonter l'erreur ; idem `connect` qui échoue
  (minuterie nettoyée).
- **Annuler pendant la connexion** (`BleDevices.jsx`) : la session arrivée après coup restait active sans interface ;
  une réception annulée puis relancée mélangeait les deux sessions. Session coupée dès qu'elle arrive si l'utilisateur a
  annulé / quitté la page ; numéro de réception pour ignorer les anciennes.
- Non corrigés (faible impact, notés au backlog) : double pesée possible sur un impédancemètre qui envoie le poids sur
  0x2A9C sans horodatage et sur 0x2A9D avec ; Android ≤ 11 sans localisation activée → « Aucun appareil » sans explication.

### Météo, pression et air (C8 / I4)
- `src/services/weather.js` (pur) : URL Open-Meteo (prévision + qualité de l'air, `past_days=92`, `timezone=auto`,
  position arrondie au 0,1° ≈ 10 km), lecture des réponses → une journée = T° max/min, pluie, soleil (h), pression
  moyenne (horaire → jour) et **variation depuis la veille**, humidité, **indice européen de qualité de l'air** (pire
  heure), **pollens** (max par type : aulne, bouleau, graminées, armoise, olivier, ambroisie). Libellés « air : bonne… »,
  « pollen : modéré (bouleau) », résumé court.
- `src/services/weatherSync.js` : réglages locaux (`healthtrack_weather` : lieu arrondi, dernière mise à jour, erreur,
  météo du jour pour l'affichage), mise à jour **au plus toutes les 3 h à l'ouverture de l'app** (`useAutoSync`),
  verrou anti-doublon, jamais d'exception (erreur notée : hors ligne, service indisponible). Seules les **journées
  terminées** sont enregistrées (entrée `weather`, source `open_meteo`, midi local) : le jour en cours changerait
  encore et `upsertEntries` ne met pas à jour une entrée existante. 92 jours repris à chaque fois → pas de trou après
  quelques jours sans ouvrir l'app, sans doublon.
- Analyses : 6 variables du groupe `environment` (température max, ensoleillement, pression, variation de pression,
  pollution de l'air, pollen) ; inconnues (null) sans relevé, **0 reste une vraie valeur** (0 °C, aucun soleil) ;
  jamais des leviers (absentes de `LEVER_ACTIONS`) ; aujourd'hui (pas encore enregistré) = journée habituelle dans la
  prédiction. Une journée qui n'a que la météo ne compte pas dans « N jours de données » et n'apparaît pas dans le journal.
- Tableau de bord : puce « Météo » (« 14° / 4° ») dans chaque journée.
- `WeatherCard` dans Connecteurs (après Health Connect / Withings) : « Utiliser ma position approximative » (géolocalisation
  du WebView, autorisation Android **approximative** seulement) ou recherche de ville (géocodage Open-Meteo) ; une fois
  activée : lieu, météo du jour, alerte douce « Pression en forte baisse » (≥ 6 hPa), « Mettre à jour », « Désactiver »
  (efface le lieu).
- Manifeste : `ACCESS_COARSE_LOCATION` sans `maxSdkVersion` (la précise reste limitée à Android ≤ 11 pour le scan BLE).
  Capacitor (`BridgeWebChromeClient`) accepte la position approximative seule sur Android 12+.
- Démo des captures : une journée météo par jour (RNG séparé), petit effet réel d'une chute de pression ≥ 5 hPa sur le
  bien-être ; `visual-check` coupe tout appel à Open-Meteo et injecte une météo « à jour » (Paris).

## Vérifications
- Tests : 903 ✅ (856 avant, +47) · Lint : 6 erreurs + 1 warning (inchangé) · Build ✅
- Visuel : `npm run visual` complet, `--empty`, `--light`, `--ble=received` : 0 erreur JS. Regardé Connecteurs (carte
  activée et à activer), Tableau de bord (puce Météo, d'abord sur 2 lignes → réduite aux températures), Analyses
  (variables météo dans « Corrélations », libellés raccourcis car tronqués).
- Réseau : l'API qualité de l'air répond avec `access-control-allow-origin: *` (vérifié), et le parseur a été validé sur
  sa vraie réponse (93 jours, AQI et pollens remplis). `api.open-meteo.com` est bloqué par le proxy de la session (pas
  par l'app) : format de la prévision construit d'après la documentation Open-Meteo.

## Apprentissages / décisions
- Faire relire un chantier par un agent en lecture seule a trouvé 6 vrais bugs que ni les tests ni les captures ne
  montraient (états de course, horloges d'appareils). À refaire après chaque gros chantier.
- Démo : avec 75 jours et ~50 variables, des corrélations fortuites « solides » apparaissent (pollen / pollution avec la
  graine 4000, aucune avec 4 autres graines → pas un défaut du moteur). Graine de la météo de démo changée (4003) pour
  des captures représentatives ; choix documenté dans `demoData.mjs`.
- Pas de stockage du jour en cours tant que `upsertEntries` ne sait pas remplacer : à revoir si l'on veut la météo
  du jour dans la prédiction (prévision du matin).

## Suite proposée
- Propriétaire : activez « Météo, pression et air » (un geste) et dites-moi si la carte affiche bien votre ville / la
  météo du jour sur l'A56.
- 🏗️ Météo étape 2 : prévision du jour dans la « Prédiction du jour », effets décalés (pression J−1), tag « mal de tête »
  avec intensité (I13) pour tester la sensibilité à la pression ; alerte du matin « pression en chute aujourd'hui ».
- 🏗️ C8 suite : temps d'écran (I6), calendrier (I11).
- 🐛 BLE : double pesée 0x2A9C / 0x2A9D, message « activez la localisation » sur Android ≤ 11.
