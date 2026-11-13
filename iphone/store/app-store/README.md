# Fiche App Store de Halcya (fr-FR) — brouillon

Préparée par la routine iOS (étape I9) à partir de la fiche Google Play d'Android (`app/store/listing/fr-FR/`),
réécrite pour l'iPhone : app Santé au lieu de Health Connect, aucune fonction absente de la version iOS (montre Huawei
en Bluetooth direct, temps d'écran, lecture du visage tant qu'I7 n'est pas fait), aucun nom d'une autre plateforme
mobile (directive 2.3.10 d'Apple). À revoir avant la première soumission, quand la parité est atteinte.

| Fichier | Champ d'App Store Connect | Limite |
|---|---|---|
| `fr-FR/name.txt` | Nom | 30 caractères |
| `fr-FR/subtitle.txt` | Sous-titre | 30 caractères |
| `fr-FR/promotional-text.txt` | Texte promotionnel (modifiable sans nouvel examen) | 170 caractères |
| `fr-FR/description.txt` | Description | 4 000 caractères |
| `fr-FR/keywords.txt` | Mots-clés, séparés par des virgules, sans répéter le nom ni le sous-titre | 100 caractères |

`scripts/store-check.mjs` vérifie ces limites et l'absence d'« Android », « Google », « Play », « Health Connect »
(workflow `store-check.yml`, sans runner macOS ; la fiche seule ne relance pas la build iOS).

Reste à préparer, au moment des actions A3 et A5 du propriétaire :
- **Catégorie** : Santé et forme (principale) ; pas « Médecine » : Halcya n'est pas un dispositif médical.
- **Âge** : 18 ans et plus, comme sur Google Play.
- Catégorie et âge sont dans `classification.json`, envoyés par `store-push.mjs` (31/10). Réponses au questionnaire
  d'Apple, au plus prudent, **à relire par le propriétaire avant la soumission** :
  - santé ou bien-être : oui ;
  - informations médicales ou de traitement : fréquentes (réintroduction FODMAP, rapport pour le médecin ; jamais un
    diagnostic) ;
  - tabac : fréquent (relevé des cigarettes) ;
  - tout le reste : non. Aucune publicité, aucun échange entre personnes, aucun contenu publié par d'autres, aucun
    navigateur libre, ni jeu d'argent, ni violence, ni contenu sexuel ;
  - âge forcé à 18 ans et plus (`ageRatingOverrideV2`), au-dessus de ce que le questionnaire calculerait.
- **URL** : assistance et politique de confidentialité. Celles publiées pour Android parlent d'Android et de Google. La politique de l'iPhone est écrite (`overlay/app/public/confidentialite-iphone.html`, embarquée dans l'app, 29/10) ; elle sera publiée en ligne avec la page d'assistance (`site/assistance.html`) par le workflow « Site — GitHub Pages », dès que Pages est activé (action A8) : `https://spreadzenox.github.io/HealthTrack-iOS/confidentialite/` et `https://spreadzenox.github.io/HealthTrack-iOS/assistance/`. Les conditions d'utilisation de l'iPhone (`conditions-iphone.html`, 29/10) le sont aussi, à `…/conditions/` ; sans achat, la fiche n'en exige pas (contrat de licence standard d'Apple), elles le seront avec l'abonnement (I6).
- **Captures** : iPhone 6,9 pouces (1320 × 2868), exigées par App Store Connect. Le workflow « iOS — build simulateur » les produit à la demande : lancement manuel (`workflow_dispatch`) avec `devices` = « iPhone 17 Pro Max ». Toutes les pages du parcours sont prises avec les données de démo et publiées sur la branche `captures/store`, sans toucher aux captures des PR. Les 8 captures de la fiche sont choisies : `captures.md`.
- **Notes pour l'examen** : texte anglais prêt à coller dans `notes-examen.md` (29/10) : pas de compte, données sur
  l'iPhone, analyse IA seulement à la demande par le relais (sans clé dans l'app), HealthKit en lecture seule (les
  15 types), caméra (repas, visage sur l'iPhone), capteurs Bluetooth, rappels, copie de secours, aucun achat pour
  l'instant ; à relire avant la soumission (I6, directive 5.1.3 (ii), A8).
- **Confidentialité de l'app** (A5) : réponses prêtes dans `confidentialite.md`, en accord avec `ios/App/App/PrivacyInfo.xcprivacy` et avec la déclaration Google Play d'Android (vérifié par un test).
