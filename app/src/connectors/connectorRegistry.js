/**
 * Connector registry – central list of all available connectors.
 *
 * To add a new connector:
 *   1. Create a class in its own file extending BaseConnector.
 *   2. Import it here and add an instance to the CONNECTORS array.
 *
 * Components and pages import CONNECTORS (or use getConnector) from here
 * rather than importing individual connectors directly.
 */
import { HealthConnectConnector } from './HealthConnectConnector'
import { WithingsConnector } from './WithingsConnector'
import { isWithingsDirectConnectAvailable } from '../settings/withingsConnectConfig'

const ALL_CONNECTORS = [
  new HealthConnectConnector(),
  new WithingsConnector(),
]

/**
 * Connectors shown in the UI.
 * Withings direct OAuth appears when credentials are bundled at build time or in
 * mock/demo mode (tests). Health Connect remains the simple path for watch + basic scale data.
 *
 * @type {import('./BaseConnector').BaseConnector[]}
 */
export const CONNECTORS = ALL_CONNECTORS.filter((c) => {
  if (c.id === 'withings') return isWithingsDirectConnectAvailable()
  return true
})

/**
 * Look up a connector by its stable id (includes hidden connectors).
 * @param {string} id
 * @returns {import('./BaseConnector').BaseConnector | undefined}
 */
export function getConnector(id) {
  return ALL_CONNECTORS.find((c) => c.id === id)
}
