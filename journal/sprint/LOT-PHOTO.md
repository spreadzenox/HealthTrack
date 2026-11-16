# Lot PHOTO — étape 15 du brief (double numérique b, la photo)

Équipier du sprint du 16/11 (consignes : `journal/sprint/SPRINT.md` de la branche de l'orchestrateur). Branches
`claude/sprint-photo-<n>`, PR « [Sprint PHOTO] … ».

## Où j'en suis
- 16/11 20:40 — lecture des règles, du brief, de PILOU-DOUBLE.md et de specs/double.SPEC.md. Branche
  `claude/sprint-photo-1` ouverte depuis origin/main.

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

## PR
- (aucune encore)
