import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseCsv, toCsv, fillTemplate, validateDataSafety, declaredTypes, publishDataSafety } from './dataSafety.mjs'
import { API, PlayApiError, isAccessDenied } from './publish.mjs'
import { DATA_SAFETY_ANSWERS, DECLARED_DATA_TYPES } from '../../store/data-safety/answers.mjs'

const DIR = resolve(import.meta.dirname, '../../store/data-safety')
const TEMPLATE = readFileSync(resolve(DIR, 'template.csv'), 'utf8')
const POLICY = readFileSync(resolve(import.meta.dirname, '../../public/privacypolicy.html'), 'utf8')

const HEADER = 'Question ID (machine readable),Response ID (machine readable),Response value,Answer requirement,Human-friendly question label'
const mini = [
  HEADER,
  'PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA,,,REQUIRED,Collects?',
  'PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT,,,MAYBE_REQUIRED,Encrypted?',
  'PSL_SUPPORTED_ACCOUNT_CREATION_METHODS,PSL_ACM_NONE,,MULTIPLE_CHOICE,No accounts',
  'PSL_SUPPORT_DATA_DELETION_BY_USER,DATA_DELETION_YES,,SINGLE_CHOICE,Yes',
  'PSL_SUPPORT_DATA_DELETION_BY_USER,DATA_DELETION_NO,,SINGLE_CHOICE,No',
  'PSL_DATA_TYPES_LOCATION,PSL_APPROX_LOCATION,,MULTIPLE_CHOICE,Location/Approximate location',
  'PSL_DATA_TYPES_HEALTH_AND_FITNESS,PSL_HEALTH,,MULTIPLE_CHOICE,Health',
  'PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:PSL_DATA_USAGE_COLLECTION_AND_SHARING,PSL_DATA_USAGE_ONLY_COLLECTED,,MULTIPLE_CHOICE,"Is this data collected, shared or both?/Collected"',
  'PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:PSL_DATA_USAGE_COLLECTION_AND_SHARING,PSL_DATA_USAGE_ONLY_SHARED,,MULTIPLE_CHOICE,Shared',
  'PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:PSL_DATA_USAGE_EPHEMERAL,,,MAYBE_REQUIRED,Ephemeral?',
  'PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:DATA_USAGE_USER_CONTROL,PSL_DATA_USAGE_USER_CONTROL_OPTIONAL,,SINGLE_CHOICE,Optional',
  'PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:DATA_USAGE_USER_CONTROL,PSL_DATA_USAGE_USER_CONTROL_REQUIRED,,SINGLE_CHOICE,Required',
  'PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:DATA_USAGE_COLLECTION_PURPOSE,PSL_APP_FUNCTIONALITY,,MULTIPLE_CHOICE,Functionality',
  'PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:DATA_USAGE_SHARING_PURPOSE,PSL_APP_FUNCTIONALITY,,MULTIPLE_CHOICE,Functionality',
  'PSL_DATA_USAGE_RESPONSES:PSL_HEALTH:PSL_DATA_USAGE_EPHEMERAL,,,MAYBE_REQUIRED,Ephemeral?',
].join('\n')

const base = [
  { question: 'PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA', value: true },
  { question: 'PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT', value: true },
  { question: 'PSL_SUPPORTED_ACCOUNT_CREATION_METHODS', response: 'PSL_ACM_NONE', value: true },
  { question: 'PSL_SUPPORT_DATA_DELETION_BY_USER', response: 'DATA_DELETION_YES', value: true },
  { question: 'PSL_DATA_TYPES_LOCATION', response: 'PSL_APPROX_LOCATION', value: true },
  { question: 'PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:PSL_DATA_USAGE_COLLECTION_AND_SHARING', response: 'PSL_DATA_USAGE_ONLY_COLLECTED', value: true },
  { question: 'PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:PSL_DATA_USAGE_EPHEMERAL', value: false },
  { question: 'PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:DATA_USAGE_USER_CONTROL', response: 'PSL_DATA_USAGE_USER_CONTROL_OPTIONAL', value: true },
  { question: 'PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:DATA_USAGE_COLLECTION_PURPOSE', response: 'PSL_APP_FUNCTIONALITY', value: true },
]
const without = (q, r) => base.filter((a) => !(a.question === q && (r === undefined || a.response === r)))

describe('CSV', () => {
  it('lit et réécrit à l’identique, guillemets, virgules et sauts de ligne compris', () => {
    const text = 'a,"b, c","d ""e""",,"f\ng"\nh,i,,,\n'
    const rows = parseCsv(text)
    expect(rows).toEqual([['a', 'b, c', 'd "e"', '', 'f\ng'], ['h', 'i', '', '', '']])
    expect(toCsv(rows)).toBe(text)
  })

  it('le modèle de la Play Console se relit sans perte (5 colonnes partout)', () => {
    const rows = parseCsv(TEMPLATE)
    expect(rows[0].join(',')).toBe(HEADER)
    expect(rows.length).toBeGreaterThan(700)
    expect(rows.every((r) => r.length === 5)).toBe(true)
    expect(rows.slice(1).every((r) => r[2] === '')).toBe(true)
    expect(toCsv(rows)).toBe(TEMPLATE)
  })
})

describe('remplissage et règles du formulaire', () => {
  it('remplit les lignes citées et laisse les autres vides', () => {
    const { rows, errors } = fillTemplate(mini, base)
    expect(errors).toEqual([])
    expect(rows.find((r) => r[1] === 'PSL_APPROX_LOCATION')[2]).toBe('true')
    expect(rows.find((r) => r[0].endsWith('PSL_APPROX_LOCATION:PSL_DATA_USAGE_EPHEMERAL'))[2]).toBe('false')
    expect(rows.find((r) => r[1] === 'PSL_HEALTH')[2]).toBe('')
    expect(validateDataSafety(rows)).toEqual([])
    expect(declaredTypes(rows)).toEqual(['PSL_APPROX_LOCATION'])
  })

  it('signale une réponse absente du modèle (question renommée par Google)', () => {
    const { errors } = fillTemplate(mini, [...base, { question: 'PSL_NOUVELLE', value: true }])
    expect(errors).toEqual(['Réponse inconnue du modèle : PSL_NOUVELLE'])
  })

  it.each([
    ['question obligatoire', without('PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA'), /obligatoire sans réponse/],
    ['collectée ou partagée', without('PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:PSL_DATA_USAGE_COLLECTION_AND_SHARING'), /collectée, partagée/],
    ['facultative', without('PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:DATA_USAGE_USER_CONTROL'), /obligatoire ou facultative/],
    ['raison de collecte', without('PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:DATA_USAGE_COLLECTION_PURPOSE'), /raison de la collecte/],
    ['éphémère', without('PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:PSL_DATA_USAGE_EPHEMERAL'), /éphémère/],
    ['suppression', without('PSL_SUPPORT_DATA_DELETION_BY_USER'), /suppression/],
    ['compte', without('PSL_SUPPORTED_ACCOUNT_CREATION_METHODS'), /Création de compte/],
    ['type sans collecte', [...without('PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA'), { question: 'PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA', value: false }], /collecte est déclarée absente/],
    ['choix unique', [...base, { question: 'PSL_SUPPORT_DATA_DELETION_BY_USER', response: 'DATA_DELETION_NO', value: true }], /Choix unique/],
    ['usage d’un type non déclaré', [...base, { question: 'PSL_DATA_USAGE_RESPONSES:PSL_HEALTH:PSL_DATA_USAGE_EPHEMERAL', value: false }], /type non déclaré : PSL_HEALTH/],
    [
      'partage sans raison',
      [...base, { question: 'PSL_DATA_USAGE_RESPONSES:PSL_APPROX_LOCATION:PSL_DATA_USAGE_COLLECTION_AND_SHARING', response: 'PSL_DATA_USAGE_ONLY_SHARED', value: true }],
      /raison du partage/,
    ],
  ])('refuse : %s', (_, answers, re) => {
    const { rows } = fillTemplate(mini, answers)
    expect(validateDataSafety(rows).join('\n')).toMatch(re)
  })
})

describe('déclaration de Halcya (variante play)', () => {
  const { rows, errors } = fillTemplate(TEMPLATE, DATA_SAFETY_ANSWERS)

  it('est complète et cohérente avec le modèle de la Play Console', () => {
    expect(errors).toEqual([])
    expect(validateDataSafety(rows)).toEqual([])
  })

  it('déclare exactement les données qui quittent le téléphone, aucune donnée de santé', () => {
    expect(declaredTypes(rows)).toEqual(DECLARED_DATA_TYPES)
    expect(declaredTypes(rows)).not.toContain('PSL_HEALTH')
    expect(declaredTypes(rows)).not.toContain('PSL_FITNESS')
  })

  it('ne déclare aucun partage, aucune publicité, aucune mesure d’audience', () => {
    const answered = rows.filter((r) => r[2] === 'true').map((r) => r[1])
    expect(answered).not.toContain('PSL_DATA_USAGE_ONLY_SHARED')
    expect(answered).not.toContain('PSL_ADVERTISING')
    expect(answered).not.toContain('PSL_ANALYTICS')
  })

  it('chaque réponse dit pourquoi', () => {
    expect(DATA_SAFETY_ANSWERS.every((a) => a.why?.length > 10)).toBe(true)
  })

  it('reste d’accord avec la politique de confidentialité', () => {
    expect(POLICY).toMatch(/Open-Meteo/)
    expect(POLICY).toMatch(/Gemini/)
    expect(POLICY).toMatch(/Vertex AI/)
    expect(POLICY).toMatch(/identifiant aléatoire/)
    expect(POLICY).toMatch(/id="vos-droits"/)
    const url = DATA_SAFETY_ANSWERS.find((a) => a.question === 'PSL_DATA_DELETION_URL').value
    expect(url).toBe('https://spreadzenox.github.io/HealthTrack/confidentialite/#vos-droits')
  })

  it('le CSV à importer à la main est à jour (node scripts/play/data-safety-cli.mjs --write)', () => {
    expect(readFileSync(resolve(DIR, 'data-safety.csv'), 'utf8')).toBe(toCsv(rows))
  })
})

describe('envoi à Google Play', () => {
  const ok = (status, body) => vi.fn(async () => ({ ok: status < 300, status, text: async () => JSON.stringify(body) }))

  it('poste le CSV entier sur applications.dataSafety', async () => {
    const fetchImpl = ok(200, {})
    await publishDataSafety({ packageName: 'fr.jpesquet.sante', csv: 'a,b\n', token: 'tok', fetchImpl })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe(`${API}/fr.jpesquet.sante/dataSafety`)
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect(JSON.parse(init.body)).toEqual({ safetyLabels: 'a,b\n' })
  })

  it('rapporte le message de Play en cas de refus', async () => {
    const fetchImpl = ok(403, { error: { message: 'The caller does not have permission' } })
    const err = await publishDataSafety({ packageName: 'p', csv: '', token: 't', fetchImpl }).catch((e) => e)
    expect(err).toBeInstanceOf(PlayApiError)
    expect(isAccessDenied(err)).toBe(true)
    expect(err.message).toMatch(/Sécurité des données : HTTP 403 — The caller does not have permission/)
  })
})
