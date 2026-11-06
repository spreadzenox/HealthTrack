# 06/11 10:35 — Titres : « bien-être » ne se coupe plus au trait d'union (KEEP-WHOLE)

Type : 🎨 run de code (revue C1, variante play, données vierges, thème sombre, 360 × 780).

## Constat au démarrage
- main `dbfae0f` vert (Build & Release, relais, Play — AAB, Alpha : porte de 24 h, 100811 en place jusqu'à ~16:30 UTC).
- PR « [Auto] » ouverte : **#751** (journal seul, run de 09:35, créée 09:23 UTC) : Frontend et Build APK verts,
  émulateurs A56 encore en cours au moment du travail ; reprise en fin de run (voir plus bas).
- Priorités du prompt : rien d'actionnable avant 16:30 (Alpha), P37 sans réponse (GOLD-a3-2), INSTALLS-21c-2 attend
  des journaux (08–09/11). Run consacré à la revue C1.

## Revue `npm run visual -- --play --empty --dark --size=360x780` (17 pages, toutes « ok »)
- **Défaut corrigé** : Analyses → Bien-être, titre lilas « Vos pistes du bien- / être arrivent dans 5 jours » coupé au
  trait d'union.
- Vu, laissé tel quel : Tendances vierge, bouton « Ajouter une montre » en lilas (couleur des pistes) pour un sujet
  « forme » ; mineur, noté en idée (KEEP-WHOLE-2 ci-dessous). Historique du bien-être, Montre, FODMAP, Paramètres :
  rien à redire.

## Fait (KEEP-WHOLE)
- `src/utils/keepWhole.jsx` : entoure chaque mot composé (`\p{L}+(-\p{L}+)+`) d'un `span` en `white-space: nowrap`.
  **Le texte ne change pas** (pas de trait d'union insécable ni de U+2060 inséré) : les scripts d'émulateur et le
  banc visuel qui cherchent « Bien-être » ou « Noter moi-même » restent valides, et aucun glyphe absent de Figtree.
- Appliqué au titre du compte à rebours d'Analyses (`AnalysisCountdown`) et au titre de la carte lilas de l'Accueil
  (`PistesTeaser`).
- Tests : `keepWhole.test.jsx` (3) ; `Recommendations.test.jsx` cherche le titre par rôle `heading` et vérifie le span.

## Vérifications
- `npm run test` : 3 191 verts. `npm run lint` : 0 erreur. `npm run build` OK.
- `npm run visual -- --play --empty --dark --size=360x780 --routes=/recommendations,/` : « Vos pistes du / bien-être
  arrivent dans 5 jours », capture lue.

## Suite
- CD-ALPHA-6 vers 16:30 UTC ; fin de la période de lancement iPhone ce soir 23:00 UTC (rien à faire, relais déjà réglé) ;
  `until` Android à redécaler si l'invitation part après le 06/11 ; GOLD-a3-2 dès P37 ; TEST-ALPHA-1 (07–08/11) ;
  INSTALLS-21c-2 (08–09/11).
