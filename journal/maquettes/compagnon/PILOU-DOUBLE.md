# Pilou, votre double numérique — conception (14/11/2026)

Demande du propriétaire (14/11) : « J'aimerais que l'apparence du Pilou soit un peu le double numérique de
l'utilisateur. On pourrait prendre une photo du visage de l'utilisateur et l'envoyer à Gemini une fois pour qu'il en
tire un subset structuré en JSON des caractéristiques du visage de l'utilisateur et faire en sorte que le Pilou lui
ressemble. Pour que ce soit viable il faut que les combinaisons soient multiples. »

## 1. Le principe
Pilou reste **Pilou** : il garde sa silhouette de galet, son corps menthe, son ventre crème, son antenne-logo et ses
joues roses. Il **porte vos traits** : vos cheveux (coupe, texture, couleur), vos sourcils, la couleur de vos yeux,
vos lunettes, votre barbe, vos taches de rousseur et vos boucles d'oreilles. On le reconnaît comme « mon Pilou » au
premier coup d'œil, sans jamais imiter un visage humain.

**Une seule photo, un seul envoi, aucune photo gardée.** Il ne reste qu'une petite fiche de style (environ 450 octets
de JSON), sur le téléphone. Si l'on ne veut pas de photo, le même résultat s'obtient **à la main**, dans le Studio
Pilou.

## 2. Le parcours
1. **Proposition**, juste après avoir nommé Pilou (onboarding) ou plus tard depuis Réglages › Mon Pilou : « Et si
   Pilou vous ressemblait ? » Trois choix : **Prendre une photo** · **Le faire à la main** · **Plus tard**.
2. **Information claire avant tout envoi** (écran dédié, consentement séparé, refuser ne bloque rien). Le texte :
   « Votre photo part une seule fois, vers le serveur de Halcya en Europe. Une IA (Gemini, de Google) en tire une
   petite fiche de style : cheveux, yeux, lunettes… La photo n'est gardée ni sur le serveur ni dans l'app. Halcya ne
   déduit jamais votre âge, votre genre, votre origine ni votre santé. » Bouton : **J'accepte, prendre la photo**.
3. **Selfie** avec la caméra avant. Un cadre ovale guide la prise, et Pilou jette un œil depuis le coin. La photo
   est réduite (512 px, JPEG), ses métadonnées sont retirées, elle reste **en mémoire seulement** (jamais écrite sur
   le disque ni dans la galerie).
4. **Analyse** (2 à 4 s) : le relais appelle Gemini avec un schéma de réponse imposé (§ 4) et renvoie le JSON. La
   photo est effacée de la mémoire dès la réponse, ou après 30 s sans réponse.
5. **Transformation** : les traits apparaissent un par un sur Pilou, chacun nommé à l'écran (les cheveux poussent,
   les lunettes se posent, les taches de rousseur s'éparpillent…).
6. **Studio Pilou** : « C'est vous ? Ajustez si besoin. » Les champs que l'IA juge incertains sont signalés
   (« Vérifiez la couleur des yeux »). Il y a des onglets Cheveux · Visage · Yeux · Lunettes · Accessoires, un
   aperçu en direct, « Surprenez-moi » et « Revenir au Pilou d'origine ». Bouton **Valider**.
7. **Ensuite** : la fiche vit dans les réglages locaux, figure dans l'export et s'efface avec « Réinitialiser
   Pilou ». « Refaire avec une photo » est possible jusqu'à 3 fois par mois (plafond du relais). Le Studio reste
   ouvert à tout moment, sans photo.

## 3. Ce qu'on demande à l'IA, et ce qu'on ne lui demande jamais
- **Extrait par l'IA** (traits de style visibles) : cheveux, barbe, sourcils, couleur et forme des yeux, lunettes,
  taches de rousseur, grain de beauté, boucles d'oreilles, piercing du nez.
- **Jamais extrait** :
  - âge, sexe ou genre, couleur de peau ou origine, émotions, santé, poids, beauté ;
  - identité, gabarit ou empreinte du visage : aucun gabarit biométrique n'est calculé ni gardé.
- **Choisi seulement à la main**, jamais déduit d'une photo : les **couvre-chefs**. Cela inclut le foulard, pour ne
  jamais déduire une religion. Ils sont proposés à tout le monde dans le Studio.
- Le corps reste menthe pour tout le monde : il n'y a pas de couleur de peau à deviner.
- La **lecture du visage pour le bien-être** reste ce qu'elle est : 100 % locale, séparée de cette fonction.

## 4. La fiche de style (JSON) et le schéma imposé à Gemini
Appel : relais `POST /v1/pilou/style`, modèle Flash-Lite de l'UE comme pour les repas. Paramètres :
`responseMimeType: "application/json"`, `responseSchema` ci-dessous, température 0. Le relais valide la réponse
contre le schéma ; une valeur inconnue prend la valeur par défaut et le champ est marqué « incertain ». Le corps de
la requête n'est jamais journalisé.

```json
{
  "type": "OBJECT",
  "required": ["cheveux", "sourcils", "yeux", "lunettes", "barbe", "peau", "oreilles", "incertains"],
  "properties": {
    "cheveux": { "type": "OBJECT", "required": ["longueur", "texture", "coiffure", "couleur", "volume"], "properties": {
      "longueur": { "type": "STRING", "enum": ["aucun", "rases", "tres_courts", "courts", "mi_longs", "longs", "tres_longs"] },
      "texture":  { "type": "STRING", "enum": ["raides", "ondules", "boucles", "frises", "crepus"] },
      "coiffure": { "type": "STRING", "enum": ["libres", "frange", "raie_milieu", "raie_cote", "en_arriere", "queue_de_cheval", "chignon", "tresses", "locks", "cotes_rases"] },
      "couleur":  { "type": "STRING", "enum": ["noir", "brun_fonce", "brun", "chatain", "chatain_clair", "blond_fonce", "blond", "blond_platine", "roux", "auburn", "poivre_sel", "gris", "blanc", "rose", "bleu", "violet", "vert"] },
      "meches":   { "type": "STRING", "enum": ["aucune", "claires", "colorees"] },
      "volume":   { "type": "STRING", "enum": ["plat", "moyen", "volumineux"] } } },
    "sourcils": { "type": "OBJECT", "required": ["epaisseur", "forme"], "properties": {
      "epaisseur": { "type": "STRING", "enum": ["fins", "moyens", "epais"] },
      "forme":     { "type": "STRING", "enum": ["droits", "arques", "anguleux"] } } },
    "yeux": { "type": "OBJECT", "required": ["couleur", "forme"], "properties": {
      "couleur": { "type": "STRING", "enum": ["marron_fonce", "marron", "noisette", "vert", "gris", "bleu", "bleu_clair"] },
      "forme":   { "type": "STRING", "enum": ["ronds", "amande", "allonges"] } } },
    "lunettes": { "type": "OBJECT", "required": ["type"], "properties": {
      "type":    { "type": "STRING", "enum": ["aucune", "rondes", "rectangulaires", "carrees_epaisses", "papillon", "aviateur", "sans_monture"] },
      "couleur": { "type": "STRING", "enum": ["noir", "ecaille", "dore", "argent", "transparent", "colore"] } } },
    "barbe": { "type": "OBJECT", "required": ["type"], "properties": {
      "type":    { "type": "STRING", "enum": ["aucune", "ombre", "moustache", "bouc", "collier", "courte", "longue"] },
      "couleur": { "type": "STRING", "enum": ["comme_cheveux", "plus_claire", "plus_foncee", "grise"] } } },
    "peau": { "type": "OBJECT", "required": ["taches_de_rousseur", "grain_de_beaute"], "properties": {
      "taches_de_rousseur": { "type": "STRING", "enum": ["aucune", "legeres", "marquees"] },
      "grain_de_beaute":    { "type": "STRING", "enum": ["aucun", "joue_gauche", "joue_droite", "menton", "levre"] } } },
    "oreilles": { "type": "OBJECT", "required": ["boucles"], "properties": {
      "boucles":      { "type": "STRING", "enum": ["aucune", "puces", "anneaux", "pendantes"] },
      "piercing_nez": { "type": "BOOLEAN" } } },
    "incertains": { "type": "ARRAY", "items": { "type": "STRING" } }
  }
}
```

**Consigne envoyée avec la photo** : « Décris uniquement les traits de style visibles demandés par le schéma, pour
créer un avatar de dessin animé. Ne déduis jamais l'âge, le genre, l'origine, la couleur de peau, l'humeur ni l'état
de santé. Si un trait n'est pas visible ou si tu hésites, choisis la valeur la plus neutre et ajoute le nom du champ
dans `incertains`. Réponds seulement avec le JSON. »

**Ajouté par l'app, jamais par l'IA** : `version`, `couvre_chef` (aucun, bonnet, casquette, bandeau, foulard,
chapeau, serre-tête), et les nuances fines du Studio (teinte ±, longueur ±).

## 5. Combien de Pilou différents ?
| Famille | Valeurs | Combinaisons |
|---|---|---|
| Cheveux | 7 longueurs × 5 textures × 10 coiffures × 17 couleurs × 3 mèches × 3 volumes | 53 550 (≈ 29 400 cohérentes : pas de tresses sur cheveux rasés) |
| Barbe | 6 types × 4 couleurs + aucune | 25 |
| Sourcils | 3 × 3 | 9 |
| Yeux | 7 couleurs × 3 formes | 21 |
| Lunettes | 6 types × 6 couleurs + aucune | 37 |
| Peau | 3 taches × 5 grains | 15 |
| Oreilles | 4 boucles × 2 piercing | 8 |
| Couvre-chef (Studio) | 7 | 7 |

**Total : environ 10¹³ combinaisons théoriques (7,9 × 10¹², compté par le prototype `pilou-double/traits.js`)**, et largement plus d'un million de Pilou **visuellement distincts**
à la taille de l'écran d'accueil. S'y ajoutent les accessoires gagnés (écharpe du jour 3, montre de l'onboarding…)
et les nuances fines du Studio.

## 6. Comment Pilou porte les traits (pour le code)
- **Visage peint** (le visage du chapitre 1 est déjà dessiné en 2D puis projeté sur le corps) : sourcils, couleur de
  l'iris (anneau visible en gros plan, reflet teinté en petit), forme des yeux, taches de rousseur, grain de beauté,
  ombre de barbe et moustache. Ce sont de simples paramètres de dessin.
- **Pièces 3D modulaires**, posées sur le galet :
  - **calottes de cheveux** par longueur × coiffure, la texture passant par la géométrie et la carte de relief ;
    l'**antenne sort toujours entre les mèches** ;
  - **montures** de lunettes ;
  - **barbe** longue en volume ;
  - **boucles d'oreilles** sur les côtés de la tête ;
  - **couvre-chefs**, percés pour l'antenne.
- **Ressorts** du chapitre 1 appliqués aux cheveux longs, aux queues de cheval et aux boucles pendantes : ils suivent
  les sauts.
- **Palettes curatées** (pas de couleur libre) : chaque valeur `couleur` donne une teinte de base, une ombre et un
  reflet choisis pour rester harmonieux avec le menthe et lisibles à petite taille.
- **Budget** : au plus une pièce par famille, ≤ 2 000 triangles par pièce, chargement à la demande. Le visage peint
  ne coûte rien de plus.

## 7. Garde-fous et obligations (à vérifier par la routine avant mise en ligne)
- **Consentement explicite et séparé**, avec l'information du § 2.2 affichée avant la caméra (exigence Google Play
  « Prominent Disclosure » ; App Store : partage avec une IA tierce annoncé et accepté explicitement).
- **Déclarations à mettre à jour** :
  - Google Play, Sécurité des données : photos traitées de façon éphémère, non conservées ;
  - App Store, étiquettes de confidentialité ;
  - politique de confidentialité ;
  - `PLAY-CONFORMITE.md`.
- **Rien n'est gardé** : ni photo, ni gabarit biométrique, ni journal du corps des requêtes. Les conditions de
  Vertex AI sur la non-réutilisation des données sont à vérifier et à citer dans la politique.
- **Coût** : un appel Flash-Lite par utilisateur (quelques centièmes de centime), au plus 3 par mois ; dans le budget.
- **Repli** : sans réseau, sans consentement ou si l'appel échoue, on ouvre le Studio à la main avec le Pilou
  d'origine. Le message dit simplement : « On le fait ensemble ? »
- Pilou reste **bienveillant** : aucun trait n'est commenté (« joli », « jeune »…). Il dit seulement « Voilà, c'est
  nous ! ».
