# TestFlight externe : textes à coller par le propriétaire

Décision du propriétaire du 05/11 (vers 20:15, `POUR-IOS.md` de HealthTrack) : TestFlight **externe**. C'est lui qui
crée le groupe de testeurs externes dans App Store Connect et qui soumet la build à l'examen bêta d'Apple (« Beta App
Review »). Rien n'est changé dans App Store Connect par la routine : voici seulement les textes, prêts à coller.

## Bon à savoir avant de commencer
- **Une build par version passe l'examen bêta** : la première build de chaque numéro de version (par exemple 817)
  attend la réponse d'Apple (souvent moins de 24 h) ; les builds suivantes du même numéro partent sans attendre. Comme
  le numéro suit celui d'Android, presque chaque version d'Android en demandera un nouveau. Le test interne, lui, reste
  sans examen.
- **Quelle build** : la plus récente de TestFlight (le résumé de `journal/README.md` donne son numéro), ou la build
  finale du 6/11 dès qu'elle est annoncée.
- Le chiffrement est déjà déclaré dans l'app (« n'utilise pas de chiffrement non exempté ») : Apple ne demande rien.

## Où coller quoi (App Store Connect → Halcya → TestFlight)

### 1. Informations de test (« Test Information »), en français
**Description de l'app bêta** (« Beta App Description ») :

> Halcya est un journal du ventre et du bien-être, pour les adultes. Vous notez vos repas (en photo, par écrit ou
> à la main), votre ventre et votre bien-être ; l'app les rapproche de votre sommeil, de votre activité et des
> mesures de l'app Santé, et vous montre des pistes à tester. Tout reste sur votre iPhone : seules l'analyse d'un
> repas ou de la forme des selles, la météo et un avis que vous envoyez en sortent, et seulement à votre demande.
> Ce n'est pas un dispositif médical : des estimations et des pistes, jamais un diagnostic.

**Adresse e-mail pour les retours** (« Feedback Email ») : votre adresse de contact, celle de la page d'assistance.

**Politique de confidentialité** : https://spreadzenox.github.io/HealthTrack-iOS/confidentialite/

### 2. Informations pour l'examen bêta (« Beta App Review Information »), en anglais
- **Contact** : votre prénom, nom, téléphone et e-mail (les mêmes que pour l'examen de l'App Store).
- **Sign-in required** : **No** (aucun compte dans l'app).
- **Review Notes** : coller le texte de `store/app-store/notes-examen.md` (entre les deux traits), le même que pour
  la soumission de l'App Store.

### 3. « À tester » (« What to Test ») de la build, en français

> Merci de tester Halcya !
> - Premiers pas : choisissez ce qui vous amène, puis autorisez l'app Santé si vous le voulez (lecture seule).
> - Aujourd'hui : notez votre ventre et votre bien-être, prenez un repas en photo et lancez l'analyse.
> - Journal : vos derniers jours ; si vous suivez votre ventre, essayez « Selles : estimer la forme avec une
>   photo » (la photo est effacée juste après).
> - Analyses : les onglets Bien-être, Ventre, FODMAP et Tendances (les pistes demandent quelques jours de notes).
> - Paramètres → « Votre avis » : écrivez-nous ce qui vous gêne ou vous plaît.
> - Abonnement : Paramètres → « Découvrir le premium » ; en TestFlight, les achats sont des achats de test, sans
>   paiement.
> Dites-nous surtout ce qui est lent, flou ou mal placé sur votre iPhone.

### 4. Groupe externe
TestFlight → **Groupes externes** → « + » → nom libre (par exemple « Testeurs Halcya ») → ajouter les testeurs (e-mail)
ou activer un lien public → ajouter la build choisie → coller « À tester » → **Soumettre pour examen**.
