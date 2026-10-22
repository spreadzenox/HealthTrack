# 2026-10-22 08:30 Paris (06:30 UTC) — Run « idées » : M2 (P2P) prêt à coder, choix de Google Play Billing

**Type** : 💡⌚ idées (pas de code produit) · **PR** : celle de ce compte rendu (journal seul)

## Pourquoi
- Main à `7045e6f` (#267). Workflows verts (Build & Release v206, Play — AAB, fiche, Tests, émulateur A56) sauf
  « Site — GitHub Pages », rouge **attendu** (P19). Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, pas à nous).
- 08:30 Paris → run « idées ». Signalement du 20/10 19:05 déjà corrigé (v188). Signalement montre du 21/10 : le run
  précédent avait laissé ouverte la séquence exacte des messages P2P (M2) ; veille produit laissée en plan : Play
  Billing sous Capacitor.

## Ce qui a été fait
- **Recherche protocole** (agent, Gadgetbridge master `32a3de0b2c` du 22/10, faits seulement, aucun code) →
  `protocoles/huawei.md` **§10.10** : compteur de séquence (premier envoi = 2), déroulé ping → demande → données →
  accusé, rattachement ping par numéro et données par classe, transport (chiffré, tranches de la couche lien), réels
  4 o / 8 o, erreurs, reprise par classe (début 0 la première fois), commande 7/0x2A de la température, autres classes.
- **Lecture du code** : `session.request()` rattache par service / commande → inutilisable pour le P2P (l'accusé de
  la montre serait pris pour la réponse). Conception de `p2p.js` sur `session.listen()` et liste des tests de M2 dans
  le §10.10.
- **Veille Play Billing** (agent) → I146–I148 : `capacitor-plugin-cdv-purchase` (MIT, PBL 9.0, Capacitor 6–8) avec le
  relais comme validateur ; RevenueCat écarté (sous-traitant tiers des achats) ; PBL ≥ 8 obligatoire depuis le
  1/11/2026 ; accusé d'achat côté serveur ; prix / essai lus dans `pricingPhases` ; tests accélérés.
- Décision proposée **I145** : ne pas lire la classe 500031 (émotions calculées par la montre).
- `IDEES.md` I144–I148, `BACKLOG.md` (M2 détaillé, jalon 6 préparé, alignement `@capacitor/cli` 7 → 8), `PRODUIT.md`
  (jalon 6, historique), `RESEARCH.md` [102]–[107], résumé de la semaine (paragraphe, tableau montre, ligne du run).

## Faits marquants
- Le dépôt a `@capacitor/core` / `android` 8.2 mais `@capacitor/cli` 7.6 : décalage à corriger (petit run).
- La création des abonnements par l'API sans profil de paiement n'est **pas confirmée** : prévoir profil de paiement
  (propriétaire) → AAB avec la permission BILLING → produits par l'API.

## Vérifications
- Journal seul. `npm ci` + `npm run test` : **1 814 Vitest verts**. Pas de changement visible → pas d'entrée
  « Nouveautés ».

## Suite proposée
- Prochain run de code : test fermé si P18 est fait, sinon **M2** (spec §10.10, tests listés).
- Prochain run « idées » (20:30) : spec M4 (stress `rrisqi` v3 en détail) et M6 (lecteur Java : P2P en arrière-plan),
  veille onboarding (jalon 4) des apps SII.
- Propriétaire : P21, P20, P19, P18 ; activer TruSleep / stress / température de la peau sur la montre (P17).
