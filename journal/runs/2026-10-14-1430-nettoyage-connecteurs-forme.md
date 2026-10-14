# 2026-10-14 14:30 Paris (12:30 UTC) — Nettoyage : Connecteurs par statut, bloc « Votre forme »

**Type** : 🧹 (consigne du propriétaire « nettoyer l'UI », puis D1)  ·  **PR** : #156, fusionnée → **v126** (APK publié)

## Pourquoi
- Démarrage : main à `c45cc56` (#155, **v125 publiée avec son APK**). Aucune PR « [Auto] » rouge ou en conflit.
- Rappel de l'orchestrateur : vérifier ce que le run 12:30 a livré pour (A) synchro à 0 mesure et (B) « nettoyer l'UI ».
  Vérifié dans le journal et sur GitHub : **(A) et (B) sont livrés et fusionnés** (fenêtre de synchro, totaux du jour,
  carte montre unique « Connectée · batterie · synchro · mesures » + « Synchroniser la montre », tout le technique
  — étapes, « Refaire l'appairage », test, « Libérer et appairer », export du journal — sous « Diagnostic » replié).
  Aucun nouveau journal du propriétaire depuis v124 : rien de plus à faire côté montre tant qu'il n'a pas synchronisé
  avec la v125. → Enchaînement sur la passe de nettoyage générale (restes de D1).

## Ce qui a été fait (retiré / fusionné, et pourquoi)
- **Connecteurs ordonnés par statut** (`connectors/connectorsLayout.js`, pur et testé) : en tête ce qui envoie déjà
  (montre jamais connectée → non ; Health Connect / Withings activés ; météo ; temps d'écran), puis un volet
  **« Brancher une autre source »** replié qui contient le reste + capteurs Bluetooth + guides par marque. Ouvert
  (« Sources à brancher ») tant que rien n'est branché. Classement figé à l'ouverture (une carte qu'on active ne saute
  pas sous le doigt).
- **Retiré** : l'intro de 4 lignes (→ une ligne) ; les pastilles « Plateforme / Permissions » sur une source
  **désactivée** (bruit : « Non disponible / Non demandé » alors que l'utilisateur n'a rien demandé).
- **Code** : les 4 alertes « Health Connect indisponible » (≈ 150 lignes quasi identiques) → une table
  `UNAVAILABLE_MESSAGES` + un seul bloc. Textes inchangés.
- **Accueil : un seul bloc « Votre forme »** (`FormeSection.jsx`) : « Radar forme » + « Votre cœur vs votre norme » +
  « Régularité du sommeil » avaient chacun leur titre et leur « Comment c'est calculé » → un titre, **une** explication
  de méthode (« comparé à *votre* norme… une observation, pas un diagnostic »). « Vos horaires » → « Horaires de
  sommeil » ; le nombre de nuits (avant caché dans l'explication) s'affiche à côté de l'indice.
- **`--border`** : variable CSS utilisée par `.settings-input` mais jamais définie → définie dans `:root`.

## Vérifications
- Tests : **1185 ✅** (91 fichiers ; +7 : classement par statut ×3, page Connecteurs ×3 dont badges masqués et volet
  ouvert/fermé, bloc « Votre forme » ×1). Build ✅. Lint : **6 erreurs** (baseline inchangée).
- `npm run visual` (démo, `--empty`, `--light`, `/connectors --ble=watch --connect=done --devices`) : aucune erreur JS ;
  captures relues : Connecteurs (Gadgetbridge + météo en tête, volet replié), état vide (volet « Sources à brancher »
  ouvert, montre en premier), montre connectée en tête ; Accueil « Votre forme » (radar, FC, VFC, horaires, une seule
  explication), état vide (titre + invitation à connecter une montre).

## Suite proposée
1. ⌚ Lire le prochain journal du propriétaire (v125+) : vraies mesures dans l'historique ? → clore la priorité absolue,
   puis (d quater) synchro en arrière-plan.
2. 🧹 D1, restes : contexte auto-détecté (I65 : « Voyage » par fuseau, « Sport le soir » par séances) ; relire
   Paramètres et Analyses avec le même œil (titres et « Comment c'est calculé » en double).
3. ⚡ D2 : Nutrition par le runner (≈ 0,8 s), `upsertEntries` par index, `WellbeingCharts` par agrégats, budget en CI.
