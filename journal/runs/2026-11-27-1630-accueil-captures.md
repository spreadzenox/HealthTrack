# Run 27/11 16:30 — Accueil : les dernières captures (REFONTE-5b-3)

**Type** : 🔧 (refonte, étape 5b, code partagé) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) ·
**Android** : main cf3292d (#1312) : Tests, Play — AAB, Build & Release verts, émulateur A56 en cours au départ ·
**TestFlight** : 1362.1362 chez « Testeurs Halcya » (inchangé) · **Parité** : 70 % (33/47), inchangée

## État de départ
- #1312 (REFONTE-5b-2 et 5b-3 en partie) mergée par le run de 15:30. Aucune PR « [Auto] » ouverte, aucune
  « Build & Release » en cours. Pas de nouvelle réponse du propriétaire.

## Fait
- **REFONTE-5b-3, fin** : captures relues du temps 1 en sombre, de l'écran du visage en play (activé, clair et
  sombre), de l'écran « Gold offert » (période de lancement) et sans période (paywall), de la carte « Montre Huawei
  trouvée » (`--devices` : sans paquet Huawei la carte reste cachée, comme voulu par ACC-4 b), puis
  `npm run visual` complet (toutes les pages ok, aucune erreur JS).
- Seul défaut : l'écran « Gold offert » répétait « Gold » quatre fois (pastille « gold », titre, texte, carte).
  **POLISH-GOLD-REDIT** : la pastille part (`Onboarding.jsx`, règle CSS devenue inutile retirée de `Onboarding.css`).
  La pastille de la page Premium, dans `section.paywall`, n'est pas touchée.
- Test d'abord : `Onboarding.face.test.jsx` (rouge, puis vert).
- Note de Nouveautés `2026-11-27-1630-gold-sans-pastille.json` (`"variants": ["play"]` : la période de lancement
  n'existe que sur Google Play).

## Vérifications
- `npm run test` : 461 fichiers verts (3 ignorés), 4 739 tests ; `npm run build` vert ; eslint sans erreur sur les
  fichiers touchés ; `npm run visual` complet sorti à 0.
- Captures : `captures/2026-11-27-1630-gold-sans-pastille{,-dark}.png`, `-accueil-huawei.png`,
  `-accueil-temps1-dark.png`, `-accueil-visage-play.png`.
- iPhone : aucun correctif `iphone/patches/` sur l'accueil ; la période de lancement iPhone est finie depuis le 06/11,
  l'écran Gold n'y apparaît pas.

## CI économe
- PR ouverte **en brouillon** : le run de code suivant y ajoute son correctif et la passe en « prête » (un seul build
  iPhone pour les deux).

## Suite proposée
1. Run de code suivant : un correctif de plus dans cette PR, la passer en « prête », regarder les captures iPhone,
   merger.
2. REFONTE-5b-4 (activité à la main sans montre) attend une étape de Ma journée ou une décision du propriétaire.
3. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; run « idées » de 20:00 : personas.

## Pour le propriétaire
Rien de nouveau à faire. Toujours : recruter des testeurs (4 sur 12), PI2, P51 ; le 29 ou le 30/11, le message E.
