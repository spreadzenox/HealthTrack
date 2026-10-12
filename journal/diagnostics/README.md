# Journaux de diagnostic des appareils

Le propriétaire dépose ici les journaux exportés par l'app (`healthtrack-diagnostic-montre-AAAA-MM-JJ-HH-MM.json`,
Plus → Connecteurs → « Montre Huawei en direct » → « Enregistrer le journal »). Chaque run hors « idées » commence par
regarder s'il y en a un nouveau et le lit (étapes, verdict, `watch.linkParams`, trames `watch.frames`).

Les journaux ne contiennent ni l'adresse Bluetooth complète de la montre (seulement ses 2 derniers octets), ni aucune
donnée de santé, ni clé. L'aléa de la montre visible dans les trames change à chaque connexion.
