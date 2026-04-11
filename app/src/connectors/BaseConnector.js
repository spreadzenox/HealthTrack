/**
 * BaseConnector – abstract base for all health-data source connectors.
 *
 * A connector is responsible for:
 *  1. Reporting its availability on the current platform.
 *  2. Requesting / checking permissions to the underlying data source.
 *  3. Syncing data into the HealthTrack local IndexedDB store.
 *
 * To add a new connector, extend this class, override the abstract methods,
 * and register the instance in connectorRegistry.js.
 */
export class BaseConnector {
  /**
   * @param {object} opts
   * @param {string} opts.id        – Unique stable identifier (e.g. 'health_connect')
   * @param {string} opts.name      – Human-readable name (displayed in UI)
   * @param {string} opts.description – Short description shown in the connector card
   * @param {string[]} opts.dataTypes – The HealthTrack entry types this connector produces
   *                                   (e.g. ['steps','sleep','heart_rate','activity'])
   */
  constructor({ id, name, description, dataTypes }) {
    if (!id || !name) throw new Error('BaseConnector requires id and name')
    this.id = id
    this.name = name
    this.description = description
    this.dataTypes = dataTypes || []
  }

  /**
   * Returns true if this connector can run on the current device / platform.
   * Override to add platform checks (e.g. Capacitor.isNativePlatform()).
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    return false
  }

  /**
   * Returns detailed availability info. Override to provide richer diagnostics.
   * @returns {Promise<{ available: boolean, reason?: string, platform?: string }>}
   */
  async availabilityDetails() {
    const available = await this.isAvailable()
    return { available }
  }

  /**
   * Returns the current permission status.
   * @returns {Promise<'granted'|'denied'|'not_asked'>}
   */
  async checkPermissions() {
    return 'not_asked'
  }

  /**
   * Requests necessary permissions from the user.
   * Should return the resulting status.
   * @returns {Promise<'granted'|'denied'>}
   */
  async requestPermissions() {
    return 'denied'
  }

  /**
   * Performs a data sync: reads data from the source and writes it into
   * the HealthTrack local storage via the provided writer function.
   *
   * @param {object} opts
   * @param {Date}   opts.since   – Lower bound for the time range to fetch
   * @param {Date}   opts.until   – Upper bound (defaults to now)
   * @param {function} opts.writer – Async function(entries[]) to persist data
   * @returns {Promise<{ synced: number, skipped: number, errors: string[] }>}
   */
  // eslint-disable-next-line no-unused-vars
  async sync({ since, until, writer }) {
    return { synced: 0, skipped: 0, errors: [] }
  }
}
