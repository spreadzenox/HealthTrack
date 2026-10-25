# Invitation des testeurs du test fermé (prête pour la version candidate)

> Préparé le 24/10 15:30 (BACKLOG « 6f »). À envoyer **seulement** quand le résumé de la semaine affiche
> « 👉 Version candidate prête : vous pouvez inviter les testeurs ». Ne rien envoyer avant.

## 1. Le jour où la version candidate part en alpha (fait par Claude, via la CI)

1. Claude choisit les dates de la **période de lancement** (premium offert à toutes les installations de la version
   Google Play, sans achat) et les écrit dans `relay/src/launch-period.json` :
   - `from` = date et heure de publication de la version candidate sur la piste alpha (UTC) ;
   - `until` = jour de l'invitation + 14 jours (durée du test fermé obligatoire) + 10 jours de marge
     (retardataires, examen de la demande de production), à minuit UTC.
2. Le merge sur `main` redéploie le relais (« Relais — déploiement ») : son résumé affiche
   « Période de lancement : premium offert du … au … » et « Installation sans achat : premium=true source=launch ».
   **Aucune mise à jour de l'app n'est nécessaire.**
3. Dans l'app, la page Premium et le dernier écran de l'onboarding affichent alors **« Premium offert pendant le
   test »** (« jusqu'au …, vous n'avez rien à payer ») : aucune formule, aucun bouton d'achat, aucun « Restaurer un
   achat ». Le jour de l'échéance, le paywall habituel revient tout seul (prix lus dans Google Play).

## 2. Ce que vous faites, vous (propriétaire)

**Prolonger la période** (sans mise à jour de l'app) : sur GitHub, ouvrez `relay/src/launch-period.json` → crayon
« Modifier » → changez la date de `until` (même format, par exemple `"2026-12-15T00:00:00Z"`) → « Commit changes »
directement sur `main`. Le relais est redéployé en 3 à 5 minutes (Actions → « Relais — déploiement », vert). Vous
pouvez aussi simplement le demander dans une consigne : le run suivant le fera.

**Couper la période** (pour retester vous-même l'abonnement, par exemple) : même fichier, `"off": false` → `"off": true`,
commit sur `main`. Attention : **tous** les testeurs perdent alors le premium jusqu'à ce que vous remettiez `false`
(ils voient de nouveau le paywall et pourraient payer avec une vraie carte). Comme votre Gmail est testeur de licence,
le plus sûr est de retester l'abonnement **après** la fin du test fermé, ou sur un créneau très court.

**Inviter** (dans cet ordre) :
1. Partagez le lien du groupe : https://groups.google.com/g/halcya-testeurs (chaque testeur clique « Rejoindre le
   groupe » avec le compte Gmail de son téléphone Android).
2. Puis le lien « Rejoindre sur le Web » de la piste de test fermé : Play Console → Halcya → Tester → Test fermé →
   Alpha → onglet **Testeurs** → en bas, « Rejoindre sur le Web » → « Copier le lien ».
3. Puis le lien de la fiche : https://play.google.com/store/apps/details?id=fr.jpesquet.sante

## 3. Texte d'invitation à envoyer (copier-coller)

> Bonjour,
>
> Je lance **Halcya**, une app Android qui aide à comprendre ce qui va avec vos bons et mauvais jours (ventre,
> sommeil, énergie, bien-être), en gardant vos données sur votre téléphone. Avant sa sortie publique, Google
> m'impose un test fermé de **14 jours avec au moins 12 personnes** : pouvez-vous m'aider ?
>
> **Le premium est offert pendant le test : vous n'avez rien à payer**, aucune carte bancaire n'est demandée.
>
> Ce qu'il faut faire (5 minutes, avec le compte Gmail de votre téléphone Android) :
> 1. Rejoindre le groupe des testeurs : https://groups.google.com/g/halcya-testeurs
> 2. Accepter le test : <lien « Rejoindre sur le Web »>
> 3. Installer l'app depuis le Play Store : https://play.google.com/store/apps/details?id=fr.jpesquet.sante
> 4. **Garder l'app installée pendant 14 jours, sans quitter le groupe ni le test**, et **l'ouvrir au moins tous les
>    2 ou 3 jours** (une photo de repas, une note du ventre, ce que vous voulez) : Google vérifie que l'app est
>    vraiment utilisée. Vos retours, même courts, me sont précieux.
>
> Astuces :
> - L'app ne sort pas dans la recherche du Play Store tant qu'elle est en test : passez par le lien ci-dessus, ou
>   Play Store → votre photo de profil → Gérer les applications et l'appareil → Gérer → filtre « Non installées ».
> - Si l'app ou sa mise à jour n'apparaît pas : Paramètres du téléphone → Applications → Google Play Store →
>   Forcer l'arrêt, puis Stockage → Vider le cache, et rouvrez le lien.
> - Si vous désinstallez puis réinstallez, passez aussi par le lien ou par « Non installées ».
>
> Merci beaucoup !


## Rappel du jour 7 (à envoyer au groupe par le propriétaire ; ajouté le 25/10, I166)

> Bonjour à tous, on est à la moitié du test de Halcya, merci ! Deux petites choses : **restez bien inscrits au test
> jusqu'au <date de fin>** (si on passe sous 12 personnes, Google remet le compteur à zéro), et **ouvrez l'app de
> temps en temps** d'ici là. Si quelque chose vous a gêné ou plu, même en une phrase, répondez-moi : vos retours
> servent directement aux prochaines versions.
