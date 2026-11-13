# Notes pour l'examen d'Apple (App Review Information → Notes)

Texte à coller par le propriétaire dans App Store Connect au moment de la soumission (A6), en anglais, la langue
des équipes d'examen (4 000 caractères au plus ; celui-ci en fait environ 3 700, compté le 5/11). À relire juste avant : chaque
phrase doit rester vraie pour la version envoyée. Le paragraphe « Backup copy » dépend de la décision sur la
directive 5.1.3 (ii) (`journal/BACKLOG.md`, I9) ; le paragraphe « Purchases » (2/11, achat ouvert) n'est vrai que si l'écran d'achat est visible sur iPhone le jour de
l'examen : décision du propriétaire du 2/11, période de lancement coupée sur iPhone le 6/11 inclus (relais, repère
`X-Platform: ios`) et soumission le 7 ou le 8/11 ; à vérifier sur la build soumise avant de coller le texte. Les trois
adresses de la fin sont en ligne (GitHub Pages, vérifiées le 3/11 : 200). Gestes du jour : `soumission.md`.

---

Halcya is a personal gut-and-wellbeing journal for adults (18+). It is not a medical device: it shows trends in the
user's own data and never gives a diagnosis.

No account, no sign-in: all features can be reviewed right after the first launch. To see charts with data, add a
few meals and gut notes, or allow Apple Health access on the "Sources" tab.

Data stays on the device (local database). Nothing leaves the phone except:
- AI meal analysis, only when the user taps "Analyser" and after a one-time consent screen: the photo (resized,
  metadata removed) or the typed description is sent to our relay (Google Cloud, EU), analysed by Gemini on Vertex
  AI and not stored; the app sends a random install identifier used only to count analyses. There is no API key in
  the app.
- Stool form estimate (Journal → « Jours », goal « Mon ventre »), only when the user taps « Selles : estimer la
  forme avec une photo » and after a one-time consent screen: the photo (resized, no metadata) goes the same way as
  a meal photo and is deleted right after the analysis; only a Bristol type (1-7) comes back, which the user can
  correct. Shape only, never colour, blood or health. Declared as "Health" in App Privacy.
- Feedback (Settings → « Votre avis »): the typed text and app version, only on « Envoyer »; kept 90 days at most.
- Weather: an approximate location (about 10 km, reduced-accuracy location permission) or a chosen city is sent to
  Open-Meteo.

Apple Health (HealthKit): read-only. Halcya reads steps, distance, active energy, workouts, sleep, heart rate,
resting heart rate, HRV, blood oxygen, respiratory rate, body temperature, blood pressure, blood glucose, weight
and body fat, only to show them and compare them with the user's own notes on the device. HealthKit data is never
sent to any server, never used for advertising, never shared.

Camera: meal photos, stool photos for the form estimate above, and an optional on-device wellbeing estimate from the user's facial expression when the app
is opened (off by default, explained before activation, visible indicator during each reading). No image is
stored or sent; only a few numbers are kept. It is presented as an estimate, not a diagnosis.

Bluetooth: optional connection to standard Bluetooth Low Energy sensors (heart-rate strap, blood-pressure monitor,
scale, thermometer, pulse oximeter) to record their measurements on the device.

Notifications: optional local reminders (evening note, gut check, portion reminder during a FODMAP
reintroduction), answerable from the notification.

Backup copy: the app keeps a copy of the user's entries in a folder of its Documents directory (visible in Files) so
that data is not lost if the system clears the web database. This folder is excluded from iCloud backup
(isExcludedFromBackup), in line with guideline 5.1.3(ii); users move to a new iPhone by exporting a file and importing
it.

Purchases: three auto-renewable subscriptions in one group (« Halcya »): Silver yearly (29.99 EUR, 2-week free
trial), Silver monthly (4.99 EUR) and Gold monthly (9.99 EUR). They add more AI meal analyses per day (10 or 20), the
meal-to-gut insights, the guided FODMAP reintroduction and the PDF report; Gold also estimates portion sizes better.
Everything else stays free. To reach the
subscription screen: gear icon (top right) → « Paramètres » → « Découvrir le premium » (« Restaurer un achat » is on
the same screen). No account is needed: purchases go through the App Store.

Privacy policy: https://spreadzenox.github.io/HealthTrack-iOS/confidentialite/
Terms of use: https://spreadzenox.github.io/HealthTrack-iOS/conditions/
Support: https://spreadzenox.github.io/HealthTrack-iOS/assistance/
