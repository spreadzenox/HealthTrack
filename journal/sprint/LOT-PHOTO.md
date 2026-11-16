# Lot PHOTO — étape 15 du brief (double numérique b, la photo)

Équipier du sprint du 16/11 (consignes : `journal/sprint/SPRINT.md` de la branche de l'orchestrateur). Branches
`claude/sprint-photo-<n>`, PR « [Sprint PHOTO] … ».

## Où j'en suis
- 16/11 20:40 — lecture des règles, du brief, de PILOU-DOUBLE.md et de specs/double.SPEC.md. Branche
  `claude/sprint-photo-1` ouverte depuis origin/main.
- 16/11 21:05 — **relais fait** (PR #1047) : `relay/src/pilou.js`, route éteinte par défaut, 17 tests.
- 16/11 21:50 — **app faite** (branche `claude/sprint-photo-2`) : `app/src/companion/photo/` (interrupteur,
  fiche, selfie en mémoire, envoi unique, parcours en 6 écrans), route `/pilou/photo` enregistrée seulement si
  `VITE_PILOU_PHOTO=on` ; 22 tests. **Missions P49 (Google Play) et PI3 (App Store)** préparées dans
  `journal/missions/`, qui s'arrêtent avant le bouton d'envoi (politique de confidentialité et PLAY-CONFORMITE.md :
  textes prêts dans P49, à publier par la routine le jour de l'allumage, pas avant).
- Captures (interrupteur allumé localement, réponse du relais simulée, caméra factice de Chromium) :
  `journal/runs/captures/2026-11-16-sprint-photo-{light,dark}-{1-proposition,2-information,3-camera,4-traits}.png`.

## Plan
1. **Relais** (`relay/src/pilou.js`, route `POST /v1/pilou/style`) : schéma imposé (PILOU-DOUBLE.md § 4), consigne
   fixe, température 0, Flash-Lite seulement, corps jamais journalisé, photo JPEG sans métadonnées, réponse validée
   contre le schéma (valeur inconnue → défaut + champ dans `incertains`), plafond de 3 par mois et par installation,
   réponse `503 disabled` tant que `PILOU_STYLE=on` n'est pas réglé sur le service (je ne l'allume pas).
2. **App** (`app/src/companion/photo/`) : interrupteur de build `VITE_PILOU_PHOTO` éteint par défaut dans toutes les
   variantes (testé : aucun écran, aucune autorisation, aucun appel réseau) ; information puis consentement séparés,
   caméra avant en mémoire, réduction à 512 px sans métadonnées, un envoi, effacement à la réponse ou après 30 s,
   traits incertains « À vérifier », fiche au schéma de PILOU-DOUBLE.md remise au lot STUDIO.
3. **Déclarations préparées** (rien d'envoyé) : missions dans `journal/missions/` pour la Sécurité des données
   Google Play, les étiquettes de confidentialité de l'App Store, la politique de confidentialité et
   PLAY-CONFORMITE.md.

## Ce que j'attends des autres lots
- STUDIO : où vit la fiche (clé de stockage ou fonction d'enregistrement) et l'événement de bus « fiche de traits
  changée ». En attendant, le lot PHOTO rend une fiche normalisée et l'émet sur le bus quand le contrat sera là.

## Pour l'intégrateur (BACKLOG, PRODUIT, PARITE)
- **Rien de visible** pour les testeurs : interrupteur de build éteint dans play, sideload et appstore (testé), route
  du relais éteinte (`503 disabled`, testé ; `relay-deploy.yml` ne règle pas `PILOU_STYLE`). Pas de note de
  Nouveautés tant que c'est éteint.
- **PARITE.md** : même code sur iPhone (caméra avant par `getUserMedia` dans la WebView, déjà autorisée pour la
  lecture du visage). À vérifier au premier allumage sur un iPhone réel : l'aperçu `<video playsinline>`.
- **Allumage** (après « P49 fait » et « PI3 fait » du propriétaire, jamais avant) : `PILOU_STYLE=on` dans
  `relay-deploy.yml`, `VITE_PILOU_PHOTO=on` dans les builds, textes de P49 parties 3 et 4 publiés, `why` de
  `PSL_PHOTOS` mis à jour, note de Nouveautés.
- **Reste à brancher** (dépend du lot STUDIO) : `PilouPhotoPage` envoie aujourd'hui la fiche vers `/settings` (état
  de navigation) ; à remplacer par `saveFiche()` de `companion/studio/fiche.js` puis la route du Studio, et une
  entrée « Prendre une photo » dans Réglages › Pilou et après le nom à l'onboarding (lot VIE). Plafond du relais en
  mémoire (repart à zéro au redémarrage de l'instance ; l'app tient aussi le sien, et les plafonds globaux bornent le
  coût).

## PR
- #1047 « [Sprint PHOTO] Relais : route POST /v1/pilou/style, éteinte par défaut »
- (à venir) « [Sprint PHOTO] App : parcours photo du double numérique, derrière un interrupteur éteint »
