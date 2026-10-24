# 2026-10-24 06:30 Paris (04:30 UTC) — VC-15 : icônes trait, apostrophes, titre « Repas »

**Type** : 🧭 chantier produit — passe « version candidate », critère C2

## Constat
- Main à `5316dad` (#310) : tous les workflows verts (Tests, Build & Release, Play — AAB, émulateur).
- Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- VC-15 (audit du 23/10 20:30) : émojis hors identité visuelle (Repas, Réglages, Paramètres, onboarding, titres de
  Pistes, note du soir), 59 textes avec apostrophe droite, titre « Alimentation » sous l'onglet « Repas ».

## Ce qui a été fait
- `components/LineIcon.jsx` (+ CSS, test) : icônes trait 24 × 24 au style de la barre d'onglets (dossier, roue
  crantée reprise de `SettingsButton`, étincelle, cadenas, document, appareil photo, image, crayon, cloche).
- Réglages (`More.jsx`), Repas (Photo / Galerie / Décrire), Paramètres (« Ce qui est envoyé »), onboarding (cadenas),
  note du soir (cloche) : émojis → `LineIcon`. Titres de Pistes : émojis décoratifs retirés (📅 🏷️ 🎯 📈 ⏳ 🙂 🤖 🔬 📉),
  ⚠️ de la clé Gemini (sideload) retiré.
- Apostrophes : réécriture sur l'AST (textes JSX, chaînes avec espace ≤ 300 caractères, `&apos;`) dans 12 fichiers
  (pages, composants, messages d'erreur des services) ; consignes envoyées au modèle d'IA inchangées.
- `Food.jsx` : titre « Repas ».
- `data/wording.test.js` : deux tests-gardes — aucune apostrophe droite dans les textes visibles (`@babel/parser`,
  désormais déclaré en devDependency à la version déjà verrouillée 7.29.0) et aucun émoji (`\p{Emoji_Presentation}`
  ou U+FE0F) dans les pages et composants, hors `DebugPanel` ; les symboles ✓ ✕ ⚠ restent permis.

## Vérifications
- `npm run test` : 171 fichiers, 2 102 tests verts. `npm run build` OK. `npm run lint` : 6 erreurs, identiques à main.
- `npm run visual` complet : 0 erreur JS. Relu : `/plus` (clair et sombre, play), `/food`, `/bienvenue`, Pistes avec
  données de démo.

## Reste / suite
- Les étiquettes d'habitudes (✈️ Voyage, ☕ Café après 14 h, 📱 Écran tard, 🤒 Malade) gardent leur émoji : ce sont des
  données (icône de l'étiquette), pas du texte → nouvelle ligne VC-20 au backlog (à trancher avec la passe Pistes du
  jalon 5).
- Prochain : VC-9 (premier lancement à froid sur l'émulateur, C4), VC-19.
