# Journaux de diagnostic des appareils

Le propriétaire dépose ici les journaux exportés par l'app (`healthtrack-diagnostic-montre-AAAA-MM-JJ-HH-MM.json`,
Plus → Connecteurs → « Montre Huawei en direct » → « Enregistrer le journal »). Chaque run hors « idées » commence par
regarder s'il y en a un nouveau et le lit (étapes, verdict, `watch.linkParams`, trames `watch.frames`).

Il y a **deux sortes de journaux** :
- `healthtrack-watch-diagnostic` (« Tester la connexion directe ») : lecture seule, ne touche pas à la montre ;
- `healthtrack-watch-connect` (« Se connecter à la montre ») : va jusqu'à l'authentification HiChain. Depuis le
  13/10 (run 11:04), ce journal porte en plus `hichain` : l'analyse **sans secret** de chaque réponse 0x28
  (classification, `message`, `errorCode`, `resultCode`, `type`, tailles des étiquettes, **noms** des champs JSON,
  premiers octets si ce n'est pas du JSON). C'est ce qui dira pourquoi l'appairage de la GT 6 Pro s'arrête à la
  réponse de 835 octets (voir `journal/protocoles/huawei.md` §6.7).

Journaux déjà reçus :
- `2026-10-13-0904-gt6pro.json` — GT 6 Pro, appairage bloqué à « Réponse HiChain illisible » (HiChain 3, voir §6.7).
- `2026-10-13-1703-gt6pro.json` — GT 6 Pro, app v118 : réponse ISO 0x8001 + 1 octet de fin (§6.9).
- `2026-10-13-2042-gt6pro-v119.md` — GT 6 Pro, app v119 (avant le correctif v120) : échec identique, résumé seulement.

Les journaux ne contiennent ni l'adresse Bluetooth complète de la montre (seulement ses 2 derniers octets), ni aucune
donnée de santé, ni clé, ni PIN, ni aucune valeur des échanges d'authentification (seulement des noms de champs et des
codes). L'aléa de la montre visible dans les trames change à chaque connexion.
