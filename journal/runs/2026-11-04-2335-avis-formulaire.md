# 04/11 23:35 — « Votre avis » dans l'app (AVIS-RELAIS-2, retour (2) du 04/11)

Type : 🔧 run de code (23:35 Paris).

## Constat au démarrage
- main vert (`8f76e29`, #698) : Tests, « Play — Alpha » réussis (émulateur en cours au démarrage). Alpha : 100778 en
  examen d'après les runs précédents (pas de nouvel envoi : seul le journal changeait).
- Aucune autre PR « [Auto] » ouverte ; seule #51 (cursor/*, non touchée).

## Fait
- `app/src/services/aiRelay.js` : `sendFeedback(text, { version, variant })` → `POST /v1/feedback` (texte nettoyé,
  ≤ 2 000 caractères vérifiés avant l'envoi ; en-têtes `X-Install-Id`, Play Integrity, appareils de test, `X-Platform`
  pour l'iPhone ; **ni jeton d'achat ni crédits**). Ajout des en-têtes d'intégrité factorisé (`addIntegrityHeaders`),
  partagé avec l'analyse.
- `app/src/pages/Settings.jsx` : « Votre avis » devient un formulaire (zone de texte, « Envoyer » désactivé tant que
  c'est vide, « Merci, votre avis est bien arrivé. », message du relais en cas de refus, texte gardé si l'envoi
  échoue) ; le lien d'avant reste en secours (« Autre moyen : la page Halcya du Play Store » / « un ticket GitHub »).
- `app/public/privacypolicy.html` (mise à jour du 4 novembre) : « En bref » et nouvelle section « Votre avis » (ce qui
  part, masquage, 90 jours, Firestore Belgique, identifiant d'installation et jeton non gardés avec l'avis) ; « Vos
  droits » corrigé (un avis envoyé s'efface seul au bout de 90 jours).
- Sécurité des données : « Autre contenu généré par l'utilisateur » était déjà déclaré (collecté, facultatif,
  fonctionnement de l'app) ; seule la justification change, **CSV identique**, rien à relancer. J'ai d'abord ajouté
  « Analytique » : le test « aucune mesure d'audience » l'a refusé à raison, retiré.
- Tests : `feedbackSend.test.js` (4), `Settings.play.test.jsx` (+2 : rien ne part avant le geste, corps limité à
  `text`/`version`/`variant`, refus affiché), `Settings.test.jsx` mis à jour.
- Nouveautés : `2026-11-04-2335-votre-avis.json`.
- `POUR-IOS.md` : formulaire et `sendFeedback` partagés ; App Attest à brancher côté iPhone.

## Vérifications
- `npm run test` (une première passe a montré l'échec Data safety ci-dessus, corrigé ; tests ciblés verts ensuite),
  `npm run build`, `npm run visual` (toutes pages) ; captures de `/settings` en play, clair (démo) et sombre (vierge)
  regardées : zone de texte pleine largeur, bouton pilule, lien de secours lisible.

## Suite
- **P46** (TTL `feedback.expireAt`) avant que les testeurs écrivent.
- AVIS-RELAIS-3 : workflow quotidien qui lit `feedback` (gh-deployer : lecture Firestore à vérifier, sinon action
  du propriétaire) et publie un résumé anonyme dans le journal ; puis avis du Play Store (`reviews.list`).
- Puis ANALYSES-ONGLETS ; VENTRE-BE-1 étape 2 attend « I220 oui / non ».
