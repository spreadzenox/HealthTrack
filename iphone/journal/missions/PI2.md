# Mission PI2 — Préparer la soumission de la version de l'App Store (jusqu'au dernier bouton)

- **Voie** : b puis c. Claude prépare tout ; **deux clics restent les vôtres** : « Enregistrer » de la déclaration
  « dispositif médical » (partie A) et « Soumettre pour examen » (partie B). Voie a écartée : l'API d'App Store Connect
  n'expose pas la déclaration (page d'aide d'Apple, lue le 14/11), et ses appels pour les abonnements sont des envois
  à l'examen, donc votre geste.
- **Durée** : 10 min. **Quand** : le jour où vous voulez soumettre. **Rôle Apple nécessaire** : titulaire du compte ou
  administrateur (le vôtre).
- **Réécrite le 14/11 d'après le relevé PI1** (14/11 vers 17:15, lecture seule) : Apple ne signale aucune erreur sur
  les abonnements ; la page de la version 844 n'a **pas** de section « Achats intégrés et abonnements », chaque
  abonnement a son bouton « Add for Review » ; un encadré bleu « Declare Your Regulated Medical Device » est affiché.
  L'ancienne version de cette mission s'arrêtait si la section manquait : elle passe maintenant par la page de chaque
  abonnement, le chemin que décrit l'aide d'Apple
  (https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase).
- **Ce que la routine n'a pas vu** : ces écrans. Les libellés viennent de l'aide d'Apple et du relevé PI1. Si une page
  ne ressemble pas à ce qui est décrit, ou si un bouton est grisé : s'arrêter et décrire ce qui est affiché.

## Partie A — Déclaration « Regulated Medical Device » (s'arrête avant « Save »)

Pourquoi : Apple la demande aux apps de la catégorie Forme et santé vendues dans l'Union européenne
(https://developer.apple.com/help/app-store-connect/manage-app-information/declare-regulated-medical-device-status).
Halcya y est (France, Belgique, Luxembourg). Réponse préparée : **No**. Halcya n'a pas de marquage CE de dispositif
médical ni d'enregistrement à la FDA ; elle montre des tendances dans les données de la personne et ne donne ni
diagnostic ni traitement, comme le disent déjà la fiche, les notes pour l'examen et la déclaration faite sur Google
Play (« rien de médical »). C'est une déclaration qui vous engage : la routine la prépare, vous la validez. La
validation juridique d'ensemble (P5 : dispositif médical, AI Act, RGPD) reste ouverte ; si vous préférez l'attendre,
dites « PI2 sans la déclaration » et la mission commence à la partie B (Apple peut alors refuser l'envoi).

1. Ouvrir https://appstoreconnect.apple.com/apps → **Halcya** (identifiant de lot `fr.jpesquet.sante`). Si la page
   demande de se reconnecter ou un code : s'arrêter.
2. Menu de gauche, sous **General** : **App Information**. Sous **App Store Regulations & Permits**, cliquer
   **Declare Regulated Medical Device** (ou le lien de l'encadré bleu du même nom).
3. À la question « votre app est-elle un dispositif médical réglementé dans un pays ou une région » : choisir **No**.
   Ne remplir aucun autre champ.
4. **S'arrêter avant « Save ».** Dire : « Déclaration prête sur No : cliquez Save, puis dites-moi de continuer. »
   Le propriétaire clique **Save** lui-même.

## Partie B — La soumission (s'arrête avant « Submit for Review »)

5. Onglet **Distribution** → version iOS en préparation (aujourd'hui **844**, « Prepare for Submission »).
   **Build** : relever le numéro de la build attachée (attendu : **844.344**). Ne pas la changer. Si elle est
   différente ou absente : s'arrêter et le dire.
6. **App Review Information** :
   - **Notes** : coller le texte anglais de `iphone/store/app-store/notes-examen.md`, entre les deux traits, tel quel
     (https://github.com/spreadzenox/HealthTrack/blob/main/iphone/store/app-store/notes-examen.md) ;
   - **Sign-in required** : décoché ;
   - coordonnées de contact : ne rien changer si elles sont remplies ; sinon s'arrêter (ce sont les vôtres).
7. **Version Release** : choisir **Manually release this version** (vous gardez le clic de mise en production), sauf
   si vous avez dit autre chose à Claude avant de lancer la mission.
8. **Save** (en haut à droite de la page de la version : cet enregistrement n'envoie rien à Apple), puis vérifier
   qu'aucun champ n'est signalé en rouge (captures iPhone 6,9" et iPad 13", classification par âge, confidentialité).
   S'il y en a : s'arrêter et les relever.
9. Si la page de la version montre maintenant une section **In-App Purchases and Subscriptions** : y cocher les trois
   abonnements (`halcya_gold_mensuel`, `halcya_premium_annuel`, `halcya_premium_mensuel`), **Done**, **Save**, puis
   cliquer **Add for Review** en haut de la page de la version et passer à l'étape 11.
10. Sinon (cas du relevé PI1) : menu de gauche, **Monetization** → **Subscriptions** → groupe **Halcya**. Pour chacun
    des trois abonnements, l'un après l'autre :
    - ouvrir l'abonnement, cliquer **Add for Review** ;
    - au premier : **Create New Submission** si la question est posée, plateforme **iOS**, version **844**, et ajouter
      aussi le **groupe d'abonnements Halcya** s'il est proposé ; aux deux suivants : ajouter à la soumission
      existante (ne pas en créer une deuxième) ;
    - si une fenêtre propose **Submit for Review** : ne pas cliquer, la fermer (la soumission reste en brouillon).
    « Add for Review » range un élément dans un brouillon de soumission et n'envoie rien ; on peut l'en retirer.
11. Ouvrir le brouillon de soumission (onglet **Distribution** → **App Review**, ou la fenêtre ouverte par le dernier
    « Add for Review ») et relever ce qu'il contient. Attendu, dans **une seule** soumission : la version iOS 844
    (build 844.344), le groupe Halcya, les trois abonnements. S'il manque la version de l'app : l'ajouter depuis sa
    page (**Add for Review**). S'il y a deux brouillons, ou un élément inattendu : s'arrêter et le dire.
12. **S'arrêter ici.** Ne pas cliquer **Submit for Review** : vous le faites.

## Vérification finale

- Déclaration « Regulated Medical Device » : **No**, enregistrée par vous.
- Page de la version enregistrée, sans champ rouge ; build 844.344 ; notes pour l'examen remplies ; publication
  manuelle.
- Un seul brouillon de soumission : version 844, groupe Halcya, trois abonnements.

**Capture attendue** : le brouillon de soumission avec ses éléments et le bouton « Submit for Review » visible, non
cliqué. **Phrase de retour** : « PI2 prête » (avec la liste des éléments du brouillon), puis, quand vous aurez cliqué
vous-même, « soumise ».
