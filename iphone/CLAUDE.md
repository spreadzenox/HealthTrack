# iphone/ — la version iPhone de Halcya, dans le dépôt unique

Ce dossier est l'ancien dépôt `spreadzenox/HealthTrack-iOS`, importé tel quel (`fusion/importer.sh`). L'app (React +
Vite + Capacitor) vit dans `app/`, à la racine de ce dépôt ; ici se trouve tout ce qui est propre à l'iPhone.

- Lisez d'abord `README.md` (ce qui a changé avec le dépôt unique), puis `journal/README.md` (charte : § 3 la build,
  § 4 les versions, § 8 les actions du propriétaire), `journal/PARITE.md` et `journal/BACKLOG.md`.
- Toutes les commandes se lancent **depuis `iphone/`** : `scripts/upstream.sh` prépare `upstream/` (ignoré par git) à
  partir de `app/` au commit de `upstream.json`, avec `patches/`, `overlay/` et `ios/`. Rien n'est téléchargé.
- Une adaptation du code partagé reste, pour l'instant, un correctif dans `patches/` ou un fichier dans `overlay/`.
  Quand elle peut devenir du vrai code partagé dans `app/` (une condition sur la plateforme), c'est mieux : voir
  `README.md`, « Sort des correctifs ».
- Pas de Mac : ce qui compile, teste ou capture iOS passe par GitHub Actions (`.github/workflows/ios-*.yml`).
- Les workflows qui publient chez Apple sont derrière `fusion/bascule.json` et l'environnement `appstore` (main
  seulement). La build 844.344 de la version 844 est celle de la soumission du propriétaire : rien n'y touche.
- UI en français, au vouvoiement ; jamais de secret, de certificat ni de profil dans le dépôt ou les logs.
