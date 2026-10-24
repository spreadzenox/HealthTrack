# 2026-10-24 21:30 Paris (19:33 UTC) — POL-7a : l'onglet « Pistes » devient « Analyses »

**Type** : 🧭 chantier produit (polissage du parcours, retours du propriétaire du 24/10 vers 15:00, point 7)

## Constat au démarrage
- Main à `7ba2ad3` (#332), workflows de main verts (Tests, émulateur ; Build & Release v256). Aucune PR « [Auto] »
  ouverte (seule #51 `cursor/*`, non touchée).
- Maquette prête : `IDEES.md` I163. POL-7 découpé en deux étapes testables : **7a** (structure de la page, ce run) et
  **7b** (un facteur = un verdict, liste « autres liens » fusionnée en barres neutres, pistes dépliables).

## Ce qui a été fait (présentation seulement : aucun calcul ni seuil ne change)
- Onglet de la barre du bas **« Analyses »** (icône inchangée), titre **« Vos analyses »**, lien « l’onglet Analyses »
  dans la carte lilas de l'Accueil.
- **Plus d'onglets « Analyse simple / avancée »** : une seule vue (`AnalysisView`). En tête, ligne mono « analyse sur
  N jours notés · M jours de données · week-end pris en compte » (gardée : le propriétaire l'aime), puis l'encart lilas
  « Des liens repérés dans vos données, pas des causes ni un diagnostic. » (masqué sur données vierges : la carte lilas
  suffit).
- **« Bientôt »** (`soonLines` / `SoonSection`) : une ligne discrète par bloc sans assez de données (bien-être estimé
  N/14 jours, habitudes N/5 jours ou « ajoutez des tags », effets décalés N/14 jours) au lieu de sections presque
  vides. Sur données vierges, seul le compteur du visage (les autres attendent les mêmes notes que la carte lilas).
- **Pied de page** (`MethodFooter`) : mise en garde en petit + **une seule** note « Comment c’est calculé » (méthode
  des liens + méthode du bien-être estimé, auparavant deux notes au milieu de la page). Dedans, **« Le modèle qui
  prédit votre bien-être »** (ex-onglet avancé, intact : pistes du modèle, ce qui pèse le plus, « A-t-il vu juste ? »),
  calculé dans le worker seulement à l'ouverture (même cache).
- CSS : flèches des volets en `> summary` (le volet imbriqué affichait ▼ fermé) ; styles des onglets retirés.
- `visual-check.mjs` : exemple `--click` mis à jour (« Comment c’est calculé > Le modèle qui prédit votre bien-être »).

## Vérifications
- Vitest **2 156** verts (tests réécrits : pas d'onglets, une seule note de méthode en pied de page, rien après, ligne
  « Bientôt » pour le visage et les effets décalés, vierge = carte lilas seule, modèle calculé à l'ouverture).
- Build OK ; lint inchangé (6 erreurs préexistantes).
- Captures relues : `--play` démo clair (4 écrans), `--play --empty` (carte lilas seule), `--play --dark` note de
  méthode ouverte, modèle de prédiction ouvert ; `npm run visual` complet.

## Suite
- **POL-7b** (I163 points 3–4) : pistes dépliables (phrase simple d'abord, statistiques au chevron), « Alcool » une
  seule fois (visage + notes fusionnés), barres neutres lilas « ↑ / ↓ » au lieu de vert / rouge, « Voir N autres liens ».
- Puis POL-6 → POL-8 → POL-1.

## Après le merge (#333, `cf2d1e6`)
- Checks de la PR tous verts (Vitest, Build APK, Relais, montre Java, budget de lectures, émulateur API 35 et 36).
- « Build & Release » vert : **v257** publiée (APK 33 746 332 octets, 33,7 Mo) ; « Play — AAB » vert (envoi en test interne).
