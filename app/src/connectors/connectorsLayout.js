/**
 * Ordre de la page Connecteurs (D1) : d'abord ce qui envoie déjà des mesures, puis ce qui reste à
 * brancher. Fonction pure : la page lui passe des états lus de façon synchrone (réglages locaux).
 * Les capteurs Bluetooth (outil de recherche) et les guides par marque restent toujours « à brancher ».
 * La Lecture du visage (chantier prioritaire du bien-être automatique) est toujours en tête dans l'app Android,
 * activée ou non : rangée repliée en bas de page, le propriétaire ne la trouvait pas (signalement du 19/10).
 */
export function splitSourcesByStatus({
  connectorIds,
  isConnectorEnabled,
  weatherEnabled,
  phoneUsageEnabled,
  watchEverConnected,
  faceSenseEnabled = false,
  faceSenseAvailable = false,
}) {
  const sources = [
    ['face', faceSenseEnabled || faceSenseAvailable],
    ['watch', watchEverConnected],
    ...connectorIds.map((id) => [id, isConnectorEnabled(id)]),
    ['weather', weatherEnabled],
    ['phone', phoneUsageEnabled],
    ['ble', false],
    ['guides', false],
  ]
  return {
    active: sources.filter(([, on]) => on).map(([id]) => id),
    // la Lecture du visage épinglée mais pas activée n'envoie rien : le volet « à brancher » reste ouvert
    nothingSending: !sources.some(([id, on]) => on && (id !== 'face' || faceSenseEnabled)),
    toConnect: sources.filter(([, on]) => !on).map(([id]) => id),
  }
}

/**
 * Connecteurs montrés sur la page Sources. Le connecteur Withings (API avec identifiants de développeur) est masqué
 * dans la variante play, sauf s'il est déjà activé ou configuré : on ne retire jamais une source qui sert, et les
 * données déjà importées restent dans le journal et l'export (VC-7).
 */
export function visibleConnectorIds(connectorIds, { withingsApi, withingsInUse }) {
  return connectorIds.filter((id) => id !== 'withings' || withingsApi || withingsInUse)
}
