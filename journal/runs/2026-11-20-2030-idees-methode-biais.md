# Run du 20/11 20:30 — Idées : préparer METHODE-BIAIS-1 (tailles des liens et fourchettes honnêtes)

**Type** : 💡 idées (aucun code produit) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main ea3d575.

## État de départ
- main vert sur #1153 (Tests, Build & Release, Play — AAB, émulateur).
- #1154 (run de 19:30, REFONTE-4b-2, banc seulement) ouverte : tous les checks verts sauf le build iPhone sur
  simulateur, relancé et en cours (étape des captures à 20:35).

## Choix
- 20:30 : run « idées ». L'étape de code qui vient est METHODE-BIAIS-1 (proposée par le run de 19:30) : changement de
  méthode, donc banc d'abord (méta-leçon 10). Ce run mesure les causes et écrit la spécification.

## Ce qui a été fait
- Mesures au banc avec un script jetable (non commité), sur la branche de #1154 : ridge actuelle, sans pénalité,
  λ ≤ 3, avec et sans jours manquants ; habitude 0,8 pt et 1,6 pt, sommeil size 1, scénario nul.
- Résultat : sans pénalité et sans imputation, la taille ressort à 0,81-0,86 de la vraie (0,51-0,53 aujourd'hui) et
  la fourchette contient la vraie valeur 82-90 % du temps (10-17 % aujourd'hui) ; puissance et faux liens inchangés.
- [`methode/METHODE-BIAIS-1.md`](../methode/METHODE-BIAIS-1.md) : tableau, trois causes (pénalité, jours manquants
  remplacés par la moyenne, lissage TS-1), proposition en 5 points pour le run de code, risques (Agir ne lit que le
  signe et le chiffre affiché : vérifié dans `trials.js`).
- BACKLOG : METHODE-BIAIS-1 renvoie à la spécification.

## iPhone
- Rien de propre à l'iPhone ce run. Parité inchangée : 70 %. Build TestFlight du soir (21:20) à venir (version 893).

## Suite proposée
1. #1154 si le build iPhone relancé n'est pas vert à la fin de ce run (voir ci-dessous).
2. METHODE-BIAIS-1 au prochain run de code qui a le temps (spécification prête).
3. Demain entre 9:00 et 17:00 : REFONTE-2-ASC, puis R18-SOUMISSION-b et « 👉 PI2 prête ».

## #1154
