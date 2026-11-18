# Run 17/11 20:30 — idées : rituel du soir, lanternes du défi et poses du widget découpés (LANT-1 à 4)

**Type** : idées (20h, sans code produit)  ·  **Android** : main vert sur 0bc5c27 (Tests, émulateur A56 ; Build & Release
v789 sur 93f4a47) ; **GitHub Actions toujours bloqué** (facturation du compte)  ·  **TestFlight** : inchangé chez
« Testeurs Halcya » (1148.1148)  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions conforme (4fa797bd…), les quatre fichiers lus en entier. 20:30 heure de Paris : run « idées ».
- PR ouvertes : #1090 (MONDE-4a, îlot voisin et mare, vérifiée en local au run de 19:30), #1091 (journal de 19:30,
  blocage de la facturation), #51 (cursor, pas à nous).
- **Sonde** : relance des jobs échoués de « Tests » sur la branche de #1091 (run 44149741934, tentative 2) : refusée
  vers 19:32 UTC avec la même annotation, « The job was not started because your account is locked due to a billing
  issue ». Le blocage dure : rien ne peut être mergé ; pas d'envoi Alpha ce soir ni de build TestFlight.
- Ce journal s'ajoute à la branche de #1091 (même PR « journal » à merger après #1090), pour ne pas ouvrir une PR de plus
  qui ne pourrait pas non plus passer ses checks.

## Idées : la suite de la refonte après MONDE-4b
- `journal/maquettes/compagnon/DECOUPAGE-RITUEL-LANTERNES.md` : inventaire écrit / branché / absent du rituel du soir,
  des lanternes du défi, de la bouillotte, du calme du soir et des poses du widget ; découpage en 5 runs de code
  (LANT-1 lanternes sur la page du défi, LANT-2 Pilou sur la page du défi et au bilan, LANT-3 lanterne du matin sur
  l'îlot, LANT-4 rituel du soir pour une piste d'écran, WIDGET-POSES depuis `companion/pilou/`), avec tests rouges,
  captures et risques.
- **Écart SPEC / décision trouvé en lisant** : la SPEC (comprendre § 7) compte « 5 soirs réussis en 10 jours » sur une
  seule piste ; le propriétaire a gardé le tirage au sort le 15/11 (10 jours, 5 avec et 5 sans, `services/trials.js`).
  Proposition : 5 lanternes = les 5 jours « avec », allumées quand le jour est tenu ; le rituel du soir seulement pour
  une piste d'écran. Pas de nouvelle question au propriétaire : c'est l'application de sa décision.
- Question qui restera à trancher avant LANT-4 : rituel en 2D dans une feuille (proposé) ou en 3D sur l'île (tiroir
  mesuré à 61 200 triangles au prototype, cible 25 000).
- Vérifié : aucun correctif `iphone/patches/` ne touche `services/trials.js`, `pages/Trial.jsx` ni `companion/`.

## Vérifications
- Journal seul. Les checks ne peuvent pas tourner tant que le compte GitHub est bloqué.
- iphone/journal/PARITE.md et BACKLOG.md : rien à changer (aucune fonction livrée, tout le découpage est en code partagé).

## Suite
- Dès que les jobs démarrent (mission P50) : relancer les checks de #1090, la merger après la build iPhone simulateur
  et les captures de l'Accueil, puis #1091 (journaux de 19:30 et 20:30).
- Run de code suivant : MONDE-4b (petit arbre, nouvelle dite une fois, image fixe du palier bas), puis LANT-1.
