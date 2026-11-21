# Run du 21/11 02:30 — Digestion : la taille d'un lien, au banc (METHODE-BIAIS-5, mesure)

**Type** : 🛠️ code (mesure au banc ; rien de livré dans l'app) · **Contrôle d'intégrité** : empreinte conforme
(dd430fbd…), origin/main c5cdad6 au départ.

## État de départ
- main vert (Tests, Build & Release, Play — AAB, émulateur) sur c5cdad6.
- PR « [Auto] » #1160 (METHODE-BIAIS-4, 2e partie) ouverte par le run de 01:30, tous les checks verts, build iOS sur
  simulateur compris (fini à 01:17 UTC) ; le run précédent n'avait pas eu le temps de la merger.
- iPhone : build du soir et envoi TestFlight (cron 21:20 UTC) pas encore partis à 01:35 UTC (retard habituel, vers
  01:50 UTC les nuits passées). Soumission bêta et expiration : au run qui suivra le traitement par Apple.
  Parité : 70 % (PARITE.md, inchangée).

## #1160 finie
- Capture iPhone d'Objectifs › Votre bien-être (abonné) regardée : rien d'anormal ; console sans erreur JS.
  Captures Android relues par le run de 01:30. Branche à jour sur main. **Mergée** (squash, 594b17b).

## Après le merge de #1160
- Build & Release et Tests verts sur 594b17b. **iOS — TestFlight** du soir parti sur 594b17b : succès (build envoyée ;
  soumission bêta au groupe externe et expiration au run qui suivra son traitement par Apple).
- **Play — AAB** rouge : Maven Central en 429 (Too Many Requests, kotlin-stdlib 2.2.0), panne passagère comme les
  19 et 20/11. Job relancé à 01:5x UTC.

## METHODE-BIAIS-5 : mesure (sondes jetables, non commitées)
Vérité exprimée sur l'échelle du confort (ventre 4,5 / 2,5 / 1) : pente retrouvée sur un journal brut de 1 500 jours.
30 jeux à 90 jours, taille montrée / vraie et fourchette juste :

| Effet planté | Série lissée (aujourd'hui) | Observation du jour |
|---|---|---|
| fibres, court terme, fort | 0,71 / 73 % | 0,99 / 97 % |
| fibres, court terme, moyen | 0,73 / 91 % | 1,01 / 91 % |
| sommeil, moyen terme | 0,76 / 75 % | 1,05 / 100 % |

Liens nets identiques (la ridge reste sur la série lissée). Sans aucun effet (40 jeux, court et moyen terme) :
45 jours, taille montrée médiane 0,36 → 0,48 pt, max 0,96 → 1,35, aucune ≥ 2 ; 70 jours 0,25 → 0,35, max 0,56 → 0,77 ;
faux liens 1/40 et 0/40 des deux côtés.

## Essai de correctif, retiré
- `observedSeries` : `digestion` = ventre et selles combinés selon leur précision (`OBS_SD.gut`, `OBS_SD.stool`).
  Test du banc écrit d'abord (rouge avant : 0,66 de la vraie taille), vert après.
- Mais `tourResults.test.js` : 4 tests rouges (« jour 28, une piste digestion (fructanes) »), comme au run de 01:30.
  La visite guidée plante un effet presque déterministe (soir d'oignon → douleur, sinon calme) : la taille montrée
  devient −4,04 pt, au-delà de `SCALE_SPAN` (4), donc `outOfScale` et plus nette. Sur cette échelle, une vraie
  différence ne dépasse pas 3,5 : c'est la pente linéaire multipliée par le « changement habituel » qui extrapole.
- Pas le temps de trancher proprement : code remis tel quel, mesures et pistes dans le BACKLOG.

## Suite
- METHODE-BIAIS-5 : régler le cas de la visite d'abord (borner la taille montrée de la digestion à l'étendue de
  l'échelle quand la ridge la dit nette, ou un changement habituel d'un facteur rare pris dans les jours observés),
  mesurer au banc, puis livrer l'observation du jour pour la digestion.

## Vérifications
- Seul le journal change. Tests ciblés lancés pendant l'essai ; aucun fichier de code modifié dans la PR.

## Pour le propriétaire
Rien à faire. Rien ne change dans l'app avec ce run ; #1160 (chiffres du bien-être) est mergée.
