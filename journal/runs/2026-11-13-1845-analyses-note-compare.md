# Run 13/11 18:45 — Analyses : la note confirmée, ce qui a été comparé (POLISH-SIM-62)

**Type** : code (mode polish).

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée avant de les suivre. Aucune PR « [Auto] » ouverte
  (#945 « [Fusion] », brouillon d'une autre session, et #51 `cursor/*` ne sont pas touchées). Sur main 4ce39b5 :
  Tests, Build & Release, Play — AAB et émulateur A56 verts.

## Constat (simulation du 12/11, Sportif J14 ; revu dans l'outil des personas)
- Au 14e jour noté, Analyses › Bien-être ne montrait que « Aucun lien assez net… » et la ligne du moyen terme : quand
  la méthode ne prévoit pas mieux que « demain comme aujourd'hui », aucune barre n'est affichée, donc rien ne dit ce
  qui a été regardé.
- « Noter maintenant » ouvre la fenêtre de note ; après « Enregistrer », elle se ferme sans aucun retour.

## Fait
- `resultsView.js` : `compared` (`count` = facteurs distincts des délais prêts, `upTo` = délai prêt le plus long ;
  `null` sans facteur).
- `Recommendations.jsx` : sans piste, sans « Ce qui va avec » ni « À regarder », la ligne « 16 facteurs comparés à
  votre bien-être, du jour même à la veille. » (« à 6 jours avant », « à 27 jours avant » selon le délai). Avec des
  barres, rien de plus : elles montrent déjà ce qui est comparé.
- `WellbeingPrompt.jsx` : `onSaved(note)` ; Analyses affiche « Noté : 4/5 » (`role=status`) sous le titre.
- Nouveautés : `2026-11-13-1845-analyses-note-compare.json`.

## Vérifs
- Tests écrits avant le code (`Recommendations.note.test.jsx`, `resultsView.test.js`, `WellbeingPrompt.test.jsx`).
  `npm run test` (3486 verts), `npm run lint` (0 erreur), `npm run build`, `npm run visual` complet sans erreur.
- Captures lues, outil des personas (Sportif, Galaxy Watch, clair) :
  [J14, facteurs comparés](captures/2026-11-13-1845-analyses-compare-J14.png) et
  [J10, note confirmée](captures/2026-11-13-1845-analyses-note-confirmee.png). Le sombre n'a pas été capturé à part
  (texte sur les tokens `--text` et `--text-muted` déjà utilisés sur cette page).

## Limites
- « Noté : 4/5 » n'apparaît que dans Analyses (là où la persona l'a manqué) ; Aujourd'hui et le Journal montrent déjà
  la note dans leur carte.
- La digestion se note sur Aujourd'hui (« Noter maintenant » y renvoie) : pas de confirmation ajoutée ici.

## Suite
- PROP-SIM-15 (séances dans Tendances : proposition avec maquette), POLISH-SIM-63 à 66 (outil), JOURNAL-CAPTURES-1.
- Deux simulations de personas à faire au run « idées » de 20 h.
