# Run 23/11 22:30 — #1222 mergée ; POLISH-SIM-151 (« Poids : la courbe arrive à 3 pesées »)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 25a21be (#1222),
release v891 attendue · **TestFlight** : 1268.1268 validée pour « Testeurs Halcya » (relevé de 07:33 UTC), 1244.1244
attachée à la version 893 ; build du soir pas encore partie à 22:30 · **Parité** : 70 % (33/47), 2 correctifs iPhone
restent (01, 27)

## État de départ
- main vert sur 65bc366 (#1223) : Tests et émulateur verts.
- PR de la routine ouverte : **#1222** (prête, à jour sur main), 15 checks verts dont « Build iOS (simulateur) et
  captures » (fini à 21:24 UTC). #51 (`cursor/*`) pas touchée.

## #1222 : mergée (squash, 25a21be)
- Captures `captures/pr-1222` (build 1290.1290) relues : `iphone-16e-vierge-onboarding-suivi.png` montre
  « Activables dans Réglages de l’app › Sources : météo. », `…-onboarding-montre-non.png` « vos sources se gèrent dans
  Réglages de l’app › Sources. », en texte, sans emoji. `…-recommendations-bien-etre.png` sans changement de mise en
  page. Message de merge écrit à la main, sans ligne d'attribution.

## POLISH-SIM-151 (branche `claude/polish-sim-151-poids`)
- Constat des personas (J14) : « Poids » de l'Accueil fait un lien vers `/tendances?mesure=weight` dès une pesée,
  mais Tendances ne trace le poids qu'à 3 pesées dans le mois : la page s'ouvrait sur « Choisissez une courbe » ou
  sur le message général, sans un mot sur le poids.
- Choix : garder le lien (la personne apprend quelque chose en touchant) et faire dire à Tendances quand la courbe
  arrive. `TrendsViewer.jsx` : une mesure demandée qui n'a de courbe ni en Semaine ni en Mois s'affiche en tête
  (« Poids : la courbe arrive à 3 pesées. » ; les autres mesures : « … après 3 jours de mesures. »), au-dessus des
  courbes à choisir, ou à la place du message général quand il n'y en a aucune. Rien ne change dès qu'elle a sa
  courbe (en Mois seulement : la puce grisée de POLISH-SIM-81b reste).
- Test d'abord (`Trends.test.jsx`, 3 cas : deux pesées avec d'autres courbes, une seule pesée, trois pesées) : rouge
  puis vert. Correctifs iPhone : aucun ne touche ces fichiers.
- Note de Nouveautés `2026-11-23-2230-poids-courbe-a-venir.json` (les deux magasins).

## Suite
1. PR de POLISH-SIM-151 : ouverte en brouillon, puis prête quand les vérifications locales sont faites ; merge au run
   suivant après le build iPhone (capture Tendances relue des deux côtés).
2. POLISH-SIM-152 (Ma journée : la ligne répondue reste un instant), puis 153, 154.
3. Après l'Alpha de 23:45 : soumission bêta de la build du soir dès qu'Apple l'a traitée, puis expiration des
   anciennes.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.
