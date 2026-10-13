# 2026-10-13 08:30 Paris (06:30 UTC) — Idées : montre app fermée, humeur réaliste, une réponse par jour

**Type** : 💡 (run « idées » de 08 h, pas de code produit)  ·  **PR** : « [Auto] Journal : run idées 13/10 08:30 » (journal seul)

## Pourquoi
- Démarrage : main vert (f4e5ede, v113 ; Tests, émulateur A56 et Build & Release verts), aucune PR « [Auto] »
  ouverte (seule #51 `cursor/*`, non touchée). `journal/diagnostics/` : toujours aucun journal du propriétaire.
- Run de 08 h Paris → run « idées ». Une bonne part sur la montre (priorité absolue) : la prochaine marche après
  (d ter) est la synchro **app fermée**, dont l'architecture n'était pas tranchée. Puis D4 (visage / voix) et la
  simplification (consigne : consolider plutôt qu'ajouter des écrans).

## Ce qui a été fait
- Recherche en 3 volets parallèles (synchro de fond Android / Gadgetbridge ; humeur sur l'appareil ; besoins des gens
  et apps qui simplifient).
- `IDEES.md` : section en tête — signaux utilisateurs, faits clés datés et sourcés, **8 idées (I49–I56)**, pistes
  d'implémentation, liste « à creuser » pour 20:30. I40 → I53, I41 → I55, I47 précisé par I51.
- `BACKLOG.md` : D3 (d quater) tranché (plan I49), guide One UI (I50), cas de test séances GT 6 Pro ; D4 : faits du
  jour (WebGPU, licences, précision réelle, caméra en arrière-plan) ; « Prochaines étapes » 2, 9 et 10 mis à jour.
- `README.md` : résumé de la semaine (meilleures idées, point d'attention « visage au déverrouillage », ligne du run).
- Pas d'entrée « Nouveautés » : rien de visible dans l'app.

## Faits marquants
- **Synchro app fermée** : `@capacitor/background-runner` est inutilisable (QuickJS sans `crypto.subtle` ni
  Bluetooth). Le **Companion Device Manager** gère le Bluetooth classique (événement à la connexion de la montre, app
  non lancée) et exempte l'app de l'interdiction de démarrer un service de premier plan depuis l'arrière-plan. → client
  Java « synchro seule » écrit depuis la spec, HiChain reste en JS au premier plan.
- **Reconnexions** : une reconnexion agressive peut faire réinitialiser l'appairage par la montre (PR GB #6367) →
  garder nos délais plafonnés, toujours fermer le socket.
- **A56** : pas de WebGPU sur GPU Xclipse (liste de blocage Chromium) → MediaPipe web (WebGL2) ou natif.
- **Humeur** : précision individuelle publiée modeste (AUC ≈ 0,6 visage, r ≈ 0,4 voix) → tendances 7 j calibrées.
  openSMILE exige une licence commerciale ; HSEmotion valence / éveil : licence des poids non précisée.
- **Caméra au déverrouillage** (« niveau 2 ») : rien de fiable ne montre que `appops` suffit sur Android 14–16 → à
  tester sur l'A56 avec un diagnostic, sans le promettre.
- Gemini Nano toujours absent de l'A56 ; Gemma 4 E2B (Apache-2.0, ~1,5 Go) possible plus tard, pour reformuler seulement.

## Vérifications
- Tests : 1073 ✅ (80 fichiers) · Lint / build / visuel : sans objet (aucun changement de l'app).

## Suite proposée
- Prochain run hors idées (10:30) : D3 (d bis) — 1/0x03, phases du sommeil, RR → VFC, séances (avec le cas des
  séances enregistrées automatiquement).
- Puis (d quater) selon I49 : `CompanionPlugin` + service + client Java + filet WorkManager.
- Dès qu'un journal du propriétaire arrive : corriger (c) / (d) en priorité.
