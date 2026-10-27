# Run du 27/10/2026 21:33 (Paris, CET) — polissage play : POL-PLAY-9 (bord à bord pour tous)

**Type** : 🎨 polissage de la version play (remarque Play Console du 27/10 « Pour votre prochaine version » ②)

## Constat au démarrage
- Main à `a4cc2a4` (#443), workflows verts ; aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).

## Fait
- `MainActivity` : `EdgeToEdge.enable(this)` avant `super.onCreate` ; dépendance explicite `androidx.activity` (1.9.2).
- **Correction du plan I184** : le plugin `SystemBars` de Capacitor 8 n'injecte `--safe-area-inset-*` **qu'à partir
  d'Android 15** (garde `VANILLA_ICE_CREAM` dans `SystemBars.java`). Activer le bord à bord seul aurait mis l'en-tête
  sous la barre d'état et laissé le clavier couvrir les champs sous Android 8–14. Notre `SystemBarsPlugin` (qui
  remplace celui de Capacitor sous le même nom, après son `load()`) reprend donc ce rôle **sous Android 14 et avant
  seulement** : écouteur d'encarts sur le conteneur de la WebView → variables CSS (barres système + encoche), clavier
  ouvert → marge basse de sa hauteur et encart bas à 0 ; encarts consommés (pas de double compte par `env()`) ;
  réinjection à chaque page affichée. Android 15+ : rien ne change.
- CI : nouveau job « Bord à bord sous Android 14 (API 34) » dans le workflow émulateur
  (`.github/scripts/edge-insets/check.mjs`) : lit les variables par le protocole DevTools, échoue si l'encart haut
  < 20 px ou bas < 16 px ; touche le premier champ de saisie s'il y en a un et vérifie (avertissement seulement) que
  la page rétrécit. Captures dans l'artefact `edge-insets-api34`.

## Vérifications
- Pas de SDK Android dans la session : compilation Java et rendu vérifiés par la CI de la PR (Build APK, émulateurs
  API 34/35/36).
- Web inchangé : voir la PR pour `npm run test` / `build` / `lint`.

## Suite
- POL-PLAY-12 (audit écran par écran `--play --empty` puis démo), puis POL-PLAY-10 (R8a).
