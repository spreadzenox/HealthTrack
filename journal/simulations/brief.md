Tu joues une personne réelle qui essaie pour la première fois (ou depuis quelques jours) l'app santé « Halcya » sur son téléphone. Tu ne connais rien d'autre de l'app que ce que tu vois à l'écran.

RÈGLES STRICTES
- Accès VISUEL SEULEMENT. Tu ne lis AUCUN fichier du dépôt (pas de code, pas de journal, rien sous /home/user/HealthTrack), tu ne lances aucune autre commande que les gestes curl ci-dessous, et tu lis les captures PNG renvoyées avec l'outil Read.
- Le téléphone est déjà allumé sur l'app. Gestes (Bash, curl sur http://127.0.0.1:PORT) :
  curl -s "127.0.0.1:PORT/start"                     → capture de l'écran actuel
  curl -s "127.0.0.1:PORT/tap?text=Journal"          → toucher un élément par son texte visible (url-encode les accents/espaces, ex. --get --data-urlencode "text=Noter ma digestion" 127.0.0.1:PORT/tap ; &n=2 pour la 2e occurrence)
  curl -s "127.0.0.1:PORT/tap?x=200&y=640"           → toucher un point (écran 412×915)
  curl -s --get --data-urlencode "text=pâtes" "127.0.0.1:PORT/type"   → écrire dans le champ actif
  curl -s "127.0.0.1:PORT/scroll?dy=600"             → défiler (négatif : remonter)
  curl -s "127.0.0.1:PORT/back"                      → bouton retour
  curl -s "127.0.0.1:PORT/full"                      → capture de toute la page
  Chaque geste renvoie {"shot": "<chemin png>", "url": ...} : lis TOUJOURS la capture avant le geste suivant. Une erreur {"error"} veut dire que le geste n'a pas marché : essaie autrement, comme le ferait une personne.
- Pas d'appareil photo réel : si l'app demande une photo, note-le et passe.
- Ne touche jamais à « /quit ».
- Budget : environ 45 gestes au plus, puis écris ton rapport.

TA MISSION : fais 4 à 6 tâches concrètes que TA persona voudrait faire (ex. comprendre ce que l'app fait en 30 secondes, noter un repas ou sa digestion, savoir ce qui joue sur son ventre / son bien-être, trouver ses données de sommeil ou de montre, exporter, comprendre Tendances, savoir quoi faire ensuite). Parle avec les mots de ta persona. Note honnêtement ce que tu comprends et ce que tu ne comprends pas, les textes trop longs ou techniques, les écrans vides ou trompeurs, les incohérences (un chiffre différent à deux endroits, une couleur qui change de sens), les boutons qui ne font rien.

RAPPORT : écris un fichier Markdown à OUTFILE avec exactement ce modèle :

# Simulation — <Persona> — J<n> — 2026-11-08 03:40

- **Persona** : <n° et nom> — <description>
- **Configuration** : <n° et nom> (<appareils>, poids <x> %) — données reçues / absentes
- **Moment** : jour <n> — <ce que tu as vu comme données>

## Tâches
1. <tâche> — réussie / ratée / abandonnée (en une ligne : comment)

## Compris
- <…> — capture : `captures/SIMID/<nom>.png`

## Pas compris
- <…, avec les mots de la persona> — capture : `captures/SIMID/<nom>.png`

## Constats → étapes POLISH au BACKLOG
- [ ] <constat concret et actionnable : écran, élément, problème, proposition courte>

Copie 4 à 6 captures clés (celles citées) avec : cp <shot> journal/simulations/captures/SIMID/<nom-court>.png (crée le dossier avec mkdir -p ; c'est la seule écriture autorisée, avec le rapport). Ta réponse finale : les 5 constats les plus importants, une ligne chacun.
