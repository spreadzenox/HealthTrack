# Run 15/11 11:35 — Refonte « Compagnon », étape 5b sur iPhone (code embarqué v1085)

**Type** : code (suivi iPhone de l'étape 5b, REFONTE-5b-iOS)  ·  **Android** : main aca48cc (#1009, v1085) au début  ·
**TestFlight** : voir « Fin de run »  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions vérifiée : conforme (710f9e8b…). Les quatre fichiers d'instructions, le brief de la
  refonte, `iphone/README.md` et le compte rendu de 10:35 lus en entier.
- Main aca48cc : Tests, Build & Release et Play — AAB verts ; émulateur en cours au début du run.
- Aucune PR « [Auto] » ouverte (#1009 mergée à 11:27). #51 non touchée.
- La branche `claude/iphone-code-5b` annoncée par le run de 10:35 **n'existe pas sur le dépôt** (jamais poussée) :
  le suivi a été refait ici depuis main.

## Fait
1. **#1011 — iPhone : code embarqué v1085** (branche `claude/iphone-code-5b-1135`) :
   - `iphone/upstream.json` : v1083 → v1085 (aca48cc) par `scripts/upstream.sh --latest` ;
   - **correctif 23** refait : la carte « copie de secours trouvée » (`SnapshotWelcome`) s'affiche au premier écran,
     avant la carte d'ouverture (`{step === 'intro' …}`) ;
   - **correctif 55** refait : avant iOS 26.4, pas de ligne « Temps d'écran » au temps 2 (« Sur ce téléphone ») ;
   - les 49 autres correctifs s'appliquent sans retouche (45 et 52 compris) ;
   - plan de captures (`overlay/app/src/ios/captureMode.js`) au parcours 3 : `vierge-onboarding-objectifs` (confort
     digestif coché, à la place de la 2e carte du tuto, qui n'existe plus), `-montre` (« Oui »), `-montre-non`,
     `-suivi`, `-notes`, `-visage` ;
   - `Onboarding.appstore.test.jsx` : « Connecter Santé », l'iPhone et 6 mois, l'accord pour le temps d'écran et
     l'absence de ligne avant iOS 26.4 se vérifient au temps 2, à « Oui ».
2. **Étape 6 préparée** pendant la build macOS, sans code :
   [`ETAPE-6-OBJECTIFS.md`](../maquettes/compagnon-etapes/ETAPE-6-OBJECTIFS.md) : ce que montrent aujourd'hui
   Objectifs, Agir et l'essai ; les facteurs du moteur par thème ; les 6 endroits qui lisent les seuils 14 et 28 ;
   deux lectures de « 7 jours » (le score seul, ou aussi les liens) à départager par le banc des nulles à n = 7 et
   14 ; découpage en 6a à 6e. Rien n'y a été essayé dans l'app.
3. Journal : résumé, les deux `BACKLOG.md`, `PARITE.md`, `PRODUIT.md`.

## Vérifs
- `iphone/scripts/upstream.sh` : « upstream/ prêt : v1085, 51 correctif(s) ».
- Suite complète de la variante iPhone, **avant** les retouches des tests : 4012 verts, 3 rouges (les 3 cas de
  `Onboarding.appstore.test.jsx` écrits pour l'ancien écran « sources »). Après retouche : `src/ios` et
  `src/pages/Onboarding*` 255 verts ; lint propre sur les 4 fichiers touchés. La suite complète n'a pas été relancée
  en local après la retouche : c'est le job « Tests d'Android avec les correctifs iOS » de la PR qui le fait.
- Aucun changement dans `app/` : rien à capturer côté Android.

## Limites
- Sur un iPhone d'avant iOS 26.4, la tuile « Temps d'écran » du temps 3 s'affiche quand même (même limite que sur
  Android, notée à 10:35) : le correctif 55 ne retire que la ligne du temps 2.
- La carte Huawei et l'écran Gold de l'accueil ne sont pas capturés sur iPhone.
- Non relus en entier : la charte, `PRODUIT.md`, `DESIGN.md`, `INFRA.md`, les deux `BACKLOG.md`, `PARITE.md`,
  `iphone/journal/README.md` (§ 3, 4 et 8).
- Pas de simulation de personas à ce run.

## Suite
- REFONTE-6 (Objectifs : score et tendance, 3 familles, piste en défi, seuils 7 et 14 jours).
- REFONTE-5b-2, 5b-3, 5b-4 (restes de l'accueil).

## Fin de run (vers 12:45)
- **#1011 mergée** (0d79999, vers 12:40) : 15 checks verts sur ef1fa29, build iOS sur simulateur verte.
- **Captures regardées** (branche `captures/pr-1011`, iPhone 17 Pro, clair) : temps 1 (Bien-être « Toujours
  suivi », Confort digestif « Ajouté »), temps 2 à « Oui » (carte « Santé », « votre iPhone et votre montre »,
  « vos 6 derniers mois », « Connecter Santé ») et à « Non » (« relier Santé dans Réglages › Sources »), temps 3
  (9 tuiles), temps 4 (repas, bien-être, digestion, 4 habitudes, Méditation cochée) ; carte de restauration
  au-dessus de l'ouverture (sombre) ; ouverture sur iPhone 16e. Non regardés : l'écran du visage, le grand texte,
  les 4 temps en sombre et sur iPhone 16e.
- **Défaut de l'outil de captures, pas de l'app** : sur iPhone 17 Pro, `vierge-onboarding.png` est le même fichier
  que `vierge-onboarding-objectifs.png` (même empreinte git) ; sur iPhone 16e, la première capture montre bien la
  carte d'ouverture. Cause non cherchée (IOS-CAPTURES-1 au backlog iPhone).
- Sur simulateur, pas de ligne « Temps d'écran » au temps 2 (seule « Météo » sous « Sur ce téléphone ») alors que la
  tuile « Temps d'écran » s'affiche au temps 3 : la limite notée plus haut se voit.
- **Build macOS relancée deux fois par mes pushs de journal** (le filtre de chemins porte sur toute la PR) : merge
  retardé d'environ 6 minutes, deux builds annulées. Noté dans `iphone/journal/BACKLOG.md`.
- « Publier l'APK » rouge sur e0b70bf : run annulé par le push suivant, artefact absent ; dit une fois sur la PR.
- TestFlight, relevé de 11:39 : « en test 1072.1073 ; refusées aucune ; en attente aucune ». Arrivée de la build du
  code v1085 non vérifiée.
- Ce run a dépassé les 50 minutes visées (attente de la build macOS).
