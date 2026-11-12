# Run 2026-11-12 16:35 (Paris) — Missions navigateur du propriétaire

## Pourquoi

Décision du propriétaire du 12/11 vers 16:15 (« à chaque fois que quelque chose doit être fait humainement via un
browser il faut absoluement trouver un moyen de l'automatiser […] ») : au premier run qui la lit, étape de journal sans
code produit — classer chaque action ouverte du § 4 en (a) CI / API, (b) mission navigateur, (c) geste du propriétaire.

## Ce qui a été fait

- `PRODUIT.md` : décision en tête du § 4 (mots exacts) ; § 4.0, tableau de classement des actions ouvertes ; ligne
  au § 1 et à l'historique.
- `journal/missions/` : README (comment lancer, règles, format, index) et 12 missions : P43, P46, P39, P29, P34, P45,
  ETAT-PLAY (nouvelle, remplace « vérifiez de temps en temps » de P42), P48, P30, P32, P15, P2. Celles qui touchent un
  geste (c) s'arrêtent avant le bouton final.
- Charte (`README.md`) : règle « gestes du propriétaire automatisés » et ligne `missions/` dans la table des fichiers.
- `POUR-IOS.md` : « Décision du propriétaire (12/11 vers 16:15) » relayée, avec la consigne de classement pour
  App Store Connect et TestFlight.
- `BACKLOG.md` : AUTO-GESTES-1 (fait) à 4.

## Choix

- Geste unique → (b) plutôt que (a) quand (a) donnerait à `gh-deployer` un droit large (serviceUsageAdmin pour P43,
  datastore.indexAdmin pour les TTL, IAM pour P29). Geste récurrent → (a) dès qu'une API existe (aucune pour les
  commentaires du test fermé ni pour l'état d'examen : P45 et ETAT-PLAY restent (b)).
- P37 et P1 se font sur le téléphone : ni (a) ni (b). P41 non rappelée (consigne).
- Les URL de la Play Console partent de https://play.google.com/console (l'identifiant du compte développeur n'est
  pas dans le dépôt).

## Vérifications

Journal seul (aucun fichier de `app/` touché) ; une PR « [Auto] » (#939) d'un autre run était ouverte : pas de fichier
de code en commun. Checks de la PR attendus verts avant merge.

## Suite proposée

Quand le propriétaire renvoie « P43 fait » : vérifier au bilan de « Play — AAB » que les vitals se lisent (VITALS-1).
Relevé P45 : ranger dans `RETOURS-TESTEURS.md`. AUTO-GESTES-3 à chaque nouvelle action.
