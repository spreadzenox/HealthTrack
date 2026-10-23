/**
 * Contenu des guides « Votre montre n’apparaît pas ? » (page Connecteurs), par marque.
 * Sources : gadgetbridge.org/basics/pairing/huawei-honor-pairing/,
 * gadgetbridge.org/basics/integrations/health-connect/ (consultées le 11/10/2026) ; journal/IDEES.md (I1).
 */
import { APP_NAME } from '../config/brand'
import { FEATURES } from '../config/distribution'

const HC_IN_HEALTHTRACK =
  'Dans ' + APP_NAME + ', carte Health Connect ci-dessus : activez-la, « Demander les autorisations », puis « Mettre à jour ».'

// Connecteur Withings par l'API : seulement là où sa carte est proposée (sideload, VC-7)
const WITHINGS_DIRECT_STEP = (
  <>Withings : {APP_NAME} peut aussi se connecter directement à votre compte (carte ci-dessus) pour tous les biomarqueurs de la balance.</>
)

export const WATCH_GUIDES = [
  {
    id: 'huawei',
    title: 'Huawei / Honor (Watch GT, Watch Fit, Band…)',
    intro:
      'L’app Huawei Health n’envoie pas vos données à Health Connect. Solution gratuite et sans compte : ' +
      'l’app libre Gadgetbridge, qui parle directement à la montre (Watch GT 6 Pro prise en charge) ' +
      'et écrit dans Health Connect. Rien ne part sur Internet.',
    steps: [
      <>Installez <strong>Gadgetbridge</strong> depuis F-Droid (il n’est pas sur le Play Store).</>,
      <>
        Récupérez votre <strong>ID de compte Huawei</strong> (17 chiffres) : sur un ordinateur, connectez-vous à
        cloud.huawei.com, ouvrez les outils du navigateur (F12) → Stockage / Application → Cookies → valeur
        de <code>userId</code>. Il sert de clé : la montre n’a pas besoin d’être réinitialisée.
      </>,
      <>
        Dans les réglages Android, <strong>retirez toutes les autorisations de Huawei Health</strong> (ou
        désinstallez-le). <strong>Ne désappairez pas la montre</strong> depuis Huawei Health : cela invaliderait la clé.
      </>,
      <>
        Dans Gadgetbridge : « + » (Ajouter) → choisissez la montre → appui long sur son nom → <em>Auth key</em> →
        saisissez l’ID de compte, puis connectez.
      </>,
      <>
        Gadgetbridge → Réglages → <em>Intégrations externes</em> → <strong>Health Connect</strong> : activez,
        autorisez les types (FC, VFC, SpO₂, sommeil, respiration, température…) et cochez
        « Synchroniser après la synchro de l’appareil ».
      </>,
      HC_IN_HEALTHTRACK,
    ],
    caveats:
      'Contreparties : la montre ne parle qu’à une app à la fois — au quotidien, c’est Gadgetbridge. Le score de ' +
      'stress n’est pas transmis, et pour mettre à jour la montre il faut repasser par Huawei Health. Variante ' +
      'payante qui garde Huawei Health : l’app Health Sync.',
    links: [
      { href: 'https://f-droid.org/packages/nodomain.freeyourgadget.gadgetbridge/', label: 'Gadgetbridge sur F-Droid' },
      { href: 'https://gadgetbridge.org/basics/pairing/huawei-honor-pairing/', label: 'Guide d’appairage détaillé (anglais)' },
    ],
  },
  {
    id: 'samsung',
    title: 'Samsung (Galaxy Watch, Galaxy Fit, Galaxy Ring)',
    intro: 'Samsung Health écrit dans Health Connect, il suffit de l’autoriser.',
    steps: [
      <>Samsung Health → menu ⋮ → Paramètres → <strong>Health Connect</strong> → autorisez le partage.</>,
      HC_IN_HEALTHTRACK,
    ],
  },
  {
    id: 'xiaomi',
    title: 'Xiaomi / Redmi / Amazfit',
    intro: 'Zepp (Amazfit) et Mi Fitness (Xiaomi, Redmi) écrivent dans Health Connect.',
    steps: [
      <>Dans <strong>Zepp</strong> ou <strong>Mi Fitness</strong>, ouvrez votre profil et cherchez « Health Connect » (comptes ou applis tierces) → activez.</>,
      HC_IN_HEALTHTRACK,
      <>Alternative sans compte constructeur : Gadgetbridge prend aussi en charge la plupart des montres Xiaomi et Amazfit.</>,
    ],
  },
  {
    id: 'garmin',
    title: 'Garmin',
    intro: 'Garmin Connect écrit une partie de vos données dans Health Connect depuis 2025.',
    steps: [
      <>Dans <strong>Garmin Connect</strong>, cherchez « Health Connect » dans les applications connectées → activez.</>,
      HC_IN_HEALTHTRACK,
    ],
  },
  {
    id: 'other',
    title: 'Withings, Oura, Polar, Fitbit, Coros…',
    intro: 'La plupart de ces apps savent écrire dans Health Connect.',
    steps: [
      <>Dans l’app de l’appareil, cherchez « Health Connect » dans les réglages ou les partenaires → activez.</>,
      HC_IN_HEALTHTRACK,
      WITHINGS_DIRECT_STEP,
    ],
  },
]

/**
 * Guide Huawei de la variante play (VC-13) : la connexion directe d'abord, Gadgetbridge seulement en dernier recours
 * et sans la manipulation des cookies du guide sideload.
 */
export const HUAWEI_DIRECT_GUIDE = {
  id: 'huawei',
  title: 'Huawei / Honor (Watch GT, Watch Fit, Band…)',
  intro:
    'L’app Huawei Santé n’envoie pas vos données à Health Connect, mais ' + APP_NAME + ' sait se connecter ' +
    'directement à une montre compatible Huawei, en Bluetooth. Rien ne part sur Internet.',
  steps: [
    <>Plus haut sur cette page, carte <strong>Montre Huawei</strong> : appuyez sur « Connecter ma montre ».</>,
    <>Gardez la montre près du téléphone, Bluetooth activé, et acceptez les demandes d’association.</>,
    <>
      La montre ne parle qu’à une app à la fois : si elle est déjà liée à Huawei Santé, l’assistant de la carte vous
      guide pour la libérer. <strong>Ne la dissociez jamais dans Huawei Santé</strong> : cela invalide sa clé sans la
      libérer.
    </>,
  ],
  caveats:
    'Votre modèle n’est pas reconnu ? En dernier recours, l’app libre Gadgetbridge peut relayer la montre vers ' +
    'Health Connect : suivez son guide officiel.',
  links: [
    { href: 'https://gadgetbridge.org/basics/pairing/huawei-honor-pairing/', label: 'Guide Gadgetbridge (anglais)' },
  ],
}

/** Guides à afficher selon la variante. */
export function watchGuidesFor(features = FEATURES) {
  if (features.gadgetbridgeGuide && features.withingsApi) return WATCH_GUIDES
  return WATCH_GUIDES.map((g) => {
    if (g.id === 'huawei' && !features.gadgetbridgeGuide) return HUAWEI_DIRECT_GUIDE
    if (!features.withingsApi && g.steps.includes(WITHINGS_DIRECT_STEP)) {
      return { ...g, steps: g.steps.filter((step) => step !== WITHINGS_DIRECT_STEP) }
    }
    return g
  })
}
