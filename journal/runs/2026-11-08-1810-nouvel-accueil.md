# Session du 08/11 au soir — Nouvel accueil (ACC-1 à ACC-10)

**Type** : chantier (priorité absolue de la session, pas un run horaire).

## Contexte
- Main verte au départ (#837). Demande du propriétaire (08/11 vers 13:30) et maquette v3 validée vers 18:00 :
  « C'est parfait go développer faut que ce soit up ce soir à minuit ». Spécification ACC-1 à ACC-10 inscrite au
  BACKLOG, décisions D1 à D9 dans PRODUIT.md, relais iOS en tête de POUR-IOS.md.
- Maquette lue en entier (artefact multi-fichiers) : `journal/maquettes/accueil/` (HTML v3, 10 captures de la visite,
  `TEXTES.md` avec tous les textes, 49 captures « android-samsung-watch-* » et « iphone-seul-* »).

## Fait
- **#838** (mergée) — ACC-1, 2, 3, 4, 6, 7, 9 : parcours fixe tuto (3 cartes) → objectifs → sources → trouvé →
  visage → première note → Gold ; compteur calculé une fois ; « Continuer » jamais bloqué ; « Passer » seulement vers
  la carte confidentialité ; objectifs multiples (`goals`, ancien `goal` lu, Paramètres en cases) ; une seule page
  « Branchez vos sources » (Health Connect / Santé d'un geste, carte Huawei si détectée, interrupteurs Météo et Temps
  d'écran, divulgations au-dessus des boutons) ; visage en deux tuiles et divulgation en cinq lignes, notification
  annoncée ; première note en cinq visages (+ ventre avec digestion ou cycle) ; écran court « Gold est offert pendant
  le test » ; plus de croix qui double « Continuer gratuitement ». Anciens écrans « Que voulez-vous suivre ? »,
  « Avez-vous une montre ? », « Vos données Health Connect » retirés.
- **PR 2** — ACC-5 et ACC-10 : mesures par thème avec « reçu / en partie / pas partagée » et la raison
  (`src/devices/deviceCapabilities.js`, tiré des 15 configurations) ; calendrier unique `src/config/firstResults.js`
  (jour 14, jour 28) lu par le moteur, Aujourd'hui, l'abonnement.
- **PR 3** — ACC-8 : visite guidée sur les vrais écrans. Données fictives en mémoire (`src/storage/exampleMode.js`) :
  pendant l'exemple, les lectures de localHealthStorage viennent de la liste en mémoire, les écritures attendent la fin
  (jamais rien dans la base de la personne) ; analyses calculées sur le fil principal sans cache ; résumés des pistes
  non rangés. Tests : base identique avant et après, « Passer » et la fin rendent les vraies données, un plantage ferme
  la visite. « Voir un exemple » en bas d'Aujourd'hui, Journal, Analyses et Agir les 14 premiers jours.

## CI
- Après #838, les deux jobs « HealthTrack sur Samsung A56 » (API 35 et 36) de main échouaient : les scripts
  `.github/scripts/play-cold-start.sh` et `play-release/smoke.mjs` attendaient le premier écran de l'ancien accueil
  (« Comprenez ce qui va… »). Repère changé en « Bienvenue dans » dans #841. Leçon : chercher aussi dans `.github/`
  les textes d'un écran qu'on remplace.

## Vérification de la carte 3 (cas où les données sortent) contre le code
- Trouvés : relais IA (variante play, Vertex UE) ; **Gemini avec la clé de la personne (variante sideload)** — le texte
  dit alors « lu par l'IA de Google, avec votre clé » (pas « en Europe ») ; export / rapport ; avis (relais) ; météo
  (Open-Meteo, position arrondie, ou nom de ville tapé) ; sauvegarde Android ; abonnement et crédits (numéro anonyme
  + jeton Play Integrity, petite ligne).
- Hors liste, sans donnée de la personne : vérification de mise à jour (GitHub, sideload) ; téléchargement des
  constantes du protocole Huawei (GitHub, sideload) ; Withings (sideload, données qui arrivent).

## Captures (maquette à gauche, app à droite)
`maquettes/accueil/comparaison/` : 01 à 10 (accueil), 11 à 15 (visite guidée) ; thème sombre et variantes dans
`maquettes/accueil/app/` (carte confidentialité, sources, visage, première note, carte Huawei, abonnement hors
période, visite en sombre). Chaque capture a été regardée.

## Écarts qui restent avec la maquette
- Visite, Analyses et Agir : avec les données de démonstration, le moteur ne trouve encore **aucun lien net** au
  jour 14 (ni même avec 75 jours fictifs) : « Pistes à tester » dit « Aucun lien assez net pour l'instant », et Agir
  n'a pas d'essai proposé. « Ce qui va avec votre bien-être » se remplit (75 jours fictifs, `RESULTS_DATA_DAYS`).
  Question au propriétaire (résumé) : garder cet exemple honnête, ou fabriquer un exemple avec un lien net (données
  inventées plus marquées) ?
- Pas d'icône par ligne dans Sources et « trouvé » ; « Comment l'arrêter » sans lien vers Paramètres (l'accueil est
  plein écran) ; pas de ligne appareil « Galaxy Watch 7 » (Health Connect ne donne que le nom de l'app).
- Mesures : une app installée mais silencieuse donne aussi ses raisons « pas partagée ».

## Envoi aux testeurs
- #841 mergée à 19:38 ; sur `c04e4fc` (v607, APK 34,6 Mo), « Build & Release », « Tests », émulateurs et « Play — AAB »
  verts. « Play — Alpha (livraison continue) » lancé à la main (workflow_dispatch, 19:52) : **versionCode 100918 placé
  sur l'alpha** (même AAB que le test interne ; avant : 100898). Google l'examine (quelques heures à 2 jours) ;
  l'API ne dit pas quand l'examen est fini (Play Console → Vue d'ensemble de la publication). Le cron de 23:45 ne
  renverra rien de plus si seul le journal change.

## Ligne pour l'orchestrateur
Accueil ACC-1 à ACC-10 livré et mergé : #838, #840, #841 ; Alpha 100918 envoyé à 19:52 (en examen chez Google).
Reste : question au propriétaire sur l'exemple du jour 14 (aucun lien net) ; écarts mineurs listés ci-dessus ; iPhone
à vérifier par la routine iOS (Santé, visage à l'ouverture).

## Suite
- iPhone : vérifier « Santé » et la lecture à l'ouverture seulement (POUR-IOS.md).
