# Run du 03/11/2026 20:35 (Paris, CET) — Idées : le jour où « Gold offert » s'arrête pour les testeurs

**Type** : 💡 idées (journal seul, aucun code produit)

## Constat au démarrage
- Main à `7d483df` (#663) ; workflows de main verts (l'émulateur du dernier push tournait encore) ; aucune PR
  « [Auto] » ouverte (seule la #51, hors routine, n'est pas touchée).
- Demandes reprises : compte rendu du 02/11 (testeurs, `until` au 27/11), TEST-REFUS (I212), règle SLOP (31/10) pour
  les textes proposés, décision du 20/10 (vrai paywall au moment de la valeur, 14 à 21 jours).

## Fait
- Lu le code de la fin de période (`entitlement.js`, `Premium.jsx`, `Settings.jsx`, `Reintroduction.jsx`) : Gold
  s'éteint bien à `launchUntil`, hors connexion compris, une réintroduction commencée se termine ; mais **rien ne
  prévient le testeur avant ni après**. Veille « essai inversé » (prévenir une fois, dire ce qui reste, ne rien
  effacer) et éligibilité à l'essai Play (`thisSubscription` : chaque testeur garde ses 14 jours d'essai).
- `IDEES.md` : **I213** (deux cartes, avant et après la fin, textes proposés, piège du `launchUntil` effacé par le
  relais après la date, drapeau App Store) et **I214** (merci aux testeurs : codes promo Play écartés, un mois de Gold
  côté relais proposé).
- `BACKLOG.md` : FIN-LANCEMENT-1, FIN-LANCEMENT-2, FIN-LANCEMENT-MSG dans « Test fermé en cours ».
- `PRODUIT.md` : **P44** (question au propriétaire, réponse avant le 20/11). Résumé de la semaine : ligne du run et P44.

## Vérifications
- Journal seul ; `npm run test` (app) et `npm test` (relais) lancés avant la PR (garde-fou).

## Demandes iOS
- Aucune. FIN-LANCEMENT-1 sera coupée pour l'App Store par un drapeau (l'examen d'Apple doit voir l'écran d'achat).
- Aucune note de Nouveautés (rien de visible dans l'app).

## Suite
- FIN-LANCEMENT-1 puis 2 dans un run de code avant le 24/11 ; TEST-ALPHA-1 vers le 07–08/11 (P42) ; P37, P44.
