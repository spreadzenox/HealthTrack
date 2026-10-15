# 2026-10-15 18:30 Paris (16:30 UTC) — Montre en maintenance ; nettoyage : journal du jour et Paramètres (D1)

**Type** : 🧹 D1 (+ 🐛 test instable sur main)  ·  **PR** : « [Auto] Nettoyage : cigarettes sur une ligne, Paramètres allégés »

## Pourquoi
- Démarrage : main à `91a20b9` (#169 fusionnée, **v136 publiée**, « Build & Release » vert). Aucune PR « [Auto] »
  ouverte ; `cursor/*` #51 hors routine, non touchée. Aucun nouveau journal dans `journal/diagnostics/`.
- Sur main, « Tests » rouge : `App.test.jsx` « changer de page remonte en haut » (scrollTop 1200 au lieu de 0).
  Cause : React Router passe la navigation en transition, la page paresseuse s'affiche, `findByRole` se résout avant
  le `useEffect` passif → course. Même défaut visible pour l'utilisateur (un instant à l'ancienne hauteur).
  « Émulateur A56 » rouge sur le job API 36 (lancement de l'émulateur, déjà connu comme fragile au run précédent).
- **Consigne du propriétaire du 15/10 (« Ça marche côté montre, plus besoin de se concentrer là-dessus ») lue pour la
  première fois** → reportée dans la charte (§000, encadré « EN MAINTENANCE ») et le backlog ; « Prochaines étapes »
  réordonnées : D1 en tête, puis D2, D4, D5, D6, montre en 6–8.
- 18:30 Paris = run normal → D1.

## Ce qui a été fait
- **Correctif** `Layout.jsx` : `useEffect` → `useLayoutEffect` pour le retour en haut de page (même rendu que la page).
- **Accueil, journal du jour** (`utils/entries.js` `groupCigarettes`, `Dashboard.jsx` `CigaretteGroupRow`) :
  ≥ 2 cigarettes dans la journée → une seule ligne « Cigarettes » avec les heures (« 09:05 ×2 · 11:30 · 15:00 »), à la
  place de la dernière ; un seul bouton, « Supprimer » la dernière notée (confirmation en deux temps inchangée).
  Une cigarette seule garde sa ligne d'avant. Aucune donnée modifiée.
- **Accueil** : tag déclaré « 📱 Écran tard » (`auto: 'phone_usage'`) masqué à l'affichage un jour où l'écran est
  mesuré (chiffre « Écran » du jour) ; gardé tel quel un jour sans mesure. Les entrées stockées ne changent pas.
- **Accueil** : sous-titre « Moyenne par jour — données locales uniquement. » du graphique bien-être retiré.
- **Paramètres** : titre « Analyse des repas (Gemini) » ; intro + lien + « sans clé » en un paragraphe (avant : 3) ;
  phrase « Une clé est enregistrée… / Sans clé… » remplacée par « ✓ Clé enregistrée » à côté du bouton ; choix du
  modèle sous `<details>` « Choisir le modèle » ; « Ce qui est envoyé » et l'avertissement « clé gratuite » restent
  visibles (information de confidentialité). Cigarettes et Diagnostic : libellé fixe qui dit ce que fait
  l'interrupteur (avant : « Bouton affiché seulement si vous fumez », « Mode diagnostic désactivé ») + une ligne d'aide.

### Retiré et pourquoi (demandé par la directive D1)
| Retiré / fusionné | Pourquoi |
|---|---|
| Une ligne par cigarette (avec « Supprimer » chacune) | Le total est déjà dans le résumé du jour ; 3–10 lignes identiques noyaient les repas |
| Tag « Écran tard » affiché un jour mesuré | Doublon du chiffre « Écran » mesuré (ne jamais redire ce que l'app capte) |
| « Moyenne par jour — données locales uniquement » | Le titre du graphique le dit ; « local » est vrai de toute l'app |
| Paragraphe « Sans clé, ni l'analyse photo ni… » | Fusionné dans l'intro (« Sans clé, la saisie manuelle reste possible ») |
| Sélecteur de modèle visible d'emblée | Réglage rare, l'app bascule déjà seule d'un modèle à l'autre → replié |
| Paragraphes d'intro Cigarettes / Diagnostic | Remplacés par un libellé d'interrupteur explicite + une ligne |

## Vérifications
- Vitest : **1260 ✅** (+4 : cigarette seule, « Écran tard » masqué / gardé, Paramètres
  « ✓ Clé enregistrée » ; tests « cigarettes groupées » et Cigarettes des Paramètres réécrits). `App.test.jsx` relancé 3 fois ✅.
- Build ✅. Lint : **6 erreurs** (inchangé ; `groupCigarettes` placé dans `utils/` pour ne pas en ajouter une).
- `npm run visual` complet : 8 pages ok, aucune erreur JS ; `dashboard-3` (ligne « Cigarettes 09:10 · 11:11 · 13:12 »)
  et `settings-1/2` relues.

## Sécurité / vie privée
- Rien de nouveau ne sort du téléphone ; aucune donnée ni schéma modifié (affichage seulement).

## Apprentissages / décisions
- Un retour en haut de page doit être en `useLayoutEffect` avec des navigations en transition (React Router 7).
- Les mentions de confidentialité Gemini restent visibles : ce n'est pas du « bruit » mais un consentement éclairé.

## Suite proposée
1. 🧹 D1 : « Prédiction du jour » (carte + point orange) en double → n'en garder qu'un ; relire Données et Nutrition ;
   tags auto-détectés (I65 : « Voyage » par fuseau, « Sport le soir » par séances).
2. ⚡ D2 : `WellbeingCharts` par agrégats journaliers, budget de lectures en CI.
3. ⌚ Maintenance : lire tout journal du propriétaire ; job émulateur API 36 fragile au lancement (à surveiller).
