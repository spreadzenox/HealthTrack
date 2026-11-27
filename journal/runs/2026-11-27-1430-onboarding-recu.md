# Run 27/11 14:30 — Accueil, temps 3 : ce qui est reçu, en une ligne

**Type** : 🔧 (reste de la refonte, code partagé) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) ·
**Android** : main a3f3cae (#1311) vert (Tests, émulateur A56, Play — AAB, Build & Release) · **TestFlight** :
1362.1362 chez « Testeurs Halcya » (inchangé) · **Parité** : 70 % (33/47), inchangée

## État de départ
- #1311 (correctifs de 12:30 et 13:30) déjà mergée (a3f3cae, 13:15 UTC), tous les workflows de main verts. Aucune
  PR « [Auto] » ouverte. Pas de nouvelle réponse du propriétaire.

## Fait
- **REFONTE-5b-2** : au temps 3 de l'accueil, quand l'accès Health Connect (ou Santé) est donné, « Ce que Halcya a
  trouvé » listait par thème (Activité, Sommeil, Corps) une grande ligne par mesure avec « reçu », qui répétait les
  tuiles du dessus (6 lignes sur données de démo, l'écran faisait deux hauteurs). Maintenant :
  - les mesures reçues sans réserve tiennent en une ligne « Bien reçu : pas, durée du sommeil, … » ;
  - les mesures « en partie » ou « pas partagée » gardent leur ligne avec la raison (couleur de leur thème), dans une
    liste « Ce que vos appareils ne donnent pas » ; « Pas mesuré par vos appareils : … » inchangé.
  - Choix : la proposition d'origine mettait le statut sur les tuiles ; les tuiles et les mesures n'ont pas les mêmes
    découpages (« Cœur » ≠ fréquence cardiaque, cœur au repos), d'où la ligne unique, plus sûre et aussi courte.
- Tests d'abord : `Onboarding.sources.test.jsx` (nouveau test rouge puis vert ; le test Samsung suit la nouvelle liste).
- Note de Nouveautés `2026-11-27-1430-onboarding-recu.json` (toutes variantes : même écran sur iPhone).

## Vérifications
- Tests ciblés (pages, `deviceCapabilities`, `monoMots3`) verts ; suite complète 460 fichiers verts (3 ignorés), 4 736 tests ; `npm run build` vert ; eslint sans erreur
  sur les fichiers touchés.
- Captures `--onboarding=auto-found`, clair et sombre, relues :
  `captures/2026-11-27-1430-onboarding-recu-{clair,dark}.png` (l'écran tient presque en une hauteur).
- iPhone : aucun correctif `iphone/patches/` sur `Onboarding.jsx`.

## CI économe
- PR ouverte **en brouillon** : le run de code suivant y ajoute son correctif et la passe en « prête », un seul
  build iPhone pour les deux.

## Suite proposée
1. Run de code suivant : un correctif de plus dans cette PR, la passer en « prête », regarder les captures iPhone de
   l'accueil (temps 3), merger.
2. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; run « idées » de 20:00 : personas.

## Pour le propriétaire
Rien de nouveau à faire. Toujours : recruter des testeurs (4 sur 12), PI2, P51 ; le 29 ou le 30/11, le message E.
