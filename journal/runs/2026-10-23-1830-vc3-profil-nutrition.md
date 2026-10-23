# 2026-10-23 18:30 Paris (16:30 UTC) — VC-3 : profil Nutrition sans valeurs inventées

**Type** : 🧭 chantier produit (passe « version candidate », critère C1)

## Constat
- Main à `d8966c0` (#299) ; Build & Release, Tests, Play — AAB, émulateur A56 : verts. Aucune PR « [Auto] » ouverte
  (seule #51 `cursor/*`, non touchée). Run de code (18:30).

## Ce qui a été fait
- `components/BodyProfileCard.jsx` : une valeur par défaut n'est plus jamais affichée comme vraie.
  - Profil vide (poids, taille, sexe, âge tous par défaut) : « Complétez votre profil pour voir vos repères
    (protéines, fer, vitamines…) ajustés à vous. Tout reste sur cet appareil. » + « Compléter mon profil » ;
    la composition Withings reste affichée si elle existe.
  - Profil partiel : seules les valeurs connues, puis « À compléter pour ajuster vos repères : taille, sexe, âge ».
  - IMC (si poids et taille connus) et « ~N kcal/jour » (si les 4 sont connus) seulement en mode « détails »
    (`useDetailsMode`, le même réglage que l'Accueil) — I152, dans les deux variantes (principe « simple par défaut »).
- `pages/Nutrition.jsx` : l'avertissement « jours incomplets » ne cite plus d'objectif calorique (« ≈ 614 kcal/j en
  moyenne : des repas manquent sans doute… ») ; la note de bas de page dit « complétez votre profil pour les ajuster »
  tant que le profil est incomplet.
- `DetailsToggle.css` : styles du bouton « détails » sortis de `TodayCards.css` (le bouton est utilisé hors Accueil).
- Changelog `2026-10-23-1830-profil-nutrition.json`.

## Vérifications
- `npm run test` : **164 fichiers, 2 030 tests verts** (Nutrition : profil vide sans aucun chiffre, profil partiel,
  IMC/kcal derrière « détails », avertissement sans « visées »). `npm run build` OK. `npm run lint` : 6 erreurs,
  identiques à main.
- `npm run visual` (démo), `--empty --play --routes=/nutrition`, `--dark --routes=/nutrition` : captures
  `nutrition-1` relues (vide : carte d'invitation ; démo : « 77,2 kg (Withings) », composition, activité, liste de ce
  qui manque ; sombre lisible).

## Suite
- VC-6 (carte montre avant appairage), VC-7 (Withings Body Scan en play), VC-8 (diagnostic montre), VC-5, VC-10, VC-9.
