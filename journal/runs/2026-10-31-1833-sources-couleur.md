# Run du 31/10/2026 18:33 (Paris, CET) — Sources en couleur (POL-PLAY-89)

**Type** : 🎨 polissage (audits prévus par le run de 17:33 : Journal → Jours démo sombre, puis Sources vierge sombre)

## Constat au démarrage
- Main à `f2dcc73` (#571, journal) ; v411 publiée ; Tests, Build & Release, Play — AAB et émulateur A56 verts.
  Aucune PR « [Auto] » ouverte (#51 `cursor/*` non touchée).

## Audits (variante play)
- `/journal` démo sombre : tuiles colorées (menthe, lilas, pêche), entrées lisibles, « Voir les jours précédents » :
  rien à corriger.
- `/connectors` vierge sombre : quatre cartes grises identiques (visage, Health Connect, météo, temps d'écran) ;
  retour 8 / principe du 24/10 (« plus de couleur, pastels par thème »).

## Fait
- `sourceTone(id)` (fonction pure, `connectorsLayout.js`) : menthe pour corps et bien-être (`face`, `health_connect`,
  `withings`), lilas pour le contexte (`weather`, `phone`), `null` pour montre, capteurs et guides (blocs sans carte).
  Même code couleur que les tuiles de « Vos derniers jours ».
- `Connectors.jsx` : chaque source teintée est enveloppée dans `.source-tint-<ton>` ; CSS : fond pastel + filet de
  4 px à gauche, sur les tokens (clair et sombre). Le texte garde ses couleurs (contrastes des pastels ≥ 4,5:1).

## Tests
- `connectorsLayout.test.js` : 2 cas (`sourceTone`). `Connectors.test.jsx` inchangé et vert.

## Vérifications
- `npm run test` (2 798 réussis), `npm run build`, `npm run lint` (6 erreurs, comme avant), `npm run visual` complet.
- Captures relues : `/journal` `--play --dark` ; `/connectors` `--play --empty` en sombre et en clair (avant / après) ;
  `/connectors` `--play` démo clair (météo active en lilas).

## Données
- Aucune : affichage seulement.

## Demandes iOS
- Rien de propre à Android (note de Nouveautés sans `variants`).

## Suite
- Accueil en vierge sombre, puis Paramètres en démo clair.

## Après le merge (#572)
- Les 9 checks de la PR étaient verts (Vitest, Build APK, relais, Java, émulateurs API 34/35/36…).
- Tests, Build & Release et Play — AAB verts sur main (`6500199`) : release **v412** publiée (APK 34 522 970 octets) ;
  AAB play envoyé en test interne.
