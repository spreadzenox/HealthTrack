/**
 * Transports vers une montre Huawei / Honor. Même format de trame sur les deux :
 * - Bluetooth classique (RFCOMM, plugin natif `BtClassic`) : montres GT 3 → GT 7 et récentes ;
 * - BLE GATT (service FE86, écriture FE01, notifications FE02) : bracelets et anciens modèles.
 * Un transport : { kind, label, open(onData, onClose), send(bytes), close() }.
 */
import { HUAWEI_SERVICE, HUAWEI_WRITE, HUAWEI_NOTIFY, toHex } from './protocol'

/** Service SDP (RFCOMM) du protocole Huawei, et sa variante Honor. */
export const HUAWEI_RFCOMM_UUID = '82ff3820-8411-400c-b85a-55bdb32cf060'
export const HONOR_RFCOMM_UUID = 'c9770a18-4c3d-453a-8aaf-d7ec7bbd2785'

export const fromHex = (s) => Uint8Array.from((String(s).replace(/[^0-9a-f]/gi, '').match(/../g) || []).map((b) => parseInt(b, 16)))
const toBytes = (view) => (view instanceof DataView ? new Uint8Array(view.buffer, view.byteOffset, view.byteLength) : Uint8Array.from(view || []))

/** RFCOMM : `plugin` = plugin natif BtClassic (connect / write / disconnect / addListener). */
export function classicTransport(plugin, deviceId, uuid) {
  const handles = []
  return {
    kind: 'classic',
    label: 'Bluetooth classique',
    async open(onData, onClose) {
      handles.push(await plugin.addListener('data', (e) => onData(fromHex(e.value))))
      handles.push(await plugin.addListener('disconnected', () => onClose?.()))
      try {
        await plugin.connect({ deviceId, uuid, timeoutMs: 15_000 })
      } catch (e) {
        await this.close()
        throw e
      }
    },
    async send(bytes) {
      await plugin.write({ value: toHex(bytes).replace(/ /g, '') })
    },
    async close() {
      // écouteurs retirés d'abord : la fin du fil de lecture natif ne doit pas passer pour une coupure par la montre
      for (const h of handles.splice(0)) await h?.remove?.()
      await plugin.disconnect?.().catch?.(() => {})
    },
  }
}

/** BLE GATT : `client` = client `@capacitor-community/bluetooth-le` (ou faux client des tests). */
export function bleTransport(client, deviceId) {
  return {
    kind: 'ble',
    label: 'Bluetooth basse consommation',
    async open(onData, onClose) {
      await client.connect(deviceId, () => onClose?.(), { timeout: 15_000 })
    },
    async subscribe(onData) {
      await client.startNotifications(deviceId, HUAWEI_SERVICE, HUAWEI_NOTIFY, (view) => onData(toBytes(view)))
    },
    async send(bytes) {
      const view = new DataView(Uint8Array.from(bytes).buffer)
      try {
        await client.write(deviceId, HUAWEI_SERVICE, HUAWEI_WRITE, view)
      } catch {
        await client.writeWithoutResponse(deviceId, HUAWEI_SERVICE, HUAWEI_WRITE, view)
      }
    },
    async close() {
      await client.stopNotifications?.(deviceId, HUAWEI_SERVICE, HUAWEI_NOTIFY).catch(() => {})
      await client.disconnect?.(deviceId).catch(() => {})
    },
  }
}
