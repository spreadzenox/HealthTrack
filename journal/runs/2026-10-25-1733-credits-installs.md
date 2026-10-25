
## Après le merge (#374, `8c7b7f8`)
- Sur la PR, le job émulateur API 35 a échoué une fois (« premier écran non affiché après 90 s », variante play) alors
  que la PR ne touche pas l'app ; relancé une fois → vert. Aléa de l'émulateur, à surveiller s'il revient.
- Main : Tests, Build & Release, Play — AAB, émulateur et **Relais — déploiement** verts ; release **v277** publiée
  (`HealthTrack-v277.apk`, 33 771 664 octets ≈ 33,8 Mo). Résumé du relais : Firestore 0 échec ; « Nouvelles
  installations : 0 sur 7 jours » (le compteur démarre à ce déploiement).
