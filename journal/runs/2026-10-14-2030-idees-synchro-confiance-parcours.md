# 2026-10-14 20:30 Paris (18:30 UTC) — Idées : pièges de synchro, Analyses lisibles, un parcours par jour

**Type** : 💡⌚ (run « idées »)  ·  **PR** : journal seul, pas de code produit

## Pourquoi
- Démarrage : main à `ee32071` (#159), **v128 publiée** (Build & Release, Tests et émulateur A56 verts). Aucune PR
  « [Auto] » rouge ou en conflit : la seule PR ouverte est `cursor/*` #51, hors routine, et je n'y ai pas touché.
- Le run de 20:30 est un run « idées ». Aucun nouveau journal du propriétaire depuis v124. La part montre de la
  recherche a donc porté sur **ce qui peut empêcher les mesures d'arriver** une fois la montre associée, et sur
  l'arrière-plan.

## Ce qui a été fait
- Recherche en 3 volets parallèles : montre et arrière-plan, ML embarqué et licences, besoins et marché. Codeberg
  répond 429 sur le web mais son API REST fonctionne. J'ai vérifié moi-même la PR 6448 via cette API.
- **Montre** (`protocoles/huawei.md` §7.10, nouveau) :
  - compte Huawei **non requis** pour une montre jamais liée (#6271) ;
  - séances automatiques : lire chaque bloc selon sa longueur (#5784) ;
  - canal RFCOMM auxiliaire, propre aux Watch 3 / 4 / 5 (#6448), qui devient la piste si 0x2C expire ;
  - stress et VFC dépendent du modèle ;
  - remède en cas de clé remplacée (#6978) ;
  - présence compagnon (API 36).
- J'ai vérifié dans le code que `normalizeAccountId` accepte bien 15 à 20 chiffres. Seul le texte « 17 à 19 » de
  l'assistant est à corriger.
- **Idées** (`IDEES.md`, 6 nouvelles, I69–I74) :
  - I69 synchro qui dit où elle cale (25) ;
  - I70 force et confiance séparées (20) ;
  - I73 visage sans poids AffectNet (16) ;
  - I71 un seul parcours par jour (15) ;
  - I72 arrière-plan par présence de la montre (15) ;
  - I74 phrase du soir à la voix, tags toujours confirmés (12).
- **Idée écartée** : Huawei Santé et HealthTrack connectés en même temps, impossible côté montre (#6010).
- **Constat** : HealthTrack corrige déjà les comparaisons multiples (Benjamini-Hochberg), l'autocorrélation
  (`effectiveSampleSize`) et les décalages. Exist et Bearable ne le font pas. Ce point fort reste à rendre lisible (I70).
- **Backlog** : n°2 (I69 en attendant le journal), n°3 (I72), n°12 (nouvelles idées), n°13 (sujets du prochain run idées).
- **Résumé hebdo** : paragraphe pour le propriétaire, 3 meilleures idées, ligne de run ; la ligne du run 18:30 est
  passée à « #159 → v128 ».
- Pas d'entrée « Nouveautés », car rien ne change dans l'app.

## Vérifications
- Tests : **1195 ✅** (92 fichiers) · Build ✅ · Lint : **6 erreurs** (baseline inchangée).
- `npm run visual` : toutes les pages OK, aucune erreur JS. J'ai relu les captures `dashboard-1` et `connectors-1` :
  elles sont inchangées, aucun code produit n'a été modifié.

## Apprentissages / décisions
- Licence (D4) : AffectNet interdit l'usage commercial et les poids HSEmotion n'ont pas de licence propre. Aucun poids
  issu d'AffectNet n'ira donc dans l'APK : on utilisera les blendshapes MediaPipe et des règles maison.
- Android 14+ : un service caméra ou micro ne peut pas être créé depuis l'arrière-plan, exemptions comprises (doc du
  01/10/2026). Le diagnostic D4 testera `appops`, mais le service se lancera depuis l'app ou d'un tap sur sa notification.
- Sites inaccessibles : reddit.com, LinkedIn, Codeberg en lecture web (API OK), whdeng.cn, PyPI emotiefflib, une page
  d'exist.io.

## Suite proposée
1. ⌚ Lire le journal v125+ dès qu'il arrive.
2. ⌚ En attendant, coder I69 : journal de synchro par service, séances tolérantes, texte du plan B.
3. ⚡ D2 suite (`WellbeingCharts` par agrégats), puis 🧹 D1 avec I65, puis 🔁 D5 avec I70.
