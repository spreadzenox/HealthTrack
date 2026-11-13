# Run 13/11 21:35 — Rapport PDF : la confirmation reste visible (POLISH-SIM-67)

**Type** : code (mode polish, bug).

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée avant de les suivre. Aucune PR « [Auto] » ouverte
  (#51 `cursor/*` non touchée). Main bb41edd (#950, bascule iOS, autre session) : Tests, Build & Release (#945),
  Play — AAB et émulateur A56 verts ; deux workflows iOS lancés à la main par l'orchestrateur en cours, non touchés.
- Les instructions de ce run ne changent pas avec la fusion du dépôt iOS (`iphone/`) : rien n'y est touché.

## Constat (simulation du 13/11 20:35, Ventre sans technique J45)
- Après « Créer le PDF », la phrase « Halcya-rapport-….pdf téléchargé. » s'écrit sous le bouton, donc sous la barre
  d'onglets quand la carte est en bas d'écran : la personne ne sait pas si le fichier a été créé.

## Fait
- `DoctorReportCard.jsx` : quand la ligne de confirmation (ou d'erreur) apparaît, elle vient à l'écran
  (`scrollIntoView`, `block: 'nearest'` : rien ne bouge si elle est déjà visible).
- `Reintroduction.css` : `.report-status` a une marge de défilement basse (barre d'onglets + marge sûre), pour
  s'arrêter au-dessus de la barre et non derrière.
- Nouveautés : `2026-11-13-2135-rapport-pdf-confirmation.json`.

## Vérifs
- Test écrit d'abord (rouge, puis vert) : `DoctorReportCard.test.jsx` (+1). `npm run test` (3505 verts), `npm run lint`
  (0 erreur), `npm run build`, `npm run visual` complet sans erreur.
- Même parcours que la persona dans l'outil des simulations (J45, variante play, Analyses › Digestion, « Préparer le
  rapport », « Créer le PDF ») : la phrase est lisible au-dessus de la barre
  ([capture](captures/2026-11-13-2135-rapport-pdf-confirmation.png)).

## Limites
- Vérifié en clair, depuis Analyses seulement ; la carte de Données est le même composant, non recapturée après le
  toucher. Thème sombre non capturé (aucune couleur ne change).
- Un premier passage des tests a échoué sur ma note de Nouveautés (`kind` « correction » au lieu de « correctif ») :
  corrigé avant le push.
- BACKLOG, PRODUIT et README lus par sections, pas en entier (800 ko).

## Suite
- POLISH-SIM-68 (digestion notée absente d'Aujourd'hui), 69, 70, 71 ; CYCLE-3a-2 ; JOURNAL-CAPTURES-1.
