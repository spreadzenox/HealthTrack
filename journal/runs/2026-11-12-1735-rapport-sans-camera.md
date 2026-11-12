# Run 12/11 17:35 — Données : rapport sans caméra, sauvegarde en une phrase (POLISH-SIM-57)

**Type** : code (mode polish).

## Contexte
- Main be09dfc (#940, journal seul) : Tests et émulateur A56 verts ; dernier « Build & Release » (75bd95d) vert.
- PR #939 (run de 15:35, POLISH-SIM-56) ouverte depuis plus de 90 min, checks verts, non mergée (« permission
  refusée » dans sa session). Elle passe avant tout : ses deux commits sont repris sur la branche de ce run (conflits
  du résumé résolus en gardant les deux blocs), #939 fermée au profit de la PR de ce run.

## Fait
- `DoctorReportCard.jsx` : la case « Inclure mon bien-être estimé (caméra) » n'est proposée qu'avec au moins une entrée
  `face_burst` (`countEntries`) ; un comptage en échec la laisse ; `includeWellbeing` reste faux sans elle.
- `Data.jsx` : l'indication dit « Un fichier JSON, à garder en lieu sûr. » (vrai sur Android, iPhone et navigateur) ;
  hors Android la phrase de fin est « <fichier> téléchargé. », comme pour le rapport. Sur Android la phrase de fin
  reste « … enregistré dans Documents (app Fichiers > Téléphone > Documents). » : le lieu a une seule maison.
- Nouveautés : `2026-11-12-1735-rapport-sans-camera.json`.
- `.gitignore` : `!journal/**/*.png`. Constat : 16 captures citées dans le résumé depuis le 12/11 00:35 ne sont pas
  dans le dépôt (png ignorés, `git add -f` oublié par les runs). Signalé en tête du résumé ; JOURNAL-CAPTURES-1.

## Écarté
- Une indication différente selon la plateforme (« rangé dans Documents » sur Android seulement) : un état de plus et
  des tests d'export qui dépendent de l'ordre des imports dynamiques, pour une information déjà dite après l'export.

## Vérifs
- `npm run test` (3475 verts), `npm run lint` (0 erreur), `npm run build`, `npm run visual` complet sans erreur.
- Captures lues : Données sur la démo (case présente, la démo a des lectures du visage) ; persona J45 téléphone seul
  après export ([capture](captures/2026-11-12-1735-donnees-export-rapport.png)).
- Limite : l'outil des personas donne des lectures du visage à toutes les personas, donc la case y reste visible ; le
  cas « aucune lecture » est couvert par les tests du composant, pas par une capture (POLISH-SIM-65).

## Suite
- JOURNAL-CAPTURES-1 (liens morts du résumé, test), POLISH-SIM-58, 61 à 65.
- iPhone : l'export hors Android passe par un lien de téléchargement ; à vérifier par la routine iOS dans la WebView.
