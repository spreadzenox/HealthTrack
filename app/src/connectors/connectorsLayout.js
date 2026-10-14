/**
 * Ordre de la page Connecteurs (D1) : d'abord ce qui envoie déjà des mesures, puis ce qui reste à
 * brancher. Fonction pure : la page lui passe des états lus de façon synchrone (réglages locaux).
 * Les capteurs Bluetooth (outil de recherche) et les guides par marque restent toujours « à brancher ».
 */
export function splitSourcesByStatus({
  connectorIds,
  isConnectorEnabled,
  weatherEnabled,
  phoneUsageEnabled,
  watchEverConnected,
}) {
  const sources = [
    ['watch', watchEverConnected],
    ...connectorIds.map((id) => [id, isConnectorEnabled(id)]),
    ['weather', weatherEnabled],
    ['phone', phoneUsageEnabled],
    ['ble', false],
    ['guides', false],
  ]
  return {
    active: sources.filter(([, on]) => on).map(([id]) => id),
    toConnect: sources.filter(([, on]) => !on).map(([id]) => id),
  }
}
