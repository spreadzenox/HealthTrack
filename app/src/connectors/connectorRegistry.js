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

/** @type {import('./BaseConnector').BaseConnector[]} */
export const CONNECTORS = [
  new HealthConnectConnector(),
]

/**
 * Look up a connector by its stable id.
 * @param {string} id
 * @returns {import('./BaseConnector').BaseConnector | undefined}
 */
export function getConnector(id) {
  return CONNECTORS.find((c) => c.id === id)
}
