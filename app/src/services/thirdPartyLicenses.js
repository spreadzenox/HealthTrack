/**
 * Composants de tiers embarqués ou téléchargés par l'app, et leur licence (LICENCES-TIERCES, 02/11/2026).
 * Affichés par la page « Licences » (Réglages). Le test `thirdPartyLicenses.test.js` échoue si une dépendance npm de
 * production ou une bibliothèque Android de `android/app/build.gradle` manque ici, ou si sa licence a changé.
 * Version Play : aucun nom de modèle visible (décision du 31/10) ; les auteurs sont cités, pas les modèles.
 */
import ciqualMeta from '../data/ciqualMeta.json'
import measurements from '../data/fodmapMeasurements.json'

export const LICENSE_URLS = {
  'MIT': 'https://opensource.org/license/mit',
  'Apache-2.0': 'https://www.apache.org/licenses/LICENSE-2.0',
  'MPL-2.0': 'https://www.mozilla.org/MPL/2.0/',
  'OFL-1.1': 'https://openfontlicense.org',
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/deed.fr',
  'Android SDK': 'https://developer.android.com/studio/terms',
}

/** Dépendances npm de production (package.json), licence lue dans node_modules par le test. */
export const NPM_LICENSES = [
  { name: 'React, React DOM', packages: ['react', 'react-dom'], license: 'MIT' },
  { name: 'React Router', packages: ['react-router-dom'], license: 'MIT' },
  { name: 'Capacitor', packages: ['@capacitor/core', '@capacitor/android', '@capacitor/cli', '@capacitor/app',
    '@capacitor/app-launcher', '@capacitor/filesystem', '@capacitor/share'], license: 'MIT' },
  { name: 'Capacitor Bluetooth LE', packages: ['@capacitor-community/bluetooth-le'], license: 'MIT' },
  { name: 'Capacitor Health', packages: ['@capgo/capacitor-health'], license: 'MPL-2.0',
    note: 'Code source : https://github.com/Cap-go/capacitor-health' },
  { name: 'pdf-lib, fontkit', packages: ['pdf-lib', '@pdf-lib/fontkit'], license: 'MIT' },
  { name: 'noble-curves', packages: ['@noble/curves'], license: 'MIT' },
  { name: 'Polices Figtree et IBM Plex Mono', packages: ['@fontsource-variable/figtree', '@fontsource/ibm-plex-mono'],
    license: 'OFL-1.1' },
]

/** Bibliothèques Android (préfixe de leurs coordonnées Maven dans build.gradle). */
export const ANDROID_LICENSES = [
  { name: 'AndroidX', artifacts: ['androidx.'], license: 'Apache-2.0' },
  { name: 'LiteRT', artifacts: ['com.google.ai.edge.litert:'], license: 'Apache-2.0' },
  { name: 'ONNX Runtime', artifacts: ['com.microsoft.onnxruntime:'], license: 'MIT' },
  { name: 'Google Play Billing, Play Integrity', artifacts: ['com.android.billingclient:', 'com.google.android.play:'],
    license: 'Android SDK', play: true },
]

function faceModels(features) {
  const named = features?.aiModelName
  return [
    { name: named ? 'MediaPipe Face Detector et Face Landmarker (Google)' : 'Détection du visage (Google)',
      license: 'Apache-2.0' },
    { name: named
      ? 'HSEmotion, modèles valence / éveil (A. Savchenko, dépôt EmotiEffLib)'
      : 'Estimation du bien-être (modèles d’A. Savchenko)',
    license: 'Apache-2.0', note: 'Téléchargés à l’activation de la lecture du visage.' },
  ]
}

/** « CC BY 4.0 (données CC0) » → « CC BY 4.0 » ; « Conditions du site MEXT : … » → « Conditions MEXT ». */
export function shortLicense(text) {
  return text.split(' : ')[0].replace(/ \(.*\)$/, '').replace(/^Conditions du site /, 'Conditions ')
}

function dataSources() {
  const fodmap = Object.values(measurements.sources).map((s) => ({
    name: s.cite, license: shortLicense(s.license), note: s.doi ? `doi:${s.doi}` : s.url,
  }))
  return [
    { name: ciqualMeta.attribution.replace(/ \(CC BY 4\.0\)\.?$/, ''), license: 'CC BY 4.0', note: ciqualMeta.source },
    ...fodmap,
  ]
}

/** Sections de la page, filtrées par variante (Play Billing et Integrity : version Play seulement). */
export function licenseSections(features = {}) {
  const isPlay = Boolean(features.billing)
  return [
    { title: 'Bibliothèques', items: [...NPM_LICENSES, ...ANDROID_LICENSES.filter((a) => !a.play || isPlay)] },
    { title: 'Lecture du visage', items: faceModels(features) },
    { title: 'Données sur les aliments', items: dataSources() },
  ].map((s) => ({ ...s, items: s.items.map(({ name, license, note }) => ({ name, license, note })) }))
}
