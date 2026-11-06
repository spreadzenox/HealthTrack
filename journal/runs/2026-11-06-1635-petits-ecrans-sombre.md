# 06/11 16:35 — Revue 320 px, installation vierge, thème sombre (REVUE-320-SOMBRE)

Type : 🎨 run de code (revue C1, variante play, données vierges, thème sombre, 320 × 700).

## Constat au démarrage
- main `09a3e8e` (#757, REVUE-320) : tous les workflows verts. Aucune PR « [Auto] » ouverte (#51 hors routine, non touchée).
- Porte Alpha (CD-ALPHA-6) vérifiée dans le bilan du passage de 15:18 UTC : « envoi espacé », 100811 sur l'alpha depuis
  23 h, test interne 100840. Le prochain passage après ~16:30 UTC (merge de ce run) peut envoyer sur Alpha.

## Revue `npm run visual -- --play --empty --size=320x700 --dark` (17 pages, toutes « ok »)
Captures relues : Accueil, Journal (Jours, Repas), Analyses (4 onglets), historique du bien-être, Sources, Données,
Paramètres, paywall, onboarding. Défauts trouvés :
1. Paywall : « Restaurer un achat · Conditions · » puis « Confidentialité » seul à la ligne : séparateur orphelin. **Corrigé.**
2. Onboarding (01/07) : la tuile « 1 geste » passait « geste » à la ligne, pas les deux autres. **Corrigé.**
3. Notés, non corrigés : paywall « soit 2,50 € par / mois » coupé en deux lignes (lisible) ; Journal vierge, le lien
   « Selles : estimer la forme avec une photo » vient avant « Rien de noté pour l'instant » ; Données vierges affiche
   « 2 entrées et votre profil » après le passage de l'outil sur les pages précédentes (à vérifier : entrées créées
   par l'outil ou par l'app sans geste de l'utilisateur ?) → REVUE-320-SOMBRE-2 au BACKLOG.

## Fait
- `Premium.jsx` / `Premium.css` : liens du pied en flex avec `column-gap`, sans « · ».
- `Onboarding.css` : `.onb-tile-num` en `nowrap`, 0.88rem sous 340 px.
- Note de Nouveautés `2026-11-06-1635-petits-ecrans-sombre.json`.
- Pas de test unitaire (CSS) ; garde : `npm run visual -- --size=320x700`.

## Vérifications
- `npm run visual -- --play --empty --size=320x700 --dark` : 17 ok (seul « 1 msg console » sur Sources, déjà là).
  `--routes=/premium,/bienvenue` en format normal : ok, captures relues (trois liens sur une ligne).
- `npm run test` : 3 199 verts. `npm run lint` : 0 erreur. `npm run build` OK.

## Suite
- CD-ALPHA-6 : vérifier au bilan du passage Alpha après ce merge qu'une version 1008xx part (porte de 24 h franchie).
- REVUE-320-SOMBRE-2 (« 2 entrées » sur données vierges) ; TEST-ALPHA-1 (07–08/11) ; INSTALLS-21c-2 (08–09/11) ; GOLD-a3-2 dès P37.
- Fin de la période de lancement iPhone ce soir 23:00 UTC (rien à faire, date servie par le relais).
