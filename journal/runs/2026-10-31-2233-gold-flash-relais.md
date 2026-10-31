
## Après le merge (#579)
- Les 9 checks de la PR étaient verts (Vitest, Build APK, relais, Java, émulateurs…).
- Sur main (`334cda4`) : Tests, Build & Release, Play — AAB et **Relais — déploiement** verts. La release **v415** est
  publiée (APK de 34 523 698 octets). Le relais est redéployé avec les variables `GOLD_*` ; l'analyse de test du
  workflow a réussi (installation neuve, donc gratuite, sur Flash-Lite). Une première analyse Gold réelle reste à
  lire dans les journaux (GOLD-a2).
