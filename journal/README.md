# Journal de bord de Claude — HealthTrack

## 📅 Semaine en cours — S44 (lundi 26 octobre → dimanche 1er novembre 2026)

> Résumé tenu à jour à chaque run : **c'est ce que lit le propriétaire chaque semaine.**
> Le premier run d'une nouvelle semaine archive ce bloc dans `semaines/AAAA-Sww.md` et en ouvre un neuf.
> Semaine précédente : [`semaines/2026-S43.md`](semaines/2026-S43.md) (Halcya sur Google Play : variantes play /
> sideload, identité visuelle, onboarding, abonnement et relais, montre M1–M7, polissage du parcours, version candidate
> en test fermé ; v189 → v278).

> **Testeurs : pas encore** (votre décision du 27/10 vers 13:00). Vous les inviterez au plus tôt la semaine
> prochaine, quand vous le direz : d'ici là, les runs polissent la version Play (bugs, chiffres fiables, parcours
> écran par écran). La version **453** reste sur la piste alpha sans changement ; la fin de la période de lancement
> (aujourd'hui le 20/11) sera recalée sur la date de votre invitation (+ 14 jours + marge).

**Ce que vous verrez dans l'app cette semaine**
- **Ventre : le bilan du soir** (26/10 00:33) — à partir de 18 h, la carte « Votre ventre » de l'Accueil demande
  « Et votre ventre aujourd'hui, dans l'ensemble ? » (Calme / Gêne / Douleur, un geste, une fois par jour). Les
  journées calmes comptent autant que les autres : c'est ce qui manquait aux analyses repas → ventre. Visible
  seulement avec l'objectif « Mon ventre » ; dans le Journal : « Ventre · bilan du jour ».
- **Ventre : le bilan du soir depuis une notification** (26/10 01:33) — le soir, sous la question, une ligne « Me le
  demander chaque soir par notification » : vers 20 h (puis à votre heure habituelle), Calme / Gêne / Douleur
  directement dans la notification, sans ouvrir l'app ; rangé à l'ouverture suivante. Jamais si le bilan est déjà
  fait. Interrupteur dans Paramètres → Ce qui vous amène. **À tester** : l'activer un soir, répondre le lendemain
  depuis la notification, vérifier « Bilan du jour : … » dans la carte.

- **Analyses : vos pistes repas → ventre** (26/10 03:33) — avec « Mon ventre », l'onglet Analyses commence par
  « Votre ventre et vos repas » : une carte par aliment (« Oignon → ventre · le jour même », « gêne ou douleur 6 fois
  sur 9 ; les autres jours, 5 fois sur 30 »), toujours « à confirmer ». Seuls les liens qui passent toutes les
  vérifications s'affichent ; avant 28 jours de notes du ventre, une ligne « Bientôt » compte les jours. Des aliments
  toujours mangés ensemble forment une seule piste (impossible de les départager). **À tester** : rien de visible tant
  que vous n'avez pas 28 jours de notes du ventre ; vérifiez la ligne « Bientôt · N/28 jours » en bas d'Analyses.

- **Pistes du ventre à nuit comparable** (26/10 05:33) — quand vos nuits sont connues, chaque aliment est comparé
  à nuit comparable : une mauvaise nuit qui gêne le ventre et pousse vers le café n'accuse plus le café. Dans les
  détails d'une piste « le jour même » / « la veille » : « à nuit comparable ».
- **… et à stress et écran de la veille comparables** (26/10 06:33) — même idée pour le stress de la montre et le
  temps d'écran de la veille, mais seulement quand ils vont vraiment avec votre ventre (deux au plus, pour ne pas
  retarder vos pistes). Mention dans les détails, par exemple « à nuit et stress de la veille comparables ».
- **… et les aliments mangés ensemble départagés** (26/10 07:33) — si l'oignon gêne et que l'ail l'accompagne
  souvent, l'ail n'est plus accusé à tort : il ne reste une piste que s'il ressort aussi les jours sans oignon. Dans
  les détails : « Souvent mangé avec : ail. Comparé à part, il ne ressort pas à lui seul. »

- **Réintroduction guidée** (26/10 10:33) — avec « Mon ventre », Analyses propose « Tester un groupe FODMAP » :
  vous choisissez un groupe (blé, oignon ou ail un par un, GOS, fructose, lactose, sorbitol, mannitol), réglez les
  3 portions, et le test démarre après 3 jours de ventre calme. Chaque jour, « J'ai mangé ma portion » en un geste,
  puis votre ventre comme d'habitude ; en cas de gêne, « C'est supportable ? » ; à la fin, une phrase (« Blé : une
  portion moyenne passe »). Premium sur la version Play, offert à tous pendant la période de lancement. **À tester** :
  ouvrir Analyses → « Tester un groupe FODMAP », vérifier le choix des groupes et la préparation (le bouton
  « Commencer » attend 3 jours de bilans du ventre « calme »).

- **Réintroduction : rappel de la portion du jour** (26/10 11:33) — pendant un test, « Me rappeler ma portion chaque
  jour à 12:00 » (heure modifiable) : une notification « Votre portion du jour · Lait · jour 2 : 250 ml » ; la toucher
  ouvre le test. Jamais pour une portion déjà notée, pendant une pause ou après la dernière portion. Dans Analyses, la
  carte du test dit où vous en êtes (« Lait · jour 2 · portion à prendre »). **À tester** : commencer un test (après
  3 jours de ventre calme), cocher le rappel avec une heure proche, vérifier la notification et qu'elle ouvre le test.

- **Vérifier une piste du ventre** (26/10 12:33) — chaque piste « aliment → ventre » d'Analyses propose « Vérifier
  avec une réintroduction guidée » : le test s'ouvre directement sur l'aliment (oignon, ail, pain, lentilles, lait ou
  yaourt, miel, avocat, champignons…), portions prêtes ; sinon vous choisissez le groupe. **À tester** : dès qu'une
  piste ventre apparaît, toucher le lien et vérifier l'aliment proposé.

- **Rapport PDF pour mon médecin** (27/10 04:33) — en bas d'Analyses (objectif « Mon ventre ») et dans Données :
  2, 4 ou 12 semaines, puis « Créer le PDF » : 2 pages (ventre semaine par semaine, calendrier avec les groupes
  FODMAP du jour, tests de réintroduction, pistes « à confirmer »), rangées dans Documents, puis Android propose
  l'envoi (e-mail, messagerie…). Le bien-être estimé n'y est que si vous cochez la case. Premium sur Play (offert
  pendant le lancement). **À tester** : créer un rapport de 4 semaines, l'ouvrir depuis Fichiers › Documents, puis
  l'envoyer à vous-même par e-mail ; dites-nous ce qui manque pour votre gastro-entérologue ou diététicienne.

- **FODMAP : plus aucun score inventé** (27/10 05:33) — dans les analyses du bien-être, l'ancien « score FODMAP »
  0–3 (écrit par l'ancien modèle) est remplacé par le nombre de groupes au-dessus de leur repère dans le repas le plus
  chargé du jour, calculé comme la carte d'un repas. Sur 3 553 aliments (100 g), 600 sont « chargés » au lieu de 1 104 :
  les fructanes du blé des produits transformés ne sont pas mesurés et restent inconnus plutôt que devinés.

- **FODMAP visibles avant d'enregistrer un repas** (27/10 06:33) — après l'analyse d'une photo, en décrivant un
  repas (« Décrire », « Refaire ») ou en le modifiant, la ligne pêche « Riche en fructanes : oignon » apparaît sous
  les ingrédients et suit vos corrections de grammes. Objectif « Mon ventre » seulement. **À tester** : photographier
  un repas avec de l'oignon ou de l'ail, baisser les grammes, voir la ligne changer avant « Enregistrer ce repas ».

- **Rapport PDF : le partage vérifié sur un vrai Android** (27/10 07:35) — rien de neuf à l'écran : à chaque
  modification, la CI rejoue maintenant sur un émulateur Android 15 « Créer le PDF » depuis Données. Constaté du premier
  coup : la feuille de partage d'Android s'ouvre avec « Halcya-rapport-2026-10-27.pdf » (Quick Share, Drive,
  Messages, Bluetooth, Imprimer), le fichier (2 pages, 20 Ko) est bien dans Documents, et si vous annulez l'envoi,
  l'app vous dit où il est. Un 2ᵉ rapport le même jour remplace le premier sans erreur.

- **Écran premium à jour + paywall au moment de la valeur** (27/10 09:33) — les 4 avantages sont maintenant cochés
  sur l'écran premium (pistes repas → ventre avec délais et rapport PDF n'y étaient encore qu'« en préparation » alors
  qu'ils sont livrés) ; conditions de vente et fiche de l'abonnement sur Play (mise à jour automatique au merge) alignées.
  Sur la version Play **sans premium**, Analyses affiche « 2 pistes repérées entre vos repas et votre ventre » en aperçu
  flou (aucun aliment dans la page) avec « Débloquer » ; « rien ne ressort » reste gratuit. **Pendant la période de
  lancement, rien ne change pour vous ni pour les testeurs** (premium offert) : l'aperçu n'apparaîtra qu'après le 20/11.

- **Forme des selles, en un geste** (27/10 10:33) — dans la carte « Votre ventre », une ligne discrète « + Selles » :
  Dures / Normales / Liquides en un geste, et « Préciser le type » pour l'échelle de Bristol (1 à 7, décrits en mots
  simples). Facultatif, objectif « Mon ventre » seulement. Les notes sont dans le Journal (supprimables) et, résumées
  par forme, dans le rapport PDF (section absente si vous n'en notez pas). Aucun sous-type du SII n'est déduit.
  **À tester** : Accueil → « + Selles » → « Normales » ; puis Journal ; puis un rapport PDF.

- **🚑 Pas et calories du jour corrigés — votre signalement du 27/10 11:56** (27/10 12:33) — « 658 625 kcal » : les
  calories minute de la montre arrivent en **petites calories** (cal), rangées jusqu'ici comme des kcal (×1000). Elles
  sont converties en kcal à la synchro, les jours déjà enregistrés sont réécrits une fois au lancement (valeur
  d'origine gardée, rien d'effacé) et corrigés à la lecture en attendant. « 30 199 pas » : la montre et le téléphone
  (Samsung Health via Health Connect) comptaient les mêmes pas, **additionnés** ; maintenant, pour chaque heure, seule
  la source qui en compte le plus est retenue (Journal, Accueil, analyses, nutrition, écran Montre, premier import).
  Garde-fou : un total au-delà de 100 000 pas ou 15 000 kcal n'est plus affiché. **À tester** : ① à un moment donné,
  comparez les pas et les kcal du jour sur la montre (écran Activité) et dans Halcya (Journal, aujourd'hui) ;
  ② dites-nous si une séance (Journal → séance) affiche des calories absurdes (leur unité n'est pas encore confirmée).

- **Analyses : plus de rapport PDF vide** (27/10 14:42) — tant qu'aucun ventre n'est noté, la carte « Rapport PDF pour
  mon médecin » (et son « Débloquer ») disparaît d'Analyses ; une ligne « Bientôt » l'annonce dès que vous avez commencé
  à noter. Toujours dans Données. **À tester** : rien, sauf sur une installation neuve.

- **Accueil vierge et « Tester un groupe FODMAP »** (27/10 16:33) — sans aucune mesure, l'Accueil ne suppose plus
  que vous avez une montre : « Pas et nuits peuvent venir de votre téléphone ; une montre ajoute le cœur · Ajouter une
  source ». Dans Analyses, la carte « Tester un groupe FODMAP » a son chevron bien à droite et, sur la version Play
  sans premium (après la période de lancement), une étiquette « premium » comme le rapport PDF. **À tester** : rien
  (visible sur une installation neuve).
- **Petits textes plus justes** (27/10 17:33) — carte « Votre ventre » : « Dernière note : Douleur, hier à 10:19 »
  au lieu de « le lundi à 10:19 » (jour de la semaine ensuite, date au-delà d'une semaine). Analyses : « Calories
  brûlées totales (Health Connect) » devient « Dépense totale de la journée » ; la petite ligne « « visage » : … »
  dit simplement « comparé à votre bien-être estimé par la caméra (30 jours) ». **À tester** : rien de particulier.
- **Accueil : la veille plutôt qu'un tiret** (27/10 18:33) — quand la montre n'a pas encore envoyé la VFC de la nuit
  ou que la journée commence (pas encore de pas), la tuile reprend le chiffre de la veille avec un petit « hier »
  au lieu de « — ». Journal : la tuile repas tient sur une ligne (« Repas · ≈ 479 kcal », « 3 repas » quand il y en
  a plusieurs). Analyses : un tag déjà montré comme piste (« Alcool ») n'est plus aussi « en cours de collecte », et
  « Autres mesures : le jour même (visage) piste solide » devient « Se retrouve aussi avec votre bien-être estimé
  (le jour même). ». **À tester** : le matin avant la synchro de la montre, la tuile « VFC nuit » doit montrer la
  valeur d'hier marquée « hier ».
- **Analyses : une seule piste « calories »** (27/10 19:33) — « Calories brûlées (activité) » et « Dépense totale de
  la journée » disaient la même chose et apparaissaient comme deux liens : ils ne forment plus qu'un facteur, et
  seul le lien le plus solide est montré. **À tester** : rien de particulier.
- **Plein écran aussi sous Android 8 à 14** (27/10 21:33) — la remarque « bord à bord » de la Play Console : sur les
  téléphones d'avant Android 15, l'app passe sous des barres système transparentes comme sur votre A56, en-tête et
  onglets dégagés, clavier qui remonte la page. Sur votre téléphone (Android 16), rien ne change. Vérifié à chaque
  modification sur un émulateur Android 14. **À tester** : rien (sauf si vous avez un vieux téléphone sous la main).

- **Votre ventre, le soir : une seule question** (27/10 23:33) — à partir de 18 h, la carte ne montre plus deux rangées
  Calme / Gêne / Douleur l'une sous l'autre : seule « Et votre ventre aujourd'hui, dans l'ensemble ? » reste ; pour
  noter un moment précis (après le dîner, par exemple), « Noter un moment précis ». Une fois le bilan donné, la note
  horodatée revient comme le matin. **À tester** : ce soir, ouvrir l'Accueil, vérifier qu'il n'y a qu'une rangée, puis
  toucher « Noter un moment précis ».

- **Version Play allégée et protégée (R8)** (28/10 01:33) — rien de nouveau à l'écran : la version Play est maintenant
  optimisée et « obscurcie » par l'outil officiel d'Android (R8), comme Google le demandait dans la Play Console
  (« optimisation du code DEX » sous le seuil, à corriger avant février 2027). Les plantages éventuels restent
  lisibles dans la Play Console (fichier de correspondance envoyé avec chaque version). Avant chaque version, un
  émulateur vérifie que la version obscurcie démarre, que ses modules natifs répondent (visage, abonnement, Health
  Connect) et qu'aucune pièce n'a été retirée par erreur. **À tester** (version de test interne suivante) : ouvrir
  l'app, la lecture du visage à l'ouverture, Premium, un rapport PDF ; dites-nous si quelque chose plante.

- **Nouveau téléphone : la montre « À reconnecter »** (28/10 04:33) — après une restauration par la sauvegarde
  Android, la carte « Montre Huawei » (Sources) disait encore « Connectée · batterie 80 % » alors que la clé de la
  montre (restée sur l'ancien téléphone, c'est voulu) avait été retirée et que la synchro automatique s'arrêtait sans
  rien dire. Elle dit maintenant « À reconnecter » avec un bouton « Reconnecter ma montre » (appairage avec le PIN, au
  geste seulement). **À tester** à votre prochaine réinstallation : Sources → « À reconnecter » → le bouton → PIN sur
  la montre → « Connectée ».

- **Les robots de Google comptés à part** (28/10 05:33) — rien de nouveau à l'écran. Le relais voyait 21 « nouvelles
  installations » en 7 jours alors que vous êtes seul sur la version Play : très probablement les appareils de test de
  Google (rapport de pré-lancement, qui parcourent l'app à chaque version envoyée et peuvent lancer une analyse IA).
  L'app les reconnaît maintenant (réglage système officiel de Firebase Test Lab) et le dit au relais, qui les compte à
  part (« dont N robot(s) du rapport de pré-lancement de Google » dans le résumé du déploiement). Une phrase ajoutée à
  la politique de confidentialité. Si, dans quelques jours, il reste beaucoup de « vraies » nouvelles installations,
  on réduira les crédits offerts à 5. **À tester** : rien.

- **Application plus légère** (28/10 03:33) — rien de nouveau à l'écran : la table nutritionnelle (Ciqual, 2 Mo) était
  copiée deux fois dans l'app (écrans et calculs d'analyse en arrière-plan) ; il n'en reste qu'une, lue au besoin. Un
  module Android inutilisé (ancienne installation des mises à jour) est aussi retiré. **À tester** : rien de particulier
  (Journal → Repas et Nutrition, Analyses doivent s'afficher comme avant).

- **Petits textes plus clairs** (28/10 00:33) — Journal : le stress de la montre se lit « 37 · normal » (détendu,
  normal, moyen, élevé : l'échelle de la montre) au lieu de « 37 / 99 ». Analyses : les calories d'activité ne se
  répètent plus sous « Marcher davantage ». Paramètres → Ce qui vous amène : sans choix, le texte dit que la carte
  ventre reste affichée. **À tester** : rien de particulier.

- **Analyses : une seule piste pour bouger** (27/10 22:33) — « Marcher davantage » et « Bouger davantage » ne
  s'affichent plus comme deux pistes : seule la plus solide reste. **À tester** : rien de particulier.

**En coulisses — chantier produit (jalon 5 : analyses avec délais)** : le moteur repas → ventre (3 fenêtres 0–4 h,
4–24 h, 24–48 h ; comparaison dans des blocs de 3 jours ; correction des comparaisons multiples ; test du décalage
temporel) passe le banc des fausses pistes depuis le 25/10 au soir, mais n'est pas encore affiché. La
notification du soir pour le bilan du ventre est livrée (26/10 01:33), et l'analyse jour par jour qui utilise ces
bilans aussi (26/10 02:33 : « mangé le jour même » ou « la veille », mêmes protections ; sur des journaux simulés sans
aucun effet, au plus 7 sur 200 gardent une fausse piste). Honnêteté : avec un bilan par jour, un effet net met 2 à
3 mois à ressortir. Les deux analyses sont affichées dans Analyses depuis le 26/10 03:33. Plus de puissance depuis le 26/10 04:33 : on ne teste plus que les 12 aliments
les mieux répartis dans vos jours (choisis sans regarder le ventre) et des aliments toujours mangés ensemble ne
comptent qu'une fois ; sur des journaux simulés avec beaucoup d'aliments rares, un vrai effet ressort 20 à 28 % plus
souvent, sans plus de fausses pistes. Depuis le 26/10 05:33, la nuit d'avant est prise en compte (I134 étape 1) : sur des
journaux simulés où seule la nuit gêne le ventre, le café des nuits courtes était accusé 7 fois sur 10, plus qu'une
fois sur 10 au plus ; un vrai effet ressort même plus souvent quand la nuit joue (22 → 31 sur 60). Depuis le 26/10
06:33, stress et temps d'écran de la veille aussi (I134 étape 2), mais seulement s'ils vont avec le ventre : ajoutés
à l'aveugle, les trois ensemble faisaient tomber la puissance de 45 à 9 sur 60 ; triés, les pièges « café » passent de
26–29 sur 30 à 3 au plus, sans perte de puissance. Depuis le 26/10 07:33, les aliments d'un même jour sont estimés ensemble (I134 étape 3) : sur des journaux simulés où seul l'oignon joue et où l'ail l'accompagne 8 fois sur 10, l'ail était accusé 23 fois sur 60, plus qu'une fois ; l'oignon garde sa puissance (50 → 49 sur 60). Si deux aliments jouent tous les deux et se mangent presque toujours ensemble, une seule piste reste et l'autre est citée dans ses détails. Suite : même chose pour les notes horodatées (facultatif), puis le reste du jalon 5.

**Votre demande du 26/10 14:45 (FODMAP par sous-groupe, table fiable) — premier constat** : vous aviez raison,
la table nutritionnelle n'est pas fiable. Sur 3 553 aliments, **3 506 ont exactement les mêmes micronutriments
qu'un autre aliment** (59 gabarits par catégorie : ail = oignon n'était qu'un cas parmi des milliers), 201 ont plus
de graisses saturées que de graisses, 145 ont une énergie incohérente avec leurs macros (abricot cru à 0 kcal, baba
au rhum sous-estimé de moitié). Les micronutriments affichés dans Nutrition sont donc à prendre avec des pincettes
jusqu'à la reconstruction. L'outil qui reconstruit la table depuis Ciqual (ANSES, Licence Ouverte : usage commercial
permis avec attribution) est prêt et testé, avec « inconnu » plutôt qu'une valeur inventée.
**✅ Table reconstruite le 26/10 16:33 depuis Ciqual 2025** (la table officielle de l'ANSES, publiée par l'ANSES
elle-même sur Zenodo sous licence CC BY 4.0, fichiers vérifiés par leur empreinte ; le site ciqual.anses.fr est
toujours en maintenance). Chaque valeur vient de Ciqual ou est « inconnue » (21 % des valeurs : Ciqual ne mesure pas
tout). Les 69 noms simples (« Banane », « Riz blanc cuit »…) pointent vers un aliment Ciqual précis : vos repas déjà
saisis sont recalculés sans rien perdre. Après : 33 aliments aux micronutriments identiques (de vrais doublons
publiés par Ciqual, ex. croissant pur beurre « artisanal » = « aliment moyen ») au lieu de 3 506, plus aucune
graisse saturée > graisses, 7 énergies « incohérentes » (vinaigres et confiseries sans sucres : polyols et acides que
le calcul simple ne compte pas). **Ce que vous verrez changer** (Journal, Nutrition) : surtout les micronutriments
(sodium changé de plus de 10 % sur 2 762 aliments, potassium 2 248, calcium 2 428, vitamine C 1 472) ; les calories
bougent peu (33 aliments à plus de 10 % : pâtes cuites 131 → 167 kcal, riz blanc cuit 130 → 155, poulet grillé
165 → 141) ; ail cru : potassium 200 → 530 mg, vitamine C 10 → 0,25 mg. En bas de Nutrition, la source est citée et
une phrase dit qu'une teneur non mesurée n'est pas comptée. Ensuite : les FODMAP isolés par sous-groupe (fructanes,
GOS, lactose, fructose, sorbitol, mannitol).
**✅ N3a le 26/10 18:33 : le calcul des FODMAP par sous-groupe est prêt (rien d'affiché encore).** Pour chaque repas,
l'app sait désormais estimer, groupe par groupe, combien de lactose, de fructose « en excès du glucose » et de polyols
il contient (mesures Ciqual : 1 739 aliments ont leur lactose, 1 883 leur fructose et glucose), quels aliments les
apportent, et si la portion dépasse le repère de départ publié (Varney et al. 2017 : 0,3 g de fructanes ou de GOS,
0,15 g de fructose en excès, 1 g de lactose, 0,4 g de polyols). Exemple : 125 ml de lait demi-écrémé → lactose au-dessus
du repère ; une poire de 150 g → fructose en excès. Les **fructanes et les GOS** (blé, oignon, ail, légumineuses) ne
sont pas mesurés par Ciqual : ils restent « inconnus » jusqu'à l'étape N3b, qui reprendra des mesures publiées dans
des articles scientifiques (citées aliment par aliment). Une valeur « sous la limite de détection » compte zéro, pour
ne jamais faire apparaître de lactose dans l'oignon.
**✅ N3a-bis + N3b (1re partie) le 26/10 22:33 : les fructanes, les GOS, le sorbitol et le mannitol de 32 aliments
courants sont maintenant connus (rien d'affiché encore).** Chaque valeur cite sa source : fructanes mesurés par
Ferjančič 2024 (oignon, poireau, pain, pâtes, blé, avoine, fruits à coque, fruits), GOS du soja et de la farine de pois
chiche (Natale 2025), sorbitol et mannitol répartis à partir des polyols Ciqual selon la table officielle japonaise
(poire, pêche, pruneau → sorbitol ; champignon de Paris, céleri → mannitol ; pomme 0,5 g). L'ail et l'échalote ne
sont connus que par une revue qui cite d'anciennes mesures : confiance basse. Exemples : 70 g d'oignon cru → environ
1,4 g de fructanes (repère 0,3 g) ; une pomme de 150 g → 0,75 g de sorbitol (repère 0,4 g) ; 100 g de tofu → 0,14 g de
GOS (sous le repère). Correction de méthode au passage : une teneur Ciqual « sous la limite de détection » (« < 0,5 g »)
ne fait plus passer un repas pour pauvre quand la portion pourrait dépasser le repère (100 g d'avocat : sorbitol
« on ne sait pas », plus « bas »). Reste pour N3b : les GOS des lentilles, pois chiches et haricots cuits (calcul
depuis le sec, il faut garder l'eau de Ciqual dans la table), et d'autres aliments de la table japonaise.

**✅ N4 le 26/10 23:33 : la carte de chaque repas dit quel FODMAP elle contient.** Journal → Repas, sous un repas :
une ligne pêche « Riche en fructanes : oignon » (un groupe par ligne, les 3 aliments qui en apportent le plus),
« Probablement riche en … » quand seule une valeur à confiance basse dépasse le repère (l'ail seul, par exemple). Le
chevron montre les grammes estimés et le repère (« ≈ 1,4 g · repère 0,3 g par repas »), avec la mention « une
hypothèse de départ : vos propres données priment ». Rien quand aucun groupe ne dépasse son repère, et un groupe
inconnu n'est jamais présenté comme bas. Seulement avec l'objectif « Mon ventre » (comme la carte ventre).
**À tester** : Journal → Repas, un repas avec de l'oignon, de l'ail, du lait ou une pomme → la ligne pêche ; toucher
le chevron.

**✅ N2b le 27/10 00:33 : Nutrition ne compte plus une teneur inconnue comme zéro.** Quand Ciqual n'a pas mesuré
un nutriment pour plus de 10 % (en poids) de ce que vous avez mangé, la ligne affiche « ≥ 25 µg/j » et une petite
étiquette « partiel » : c'est un minimum, l'apport réel est sans doute plus élevé. Sur les données de démo : oméga-3 et
folates. **À tester** : Journal → Nutrition, repérer les lignes « partiel » et lire la note en bas de page.

**✅ N5 le 27/10 02:33 : les pistes du ventre disent lequel des FODMAP.** Dans Analyses (objectif « Mon ventre »), le
facteur unique « Repas riches en FODMAP » est remplacé par six facteurs : « Repas riches en fructanes », « … en GOS »,
« … en lactose », « … en fructose en excès », « … en sorbitol », « … en mannitol » (repère de départ par portion
dépassé, présenté comme une hypothèse). Mêmes protections que les aliments (blocs de jours voisins, correction des
comparaisons multiples, décalage temporel, aliments mangés ensemble). Banc de 200 journaux simulés aux vrais noms
Ciqual : **pas plus de fausses pistes** (au plus 13/200, comme avant) ; un effet qui passe par le lait et le yaourt
est repéré **25 fois sur 200 au lieu de 13** (le lactose réunit les deux) ; un effet de l'oignon seul, 64 au lieu de 66.
« Vérifier avec une réintroduction guidée » ouvre le test du même groupe (lactose → lait ; fructanes → le groupe en
tête, vous choisissez blé, oignon ou ail). Honnêteté : si l'oignon, l'ail ou les pâtes reviennent presque tous les
jours, les fructanes restent « trop tôt pour dire » (trop peu de jours sans) : la réintroduction tranche mieux.
**À tester** : rien de visible tant que vous n'avez pas 28 jours de bilans du ventre ; ensuite, une piste « Repas riches
en … » doit mener au test du même groupe.

**✅ N3b-2 le 27/10 01:33 : les lentilles, pois chiches et haricots ont leurs GOS.** Ciqual ne les mesure pas ; on
part de mesures publiées sur légumineuses sèches (Siva 2019), ramenées au cuit avec l'eau de Ciqual et les pertes au
trempage et à la cuisson publiées (Njoumi 2019). Ordres de grandeur : 150 g de lentilles cuites ≈ 1,1 g de GOS
(repère 0,3 g), 120 g de pois chiches cuits ≈ 0,45 g, 50 g de pois chiches en conserve sous le repère. Toujours affiché
« Probablement riche en GOS » (valeur calculée, confiance basse). Le chevron de la carte d'un repas cite maintenant
les sources réellement utilisées (« Teneurs : Ciqual (Anses), Ferjančič 2024. »). **À tester** : Journal → Repas, un
repas avec des lentilles ou des pois chiches → la ligne pêche ; toucher le chevron.

**N3b préparé (run « idées » du 26/10 20:33)** : les teneurs que Ciqual ne mesure pas auront une source publique et
réutilisable : le sorbitol et le mannitol de la **table officielle japonaise** (pomme, poire, pêche, pruneau, cerise,
champignons, céleri…), les fructanes d'une étude slovène de 2024 (oignon, poireau, pain, pâtes, fruits, noix), les GOS
de deux études sur les légumineuses et le soja (lentilles et pois chiches cuits estimés depuis le sec, en confiance
basse). L'ail et l'échalote n'ont qu'une valeur citée par une revue (confiance basse). Restent inconnus : sorbitol de
l'avocat, mannitol du chou-fleur. Au passage, un défaut du calcul N3a sera corrigé avant tout affichage : une teneur
« inférieure à 0,5 g » ne doit pas faire dire « bas » quand la portion peut dépasser le repère (avocat, chou-fleur).

**Prochain chantier (préparé par le run « idées » du 26/10 08:33)** : la **réintroduction FODMAP guidée** et le
**rapport PDF pour votre médecin** (jalon 7) sont spécifiés : test d'un groupe sur 3 jours (portion de départ, puis
double, puis triple, en regardant les 24 h qui suivent), seulement après 3 jours de ventre calme, un groupe à la fois,
résultat en une phrase (« Blé : une portion moyenne passe ») ; rapport de 2 pages créé sur le téléphone, résumé
d'abord. Repères tirés d'une fiche patient du NHS et des conseils de l'université Monash, présentés comme des repères
à adapter avec votre diététicienne. Depuis le 26/10 09:33, la logique du test est écrite et vérifiée (7a : départ
seulement après 3 jours de ventre calme, une portion par jour, « C'est supportable ? » en cas de gêne, résultat en
une phrase, un seul test à la fois, deux jours sautés → le test repart du jour 1). Depuis le 26/10 10:33, les écrans
sont dans l'app (7b-1, ci-dessus) et le rappel de la portion aussi depuis 11:33 (7b-2) ; le lien depuis chaque piste ventre aussi depuis 12:33 (7c). Le rapport PDF est commencé (26/10 13:48) : son contenu
est calculé et vérifié (période de 2, 4 ou 12 semaines, ventre jour par jour, réintroductions, pistes « à confirmer »,
sommeil, aliments fréquents, sources ; bien-être estimé seulement si vous le cochez). Depuis le 27/10 03:33, le PDF
lui-même se dessine (N6a) : 2 pages A4 aux couleurs de Halcya, calendrier du ventre avec, dans chaque case, les
sous-groupes FODMAP du jour (Fn = fructanes, G = GOS, L = lactose…), tableau des jours riches par sous-groupe (simple
décompte, pas une analyse), fichier de 20 à 30 Ko ; le bouton « Rapport PDF pour mon médecin » arrive au prochain run
(N6b).

**Prochain gros chantier préparé (run « idées » du 27/10 08:33) : Halcya en anglais (jalon 9).** Mesuré : environ
2 000 phrases visibles (le mode diagnostic reste en français). Bonne nouvelle : la table officielle Ciqual 2025 donne
déjà le **nom anglais de chacun de ses 3 484 aliments**, donc rien à traduire à la main côté aliments (sauf 69 noms
simples). Plan en 8 étapes, la langue suit celle du téléphone (réglable), tout reste caché jusqu'à ce que l'anglais
soit complet. **Une décision pour vous, pas urgente (P32)** : vendre d'abord en France et dans les pays
francophones, puis au Royaume-Uni, en Irlande et dans le reste de l'UE quand l'anglais est prêt, et **pas aux
États-Unis** tant qu'un juriste n'a pas relu (deux règles américaines visent précisément les apps de santé).

**✅ 9a le 27/10 11:33 : le socle de la traduction est posé (rien de visible).** Les dates et les nombres passent
désormais par un seul réglage de langue (« 3,4 » et « mar. 27 oct. » en français, « 3.4 » et « Tue 27 Oct » en
anglais) ; les textes passeront par une petite fonction de traduction, écran par écran (prochaines étapes). Le
réglage « Langue » existe mais reste caché tant que l'anglais n'est pas complet : vous ne verrez aucun changement.

**Les deux remarques de la Play Console du 27/10 sont préparées (run « idées » de 20:33)** : ① « le bord à bord peut
ne pas s'afficher pour tous » : sur Android 8 à 14, l'app s'affiche encore sous des barres opaques ; une ligne dans le
code natif suffit (nos écrans gèrent déjà les bords), à vérifier sur un émulateur Android 11 ou 14 en plus ; ②
l'obscurcissement à 4 % : l'outil d'Android qui optimise et réduit le code (R8) est coupé. Il ne sera allumé que sur la
version Play (la version GitHub ne change pas) et ne passera en alpha qu'après une version de test interne sans
plantage : c'est la modification la plus délicate du natif (une erreur n'apparaît qu'en version finale), d'où un essai
complet sur émulateur (visage, Health Connect, Premium, PDF) avant tout merge. Échéance Google : février 2027.

**Protection des analyses IA offertes (Play Integrity, 28/10 02:33)** : premier bilan lu. Sur 7 jours, **votre
téléphone passe la vérification de Google** (1 installation « acceptée », aucune refusée) ; 51 analyses sont arrivées
sans jeton, mais le relais ne savait pas dire lesquelles venaient des essais automatiques de la CI et lesquelles de
vrais téléphones. C'est corrigé (rien de visible) : l'app dit maintenant pourquoi elle n'a pas de jeton (Google trop
lent, code d'erreur de Google Play) et le bilan sépare « CI » et « téléphones ». La protection reste en **observation**
(elle ne bloque personne) ; on ne la durcira que si les vrais téléphones passent tous, quelques jours après la
prochaine version. Rien à faire de votre côté, sauf faire une analyse IA de repas de temps en temps.

**Chantier montre** : état par type de donnée inchangé depuis la semaine dernière (voir l'archive S43, tableau
« Montre Huawei ») ; restent M6 (resynchronisation en arrière-plan) et la confirmation sur votre montre des données
🟡 (sommeil détaillé, VFC de journée, température de la peau, FC et allure des séances).

**👉 Vos prochaines actions, la plus utile d'abord**
0. **Pas et kcal (2 min)** : avec la version de 12:33 ou plus récente, comparez au même moment les pas et kcal du jour
   de la montre (écran Activité) et ceux du Journal de Halcya ; renvoyez les 4 chiffres. Si les kcal de Halcya sont
   bien plus basses que la montre, c'est normal : Halcya ne compte que les calories d'activité qu'elle reçoit ; dites-le
   et un run lira la dépense totale.
1. **P28 faite (merci)** : déclaration envoyée vers 15:35 (Caméra, « Autre », vidéo), **en cours d'examen chez
   Google**. Rien à faire d'ici là, sauf **tester la 100522** (affichée 522, test interne, vous seul) : mise à jour
   depuis le Play Store, activer la lecture au déverrouillage dans la carte bien-être, vérifier la notification
   permanente et son bouton « Arrêter ». Dites-nous quand la déclaration est acceptée : l'alpha recevra alors la
   fonction.
2. **Inviter les testeurs** : quand vous le déciderez (au plus tôt la semaine prochaine).
3. **P32** (pas urgent, avant la production) : dans quels pays vendre (proposition ci-dessus ; répondez
   « d'accord » ou votre liste).
4. **P25** (facultatif) : ce que promet le paywall (① appliqué par défaut). P13 fait le 26/10 (reste le W-8BEN
   quand Google le demande).

| Run | Type | Résultat |
|---|---|---|
| 27/10 20:33 — [Idées : bord à bord et R8 prêts à coder](runs/2026-10-27-2033-idees-bord-a-bord-r8.md) | 💡 | `IDEES.md` I184 (`EdgeToEdge.enable` avant `super.onCreate`, aucun appel déprécié, encarts CSS déjà là, émulateur API 30/34 à ajouter) et I185 (R8 : `release` = play seul, `proguard-android-optimize.txt`, règles Capacitor fournies, JNI ONNX/LiteRT à surveiller, `mapping.txt` via `deobfuscationFiles`, APK play release testé à l'émulateur) ; POL-PLAY-9 à 12 au BACKLOG ; journal seul |
| 27/10 23:33 — [Ventre du soir : une seule question](runs/2026-10-27-2333-ventre-soir-une-question.md) | 🎨 | PR #445 mergée (checks verts, merge bloqué à la session précédente) ; audit POL-PLAY-12 vierge + démo ; carte ventre du soir sans rangée en double ; POL-PLAY-13 à 15 au BACKLOG |
| 28/10 05:33 — [Robots de Google comptés à part](runs/2026-10-28-0533-appareils-test.md) | 🏗️ | INSTALLS-21 : l'app play signale les appareils Firebase Test Lab (`X-Test-Device`), le relais marque `testlab` (`first_credit`, `integrity`), résumé du déploiement « dont N robot(s) » ; confidentialité ; relais 84 tests, app 2 596 ; v332 (APK 34,5 Mo) |
| 28/10 04:33 — [Montre à reconnecter après une restauration](runs/2026-10-28-0433-montre-restauree.md) | 🎨 | SAUV (reste) : après une restauration de la sauvegarde Android, carte montre « À reconnecter » + « Reconnecter ma montre » au lieu d'un « Connectée » trompeur ; synchro auto en pause jusqu'au geste ; v331 (APK 34,5 Mo) |
| 28/10 03:33 — [Table Ciqual en un seul exemplaire](runs/2026-10-28-0333-table-unique.md) | 🏗️ | La table nutritionnelle n'est plus embarquée deux fois (application + worker d'analyse : 2 × 2 Mo) mais lue dans un seul fichier JSON ; dépendance native inutilisée retirée ; v330 (APK 34,5 Mo, −0,4 Mo) ; rien de visible |
| 28/10 02:33 — [Bilan Play Integrity lisible](runs/2026-10-28-0233-integrity-bilan.md) | 🏗️ | PR #450 (journal R8) mergée ; bilan 6b-2c lu (votre téléphone passe, 51 sans jeton) ; l'app envoie la raison d'un jeton manquant, le relais sépare CI et téléphones ; reste en observation |
| 28/10 01:33 — [R8 sur la version Play](runs/2026-10-28-0133-r8-play.md) | 🏗️ | POL-PLAY-10 (R8a) : release play optimisée et obscurcie (règles étroites ONNX / LiteRT), `mapping.txt` envoyé avec l'AAB, APK play release testé à l'émulateur (plugins, visage, journal) ; rien de visible |
| 28/10 00:33 — [POL-PLAY-13 à 15](runs/2026-10-28-0033-pol-play-13-15.md) | 🎨 | Phrase « Ce qui vous amène » sans choix ; plus de calories répétées sous « Marcher davantage » ; stress montre « 37 · normal » |
| 27/10 22:33 — [CI bord à bord réparée + une piste « mouvement »](runs/2026-10-27-2233-ci-bord-a-bord-pistes.md) | 🔧 | Job émulateur API 34 rouge sur main (attente DevTools sans délai) : délai, reconnexion, 3 essais ; POL-PLAY-12 : un seul levier « mouvement » |
| 27/10 21:33 — [Polissage play : bord à bord pour tous](runs/2026-10-27-2133-pol-play-9-bord-a-bord.md) | 🎨 | POL-PLAY-9 : `EdgeToEdge.enable` ; encarts CSS et clavier gérés par `SystemBarsPlugin` sous Android ≤ 14 (Capacitor ne le fait qu'à partir de 15) ; job émulateur API 34 |
| 27/10 19:33 — [Une seule piste « calories »](runs/2026-10-27-1933-pol-play-5.md) | 🎨 | POL-PLAY-5 : dépense de l'activité et dépense de la journée réunies en un seul facteur dans la liste des liens d'Analyses (le plus solide gardé, pas de « Se retrouve aussi » redondant) ; effets décalés rattachés aux mêmes alias. Liste POL-PLAY soldée ; suite : audit `--empty` écran par écran |
| 27/10 18:33 — [Tuiles « hier », repas sur une ligne, doublons d'Analyses](runs/2026-10-27-1833-pol-play-6-8.md) | 🎨 | POL-PLAY-6, 7, 8 : tuiles de l'Accueil qui reprennent la veille (« hier ») au lieu de « — » ; tuile repas du Journal sur une ligne ; « Alcool » plus en double (piste et collecte) ; ligne « Autres mesures » en phrase. Reste POL-PLAY-5 |
| 27/10 17:33 — [Audit démo clair/sombre : petits textes](runs/2026-10-27-1733-pol-play-4.md) | 🎨 | POL-PLAY-4 (1re partie) : Accueil, Journal, Analyses, Sources relus sur données de démo, clair et sombre ; « hier à 10:19 » sur la carte ventre ; plus de « (Health Connect) » dans un titre d'Analyses (test sur tous les libellés) ; ligne « visage » simplifiée ; défauts restants rangés en POL-PLAY-5 à 8 |
| 27/10 16:33 — [Accueil vierge sans montre supposée ; FODMAP « premium »](runs/2026-10-27-1633-pol-play-2-3.md) | 🎨 | POL-PLAY-2 et 3 : la ligne de l'Accueil vierge ne suppose plus de montre (« Pas et nuits peuvent venir de votre téléphone ; une montre ajoute le cœur · Ajouter une source ») ; « Tester un groupe FODMAP » : chevron détaché à droite, étiquette « premium » sur Play hors lancement (comme le rapport PDF) |
| 27/10 15:34 — [versionCode Play au-dessus de 100487](runs/2026-10-27-1534-versioncode-play.md) | 🏗️ | Votre brouillon P28 (100487) publié en test interne : « Play — AAB » envoie désormais 100000 + n (versionName et numéro affiché = n) ; brouillon P28 à 50000 + n (plus petit, ne bloque rien) ; interrupteur rallumé pour le test interne : **100522 accepté par Google et déployé avec la lecture au déverrouillage** (vous seul) ; v318 |
| 27/10 14:42 — [Pas de rapport PDF vide dans Analyses](runs/2026-10-27-1442-rapport-pdf-vide.md) | 🎨 | Audit play vierge (15 pages) ; Analyses (« Mon ventre ») ne pousse plus « Débloquer » pour un rapport PDF sans aucune note du ventre : ligne « Bientôt » à la place ; Données inchangé |
| 27/10 13:33 — [P28 : test interne avec la lecture au déverrouillage](runs/2026-10-27-1333-p28-test-interne.md) | 🏗️ | « Play — AAB » : interrupteur `FACE_UNLOCK_INTERNAL` (test interne seul propriétaire vérifié, versionCode normal, alpha jamais allumée) ; résumé « testeurs » retiré (décision du 27/10 13:00) ; v315 ; **Google refuse la 518 : « You must let us know whether your app uses any Foreground Service permissions. »** → interrupteur recoupé, ce 403 n'est plus pris pour un accès refusé ; P28 au propriétaire (chemin par le brouillon) ; v316 et 519 en test interne normalement |
| 27/10 12:33 — [🚑 Pas et kcal du jour](runs/2026-10-27-1233-pas-kcal-montre.md) | 🐛 | **v314** · signalement du 27/10 11:56 : kcal minute de la montre en cal (÷1000 à la synchro, migration `watchKcalFix.js`, correction à la lecture) ; pas : une source par heure (`activityTotals.js`, Journal, analyses, agrégats v2, écran Montre, premier import) ; garde-fou de plausibilité |
| 27/10 11:33 — [9a : socle i18n](runs/2026-10-27-1133-i18n-socle.md) | 🏗️ | `src/i18n/` (`t()`, pluriels, `appLocale()` dans 39 fichiers, `decimalMark()`), test de catalogue, réglage « Langue » caché (`VITE_I18N_EN`), `visual --lang=en` ; rien de visible ; 2 547 Vitest ; v313 |
| 27/10 10:33 — [Forme des selles](runs/2026-10-27-1033-forme-des-selles.md) | 🏗️ | I176 : « + Selles » dans la carte ventre (3 formes, Bristol sur demande), Journal, section du PDF ; 2 532 Vitest ; v312 |
| 27/10 09:33 — [Premium à jour + paywall des pistes ventre](runs/2026-10-27-0933-premium-pistes-ventre.md) | 🏗️ | `premiumBenefits` : pistes avec délais et PDF livrés (plus rien « en préparation ») ; `GutLinks` floutées sans premium sur Play (nombre de pistes, aucun aliment, « Débloquer ») ; conditions alignées ; 2 524 Vitest ; v311 |
| 27/10 08:33 — [Idées : jalon 9 (anglais) prêt à coder](runs/2026-10-27-0833-idees-jalon9-anglais.md) | 💡 | `IDEES.md` I180–I183 : ≈ 2 800 chaînes mesurées (≈ 2 000 visibles hors diagnostic), 41 `fr-FR` en dur, 25 fichiers Java ; `t()` maison, français = clé ; Ciqual 2025 `alim_nom_eng` 3 484 / 3 484 ; découpage 9a–9h ; P32 (pays, États-Unis exclus : HBNR, My Health My Data) ; journal seul |
| 27/10 07:35 — [N6c : partage du PDF vérifié sur l'émulateur](runs/2026-10-27-0735-n6c-partage-pdf-emulateur.md) | 🏗️ | script CI `pdf-share/drive.mjs` (job API 35, non bloquant) : feuille de partage avec le PDF, fichier de 20 Ko dans Documents, partage annulé → message, 2ᵉ rapport du jour ; tout vert ; PR #421 (journal) mergée ; 2 519 Vitest ; v310 |
| 27/10 06:33 — [N4 (reste) : FODMAP avant d'enregistrer](runs/2026-10-27-0633-n4-fodmap-avant-enregistrer.md) | 🏗️ | `MealFodmapLine` sous l'éditeur du résultat d'une analyse photo, de « Décrire » / « Refaire » et de « Modifier », en direct sur les grammes corrigés ; option `--food-analysis=fodmap` des captures ; 2 519 Vitest ; v309 |
| 27/10 05:33 — [N3c : score FODMAP depuis les sous-groupes](runs/2026-10-27-0533-n3c-fodmap-score-groupes.md) | 🏗️ | le moteur du bien-être compte les groupes FODMAP au-dessus du repère (repas le plus chargé) au lieu du score 0–3 inventé, retiré de la table ; 1 104 → 600 aliments « chargés » à 100 g ; 2 517 Vitest ; v308 |
| 27/10 04:33 — [N6b : bouton « Rapport PDF pour mon médecin »](runs/2026-10-27-0433-n6b-rapport-pdf.md) | 🏗️ | carte en bas d'Analyses (objectif ventre) et dans Données : 2 / 4 / 12 semaines, bien-être décoché par défaut, PDF dans Documents puis partage Android (`@capacitor/share` 8.0.3, MIT) ; premium sur play ; essai de bout en bout sur les données de démo ; 2 511 Vitest ; v307 |
| 27/10 03:33 — [N6a : le rapport PDF se dessine](runs/2026-10-27-0333-n6a-rendu-pdf.md) | 🏗️ | `renderPdf.js` (pdf-lib + fontkit, MIT) : 2 pages A4, calendrier avec sous-groupes FODMAP abrégés, décompte par sous-groupe, polices TTF embarquées (conversion WOFF → TTF scriptée) ; 19–26 Ko ; rien d'affiché ; 2 507 Vitest ; v306 |
| 27/10 02:33 — [N5 : pistes du ventre par sous-groupe FODMAP](runs/2026-10-27-0233-n5-pistes-fodmap.md) | 🏗️ | facteurs `fodmap:<groupe>` au lieu de `fodmap_eleve` ; banc 200 jeux : nulles ≤ 13/200 (inchangé), lactose 25 vs 13/200, oignon 64 vs 66 ; lien vers le test du même groupe ; calendrier du rapport par sous-groupe ; 2 496 Vitest ; v305 |
| 27/10 01:33 — [N3b-2 : GOS des légumineuses cuites](runs/2026-10-27-0133-n3b2-gos-legumineuses.md) | 🏗️ | `legumeGos.mjs` : eau Ciqual 2025 × Siva 2019 (tableau 5, relu) × pertes Njoumi 2019, 13 aliments en `analogie` recalculables ; sources citées dans le chevron de la carte d'un repas ; 2 478 Vitest ; v304 |
| 27/10 00:33 — [N2b : plus de faux zéro dans Nutrition](runs/2026-10-27-0033-n2b-nutrition-partiel.md) | 🏗️ | `unknown_share` au poids mangé dans `computeTotalsFromItems` ; « ≥ » + « partiel » dans Nutrition au-delà de 10 % ; 2 471 Vitest ; v303 |
| 26/10 22:33 — [N3a-bis + N3b : mesures FODMAP publiées](runs/2026-10-26-2233-n3b-mesures-fodmap.md) | 🏗️ | `fodmapMeasurements.json` v2 (une entrée par groupe, source, tableau, confiance) : 32 aliments, 4 sources (Ferjančič 2024, Natale 2025, MEXT 2020, revue Wang & Cheong 2023) ; polyols Ciqual répartis plutôt que remplacés ; « < x » : `bas` seulement si la portion reste sous le repère au plafond de la limite ; test `UpdateBanner` fiabilisé ; rien d'affiché ; 2 457 Vitest |
| 26/10 23:33 — [N4 : FODMAP sur la carte d'un repas](runs/2026-10-26-2333-n4-carte-repas-fodmap.md) | 🏗️ | « Riche en fructanes : oignon » sous chaque repas (objectif ventre), « probablement » en confiance basse, grammes et repère au chevron ; `mealFodmapHighlights` ; 2 466 Vitest ; v302 |
| 26/10 21:33 — [P28 : brouillon pour faire apparaître la déclaration](runs/2026-10-26-2133-p28-brouillon.md) | 🏗️ | Workflow « Play — brouillon P28 » : AAB play signé avec la lecture au déverrouillage, versionCode à part, envoyé en brouillon sur le test interne (jamais déployé ; **`p28-100487` accepté sans erreur**, v300) ; les envois normaux gardent ce brouillon ; tests de l'envoi Play (4 nouveaux) |
| 26/10 20:33 — [Idées : N3b prêt à coder](runs/2026-10-26-2033-idees-n3b-sources.md) | 💡 | Sources ouvertes des FODMAP non mesurés par Ciqual (`IDEES.md` I177–I179) : sorbitol / mannitol de la table officielle japonaise MEXT 2020, fructanes Ferjančič 2024, GOS Siva 2019 et Natale 2025, pertes à la cuisson Njoumi 2019 ; défaut trouvé dans N3a (« < 0,5 » compté 0) → N3a-bis ; page P28 en ligne vérifiée |
| 26/10 19:33 — [P28 : film vert, PR #398 mergée](runs/2026-10-26-1933-p28-video-vert.md) | 🏗️ | Deux causes trouvées : l'appui « déplier » tombait sur toute la ligne de la notification (ouvrait l'app) ; connexion DevTools gardée sur une ancienne redirection (port neuf à chaque essai, sans keep-alive). **Film complet de 1 min 48 s** : divulgation → accord → notification avec « Arrêter » → caméra au déverrouillage → « Arrêter » → interrupteur coupé ; publication lancée sur main |
| 26/10 18:33 — [N3a : FODMAP par sous-groupe (calcul)](runs/2026-10-26-1833-n3a-fodmap-sous-groupes.md) | 🏗️ | `fodmapGroups.js` : lactose / fructose en excès / polyols depuis Ciqual (« < x » = traces = 0), repères Varney 2017, niveau élevé / bas / inconnu par repas, aliments contributeurs ; `fodmapMeasurements.json` vide prêt pour N3b ; rien d'affiché ; 2 448 Vitest |
| 26/10 17:33 — [P28 : mise au point du film](runs/2026-10-26-1733-p28-video-film.md) | 🏗️ | Reprise de la PR #398 : écran au format de l'A56 (720 × 1560), notification dépliée, ffmpeg statique ; un film de 106 s complet jusqu'au déverrouillage, puis la WebView n'a plus été trouvée par le script sur 2 essais → la prise existe mais la WebView répond trop lentement (délai porté à 30 s, essai suivant à lire) → **PR #398 toujours ouverte** |
| 26/10 16:33 — [N2 : table rebâtie depuis Ciqual 2025](runs/2026-10-26-1633-n2-table-ciqual-2025.md) | 🏗️ | `ingredientsNutrition.json` reconstruite depuis Ciqual 2025 (Anses, Zenodo, CC BY 4.0, md5 vérifiés) : code Ciqual par aliment, inconnu = null, 69 alias pour les noms simples, mêmes 3 553 clés dans le même ordre ; audit 3 506 → 33 micros recopiés, 201 → 0 AGS > lipides ; attribution dans Nutrition |
| 26/10 15:46 — [P28 : vidéo filmée par la CI](runs/2026-10-26-1546-p28-video-ci.md) | 🏗️ | Workflow « Play — vidéo P28 » (APK d'aperçu, émulateur, pilotage DevTools + appuis adb, preuve par plan, publication Pages) ; caméra au déverrouillage prouvée, notification pas encore filmée → **PR #398 ouverte, non mergée** ; ciqual.anses.fr toujours en 503 |
| 26/10 14:53 — [N1 : audit de la table nutritionnelle](runs/2026-10-26-1453-n1-audit-ciqual.md) | 🏗️ | Audit chiffré (3 506/3 553 aliments aux micronutriments recopiés, 201 AGS > lipides, 145 énergies fausses) + importeur Ciqual testé ; ciqual.anses.fr en maintenance, reconstruction au run suivant ; 20 tests de plus |
| 26/10 13:48 — [I175-1 : contenu du rapport médecin](runs/2026-10-26-1348-i175-1-build-report.md) | 🏗️ | Modèle pur du rapport PDF (`buildReport.js`, 2 pages : en bref + détail), rien d'affiché ; 2 396 Vitest |
| 26/10 11:33 — [7b-2 : rappel de la portion du jour](runs/2026-10-26-1133-7b2-rappel-portion.md) | 🏗️ | Notification « Votre portion du jour » à l'heure choisie (natif, deux variantes, au plus 3 rappels, toucher ouvre le test) ; état du test dans la carte d'entrée d'Analyses ; 2 356 Vitest, 4 JUnit de plus |
| 26/10 12:33 — [7c : vérifier une piste ventre](runs/2026-10-26-1233-7c-verifier-piste.md) | 🏗️ | Lien « Vérifier avec une réintroduction guidée » sur chaque piste ventre, aliment présélectionné (correspondance aliment → groupe, exclusions lait végétal / sans gluten) ; 2 384 Vitest |
| 26/10 10:33 — [7b-1 : écrans de la réintroduction](runs/2026-10-26-1033-7b-ecrans-reintroduction.md) | 🏗️ | `/reintroduction` : choix du groupe (étiquettes d'état), préparation (portions modifiables, 3 jours calmes avant), jour en cours (frise, portion en un geste, « supportable ? », reprise), résultat ; carte « Tester un groupe FODMAP » dans Analyses ; premium coché ; 2 339 Vitest |
| 26/10 09:33 — [7a : machine de réintroduction](runs/2026-10-26-0933-7a-machine-reintroduction.md) | 🏗️ | `fodmapChallenge.js` : 6 groupes, 3 jours calmes avant, ×1 / ×2 / ×3 sur 24 h, « supportable ? », verdict, pause de fin, un test à la fois, 2 jours sautés → pause ; « intolérance » / « allergie » interdits ; rien d'affiché ; 2 329 Vitest |
| 26/10 08:33 — [Idées : jalon 7 prêt à coder](runs/2026-10-26-0833-idees-jalon7-reintroduction-pdf.md) | 💡 | Réintroduction FODMAP guidée (I174 : ×1 / ×2 / ×3 sur 24 h, 3 jours calmes avant, machine + 4 écrans, découpage 7a–7d), rapport PDF 2 pages (I175, `pdf-lib` MIT), selles facultatives (I176) ; journal seul |
| 26/10 07:33 — [I134 étape 3 : aliments ensemble](runs/2026-10-26-0733-i134-aliments-ensemble.md) | 🏗️ | `gutDays` : pistes recomparées à exposition égale aux pistes plus nettes (même seuil de p) ; piège ail 23 → 1/60 ; « Souvent mangé avec » dans les détails ; 2 300 Vitest |
| 26/10 06:33 — [I134 étape 2 : stress et écran](runs/2026-10-26-0633-i134-stress-ecran.md) | 🏗️ | `gutDays` : nuit / stress / écran de la veille candidats, retenus si liés au ventre (z ≥ 2 en valeur absolue, 2 au plus), coupure médiane équilibrée ; pièges café ≤ 3/30 ; « à … comparables » ; 2 293 Vitest |
| 26/10 05:33 — [I134 étape 1 : nuit comparable](runs/2026-10-26-0533-i134-nuit-comparable.md) | 🏗️ | `gutDays` : blocs × nuit courte / longue (si nuits connues pour 2 bilans sur 3) ; piège café 7/10 → ≤ 1/10 ; puissance 22 → 31/60 quand la nuit joue ; « à nuit comparable » dans les détails ; 2 285 Vitest |
| 26/10 04:33 — [I173 : moins de comparaisons](runs/2026-10-26-0433-i173-moins-de-comparaisons.md) | 🏗️ | 12 aliments testés au plus (les mieux répartis) + FODMAP, jumeaux comptés une fois ; longue traîne : 42 → 51 et 50 → 64/200 ; nulles ≤ 5/100 ; 2 280 Vitest |
| 26/10 03:33 — [Pistes ventre dans Analyses](runs/2026-10-26-0333-pistes-ventre-analyses.md) | 🏗️ | `gutLinks.js` + `GutLinks.jsx` : « Votre ventre et vos repas » (une piste par aliment, mangés ensemble regroupés, I171 a/b, « Bientôt N/28 ») ; option `--gut-links` des captures ; 2 276 Vitest |
| 26/10 02:33 — [I170 étape 3 : analyse jour par jour](runs/2026-10-26-0233-i170-analyse-jour.md) | 🏗️ | `gutDays.js` (jour même / veille, blocs de 7 j + BH + TTS) ; banc des nulles ≤ 7/200 ; rien d'affiché ; 2 266 Vitest |
| 26/10 01:33 — [I170 étape 2 : bilan du ventre par notification](runs/2026-10-26-0133-i170-notification-soir.md) | 🏗️ | Notification native Calme / Gêne / Douleur (20 h ou heure apprise, avant minuit, choix × carte ventre) ; proposée dans la carte, interrupteur dans Paramètres ; 2 256 Vitest, 15 JUnit |
| 26/10 00:33 — [I170 étape 1 : bilan du soir du ventre](runs/2026-10-26-0033-i170-bilan-du-soir.md) | 🏗️ | Archive S43 ; carte « Votre ventre » : question du soir à partir de 18 h (`scope: 'day'`, une fois par jour), ignorée par le moteur par fenêtres, comptée dans les 7 jours ; option `--tz` des captures ; 2 240 Vitest |

---

## Charte

Ce dossier appartient à Claude. C'est sa mémoire entre deux exécutions de la routine
autonome (une toutes les 2 h) : chaque exécution démarre sans aucun souvenir et
**doit lire ce fichier en premier**. Claude peut et doit faire évoluer cette charte
quand il trouve une meilleure façon de travailler (en le notant dans le compte rendu du run).

| Fichier | Rôle |
|---|---|
| `README.md` | Résumé de la semaine en cours (en tête) + charte : mission, principes, protocole d'un run |
| `BACKLOG.md` | Vision, chantiers long terme, backlog priorisé, idées en vrac |
| `RESEARCH.md` | Veille : besoins utilisateurs, ce qui marche en health tech, avancées ML — avec sources |
| `IDEES.md` | Idées des runs « idées » (08 h / 20 h Paris), classées impact × faisabilité, avec sources et pistes |
| `runs/AAAA-MM-JJ-HHMM-<slug>.md` | Un compte rendu par exécution (un fichier par run = pas de conflit Git) |
| `semaines/AAAA-Sww.md` | Résumés des semaines passées |
| `INFRA.md` | Infrastructure (20/10 au soir) : Google Cloud `healthtrack-824b26`, connexion GitHub sans clé (WIF, `main` seulement), comptes de service, Vertex AI, Play, ce que la CI peut faire seule |
| `DESIGN.md` | Identité visuelle « Clair et précis » validée le 20/10 au soir : couleurs, polices, formes, icône, maquettes, étapes de mise en œuvre |
| `PRODUIT.md` | **Chantier produit (décisions du 20/10 au soir)** : décisions, 10 jalons et leur état, inventaire des écrans, « Actions du propriétaire » — à lire juste après ce résumé |
| `BIEN-ETRE-AUTO.md` | État des lieux et plan du chantier « bien-être entièrement automatique » (consigne §00000), décisions Y / X, ce qu'il faut valider sur le téléphone |
| `protocoles/<famille>.md` | Spécifications de protocoles d'appareils, écrites avec nos mots (sources citées) : le code des pilotes est écrit à partir d'elles |

---

## 000000000. Décisions produit du propriétaire du 20 octobre 2026 au soir — CADRE GÉNÉRAL (remplace §00000 / §0000000 comme cadre)

Objectif : un **produit vendable sur Google Play**, compréhensible en 30 s, sans jamais casser ce qui marche.
Détail complet, jalons, inventaire et actions du propriétaire : **[`PRODUIT.md`](PRODUIT.md)** (le prompt de la
routine fait foi). Points clés pour chaque run :
- **Workflow « Play — AAB »** (21/10) : tant que le propriétaire n'a pas fait P9, il est rouge sur `main` avec le
  message « Clé d'envoi Play absente » (ou « Accès refusé ») — c'est attendu, **pas** la « priorité absolue » de
  réparation ; tout autre échec de ce workflow, si.
- **Ordre** : signalement en cours éventuel → jalons de `PRODUIT.md` dans l'ordre (2 nettoyage → 3 variantes
  play / sideload → 4 onboarding + « aha » → 5 analyses avec délais → 6 Billing, paywalls, crédits, relais Gemini →
  7 FODMAP + PDF → 8 Health Connect → 9 i18n → 10 fiche Play). Un run = une étape testable et mergeable.
- **Textes** : « bien-être » (plus « humeur ») ; « local par défaut, IA optionnelle et clairement signalée » (jamais
  « 100 % privé ») ; jamais « diagnostiquer », « prédire une crise », « traiter » → « comprendre vos tendances »,
  « estimation, pas un diagnostic ». Garde-fou automatique : `app/src/data/wording.test.js`.
- **Gratuit / payant** : collecter est gratuit, comprendre est payant ; **ne jamais bloquer une fonction locale**.
- **Design** : pas de nouvelle identité tant que `journal/DESIGN.md` n'existe pas ; centraliser en tokens.
- **Interdits** : créer des comptes, payer, déployer, publier sur le Play Store → « Actions du propriétaire ».
- Le bien-être automatique (§0000000) et la montre (§000, maintenance A.1–A.3) restent valables, après les jalons.


**Ajout du 21/10 00:30** — le prompt apporte deux sections lues pour la première fois : **INFRASTRUCTURE ET
AUTONOMIE** (→ [`INFRA.md`](INFRA.md) : aucun identifiant dans la session ; Google Cloud et Google Play uniquement via
GitHub Actions sur `main` avec Workload Identity Federation ; Vertex AI sans clé API ; la routine peut déployer le
relais et publier sur les pistes de test, jamais en production) et **IDENTITÉ VISUELLE** (→ [`DESIGN.md`](DESIGN.md) :
« Clair et précis », tokens, Figtree + IBM Plex Mono embarquées, icône « H nuit », maquettes ; appliquée par étapes,
un run = une étape, captures claires et sombres). Couleurs : uniquement via `app/src/theme/tokens.css` (tests).

## 00000000. Signalement du propriétaire du 20 octobre 2026 à 19:05 — mise à jour bloquée sur « Téléchargement… » — corrigé au run 20/10 20:30 (à confirmer sur l'A56)

Bandeau « version 187 » figé sur « Téléchargement… » sans aucune indication (Galaxy A56, 4G). Cause : APK passé de
6,8 à 33,6 Mo (ONNX Runtime 18 Mo) et téléchargé d'un bloc en mémoire (`CapacitorHttp` → base64 → pont → `writeFile`),
sans délai ni progression. Correction : `AppUpdatePlugin` (DownloadManager + vérification taille / SHA-256 / paquet)
et `services/appUpdate.js` + `UpdateBanner` (progression, étapes, blocage 45 s, Réessayer, navigateur). La version
installée chez le propriétaire ne peut pas en profiter : **installation manuelle une fois** depuis
`https://github.com/spreadzenox/HealthTrack/releases/latest`, puis essai du bouton à la release suivante.
**Leçon** : tout ce qui grossit l'APK se mesure à la release (taille notée après chaque merge, déjà au protocole) ; un
téléchargement sans progression ni délai est une panne silencieuse — toujours afficher l'avancement et une sortie.

## 0000000. Consigne du propriétaire du 19 octobre 2026 au soir — lecture du bien-être 100 % automatique, sans attendre la calibration (prime sur l'ordre de §00000)

Message : **« Je ne veux pas avoir à attendre les 30 jours de calibration, quitte à embarquer un modèle plus puissant :
je veux une lecture du bien-être 100 % auto. »**
- Dès la **première lecture réussie**, l'app affiche une estimation de l'humeur et du bien-être (du moment et du jour),
  par un modèle pré-entraîné qui marche d'emblée, sans aucune note. Préférer un modèle qui sort **valence et éveil**
  (ex. HSEmotion `enet_b0_8_va_mtl`) plutôt que des classes d'émotions ; combiner visage et voix quand la voix sera là.
- Choisir le modèle le plus fiable qui tourne correctement sur un Galaxy A56 (LiteRT ou ONNX, GPU / NNAPI si possible),
  quelques dizaines de Mo acceptés ; documenter dans `journal/` le choix, les alternatives, la précision publiée, la
  taille, la latence, la consommation et la **licence (compatible obligatoire)** ; trop gros pour le dépôt →
  téléchargé au build ou au premier lancement depuis une source officielle, empreinte vérifiée ; aucune donnée de
  l'utilisateur envoyée.
- Notes manuelles et calibration personnelle **facultatives** : elles affinent (ligne de base, adaptation
  personnelle), elles ne conditionnent **jamais** l'affichage. Retirer « Rien n'est affiché avant… » et la condition
  des 30 jours partout où elle bloque.
- Honnêteté : niveau de confiance (lectures du jour, qualité / cadrage du visage, accord entre signaux), toujours
  « estimation », jamais diagnostic ; l'incertitude diminue avec les lectures et la calibration facultative.
- D5 (anti-circularité) et D6 (science personnelle) inchangés : l'estimateur n'utilise que visage, voix et
  auto-déclaration facultative.
- Livraison par étapes fusionnables : **1) estimation dès la première lecture avec le modèle actuel + verrou retiré
  (✅ run 19/10 22:30)** ; 2) modèle valence / éveil plus puissant ; 3) fusion visage + voix. Tests et captures à
  chaque étape.
- Runs « idées » : veille en priorité sur ce choix de modèle (comparatif précision / poids / licence des modèles
  valence-éveil faciaux et vocaux embarquables, benchmarks AffectNet, AFEW-VA…, retours de terrain).

**Décision de l'étape 1** (run 19/10 22:30, `app/src/services/mood/faceMood.js`) : en attendant le modèle valence /
éveil, une valence **a priori** est tirée des indices de blendshapes déjà mesurés (AU12, AU6 + AU12 → +, AU15, AU4,
AU1 → −, poids fixes documentés), note = 2,5 + 2,5 × valence ; le neutre de population est remplacé peu à peu par le
**visage habituel** de la personne (médianes 28 j, poids j / (j + 7)) ; la calibration Ridge sur les notes (≥ 14 jours,
gardée si ≥ 10 % mieux que la moyenne en LOO) prend le relais quand elle existe. Fourchette = √(erreur du modèle² +
dispersion des lectures² / n) × pénalités qualité / cadrage. Cohérent avec D6 : l'a priori est présenté comme une
hypothèse générale, supplantée par les données personnelles dès qu'elles suffisent. La porte `gate.js` reste, comme
**vérification facultative** affichée, sans rien bloquer.

## 000000bis. Signalement du propriétaire du 19 octobre 2026 à 15:05 — corrigé au run 19/10 16:30 — ✅ RÉSOLU (confirmé le 20/10 19:05)

Confirmé par la capture du propriétaire du 20/10 19:05 : carte « Humeur estimée — Confiance moyenne », 44 lectures
automatiques dans la journée, deux modèles d'accord. Chantier clos, ne pas rouvrir.


« J'ai déverrouillé plusieurs fois et toujours aucune prise de photo automatique. Le test manuel fonctionne. Je
déverrouille avec l'empreinte. » Diagnostic : « Aucun déverrouillage depuis minuit », service actif, caméra
autorisée (« seulement lorsque l'appli est utilisée »), batterie sans restriction. Cause : le récepteur
`USER_PRESENT` du service était enregistré `RECEIVER_NOT_EXPORTED` ; la diffusion vient de SystemUI (pas l'uid
système), donc filtrée. Correctif : récepteur `RECEIVER_EXPORTED` (diffusions protégées) livré sur le fil du service,
secours `UnlockWatch` (interrogation de `isKeyguardLocked` 60 s après `SCREEN_ON`, écran allumé déjà déverrouillé),
diagnostic v2 (allumages / déverrouillages du jour par source, dernier, démarrage du service, app-op caméra,
12 dernières tentatives avec l'erreur exacte), état « À relancer » + `start({ restart })`, guide Shizuku / ADB.
**Leçon** : une diffusion système reçue dynamiquement se teste avec son **émetteur réel** en tête (SystemUI ≠
system_server) ; `RECEIVER_NOT_EXPORTED` ne convient qu'aux diffusions de l'app elle-même. Et tout déclencheur doit
avoir un compteur « reçu » distinct du compteur « traité » pour que le diagnostic dise où ça casse.

## 000000. Signalement du propriétaire du 19 octobre 2026 à 08:37 — corrigé au run 19/10 10:30

« Je ne vois pas la carte pour la lecture du visage dans connecteur. » Cause : `connectorsLayout` ne mettait la carte
`face` en tête que **activée** ; désactivée, elle tombait dans le volet replié « Brancher une autre source », sous la
montre. Correctif : dans l'app Android (`isFaceSenseAvailable()`), `face` est toujours la première source active ;
`nothingSending` garde « Sources à brancher » ouvert au premier lancement ; message + « Réessayer » si le plugin natif
ne répond pas. Tests : `connectorsLayout.test.js`, `Connectors.test.jsx` (Android natif simulé), `FaceSenseCard.test.jsx`.
**Leçon** : une carte « censée être en tête » se vérifie dans l'état **par défaut** du propriétaire (non activée,
montre connectée), pas seulement avec le faux plugin actif.

## 00000. Consigne du propriétaire du 18 octobre 2026 au soir — *remplacée comme cadre général par §000000000 le 20/10 au soir* (le bien-être automatique reste un pilier)

Message du propriétaire : **« Ok à partir de maintenant concentration maximale sur la collecte entièrement automatique
du bien-être »**. Objectif : que HealthTrack connaisse l'humeur et le bien-être du propriétaire, jour après jour et au
fil de la journée, **sans qu'il ait rien à saisir** ; l'auto-déclaration en un geste reste possible comme calibration
et vérité terrain, jamais obligatoire.
- **Tous les runs de code** livrent une étape testable et fusionnable de ce chantier ; les runs « idées » (08 h / 20 h)
  y consacrent toute leur veille (émotions faciales / vocales embarquées, phénotypage par l'usage du téléphone, Emobot
  et concurrents, validité des mesures, retours d'utilisateurs, Android 14–16 / One UI).
- Contenu : points 4 (visage via service caméra « niveau 2 », voix, usage du téléphone / des réseaux sociaux), 5
  (anti-circularité) et 6 (science personnelle) des directives du 12/10 (§00).
- Ordre conseillé : (1) état des lieux + plan (**fait : [`BIEN-ETRE-AUTO.md`](BIEN-ETRE-AUTO.md)**) ; (2) cœur Y / X
  et test anti-circularité (existant) ; (3) visage (service niveau 2, modèle embarqué, aucune image gardée, diagnostic
  exportable) ; (4) voix ; (5) usage du téléphone / réseaux sociaux (décidé : **X**) ; (6) restitution simple
  (estimation du jour, incertitude, jamais un diagnostic).
- Signaux physiologiques de la montre (stress / VFC, FC, sommeil) : **décidé le 18/10 22:30 → X**, jamais en entrée
  de l'estimateur (voir `BIEN-ETRE-AUTO.md` §2).
- Validation sur l'appareil réel (Galaxy A56, One UI) : dire précisément au propriétaire quoi faire et quoi renvoyer,
  dans le compte rendu et dans le résumé de la semaine.
- **En pause** : petites corrections montre A.1–A.3 (livrées de toute façon le 18/10 16:30), nettoyage de l'UI (D1),
  performance (D2), interconnexion d'autres appareils. Exceptions : build / release cassés, PR « [Auto] » rouge,
  régression bloquante signalée, travail strictement nécessaire au bien-être automatique.

## 0000. Consigne du propriétaire du 18 octobre 2026 — PRIORITÉ ABSOLUE — *remplacée par §00000 le 18/10 au soir* (prime sur tout, y compris l'ordre du 12/10)

**A. Régression de l'écran montre** (capture du 18/10 11:06, « Ça ça ne marche pas ») : test bloqué sur « Test en
cours… » dès « Apps qui peuvent tenir la montre » ; carte « Libérer et appairer » qui propose « Appairer » alors que
la montre est appairée et synchronise ; « 14 pas aujourd'hui → 2 mesures » à 11 h à vérifier. Attendu : délai
maximal par étape, erreur claire au lieu d'un blocage, test qui marche montre déjà connectée, carte cohérente avec
l'état réel, synchro complète ; tests pour chaque cas ; ne casser ni l'appairage, ni l'authentification, ni la
synchro. → **Corrigé au run du 18/10 12:30** (voir son compte rendu). **Confirmé sur l'appareil réel par le
propriétaire (capture du 18/10 15:03)** : le test se termine (« Relancer le test »), titre « HUAWEI WATCH GT 6 Pro-169 »,
verdict « La montre répond à HealthTrack — protocole v2, HiChain 3 (GCM) ; HealthTrack synchronise déjà cette montre
(dernière synchro réussie il y a 4 h) : rien d'autre à faire ». Étapes : ✓ Bluetooth · – Apps (« délai dépassé
(8 s) ») · ✓ Recherche (appairée, ne s'annonce pas) · ✓ Connexion directe (classique) · ! Services (« 2 services
connus, Huawei non listé ») · ✓ Canal Huawei · ✓ Paramètres du lien. **Restes à traiter en petites corrections (un
seul run, sans freiner B)** : **A.1** détection des apps rapide et fiable (ou échec expliqué) ; **A.2** plus
d'avertissement « Huawei non listé » quand le canal s'ouvre en classique ; **A.3** resynchro de fond réellement à la
fréquence prévue + historique du jour complet ; tests pour chaque cas. → **A.1–A.3 livrés au run du 18/10 16:30.**
**B. Ensuite : l'estimation automatique du bien-être et de l'humeur** (« une fois que c'est fixé j'aimerais que ça
avance le côté estimation du bien-être automatique ») : D4 (humeur captée par visage / voix, approche Emobot) et D5
(anti-circularité) passent **devant** D1 (nettoyage de l'UI) et D2 (performance), en respectant D6.
**Ordre des « Prochaines étapes » (BACKLOG)** : 1) petites corrections montre restantes (A.1 à A.3) ; 2) estimation automatique du
bien-être (D4 + D5, D6) ; 3) nettoyage de l'UI ; 4) performance. Runs « idées » : la régression d'abord tant
qu'elle n'est pas fusionnée.

## 000. PRIORITÉ ABSOLUE (propriétaire, 12 octobre 2026 au soir) — la montre d'abord → **EN MAINTENANCE depuis le 15/10**

> **Mise à jour du propriétaire du 15 octobre 2026, mot pour mot : « Ça marche côté montre, plus besoin de se
> concentrer là-dessus ».** Objectif atteint : HealthTrack appaire, authentifie et relit la GT 6 Pro sans
> Gadgetbridge ni Huawei Santé. **D3 passe en maintenance** : les runs ne le traitent plus en premier. On n'y revient
> que pour (1) corriger une régression, (2) exploiter un journal de diagnostic envoyé par le propriétaire, ou
> (3) compléter au fil de l'eau (types de données manquants : stress, VFC de journée, séances auto ; resynchro en
> arrière-plan) quand c'est le travail le plus utile du moment. **L'ordre redevient celui du §00 : D1 (nettoyage de
> l'UI) en tête, puis D2, D4, D5, D6.** Les règles ci-dessous (parcours, licence, méthode, pilote générique) restent
> valables pour tout travail sur les montres.


**HealthTrack devient l'app principale de communication avec la ou les montres, sans Gadgetbridge ni app constructeur.**
Hors runs « idées », **chaque run travaille d'abord sur ce chantier (D3)**, avant le nettoyage et la performance,
jusqu'à ce que la Huawei Watch GT 6 Pro du propriétaire remonte ses données dans HealthTrack. Les runs « idées » de
08 h et 20 h y consacrent aussi une bonne part de leur recherche.

- **Parcours visé, en un minimum de gestes** : autodétection (scan BLE + appareils appairés, empreinte : nom, services,
  données fabricant, Device Information Service) → savoir ce qui tient la montre (apps installées : Huawei Santé,
  Gadgetbridge, Zepp, Mi Fitness… dans `<queries>` ; appairage système ; réponse aux paramètres du lien et à
  l'authentification) → **libération** (bouton qui ouvre la boîte de désinstallation Android de l'app concurrente,
  `ACTION_DELETE` + `REQUEST_DELETE_PACKAGES`, ou ses réglages pour lui retirer le Bluetooth ; Android interdit la
  désinstallation silencieuse et la réinitialisation à distance : un geste de l'utilisateur, guide pas à pas avec le
  menu exact de la montre ; **jamais** « dissocier dans Huawei Santé » ; plan B identifiant de compte Huawei) →
  **assistant d'appairage** (liaison Android, authentification Huawei, clés générées et stockées en local seulement) →
  **synchronisation** (FC, sommeil, pas, SpO₂, stress / VFC, séances) puis resynchro en arrière-plan (WorkManager ou
  service de premier plan) → IndexedDB.
- **Méthode** : plugin Capacitor natif (Java / Kotlin) pour le Bluetooth et le protocole. Étudier Gadgetbridge (paquets
  Huawei, issues / PR GT 6, HiChain), `zyv/huawei-lpv2` (MIT), CCC eh19, toute doc publique ; rétro-ingénierie
  d'interopérabilité permise (directive UE 2009/24, art. 6).
- **Licence (décision du propriétaire)** : réimplémentation totale, HealthTrack ne passe pas sous AGPL. Lire pour
  comprendre, **jamais** copier ni traduire ligne à ligne. D'abord la spécification avec nos mots
  (**`protocoles/huawei.md`**, sources citées), puis le code à partir d'elle. Pilote compact : seulement ce dont
  HealthTrack a besoin.
- Jamais de firmware, d'APK, de code décompilé propriétaire ni de clé extraite d'une app constructeur dans le dépôt.
- **Étapes livrables, chacune mergeable seule** : (a) écran de diagnostic qui déroule chaque étape et exporte un
  journal (le propriétaire le renvoie, le run suivant le lit) ; (b) détection et libération ; (c) authentification ;
  (d) synchronisation et resynchro en arrière-plan. Tests sur trames d'exemple à chaque étape.
- Un **pilote dans un registre générique**, pour ajouter d'autres montres et familles de protocoles ensuite.
- **Consigne du propriétaire du 14/10/2026 (≈ 12:25), mot pour mot : « Maintenant que ça marche tu peux nettoyer
  l'UI ».** La connexion à la GT 6 Pro fonctionne (association acceptée par la montre, journal v124). L'interface de la
  montre se réduit à une seule carte : par défaut l'état (connectée, batterie, dernière synchro, mesures) et
  « Synchroniser la montre » ; tout le technique (étapes, « Refaire l'appairage », test, « Libérer et appairer », export
  du journal) dans « Diagnostic » replié, sans perdre l'export ; pas de bandeaux redondants. Ensuite : passe de
  nettoyage générale (D1), puis performance (D2). La priorité absolue reste active **tant que de vraies mesures
  n'apparaissent pas dans l'historique** (run du 14/10 12:30 : fenêtre de synchro et totaux du jour corrigés).

## 00. Directives du propriétaire (12 octobre 2026) — priment sur tout le reste (la montre §000 est en maintenance depuis le 15/10)

Constat du propriétaire : l'app devient un « sac à features ». **Hors runs « idées », les runs traitent ces chantiers
dans cet ordre, avant toute nouvelle fonctionnalité** (chantiers D1–D6 de `BACKLOG.md`) :

1. **D1 — Passe de nettoyage.** Inventaire de chaque écran, champ, carte, réglage ; supprimer / fusionner le redondant,
   le peu utile, le désormais captable automatiquement. **Ne jamais demander une donnée que l'app capte déjà**
   (ex. « écran tard » auto-détecté → plus demandé). Données existantes toujours lisibles (migration, import / export) :
   seuls l'affichage et la saisie sont simplifiés. Lister dans le compte rendu ce qui est retiré et pourquoi.
2. **D2 — Performance.** L'app lag au chargement des courbes. **Mesurer d'abord** (profil, temps par page, volume lu
   dans IndexedDB), puis : cache d'agrégats journaliers / hebdo invalidés à l'écriture, requêtes IndexedDB par index et
   par plage, mémoïsation, sous-échantillonnage des longues séries, calculs lourds en Web Worker, graphiques différés.
   Une mesure / un test anti-régression ; chiffres avant / après dans le compte rendu.
3. **D3 — Montre Huawei en direct, sans app tierce** (remplacé et promu par la **priorité absolue, §000**). La GT 6 Pro ne se connecte pas, même avec Gadgetbridge.
   HealthTrack fait tout elle-même (seules étapes manuelles : autorisations Android) : découverte BLE, connexion,
   authentification, récupération (FC, sommeil, pas, SpO₂, stress / VFC…), resynchro en arrière-plan. Protocole Huawei
   réimplémenté d'après la documentation et les observations publiques, **sans code AGPL**, tests sur trames d'exemple.
   Commencer par **diagnostiquer** l'échec actuel : journal de connexion lisible + écran de diagnostic. Documenter la
   contrainte d'appairage (montre liée à Huawei Santé → quoi faire exactement). Ce qui n'est pas vérifiable sans la
   montre : livré avec un mode diagnostic qui permet au propriétaire **d'exporter les logs** pour le run suivant.
4. **D4 — Humeur « à la Emobot » : signaux émotionnels directs.** Visage (caméra frontale, modèle local d'émotions
   faciales : MediaPipe / TFLite / ONNX), voix (timbre, prosodie : modèle local d'émotion vocale), usage des réseaux
   sociaux (temps, apps, contenu si faisable). Captation la plus continue possible, **traitement 100 % sur l'appareil,
   aucune image ni audio brut conservé** (seulement les scores). Documenter les vraies limites d'Android (caméra / micro
   en arrière-plan, service de premier plan + notification, indicateurs de confidentialité, Accessibility, UsageStats) ;
   construire le meilleur possible dedans (ex. capture opportuniste au déverrouillage / à l'usage).
5. **D5 — Pas de raisonnement circulaire (non négociable).** Y = humeur, estimée **uniquement** par des signaux
   émotionnels directs (visage, voix, auto-déclaration). X = comportements et contexte (sommeil, activité, écran,
   alimentation…), qui servent seulement à expliquer Y. Les réseaux sociaux sont soit dans l'estimateur, soit dans les
   X : choisir et documenter. **Liste déclarée des entrées de l'estimateur + test qui échoue** si une variable est à la
   fois entrée de l'estimateur et facteur des corrélations. Retirer les entrées comportementales des estimateurs
   existants. Contrôler aussi : ordre temporel (X avant Y), comparaisons multiples, taille d'échantillon minimale,
   formulations qui ne confondent pas corrélation et causalité.
6. **D6 — Science personnelle, pas de normes imposées.** Le but : vérifier, pour **cet** utilisateur, quels facteurs
   influent réellement sur son humeur et son bien-être ; ses données font foi (si l'écran le soir va chez lui avec une
   meilleure humeur, l'app le montre tel quel). Aucun X codé « bon » ou « mauvais », aucun score / alerte / conseil qui
   pénalise un comportement par principe. Les normes générales = hypothèses (quoi examiner d'abord, quoi tester, a
   priori faible), supplantées par les données personnelles dès qu'elles suffisent ; quand elles se contredisent, le
   dire simplement, sans culpabiliser. Revoir scores, conseils et messages normatifs (ex. « écran tard = mauvais »).

Runs « idées » : privilégier les idées qui **simplifient et consolident** plutôt que celles qui ajoutent des écrans.
Conséquence sur §0 ci-dessous : la priorité n° 3 (humeur) ne s'appuie plus sur sommeil / VFC / activité / écran comme
entrées de l'estimation (ce sont des X), mais sur des signaux émotionnels directs.

## 0. Directions du propriétaire (11 octobre 2026) — priment sur le choix libre du mode

- **Vision** : HealthTrack devient le **hub ultime de la santé, de l'humeur et de la vie** de l'utilisateur, voire un
  assistant personnel : un « humain augmenté par les données » (connaissance de soi et décisions guidées par beaucoup
  de données, sans modification du corps). Il faut donc **capter beaucoup de données**. Tout reste sur le téléphone :
  ne pas brider les idées par excès de prudence sur la vie privée.
- **Priorité n° 1 — simplifier la vie** : tout ce qui peut être capté automatiquement doit l'être ; la saisie manuelle
  devient le dernier recours, en un geste minimum.
- **Priorité n° 2 — objets connectés (gros chantier)** : détecter automatiquement les équipements / apps santé présents
  ou connectés au téléphone et récupérer leurs données sans intervention. Cas concret : **Huawei Watch GT 6 Pro**
  (absente de Health Connect). Puis Samsung, Garmin, Fitbit, Xiaomi/Zepp, Withings, Oura, Polar… Étape manuelle
  inévitable → guide pas à pas dans l'app.
  - **Données brutes d'abord** (montre, bague, capteurs) ; sans API ouverte : reverse engineering à des fins
    d'interopérabilité (protocoles BLE documentés, exports, sauvegardes, captures BLE), viser une **connexion BLE
    directe** (plugin Capacitor natif si besoin). Respecter les licences (Gadgetbridge = AGPL : **ne pas copier son
    code**, réimplémenter d'après la documentation du protocole), ne jamais committer clés, secrets ni firmware
    propriétaire, documenter les limites (montre appairée à une seule app à la fois…).
  - **Approche générique** : couche de connexion avec autodétection (scan BLE, empreinte : nom annoncé, UUID de
    services, données fabricant, Device Information Service) → choix automatique du pilote. D'abord les **profils BLE
    standard** (FC 0x180D, batterie, balance, tensiomètre, glycémie, oxymètre, vélo/course…), puis les **familles de
    protocoles propriétaires** partagées entre modèles. Registre de pilotes extensible, détection des capacités plutôt
    que listes de modèles, repli propre pour un appareil inconnu (empreinte collectée localement).
- **Priorité n° 3 — humeur et bien-être captés automatiquement** (inspiration Emobot) : estimation à partir de
  signaux passifs (sommeil, VFC, activité, usage du téléphone, voix, visage, conversations), traitée sur l'appareil,
  toujours présentée comme une **estimation**, jamais un diagnostic.
- **Conversations** : importer les résumés des enregistreurs (Omi, Plaud, Limitless, Bee… et équivalents) ou faire
  pareil avec le micro du téléphone, pour le journal et l'humeur ; stockage local ; rappel simple (sans blocage) que
  l'enregistrement d'autrui peut demander leur accord selon le pays.
- **Recommandations de matériel** utile (capteurs, wearables) quand elles servent le suivi.
- **Runs « idées »** (08 h et 20 h, heure de Paris) : pas de code produit ; se mettre à la place de l'utilisateur,
  chercher (Reddit QS / Biohackers / wearables…, LinkedIn, wearables récents, reverse engineering, enregistreurs de
  conversations, humeur, ML embarqué, meilleures apps) et enrichir **`IDEES.md`** (idées classées par impact et
  faisabilité, besoin servi, sources, dates, pistes d'implémentation), puis faire entrer les meilleures dans
  `BACKLOG.md`. Les garde-fous de fusion s'appliquent (tests verts même si seul le journal change).

Conséquence sur le principe 3 ci-dessous : « local-first » reste la règle (rien ne sort de l'appareil hors Gemini
déclenché par l'utilisateur), mais **à l'intérieur du téléphone** on capte large.

## 1. Mission

Faire de HealthTrack **la meilleure app de santé personnelle possible** : celle qui
transforme les données d'une personne (alimentation, sommeil, activité, cœur, corps,
humeur, habitudes) en **compréhension** et en **actions concrètes** pour aller mieux —
sans friction de saisie, et sans que les données quittent l'appareil.

L'utilisateur (propriétaire du dépôt) passe une fois par semaine : il installe la
dernière version via la **mise à jour en 1 clic** et découvre les changements dans la
page **Nouveautés**. Chaque semaine doit donc apporter des progrès visibles et fiables.

## 2. Principes non négociables

1. **Ne jamais casser l'app installée.** Le mécanisme de mise à jour (`UpdateBanner`,
   `services/updateCheck.js`, `services/installUpdate.js`, `.github/workflows/build-release.yml`,
   `android/app/debug.keystore`) est vital : s'il casse, l'utilisateur est bloqué sur une
   vieille version. Toute modification de ces fichiers exige des tests et une justification.
2. **Ne jamais perdre de données.** Toute évolution du schéma IndexedDB passe par une
   migration testée (`storage/localHealthStorage.js`, `DB_VERSION`). L'export/import JSON
   doit rester compatible avec les anciens fichiers.
3. **Local-first et vie privée.** Aucune donnée de santé n'est envoyée à un serveur tiers,
   sauf les appels Gemini explicitement déclenchés avec la clé de l'utilisateur. Pas de
   nouveau service distant sans nécessité forte, documentée dans le run.
4. **Honnêteté scientifique.** Pas d'allégation médicale ni de diagnostic. Corrélation ≠
   causalité : toujours afficher l'incertitude (intervalle, taille d'échantillon), et
   citer les références (recommandations OMS/ANSES/EFSA…) quand l'app donne un repère.
5. **TDD.** Écrire le test qui échoue, puis le code (voir `CONTRIBUTING.md`). Le visuel
   pur n'exige pas de test, mais exige une **vérification visuelle**.
6. **Un run = un changement cohérent, fini, vérifié et livré.** Les gros chantiers sont
   découpés en étapes livrables (voir `BACKLOG.md` → Chantiers). Mieux vaut un petit
   progrès livré qu'un gros chantier à moitié fait.
7. **Respecter le travail des autres** : ne pas toucher aux PR/branches qui ne sont pas
   celles de la routine (ex. branches `cursor/*`), sauf pour en récupérer des idées.

## 3. Protocole d'un run

### 3.1 Démarrage (≈ 5 min)
1. `git fetch origin main` puis partir de `origin/main` à jour sur la branche de travail.
2. `cd app && npm ci`.
3. Lire ce fichier, `BACKLOG.md`, et les **5 derniers comptes rendus** (`ls journal/runs | tail -5`).
   Regarder aussi `journal/diagnostics/` : un journal de montre déposé par le propriétaire oriente la priorité absolue (§000).
4. Vérifier les PR ouvertes par la routine (titre préfixé `[Auto]`) : une PR rouge ou en
   conflit d'un run précédent est **la priorité absolue** — la réparer et la fusionner
   avant toute autre chose (ou la fermer en expliquant pourquoi dans le compte rendu).

### 3.2 Choisir le type de run
Regarder la répartition des derniers runs et choisir ce qui apporte le plus maintenant.
Repères (pas des règles rigides) :

| Type | Quand | Contenu |
|---|---|---|
| 🐛 **Bugs & vérif visuelle** | ≥ 1 run sur 4 ; toujours après un gros chantier | `npm run visual` (+ `--empty`, `--light`), lire **chaque** capture, traquer erreurs console, débordements, états vides/erreur, cas limites ; écrire le test qui reproduit puis corriger |
| 💡 **Idées** | runs de 08 h et 20 h (heure de Paris) | Pas de code produit : recherche orientée utilisateur → `IDEES.md` + meilleures idées dans `BACKLOG.md` |
| 🔭 **Recherche** | ~1 run sur 6, jamais deux de suite | Recherche web (besoins réels, apps qui marchent, publications ML/santé récentes) → `RESEARCH.md` + nouvelles idées priorisées dans `BACKLOG.md`. Finir si possible par un quick win issu de la recherche |
| 🎨 **UI / ergonomie** | régulièrement | Réduire la friction (moins de taps), lisibilité, hiérarchie visuelle, cohérence du design system, accessibilité (contraste, tailles tactiles ≥ 44 px), mode clair. Captures avant/après obligatoires |
| 🏗️ **Travail de fond** | le reste du temps | Nouvelles fonctionnalités, moteur d'analyse / ML, architecture, performance, dette technique, tests |

En cas de doute : prendre l'item du haut de `BACKLOG.md` → « Prochaines étapes ».

### 3.3 Réaliser
- TDD, code lisible qui ressemble au code existant, UI en **français**.
- Toujours penser mobile (viewport ~412 px, doigts, une main) et données réelles imparfaites
  (trous, doublons, fuseaux horaires, montre non portée).

### 3.4 Vérifier — obligatoire avant de livrer
1. `npm run test` → tout vert.
2. `npm run lint` → **pas plus d'erreurs qu'avant** (baseline dans le dernier compte rendu ;
   en réduire le nombre est un bonus apprécié).
3. `npm run build` → OK.
4. `npm run visual` (pages concernées au minimum, avec `--routes=`) et **regarder les captures**
   `app/.visual/tiles/*.png` avec l'outil de lecture d'image. Comparer avant/après pour toute
   modification visuelle (`--out=.visual/avant` sur `origin/main`, puis `--out=.visual/apres`).
   Le script échoue sur erreur JS ; il signale aussi les débordements horizontaux.
5. Relire son diff de façon critique : qu'est-ce qui pourrait casser chez l'utilisateur ?

### 3.5 Livrer
1. **Nouveautés in-app** : pour tout changement visible par l'utilisateur, ajouter
   `app/src/data/changelog/AAAA-MM-JJ-HHMM-<slug>.json` (heure UTC, langage simple, orienté
   bénéfice : « Le graphique du sommeil se lit mieux sur petit écran », pas « refactor CSS »).
2. **Compte rendu** : créer `journal/runs/AAAA-MM-JJ-HHMM-<slug>.md` (modèle ci-dessous) et
   mettre à jour `BACKLOG.md` (cocher, ajouter, re-prioriser).
3. **Résumé de la semaine** (en tête de ce fichier) : l'enrichir — ce que l'utilisateur verra dans
   l'app, ce qui a changé en coulisses, les points d'attention, une ligne dans le tableau des runs.
   Écrit pour l'utilisateur (clair, concret, sans jargon). Nouvelle semaine ISO (lundi, heure de
   Paris) → déplacer l'ancien bloc dans `semaines/AAAA-Sww.md` et repartir d'un bloc vide.
4. Commit(s) clairs, push, PR vers `main` intitulée `[Auto] <résumé>`, corps = résumé du run.
5. Attendre la CI (s'abonner à l'activité de la PR, pas de boucle d'attente) : **Frontend (Vitest)**
   et **Build APK** doivent être verts (*Build APK* échoue = la release échouera aussi). Les jobs
   émulateur sont longs : les attendre seulement si le changement touche `android/`, Capacitor
   ou Health Connect.
6. CI verte **et** vérifications du §3.4 faites → **fusionner (squash)** : le push sur `main` déclenche le build de l'APK et la
   release que l'utilisateur installera en 1 clic. CI rouge → corriger et recommencer.
7. Après la fusion, vérifier que le workflow **Build & Release** de `main` a réussi et publié
   la release `v<N>` avec son APK. S'il échoue (même sans lien avec ton changement : image des
   runners, action obsolète…), le réparer est la priorité absolue — sans release, l'utilisateur
   ne reçoit plus rien.
8. Si le run ne peut pas aboutir (ou si une vérification du §3.4 échoue) : laisser la PR ouverte, documenter précisément l'état
   et la suite dans le compte rendu — le run suivant reprendra.

### Modèle de compte rendu

```markdown
# AAAA-MM-JJ HH:MM UTC — <titre>

**Type** : 🐛 / 🔭 / 🎨 / 🏗️  ·  **PR** : #NN (fusionnée / ouverte)

## Pourquoi
<le besoin, l'observation ou la source qui a motivé ce run>

## Ce qui a été fait
- …

## Vérifications
- Tests : NNN ✅ · Lint : NN erreurs (avant : NN) · Build ✅
- Visuel : pages vérifiées, ce qui a été observé

## Apprentissages / décisions
- …

## Suite proposée
- …
```

## 4. Outillage

- **Vérification visuelle** : `cd app && npm run visual` — lance Vite, injecte ~75 jours de
  données de démo corrélées (`scripts/visual/demoData.mjs`), capture chaque page dans un
  viewport Galaxy A56 (412×915, Chromium/Playwright). Options : `--empty`, `--light`,
  `--routes=/,/food`, `--radar` (début d'infection simulé), `--wellbeing-gap` (pas de note de J−9 à J−4), `--food-analysis` (analyse photo
  simulée sur /food, réponse Gemini factice), `--update-banner`, `--wellbeing-prompt`, `--whats-new`, `--out=`,
  `--click="Analyse avancée"` (clique un bouton avant la capture, ex. un onglet),
  `--viewport` (capture de l'écran visible, pour les éléments fixes), `--insets=24,48` (simule les
  barres système d'Android 15+ ; à combiner avec `--viewport`).
- **Captures sur émulateur Android réel** : chaque PR produit les artefacts `screenshots-samsung-a56-api35`
  et `-api36` (`screenshot_app.png`, `screenshot_plus.png` + arbres `ui_*.xml`). Les récupérer avec
  `gh api repos/spreadzenox/HealthTrack/actions/runs/<id>/artifacts` puis `…/artifacts/<id>/zip`, et les
  regarder pour tout changement d'interface. Toujours utiliser `var(--safe-top)` / `var(--safe-bottom)`,
  jamais `env(safe-area-inset-*)` directement (WebView ≤ 139).
  Pour une interaction précise (clic, saisie, modale), écrire un petit script Playwright
  ad hoc dans le scratchpad en s'inspirant de `visual-check.mjs`.
- **Données de démo** : enrichir `demoData.mjs` quand une nouvelle donnée apparaît, pour
  que les captures restent représentatives.
- **GitHub** : outils `mcp__github__*` s'ils sont présents ; sinon `gh api` (REST uniquement — le
  GraphQL est bloqué dans les sessions, donc pas de `gh pr create` / `gh pr checks`) :
  - PR : `gh api repos/spreadzenox/HealthTrack/pulls -f title='[Auto] …' -f head=<branche> -f base=main -f body=…`
  - checks : `gh api repos/spreadzenox/HealthTrack/commits/<sha>/check-runs --jq '.check_runs[]|[.name,.status,.conclusion]|@tsv'`
  - merge : **préférer** l'outil `mcp__github__merge_pull_request` (squash, `expectedHeadSha`) — le
    `gh api -X PUT …/pulls/<n>/merge` a été refusé par les permissions d'une session (run 17:40)
  - release : `gh api repos/spreadzenox/HealthTrack/releases/latest --jq .tag_name`
  - attendre la CI sans boucle active : outil Monitor (boucle `until` sur les check-runs) ou abonnement à la PR.
- **Mécanique de la routine** : la tâche planifiée « HealthTrack — amélioration autonome » réveille
  toutes les 2 h une session « orchestrateur » qui crée une **session neuve avec le dépôt attaché**
  (seul moyen d'avoir le droit de pousser) et lui transmet le prompt du run. Chaque run est donc
  indépendant : sa seule mémoire est ce dossier. Sessions de run étiquetées `healthtrack-routine`.
- **CI** : `Tests` (Vitest, rapide) sur PR ; `Test — émulateur Samsung Galaxy A56` (long) ;
  `Build & Release` sur push `main` → release `v<run_number>` + APK (sauf si le push ne touche
  que `journal/` : un run de pure veille ne publie donc pas de release vide).
