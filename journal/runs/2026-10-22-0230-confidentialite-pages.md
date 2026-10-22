# 2026-10-22 02:30 Paris (00:30 UTC) — Page de confidentialité + GitHub Pages (préparation du test fermé)

**Type** : 🧭📄 code (run court Play) · **PR** : « [Auto] Politique de confidentialité publiée par GitHub Pages » (voir « Après le merge »)

## Pourquoi
- Main à `55c66db` (#262), aucune PR « [Auto] » ouverte, workflows du dernier merge verts d'après le run précédent.
- Le prompt : après le run court de l'envoi automatique (fait le 21/10 22:30, vérifié le 22/10 00:30), « un ou deux runs
  courts préparent tout ce qui permet d'ouvrir le test fermé au plus vite » avant de revenir à la montre. Le run de 00:30
  a fait M0 + M1 ; ce run fait la première brique Play : la politique de confidentialité publique (exigée par la fiche,
  par Health Connect et par le formulaire Sécurité des données).

## Ce qui a été fait
- `app/public/privacypolicy.html` **réécrite** (l'ancienne datait d'avril, parlait de « fonctionne entièrement hors
  ligne » et de Samsung Galaxy Fit) d'après le code réel de la variante play : stockage IndexedDB local ; 15 lectures
  Health Connect (liste de `PLAY-CONFORMITE.md`), jamais d'écriture, mention de l'utilisation limitée ; Open-Meteo avec
  coordonnées arrondies au dixième de degré (`roundCoord`, ~10 km) ; temps d'écran ; lecture du visage à l'ouverture de
  l'app, « système d'IA de reconnaissance des émotions », aucune image gardée ; montre en Bluetooth (clés locales,
  paramètres publics téléchargés à l'appairage) ; Withings ; analyse Gemini seulement à la demande, photo réduite et
  sans métadonnées (`imagePrep.js`), clé de l'utilisateur pour l'instant ; notifications ; export, effacement (pas de
  bouton « tout effacer » dans l'app : désinstaller ou « Effacer les données » d'Android) ; RGPD / CNIL ; 18 ans et plus ;
  contact (e-mail de la fiche Play + issues GitHub, sans adresse personnelle publiée). Couleurs des tokens, thème
  sombre, aucune ressource externe (lue hors ligne par l'écran Health Connect, JS désactivé).
- **Source unique** : le fichier reste l'asset embarqué (`health_connect_privacy_policy_url` inchangé, pour que l'écran
  de justification marche hors ligne) et est publié tel quel par **`.github/workflows/pages.yml`** (« Site — GitHub
  Pages », push sur main limité à ces chemins + workflow_dispatch) via `app/scripts/site/build-site.mjs` :
  `/` (présentation courte), `/confidentialite/` (adresse pour la Play Console), `/privacypolicy.html`. La page
  renvoie à sa version en ligne. Écart assumé avec le prompt (« la même adresse dans l'écran Health Connect ») : même
  document, servi localement pour ne pas dépendre du réseau ; à basculer sur l'URL si l'examen Play l'exige.
- Le workflow vérifie d'abord `GET /repos/…/pages` : si Pages n'est pas activé (ou pas en source « GitHub Actions »),
  il échoue avec un résumé qui renvoie à **P19**.
- **Réglages → Confidentialité** (lien vers la page embarquée, hors routeur).
- Tests : `src/data/privacyPolicy.test.js` (14 points obligatoires, nom Halcya, vocabulaire, aucune ressource externe,
  construction du site), `More.test.jsx` (+1). Nouveautés `2026-10-22-0230-confidentialite`.

## Vérifications
- `npm run test` : **1 778 Vitest verts** (+19). `npm run lint` : 6 erreurs, comme avant. `npm run build` OK
  (`dist/privacypolicy.html` présent). `npm run visual` OK ; capture Réglages regardée ; page de confidentialité
  capturée à 412 px en clair et en sombre (lisible, contraste des tokens).

## Suite proposée
- Propriétaire : **P19** (activer Pages puis relancer le workflow), **P18** (groupe de testeurs), retour sur la nuit
  de la montre (v202).
- Prochain run de code : fiche du Store FR par l'API (edits.listings, images : icône 512, présentation 1024×500,
  ≥ 4 captures synthétiques ; details : site web), puis Sécurité des données ; ensuite retour à **M2** (VFC).
