# 2026-10-22 06:30 Paris (04:30 UTC) — Formulaire « Sécurité des données » de Google Play, envoyé par l'API

**Type** : 🧭📄 code (run court Play, préparation du test fermé) · **PR** : « [Auto] Sécurité des données Google Play par l'API » (voir « Après le merge »)

## Pourquoi
- Main à `2e31077` (#266), CI verte, aucune PR « [Auto] » ouverte. Signalement du 20/10 19:05 déjà corrigé.
- Étape suivante prévue par le run de 04:30 : Sécurité des données, puis test fermé (attend P18), puis retour montre (M2).

## Ce qui a été fait
- **Modèle** `app/store/data-safety/template.csv` : le modèle CSV de la Play Console (782 lignes, colonnes « Question ID,
  Response ID, Response value, Answer requirement, label »), valeurs vidées. Pris sur un export public récent
  (2026-10-03) d'un autre dépôt : c'est le formulaire de Google, pas du code.
- **Réponses** `app/store/data-safety/answers.mjs`, chacune avec sa justification : collecte oui, chiffrement oui,
  aucun compte, suppression possible (URL `…/confidentialite/#vos-droits`, ancre ajoutée à la politique) ; types
  déclarés : position approximative (Open-Meteo), photos et autres contenus générés (repas → Gemini), tous
  **collectés, non partagés** (prestataires), **facultatifs**, **non éphémères** (prudence), pour le fonctionnement.
  Aucune donnée de santé ni forme (rien ne part de Health Connect, de la montre, du ventre ; l'IA ne reçoit que le repas).
- **Script** `scripts/play/dataSafety.mjs` : lecteur/écrivain CSV, remplissage du modèle (réponse inconnue = erreur,
  pour détecter un renommage par Google), règles du formulaire (obligatoires, choix unique, chaque type déclaré a ses
  réponses d'usage, pas de réponse pour un type non déclaré), envoi `POST applications/{pkg}/dataSafety`.
  CLI `data-safety-cli.mjs` (`--write` régénère `data-safety.csv`, le fichier de repli à importer à la main).
- **Workflow** « Play — sécurité des données », **lancement manuel seulement** : le premier essai de push (workflow
  déclenché sur main) a été refusé par le garde-fou de la session comme une démarche faite au nom du propriétaire ;
  c'est juste : la déclaration est une affirmation légale, il la relit puis lance le workflow (**P21**). Refus de Play
  (401, 403, 400) → avertissement avec le repli, pas d'échec.
- Réponses en clair pour le propriétaire : `PLAY-CONFORMITE.md` §5 ; P16 et jalon 10 mis à jour dans `PRODUIT.md`.
- Pas d'entrée « Nouveautés » : rien de visible ne change dans l'app.

## Vérifications
- `npm run test` : **1 814 Vitest verts** (+24 : CSV, modèle relu sans perte, 11 règles refusées, déclaration réelle
  cohérente avec la politique, CSV de repli à jour, envoi et refus). `npm run lint` : 6 erreurs, comme avant (aucune
  dans les nouveaux fichiers). `npm run build` OK. `npm run visual` OK, accueil regardé (inchangé).

## Suite proposée
- Propriétaire : **P21** (relire et lancer « Play — sécurité des données »), **P20**, **P19**, **P18**.
- Prochain run de code : test fermé si P18 est fait, sinon montre **M2** (VFC de journée).
