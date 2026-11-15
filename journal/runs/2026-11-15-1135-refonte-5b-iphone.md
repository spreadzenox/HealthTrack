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
2. Journal : résumé, les deux `BACKLOG.md`, `PARITE.md`, `PRODUIT.md`.

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
