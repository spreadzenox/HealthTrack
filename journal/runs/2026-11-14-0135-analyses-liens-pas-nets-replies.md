# Run 14/11 01:35 — Analyses : rien de net, la liste hachurée est repliée (POLISH-SIM-69, 1re partie)

**Type** : code (mode polish)  ·  **Android** : v1034 sur main après ce run  ·
**TestFlight** : 1030.1031 (version 893) chez les testeurs externes depuis le 14/11 à 00:33 ; build du code v1032
lancée par le merge de #955 à 01:36 (« iOS — TestFlight » en cours pendant ce run, voir « Vérifs ») ; 844.344 intacte  ·
**Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme.
- Main 55d4e43 vert au début du run. PR #955 du run précédent ouverte (50 min), « Build iOS (simulateur) et
  captures » encore en cours : priorité (b). La session précédente était encore active : elle a mergé #955 elle-même
  à 01:36 (0ab54b8), pendant que je préparais la suite sur d'autres fichiers. #51 (`cursor/*`) non touchée.
- L'envoi Alpha du soir (cron de 23:45) n'était pas parti à 01:40.

## Fait
**POLISH-SIM-69, 1re partie** (deux personas J45 : « Lactose −0,8 pt : j'arrête le lait ou pas ? »). Quand aucun
lien n'est net (ni piste, ni barre pleine, ni facteur « à regarder » net), Analyses n'affiche plus d'emblée la
vingtaine de barres hachurées.
- `Recommendations.jsx` (`Results`) : dans cet état, sous « Aucun lien assez net pour l'instant… », la ligne « 16
  facteurs comparés à votre bien-être, du jour même à 27 jours avant. » (celle de POLISH-SIM-62), le compte « Long
  terme : encore N jours… » s'il y en a un (il n'était dit qu'en bas de page), puis un lien « Voir les liens pas
  encore nets » qui déplie les mêmes sections qu'avant (« Ce qui va avec… », « À regarder, pas à changer »), avec
  leur phrase « Rien n'est net pour l'instant… ». Dès qu'un lien est net, rien n'est replié.
- Aucun calcul ne change (`resultsView.js` intact) ; aucun style nouveau (le lien reprend celui de « Comment c'est
  calculé »).
- Nouveautés : `2026-11-14-0135-analyses-liens-pas-nets-replies.json` (code partagé : Android et iPhone).

## Vérifs
- Tests écrits d'abord (rouges, puis verts) : `Recommendations.test.jsx` (+2 ; le test POLISH-SIM-50 « rien de
  net » déplie d'abord la liste). `npm run test` : 3511 verts, 44 ignorés. `npm run lint` : 0 erreur.
  `npm run build` et `npm run visual` complet : voir la PR.
- Persona « Tout mesurer » au 45e jour (`npm run persona -- --day=45 --equipment=watch --goals=all --notes=full
  --source=Zepp`), variante play, clair : [replié](captures/2026-11-14-0135-analyses-rien-de-net-replie.png),
  [déplié](captures/2026-11-14-0135-analyses-rien-de-net-ouvert.png) (capture pleine page : la barre d'onglets y
  apparaît au milieu, c'est l'outil). Données de démo ordinaires (`npm run visual --play`) : état de POLISH-SIM-62,
  inchangé, regardé.
- Le correctif iPhone 50 (seul à toucher Analyses, dans `Recommendations.css`) s'applique toujours sur ce code.

## Limites
- Pas de capture en sombre : l'outil des personas n'a pas d'option de thème, et les données de démo ne donnent pas
  cet état. Aucune couleur ni classe nouvelle.
- Quand les trois délais sont déjà calculés, la page ne dit pas « ce qui manque » : l'app ne sait pas combien de
  jours il faudrait encore. Je n'ai pas inventé de chiffre.
- Reste de POLISH-SIM-69 : toucher une ligne (GOS, sorbitol) pour une explication courte avec des aliments.
- Suivi iPhone : `scripts/upstream.sh --latest` reste sur v1032 (« Play — AAB » de la v1033 pas encore fini) :
  `iphone/upstream.json` inchangé, pas de build iOS pour cette PR. POLISH-SIM-69 et 70 arriveront sur iPhone au
  prochain suivi. PARITE inchangée.
- Charte, PARITE, BACKLOG et PRODUIT lus par sections, pas en entier (plus de 1 Mo) ; `iphone/README.md` lu en
  entier, `iphone/journal/README.md` non relu à ce run (aucun geste vers Apple).

## Suite
- Relever la build TestFlight du code v1032 (merge de #955) ; ne pas la soumettre avant la nuit prochaine (une
  soumission par jour, après l'Alpha de 23:45).
- Vérifier que l'envoi Alpha de la nuit est parti et vert.
- Suivi iPhone (`upstream.sh --latest` : v1034), FUSION-2 ; POLISH-SIM-69 (fin), 71, 72 ; CYCLE-3a-2.
