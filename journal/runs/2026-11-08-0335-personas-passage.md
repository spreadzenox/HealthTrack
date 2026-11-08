# Run 08/11 03:35 — Personas : premier passage complet

**Type** : 🎨 code (outillage + un correctif). **Branche** : `auto/run-0335`. Aucune autre session en cours (seule PR
ouverte : #51, `cursor/*`, hors routine).

## Pourquoi
Décision C du propriétaire (07/11) : un passage complet des personas avant l'envoi aux testeurs du 08/11 au soir
(PERSONAS-1, priorité désignée par le run précédent, T1 à T3 étant livrés).

## Ce qui a été fait
1. **Outil** `npm run persona` (`app/scripts/persona/`) : lance la variante play dans un téléphone simulé avec les
   données de démo de la persona (`personaData.mjs` : jour 1 = premier lancement sans saisie, 30 jours importés si
   montre ; jour N ; matériel `phone`, `watch`, `watch-hrv`, `huawei`, `full`) ; gestes HTTP qui renvoient une capture
   (toucher par texte ou par point, écrire, défiler, retour). Relais, météo, GitHub simulés ; faux Play Billing pour
   que les droits soient relus au démarrage comme sur le téléphone ; Nouveautés marquées lues comme après l'onboarding.
   5 tests (`personaData.test.mjs`). Consigne des agents : `journal/simulations/brief.md`.
2. **Passage complet** : 7 agents (un par persona), configurations tirées au prorata des poids, jours tirés ; 7
   rapports et 40 captures dans `journal/simulations/` ; synthèse qui sépare les artefacts de l'outil (vérifiés) des
   vrais constats.
3. **Correctif POLISH-SIM-1** (TDD) : `NewMealForm` efface l'erreur dès que la liste d'aliments change.

## Vérifications
- `npm run test` : vert (3 246 + 1 nouveau test de page + 5 tests de l'outil) ; lint et build : voir la PR.
- Captures lues : Accueil J14, Réglages, Données (rapport PDF accessible pendant la période de lancement).

## Suite proposée
- POLISH-SIM-2 à 7 (polish, dès le 09/11), POLISH-SIM-8 en proposition avec maquette, POLISH-SIM-9 (outil).
- Runs « idées » : deux simulations par jour avec l'outil corrigé.
