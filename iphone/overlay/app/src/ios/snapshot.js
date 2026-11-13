/**
 * Copie de secours de la base, version iOS (dépôt HealthTrack-iOS).
 *
 * Dans WKWebView, IndexedDB n'est pas durable : iOS peut le reprendre quand le téléphone manque de place (guide
 * « Data Storage » de Capacitor, politique de stockage de WebKit ; journal/RECHERCHE.md). L'app tient donc à jour le
 * même fichier JSON que « Télécharger la sauvegarde », qui se restaure par « Importer », dans le dossier
 * « Copie de secours » de Documents (visible dans Fichiers › Sur mon iPhone › Halcya).
 *
 * **Ce dossier est exclu de la sauvegarde iCloud** (directive 5.1.3 (ii) d'Apple : pas de données de santé
 * personnelles dans iCloud ; décision du propriétaire du 1/11) : l'app le crée et le marque à chaque lancement
 * (`SnapshotFolder.swift`, `AppDelegate`). Pour changer de téléphone, c'est l'export. Jusqu'au 1/11, la copie était à
 * la racine de Documents, donc dans la sauvegarde : elle est encore lue, puis retirée dès que la nouvelle est écrite.
 * Rien ne quitte le téléphone ; une base vide n'écrase jamais la copie existante.
 */
export const SNAPSHOT_FILE = 'Halcya-copie-de-secours.json'
/** Dossier de Documents exclu de la sauvegarde iCloud : même nom que `SnapshotFolder.name` (Swift). */
export const SNAPSHOT_DIR = 'Copie de secours'
export const SNAPSHOT_PATH = `${SNAPSHOT_DIR}/${SNAPSHOT_FILE}`
/** Emplacements lus, dans l'ordre : le dossier exclu, puis l'ancienne copie de la racine (avant le 1/11). */
const LOCATIONS = [
  { dir: SNAPSHOT_DIR, path: SNAPSHOT_PATH },
  { dir: '', path: SNAPSHOT_FILE },
]

/**
 * Réglages gardés dans la copie (champ `iosSettings`, ignoré par l'import) : la sauvegarde iCloud n'emporte pas le
 * localStorage de WKWebView (mesuré le 28/10), alors que la sauvegarde Android les ramène. Des préférences seulement :
 * jamais un secret ni un état propre au téléphone (`DEVICE_BOUND_KEYS` de `restoreGuard.js`, appairages, jetons,
 * abonnement, consentement à l'IA redemandé sur le nouveau téléphone) ; l'identifiant d'installation non plus.
 */
export const SNAPSHOT_SETTINGS = [
  'healthtrack_theme',
  'healthtrack_evening_note',
  'healthtrack_evening_note_minute', // heure du rappel du soir choisie (Android v855, `eveningNote.js`)
  'healthtrack_gut_evening',
  'healthtrack_weather',
]

function pickSettings(storage) {
  const settings = {}
  for (const key of SNAPSHOT_SETTINGS) {
    const value = storage?.getItem(key)
    if (value != null) settings[key] = value
  }
  return Object.keys(settings).length ? settings : null
}

/**
 * Écrit la copie dans le dossier exclu de la sauvegarde si la base contient quelque chose, puis seulement alors retire
 * l'ancienne copie de la racine (`removeLegacy`). Rend `true` si la copie a été écrite ; ne lève jamais.
 */
export async function saveSnapshot({ countAllEntries, exportToJson, writeFile, storage, removeLegacy, isExampleMode }) {
  // Pendant l'exemple de la visite guidée (ACC-8 d'Android), le compte lit les données fictives, l'export la vraie base :
  // pas de copie, pour ne jamais remplacer une copie par une base vide
  if (isExampleMode?.()) return false
  try {
    if ((await countAllEntries()) === 0) return false
    const json = await exportToJson()
    const settings = pickSettings(storage)
    await writeFile(SNAPSHOT_PATH, settings ? JSON.stringify({ ...JSON.parse(json), iosSettings: settings }, null, 2) : json)
  } catch {
    return false
  }
  try {
    await removeLegacy?.()
  } catch {
    // retirée à la prochaine copie
  }
  return true
}

/** Rétablit les réglages de la liste trouvés dans une copie ; rend leurs clés. Ne lève jamais. */
export function restoreSnapshotSettings(text, storage = globalThis.localStorage) {
  try {
    const settings = JSON.parse(text)?.iosSettings
    if (!settings || typeof settings !== 'object') return []
    const restored = SNAPSHOT_SETTINGS.filter((key) => typeof settings[key] === 'string')
    for (const key of restored) storage.setItem(key, settings[key])
    return restored
  } catch {
    return []
  }
}

/** Fichiers d'un dossier de Documents (`[]` s'il n'existe pas encore). */
async function filesIn(fs, dir) {
  try {
    return (await fs.list(dir)) || []
  } catch {
    return []
  }
}

/**
 * La copie de secours (`{ text, savedAt }`), ou null s'il n'y en a pas : celle du dossier exclu, sinon l'ancienne de
 * la racine. `fs.list(dossier)` rend les fichiers d'un dossier de Documents (`{ name, mtime }`) : on n'interroge
 * jamais un fichier absent, que Capacitor écrirait en erreur dans la console. Ne lève jamais.
 */
export async function readSnapshot(fs) {
  try {
    for (const { dir, path } of LOCATIONS) {
      const entry = (await filesIn(fs, dir)).find((f) => f.name === SNAPSHOT_FILE)
      if (!entry) continue
      const { data } = await fs.readFile(path)
      return { text: String(data), savedAt: new Date(entry.mtime).toISOString() }
    }
    return null
  } catch {
    return null
  }
}

/** Retire l'ancienne copie de la racine de Documents (dans la sauvegarde iCloud) si elle y est. */
export async function removeLegacySnapshot(fs) {
  if (!(await filesIn(fs, '')).some((f) => f.name === SNAPSHOT_FILE)) return false
  await fs.deleteFile(SNAPSHOT_FILE)
  return true
}

/** Lecture réelle, dans l'app iPhone seulement. */
export async function readDeviceSnapshot() {
  try {
    const [{ Capacitor }, { Filesystem, Directory, Encoding }] = await Promise.all([import('@capacitor/core'), import('@capacitor/filesystem')])
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return null
    return readSnapshot({
      list: async (dir) => (await Filesystem.readdir({ path: dir, directory: Directory.Documents })).files,
      readFile: (path) => Filesystem.readFile({ path, directory: Directory.Documents, encoding: Encoding.UTF8 }),
    })
  } catch {
    return null
  }
}

/**
 * « Supprimer toutes mes données » : la copie contient toutes les entrées et le profil ; elle est effacée aussi, au
 * dossier exclu comme à l'ancienne place (les sauvegardes exportées par la personne restent). Rend `true` si une copie
 * l'a été ; ne lève jamais.
 */
export async function deleteSnapshot(fs) {
  let deleted = false
  for (const { dir, path } of LOCATIONS) {
    try {
      if (!(await filesIn(fs, dir)).some((f) => f.name === SNAPSHOT_FILE)) continue
      await fs.deleteFile(path)
      deleted = true
    } catch {
      // l'autre emplacement est tout de même essayé
    }
  }
  return deleted
}

/** Effacement réel, dans l'app iPhone seulement. */
export async function deleteDeviceSnapshot() {
  try {
    const [{ Capacitor }, { Filesystem, Directory }] = await Promise.all([import('@capacitor/core'), import('@capacitor/filesystem')])
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return false
    return deleteSnapshot({
      list: async (dir) => (await Filesystem.readdir({ path: dir, directory: Directory.Documents })).files,
      deleteFile: (path) => Filesystem.deleteFile({ path, directory: Directory.Documents }),
    })
  } catch {
    return false
  }
}

/** Dans l'app iPhone : stockage persistant demandé, copie au démarrage puis à chaque passage en arrière-plan. */
export async function installSnapshots(deps) {
  if (deps.platform !== 'ios') return
  try {
    await deps.persist?.()
  } catch {
    // sans garantie de toute façon : la copie de secours reste le filet
  }
  deps.addAppStateListener(({ isActive }) => (isActive ? undefined : saveSnapshot(deps)))
  // Laisser l'Accueil se charger avant la première copie
  await deps.wait(10_000)
  await saveSnapshot(deps)
}

/** Branchement réel : Capacitor, @capacitor/app, @capacitor/filesystem et la base de l'app. */
export async function startSnapshots() {
  try {
    const [{ Capacitor }, { App }, { Filesystem, Directory, Encoding }, storage, example] = await Promise.all([
      import('@capacitor/core'),
      import('@capacitor/app'),
      import('@capacitor/filesystem'),
      import('../storage/localHealthStorage.js'),
      import('../storage/exampleMode.js'),
    ])
    await installSnapshots({
      platform: Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web',
      persist: () => navigator.storage?.persist?.(),
      addAppStateListener: (fn) => App.addListener('appStateChange', fn),
      wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      countAllEntries: storage.countAllEntries,
      exportToJson: storage.exportToJson,
      isExampleMode: example.isExampleMode,
      storage: window.localStorage,
      writeFile: (path, data) => Filesystem.writeFile({ path, data, directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true }),
      removeLegacy: () =>
        removeLegacySnapshot({
          list: async (dir) => (await Filesystem.readdir({ path: dir, directory: Directory.Documents })).files,
          deleteFile: (path) => Filesystem.deleteFile({ path, directory: Directory.Documents }),
        }),
    })
  } catch {
    // jamais bloquant pour l'app
  }
}
