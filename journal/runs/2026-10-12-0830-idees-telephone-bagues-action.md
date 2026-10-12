# 2026-10-12 08:30 Paris (06:30 UTC) — Idées : tout capter depuis le téléphone, bagues ouvertes, du chiffre à l'action

**Type** : 💡 (run « idées » de 08 h, pas de code produit)  ·  **PR** : voir la PR « [Auto] Run idées 12/10 08:30 »

## Pourquoi
- Démarrage : aucune PR [Auto] ouverte ; Tests, Build & Release (v102) et émulateur verts sur main (0c34040).
- Run de 08 h Paris → run « idées ». Question de départ : *« sans rien saisir, qu'est-ce qui me dirait chaque matin où
  j'en suis et quoi faire, et m'éviterait les fausses alertes ? »* + les points « À creuser » du run du 11/10 20:30
  (retours GT 6 Pro + Gadgetbridge, bagues et CGM, Gemini Nano sur A56, temps d'écran).

## Ce qui a été fait
- Recherche en parallèle par 3 agents (lecture seule) : (1) données brutes des wearables (GT 6 Pro, bagues, CGM, types
  HC par fabricant, matériel BLE standard), (2) capture passive par le téléphone et ML embarqué (sommeil sans montre,
  temps d'écran, mobilité, Gemini Nano / LiteRT, voix FR, Emobot / Sahha), (3) besoins utilisateurs et meilleures apps
  2026 (Whoop, Bevel, Oura, Google Health, Alan Mo, JITAI, enregistreurs de conversations). Synthèse et tri par moi.
- `IDEES.md` : nouvelle section en tête — 8 besoins utilisateurs, faits clés datés et sourcés, **17 nouvelles idées
  (I22–I38)** notées impact × faisabilité, pistes d'implémentation détaillées pour les 8 meilleures, mises à jour de
  I6 / I14 / I21, liste « à creuser ».
- `BACKLOG.md` : idées réparties dans C2, C4, C5, C7, C8, C9 ; « Prochaines étapes » réordonnées (temps d'écran +
  sommeil par le téléphone, puis Radar expliqué + « qui envoie quoi », puis plage habituelle + briefing du matin).
- `README.md` : bloc « Meilleures idées des runs idées » dans le résumé de la semaine, 2 points d'attention
  (vérification des développeurs Android 2027 ; VFC de la GT 6 Pro via Gadgetbridge), tableau à jour (#111 → v102).
- Pas d'entrée « Nouveautés » : rien de visible dans l'app.

## Faits marquants
- **Gadgetbridge 0.95.0 / 0.95.1 sortis le jour même** (tension → HC, export FIT des séances Huawei). GT 6 Pro : FC,
  SpO₂, stress, température cutanée, sommeil, séances OK chez de vrais utilisateurs ; **VFC jamais mentionnée**.
- **Bagues Colmi / Yawell** : protocole documenté sous **MIT** (tahnok) → pilote BLE direct possible et légal.
- **ML Kit GenAI (Gemini Nano) : aucun Galaxy A** au 08/10/2026 → LLM local = LiteRT-LM + Gemma 3 1B si un jour utile.
- **APK hors store sur Android 15+** : temps d'écran / notifications = « paramètres restreints » à débloquer
  manuellement → à intégrer au guide. **Vérification des développeurs Android mondiale en 2027** → risque pour la
  mise à jour en 1 clic, à étudier.
- Preuves humeur passive : l'écart à **sa propre** moyenne compte (LifeSense β = 0,22 pour le temps à la maison),
  mais variance expliquée faible (5–6 %) et modèles personnels pas toujours meilleurs que la moyenne (MONDY, 8/11)
  → afficher une « plage habituelle », pas un score précis.

## Vérifications
- Tests : 903 ✅ (61 fichiers) · Lint : 6 erreurs, 1 warning (inchangé) · Build : sans objet (journal seul, vérifié
  par la CI) · Visuel : sans objet (aucun changement d'interface).

## Apprentissages / décisions
- Reddit reste inaccessible (old.reddit, `.json`, miroirs 503) ; gummysearch / redlib donnent des extraits utilisables.
  npmjs.com en 403 : vérifier les versions de plugins par GitHub.
- Déléguer la recherche à 3 agents parallèles avec des questions précises puis trier soi-même : ~5 min de recherche
  pour une couverture large. À garder pour les runs idées.
- Décision : prochaines étapes de fond = un seul plugin Kotlin `PhoneUsage` qui sert temps d'écran **et** sommeil
  estimé ; I22 / I23 (purs, petits) sont de bons « bouche-trous » pour un run court.

## Suite proposée
- Run suivant (10:30) : 🏗️ temps d'écran + sommeil estimé (I6 + I25), ou I22 + I23 si le plugin natif paraît trop gros.
- Run idées de 20:30 : protocole Colmi en détail, vérification des développeurs Android 2027, tensiomètres français à
  profil standard réellement testés.
