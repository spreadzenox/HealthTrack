
## Après le merge (#699, `b481d9e`)
- Checks de la PR tous verts (Vitest, Build APK, relais, émulateurs API 28/32/34/35/36).
- Build & Release **v498** (APK 34 539 795 octets), Play — AAB (test interne **100782**), Site — GitHub Pages
  (politique de confidentialité du 4 novembre en ligne) et Tests verts.
- « Play — fiche du Store » **annulé** sans job : déclenché par `app/store/**` (seules les réponses Sécurité des
  données changeaient, pas la fiche), son exécution en attente a été remplacée dans le groupe `play-edits` par les
  envois Alpha. Rien à refaire.
