# Notes pour l'examen d'Apple (App Review Information → Notes)

Texte de la soumission de la refonte « Compagnon » (retours du propriétaire du 18/11 : « oui go soumettre directement
la refonte »), en anglais, la langue des équipes d'examen (4 000 caractères au plus). **Revu le 18/11 20:30 pour la
refonte**, chaque phrase vérifiée dans le code de main (b61ce10) : 4 onglets (Accueil, Ma journée, Objectifs,
Données) et la roue « Réglages » en haut à droite ; Sources, Sauvegarde et Paramètres sous Réglages ; photo des selles
dans « Ma journée » → bandeau « Ajouter » → « Selles », avec l'objectif « Ma digestion » ; compagnon Pilou calculé sur
le téléphone ; photo du double numérique (étape 15) **éteinte** (`VITE_PILOU_PHOTO`), donc absente du texte. Si elle
est allumée avant la soumission (« P49 fait » et « PI3 fait »), ajouter le paragraphe de `journal/missions/PI3.md`
partie 2. Le texte collé le 18/11 sur la version 844 est l'ancien (onglet « Sources », « Journal → Jours ») : il est
à remplacer par celui-ci. Le paragraphe « Purchases » n'est vrai que si l'écran d'achat est visible sur iPhone le jour
de l'examen (période de lancement coupée sur iPhone depuis le 6/11 inclus). Les trois adresses de la fin répondent 200
(vérifié le 18/11 20:30 ; site du dépôt iOS, toujours servi). Gestes du jour : `journal/missions/PI2.md`.

---

Halcya is a personal gut-and-wellbeing journal for adults (18+). It is not a medical device: it shows trends in the
user's own data and never gives a diagnosis. A small companion character, Pilou (named by the user), reflects the
day's notes on the home screen; it is drawn on the device from the user's own entries.

No account, no sign-in: all features can be reviewed right after the first launch. The app has four tabs (Accueil,
Ma journée, Objectifs, Données) and a gear icon at the top right for « Réglages ». To see charts with data, add a few
notes in « Ma journée », or allow Apple Health access in Réglages → « Sources ».

Data stays on the device (local database). Nothing leaves the phone except:
- AI meal analysis, only when the user taps « Analyser les ingrédients » and after a one-time consent screen: the
  photo (resized, metadata removed) or the typed description is sent to our relay (Google Cloud, EU), analysed by
  Gemini on Vertex AI and not stored; the app sends a random install identifier used only to count analyses. There
  is no API key in the app.
- Stool form estimate (« Ma journée » → « Ajouter » → « Selles », with the goal « Ma digestion »), only when the user
  taps « Selles : estimer la forme avec une photo » and after a one-time consent screen: the photo (resized, no
  metadata) goes the same way as a meal photo and is deleted right after the analysis; only a Bristol type (1-7)
  comes back, which the user can correct. Shape only, never colour, blood or health. Declared as "Health" in App
  Privacy.
- Feedback (Réglages → « Paramètres » → « Votre avis »): the typed text and app version, only on « Envoyer »; kept
  90 days at most.
- Weather: an approximate location (reduced-accuracy location, about 10 km) or a chosen city is sent to
  Open-Meteo.

Apple Health (HealthKit): read-only. Halcya reads steps, distance, active energy, workouts, sleep, heart rate,
resting heart rate, HRV, blood oxygen, respiratory rate, body temperature, blood pressure, blood glucose, weight
and body fat, only to show them next to the user's own notes on the device. HealthKit data is never
sent to any server, never used for advertising, never shared.

Camera: meal photos, stool photos for the form estimate above, and an optional on-device wellbeing estimate from the
user's facial expression when the app is opened (off by default, explained before activation, visible indicator
during each reading). No image is stored or sent; only a few numbers are kept. It is presented as an estimate, not a
diagnosis.

Bluetooth: optional connection to standard Bluetooth Low Energy health sensors (heart rate, blood pressure, scale,
thermometer, oximeter) to record their measurements on the device.

Notifications: optional local reminders (evening note, gut check, portion reminder during a FODMAP
reintroduction).

Backup copy: the app keeps a copy of the user's entries in a folder of its Documents directory (visible in Files) so
that data is not lost if the system clears the web database. This folder is excluded from iCloud backup
(isExcludedFromBackup), in line with guideline 5.1.3(ii); users move to a new iPhone by exporting a file
and importing it.

Purchases: three auto-renewable subscriptions in one group (« Halcya »): Silver yearly (29.99 EUR, 2-week free
trial), Silver monthly (4.99 EUR) and Gold monthly (9.99 EUR). They add more AI meal analyses per day (10 or 20), the
meal-to-gut insights, the guided FODMAP reintroduction and the PDF report; Gold also estimates portion sizes better.
Everything else stays free. To reach the subscription screen: gear icon (top right) → « Paramètres » → « Découvrir le
premium » (« Restaurer un achat » is on the same screen). No account is needed: purchases go through the App Store.

Privacy policy: https://spreadzenox.github.io/HealthTrack-iOS/confidentialite/
Terms of use: https://spreadzenox.github.io/HealthTrack-iOS/conditions/
Support: https://spreadzenox.github.io/HealthTrack-iOS/assistance/
