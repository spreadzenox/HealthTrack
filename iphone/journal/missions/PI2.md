# Mission PI2 — Soumettre la refonte à l'App Store (il ne vous reste que « Submit for Review »)

- **Réécrite le 18/11 20:30** d'après vos retours du 18/11 (« oui go soumettre directement la refonte ») : la
  soumission part avec **une build de la refonte** traitée par Apple, plus avec la 844.344 (d'avant la refonte), quand
  l'app est propre (objectif du 22/11). La déclaration « Regulated Medical Device » est **faite** (18/11, « No ») ;
  publication manuelle et « Sign-in required » décoché sont **déjà enregistrés** : cette mission ne les touche plus.
- **Voie** : a (API, par la routine) pour tout ce que l'API sait faire ; b (Claude dans Chrome) pour les abonnements ;
  c (vous) pour le dernier bouton. **Durée** : 5 min. **Quand** : quand la routine écrit en tête du résumé
  « 👉 PI2 prête » (après la partie 0). **Rôle Apple** : titulaire du compte ou administrateur (le vôtre).
- **Ce que la routine n'a pas vu** : ces écrans. Les libellés viennent de l'aide d'Apple et du relevé PI1 (14/11). Si
  une page ne ressemble pas à ce qui est décrit, ou si un bouton est grisé : s'arrêter et décrire ce qui est affiché.

## Partie 0 — Faite par la routine, par l'API (rien à faire de votre côté)

**Build rattachée le 22/11 vers 06:39 (Paris)** (run 44990310513) : la version **893** a la build **1244.1244** (validée chez « Testeurs Halcya »), notes inchangées, publication manuelle ; la 844.344 est expirée. Avant : **faite le 21/11 vers 05:33 (Paris)** (run 44866638637) : version **893** en préparation, build **1221.1221** attachée,
notes de 3 988 caractères, publication manuelle. Si une build plus récente est validée avant « 👉 PI2 prête », la
routine la rattache et le résumé nomme la build attendue.

Workflow « App Store — préparer la soumission » (`.github/workflows/ios-store-submission.yml`, écrit le 18/11 21:30), lancé sur main, qui
**n'envoie rien à l'examen** :

1. la version en préparation (aujourd'hui **844**, « Prepare for Submission ») prend le numéro des builds TestFlight,
   celui de `iphone/testflight-version.json` (**893**) : une build ne peut être attachée qu'à la version de même
   numéro ;
2. la build de la refonte choisie par la routine (version 893, traitée par Apple, déjà validée chez « Testeurs
   Halcya » et sans défaut connu) est attachée à cette version ;
3. les notes pour l'examen sont remplacées par le texte revu pour la refonte
   (`iphone/store/app-store/notes-examen.md`, entre les deux traits, 3 988 caractères) ;
4. relevé final imprimé dans le log : numéro de version, build attachée, longueur des notes, publication manuelle,
   « Sign-in required » décoché, état des trois abonnements et de leurs prix.

Ensuite seulement, la 844.344 s'expire comme les autres (votre consigne du 18/11).

## Partie 1 — Les abonnements dans le brouillon de soumission (« fais la mission PI2 », Claude dans Chrome)

« Add for Review » range un élément dans un brouillon et n'envoie rien ; on peut l'en retirer. L'API ne le fait pas :
pour un abonnement, son seul appel est un envoi à l'examen.

1. Ouvrir https://appstoreconnect.apple.com/apps → **Halcya** (`fr.jpesquet.sante`). Si la page demande de se
   reconnecter ou un code : s'arrêter.
2. Onglet **Distribution** → la version iOS en préparation. Relever : numéro (attendu **893**), build attachée
   (attendu : celle que le résumé de la routine nomme), notes pour l'examen qui commencent par « Halcya is a personal
   gut-and-wellbeing journal ». Si l'un diffère : s'arrêter et le dire.
3. Menu de gauche, **Monetization** → **Subscriptions** → groupe **Halcya**. Pour `halcya_gold_mensuel`, puis
   `halcya_premium_annuel`, puis `halcya_premium_mensuel` :
   - ouvrir l'abonnement, cliquer **Add for Review** ;
   - au premier : **Create New Submission** si la question est posée, plateforme **iOS**, version **893**, et ajouter
     aussi le **groupe d'abonnements Halcya** s'il est proposé ; aux suivants : ajouter à la soumission existante ;
   - si une fenêtre propose **Submit for Review** : ne pas cliquer, la fermer.
   - **Si Apple répond « You must add a subscription price »** (refus du 18/11) : s'arrêter, relever le message exact
     et ouvrir **Subscription Prices** de cet abonnement : relever le pays affiché en premier (« base ») et les prix
     listés. Ne rien modifier. La routine a fixé le 18/11 un prix aux États-Unis pour chaque abonnement (territoire de
     base du prix de l'app) ; si le refus persiste, la piste suivante est de passer le territoire de base du prix de
     l'app en France (« Pricing and Availability ») : c'est votre réglage, dites « base France » à la routine.
   - Laisser **non configurée** l'option « Monthly with a 12-Month Commitment » de l'annuel.
4. Ouvrir le brouillon de soumission (**Distribution** → **App Review**). Attendu, dans **une seule** soumission : la
   version iOS 893 avec sa build, le groupe Halcya, les trois abonnements. S'il manque la version : **Add for Review**
   depuis sa page. Deux brouillons, ou un élément inattendu : s'arrêter et le dire.
5. **S'arrêter ici.** Capture : le brouillon avec ses éléments et **Submit for Review** visible, non cliqué. Phrase de
   retour : « PI2 prête » avec la liste des éléments.

## Partie 2 — Votre geste

6. Cliquer **Submit for Review**. Dire « soumise » à l'orchestrateur. L'examen dure en général 1 à 2 jours ; à
   l'acceptation, la version attend votre clic de mise en production (publication manuelle).

## Vérification finale

- Version 893, build de la refonte, notes revues, publication manuelle : relevé de la partie 0 et capture de l'étape 2.
- Un seul brouillon : version 893, groupe Halcya, trois abonnements ; puis « Waiting for Review » après votre clic.
