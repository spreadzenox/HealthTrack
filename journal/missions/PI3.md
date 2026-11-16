# Mission PI3 — App Store : déclarer le double numérique par photo (« Et si Pilou vous ressemblait ? »)

- **Voie** : c (App Store Connect, déclaration du propriétaire) ; la mission prépare tout jusqu'au bouton.
  **Durée** : 10 min. **Préparée par** : lot PHOTO du sprint du 16/11 (étape 15 de la refonte, brief § 9).
- **Ce qui part** : voir la mission P49 (« Ce qui part, exactement ») ; même parcours sur iPhone, même relais.
- **Rien n'est actif** (interrupteurs de build et du relais éteints) avant « P49 fait » et « PI3 fait ».

## Partie 1 — Confidentialité de l'app (App Store Connect)

**Aucune nouvelle case.** Contenu de l'utilisateur → **Photos ou vidéos** est déjà cochée (photo du repas) : usage
« Fonctionnalités de l'app », liée à l'utilisateur (envoyée avec l'identifiant d'installation, choix prudent),
sans pistage. Le selfie entre dans ce type. Rien n'est déclaré en « Santé » pour lui : aucune donnée de santé n'est
demandée ni déduite.

1. Ouvrir https://appstoreconnect.apple.com → **Apps** → **Halcya** → **Confidentialité de l'app**.
2. Vérifier **Contenu de l'utilisateur → Photos ou vidéos** : « Fonctionnalités de l'app », liée, pas de pistage.
3. Ne rien publier si rien n'a changé. **S'arrêter avant « Publier »** si une modification a été faite par erreur.
4. À faire par la routine à l'allumage : ajouter au tableau de `iphone/store/app-store/confidentialite.md` la ligne
   « selfie du double numérique, une fois, sur geste, non gardé » dans « Photos ou vidéos », et vérifier que
   `PrivacyInfo.xcprivacy` déclare toujours `NSPrivacyCollectedDataTypePhotosorVideos` (le test
   `privacyManifest.test.js` le garde aligné).

## Partie 2 — Partage avec une IA tierce (règle 5.1.2(i) de l'examen d'Apple)

Apple demande d'**annoncer clairement** quelles données personnelles partent vers une IA tierce et d'obtenir une
**autorisation explicite** avant. C'est fait dans l'app : écran « Avant la photo » qui nomme « Gemini, de Google »,
dit ce qui part, ce qui est gardé et ce qui n'est jamais déduit, puis « J'accepte, prendre la photo » ; refuser mène
au Studio à la main. Texte pour les **notes d'examen** de la prochaine soumission (à coller dans App Store Connect →
version → « Informations sur l'examen de l'app » → Notes, quand la fonction sera allumée) :

> Optional "Pilou looks like you" feature: if the user chooses it, a dedicated screen first explains that one selfie
> is sent once to our server in the EU, where Google Gemini (Vertex AI) returns a small style sheet (hair, eye
> colour, glasses…). The user must tap "J'accepte, prendre la photo" before the camera opens. The photo is never
> stored (device or server); age, gender, ethnicity, emotions and health are never inferred. Declining opens a manual
> editor with the same result.

## Partie 3 — Politique de confidentialité iPhone
Le même paragraphe que la mission P49, partie 3, ajouté à la version iPhone de la politique
(`iphone/site/…/confidentialite`) par la routine à l'allumage.

## Vérification finale
« Photos ou vidéos » cochée, usage « Fonctionnalités de l'app » ; aucune publication lancée par cette mission.

**Capture attendue** : la page Confidentialité de l'app. **Phrase de retour** : « PI3 fait ».
