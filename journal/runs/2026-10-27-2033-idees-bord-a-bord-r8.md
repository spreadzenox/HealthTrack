# Run du 27/10/2026 20:33 (Paris, CET) — idées : bord à bord et R8 prêts à coder

**Type** : 💡 run « idées » (20 h), sans code produit.

## Constat au démarrage
- Main à `a6d9dc5` (#442) ; aucune PR « [Auto] » ouverte ; liste POL-PLAY 1–8 soldée par le run de 19:33.

## Fait
- Préparé les deux remarques « Pour votre prochaine version » de la Play Console du 27/10 (`IDEES.md` I184, I185) :
  - **Bord à bord** : aucun appel déprécié dans notre code, Capacitor 8.2.0 ni les plugins (`grep`) ; l'app n'est bord à
    bord que sur Android 15+ (imposé par targetSdk 36) ; correctif `EdgeToEdge.enable(this)` avant `super.onCreate` ;
    encarts déjà fournis en CSS par le plugin `SystemBars` de Capacitor ; vérification à ajouter sur un émulateur API 30/34.
  - **R8** : seul `release` est concerné et seule la variante play est construite en release (sideload en debug) ;
    `proguard-android.txt` contient `-dontoptimize` → `proguard-android-optimize.txt` ; les règles consumer de
    `@capacitor/android` gardent tous les plugins ; pas de réflexion chez nous ; bibliothèques JNI à surveiller (ONNX,
    LiteRT) ; `mapping.txt` à envoyer par `edits…/deobfuscationFiles/proguard` ; preuve sur APK play release à l'émulateur.
- BACKLOG : POL-PLAY-9 (bord à bord), 10 (R8a), 11 (R8b/c), 12 (audit écran par écran déjà prévu).
- Pas de SDK Android dans la session : rien n'a été construit ; tout est à vérifier par la CI.

## Sources
- https://capgo.app/blog/google-play-obfuscation-capacitor-android/ (seuil 25 %, février 2027, réglages) — tiers.
- Fils AppMySite, Solar2D, Flutter #169810 (texte de l'avertissement et `EdgeToEdge.enable()`) — tiers.

## Suite
- Prochain run de code : POL-PLAY-9 (petit), puis POL-PLAY-12 (audit), puis POL-PLAY-10 (R8a, PR non mergée sans le job
  émulateur release vert).
