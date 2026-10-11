/**
 * Contenu des guides « Votre montre n’apparaît pas ? » (page Connecteurs), par marque.
 * Sources : gadgetbridge.org/basics/pairing/huawei-honor-pairing/,
 * gadgetbridge.org/basics/integrations/health-connect/ (consultées le 11/10/2026) ; journal/IDEES.md (I1).
 */
const HC_IN_HEALTHTRACK =
  'Dans HealthTrack, carte Health Connect ci-dessus : activez-la, « Demander les autorisations », puis « Mettre à jour ».'

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
        Dans Gadgetbridge : « + » (Ajouter) → choisissez la montre → appui long sur son nom → <em>Auth key</em> →
        saisissez l’ID de compte, puis connectez.
      </>,
      <>
        Gadgetbridge → Réglages → <em>Intégrations externes</em> → <strong>Health Connect</strong> : activez,
        autorisez les types (FC, VFC, SpO₂, sommeil, respiration, température…) et cochez
        « Synchroniser après la synchro de l’appareil ».
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
      <>Dans <strong>Zepp</strong> ou <strong>Mi Fitness</strong>, ouvrez votre profil et cherchez « Health Connect » (comptes ou applis tierces) → activez.</>,
      HC_IN_HEALTHTRACK,
      <>Alternative sans compte constructeur : Gadgetbridge prend aussi en charge la plupart des montres Xiaomi et Amazfit.</>,
    ],
  },
  {
    id: 'garmin',
    title: 'Garmin',
    intro: 'Garmin Connect écrit une partie de vos données dans Health Connect depuis 2025.',
    steps: [
      <>Dans <strong>Garmin Connect</strong>, cherchez « Health Connect » dans les applications connectées → activez.</>,
      HC_IN_HEALTHTRACK,
    ],
  },
  {
    id: 'other',
    title: 'Withings, Oura, Polar, Fitbit, Coros…',
    intro: 'La plupart de ces apps savent écrire dans Health Connect.',
    steps: [
      <>Dans l’app de l’appareil, cherchez « Health Connect » dans les réglages ou les partenaires → activez.</>,
      HC_IN_HEALTHTRACK,
      <>Withings : HealthTrack peut aussi se connecter directement à votre compte (carte ci-dessus) pour tous les biomarqueurs de la balance.</>,
    ],
  },
]
