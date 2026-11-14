# Run 14/11 08:35 — Deux personas (Ventre sans technique J14, Sportif J1) ; Garmin : clé personnelle écartée

**Type** : idées (aucun code produit)  ·  **Android** : v1040 sur main au début, v1041 après le merge de #963  ·
**TestFlight** : 1030.1031 chez les testeurs externes (depuis le 14/11 à 00:33) ; aucune soumission bêta avant la
nuit prochaine ; 844.344 intacte  ·  **Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme.
- Main b9db9de (#962, v1040) : Build & Release, Tests, Play — AAB et émulateur A56 verts. « Play — Alpha » de la nuit
  vert (parti le 14/11 à 03:41).
- PR #963 du run de 07:35 ouverte (iPhone, « Variabilité cardiaque » tout court ; code embarqué v1040) : il ne
  lui manquait que « Build iOS (simulateur) et captures ».
  #51 (`cursor/*`) non touchée.

## Fait
0. **PR #963 finie et mergée** (a0fe1d1, priorité (b)) : build iOS verte, branche à jour ; captures iPhone
   regardées sur `captures/pr-963` : « Variabilité cardiaque · hier » sur une ligne sur
   [Aujourd'hui](captures/2026-11-14-0835-iphone-accueil.png), sur deux dans la tuile du
   [Journal](captures/2026-11-14-0835-iphone-journal.png) (trois avant), Tendances sans erreur.
1. **Deux simulations de personas** (tirage au sort ; agents à accès visuel seul) :
   [Ventre, sans technique · J14 · iPhone + Apple Watch](../simulations/2026-11-14-0835-ventre-sans-technique-J14.md)
   et [Sportif · J1 · téléphone + balance](../simulations/2026-11-14-0835-sportif-J1.md) ;
   [synthèse](../simulations/2026-11-14-0835-synthese.md). Captures clés regardées par moi (Tendances « Poids »
   disparu, « Autre chose », Analyses › Digestion au 14e jour, fiche d'un jour). Au BACKLOG : POLISH-SIM-81 à 90,
   PROP-SIM-17 et 18.
2. **Outil des personas** (`app/scripts/persona/`, pas de code produit) : matériels `apple-watch` (POLISH-SIM-79) et
   `phone-scale` (config 5, jamais jouée) ; accord de l'analyse par l'IA posé pour une persona qui note ses repas
   depuis des jours (POLISH-SIM-78 : c'était l'outil, pas l'app).
3. **Intégrations, INTEG-1a** : documentation du niveau personnel de Garmin lue (page du programme, page et FAQ du
   niveau personnel, client d'exemple officiel). Garmin réserve la clé personnelle à l'usage individuel (« not
   intended for commercial applications serving multiple end users ») et demande de la garder comme un mot de
   passe : **voie écartée pour l'app vendue**. `protocoles/garmin-samsung.md` (§ 3 et ordre § 4), PRODUIT § 0 (B) et
   BACKLOG mis à jour.

## Vérifs
- `npx vitest run scripts/persona` : 21 verts (2 nouveaux, vus rouges avant le code). `npx eslint scripts/persona` : rien.
- `npm run test` : 3528 verts, 44 ignorés. `npm run build` et `npm run visual` non relancés : `app/src` inchangé (checks de la PR).
- Aucune entrée de Nouveautés : rien de visible dans l'app.

## Limites
- Les deux simulations ont tourné avant le correctif de l'accord IA (serveurs déjà lancés) ; aucune des deux ne l'a
  relevé.
- Config 5 : les pesées de la démo viennent de la carte Withings directe, absente de la variante play ; le constat
  « Sources ne cite pas le poids » est un artefact à rejouer (POLISH-SIM-89).
- Constats « à vérifier » non rejoués dans l'app par moi : POLISH-SIM-83, 85, 87, 88. POLISH-SIM-80 toujours à vérifier.
- Garmin : conditions acceptées à la création de la clé et documentation Swagger non lues (derrière la connexion).
- Charte, PRODUIT, BACKLOG, PARITE et journal iPhone lus par sections, pas en entier (plus de 1 Mo).
- Numéros des builds TestFlight des codes v1034 à v1037 non relevés.

## Suite
- Vérifier « iOS — TestFlight » et « iOS — build simulateur » de a0fe1d1 (#963) sur main.
- Run de code suivant : POLISH-SIM-81 (bug Tendances « Poids »), puis 82, 90, 86.
- Maquettes de PROP-SIM-17 (bilan digestif simple) et PROP-SIM-18 à un prochain run « idées ».
- POLISH-SIM-72-iOS-c ; fin de POLISH-SIM-69 ; FUSION-2 ; POLISH-SIM-71b ; CYCLE-3a-2.
- Nuit prochaine, après l'Alpha de 23:45 : soumettre la dernière build TestFlight traitée, puis expirer les anciennes.
