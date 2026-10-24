import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createEntry } from '../storage/localHealthStorage'
import { getBodySettings, setBodySettings } from '../settings/bodySettings'
import { computeBmi } from '../services/bodyProfile'
import { computeDailyEnergyKcal, ACTIVITY_LEVELS, activityLevel } from '../services/nutrientReferenceIntakes'
import { useDetailsMode } from '../hooks/useDetailsMode'
import DetailsToggle from './DetailsToggle'

const formatNumber = (v) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(v)
const formatInt = (v) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v)

const SEX_LABEL = { M: 'Homme', F: 'Femme' }
// Le point reste collé à la valeur qui le précède : une ligne repliée ne commence jamais par « · ».
const SEP = '\u00a0· '
const formatDayMonth = (iso) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(new Date(iso))

// Composition de la dernière pesée Withings : une ligne du profil au lieu d'une section à part (D1).
const COMPOSITION_FIELDS = [
  ['fatRatioPct', 'Masse grasse', '%'],
  ['fatMassKg', 'Graisse', 'kg'],
  ['muscleMassKg', 'Muscles', 'kg'],
  ['boneMassKg', 'Os', 'kg'],
  ['hydrationPct', 'Hydratation', '%'],
  ['bmrKcal', 'Métabolisme basal', 'kcal'],
  ['visceralFatIndex', 'Graisse viscérale', ''],
  ['vascularAgeYears', 'Âge vasculaire', 'ans'],
  ['standingHrBpm', 'FC debout', 'bpm'],
  ['pwvMps', 'Vitesse d’onde de pouls', 'm/s'],
]

function compositionParts(payload) {
  if (!payload) return []
  return COMPOSITION_FIELDS
    .filter(([key]) => typeof payload[key] === 'number')
    .map(([key, label, unit]) => `${label}\u00a0${formatNumber(payload[key])}${unit ? `\u00a0${unit}` : ''}`)
}

function parseDecimal(text) {
  const t = String(text ?? '').trim().replace(',', '.')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : NaN
}

function Hint({ children }) {
  return <span className="nutrition-profile-hint-inline"> {children}</span>
}

function ProfileForm({ profile, onCancel, onSaved }) {
  const manual = getBodySettings()
  const { origins } = profile
  const [sex, setSex] = useState(origins.sex === 'default' ? '' : profile.sex)
  const [birthYear, setBirthYear] = useState(manual.birthYear ? String(manual.birthYear) : '')
  const [height, setHeight] = useState(origins.height === 'default' ? '' : String(profile.heightCm))
  const [weight, setWeight] = useState(origins.weight === 'default' ? '' : formatNumber(profile.weightKg))
  const [activity, setActivity] = useState(manual.activity ?? '')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const thisYear = new Date().getFullYear()

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const year = parseDecimal(birthYear)
    const heightCm = parseDecimal(height)
    const weightKg = parseDecimal(weight)
    if (year !== null && !(Number.isInteger(year) && year >= thisYear - 110 && year <= thisYear - 15)) {
      setError(`Année de naissance invalide : entre ${thisYear - 110} et ${thisYear - 15}.`)
      return
    }
    if (heightCm !== null && !(heightCm >= 100 && heightCm <= 250)) {
      setError('Taille invalide : entre 100 et 250 cm.')
      return
    }
    if (weightKg !== null && !(weightKg >= 25 && weightKg <= 350)) {
      setError('Poids invalide : entre 25 et 350 kg.')
      return
    }
    setSaving(true)
    try {
      // Une valeur Withings non modifiée reste « Withings » (elle suivra les prochaines pesées / mises à jour).
      const keepWithings = (origin, value, current) => origin === 'withings' && value === current
      setBodySettings({
        sex: keepWithings(origins.sex, sex, profile.sex) ? undefined : sex,
        birthYear: year ?? undefined,
        heightCm: heightCm === null || keepWithings(origins.height, heightCm, profile.heightCm)
          ? undefined
          : heightCm,
        activity: activity || undefined,
      })
      const weightChanged = weightKg !== null
        && (origins.weight === 'default' || Math.abs(weightKg - profile.weightKg) >= 0.05)
      if (weightChanged) {
        await createEntry({ type: 'weight', source: 'app_weight', payload: { valueKg: Math.round(weightKg * 10) / 10 } })
        window.dispatchEvent(new CustomEvent('health-entries-updated'))
      }
      onSaved()
    } catch {
      setError('Enregistrement impossible. Réessayez.')
      setSaving(false)
    }
  }

  return (
    <form className="nutrition-profile-form" onSubmit={handleSubmit} noValidate>
      <fieldset className="nutrition-profile-sex">
        <legend className="input-label">Sexe</legend>
        {['F', 'M'].map((s) => (
          <label key={s} className={`nutrition-sex-option${sex === s ? ' selected' : ''}`}>
            <input type="radio" name="sex" value={s} checked={sex === s} onChange={() => setSex(s)} />
            {SEX_LABEL[s]}
          </label>
        ))}
      </fieldset>
      <div className="nutrition-profile-fields">
        <label className="input-label" htmlFor="profile-birth-year">Année de naissance</label>
        <input id="profile-birth-year" className="settings-input" inputMode="numeric" placeholder={`ex. ${thisYear - 35}`}
          value={birthYear} onChange={(e) => setBirthYear(e.target.value)} />
        <label className="input-label" htmlFor="profile-height">Taille (cm)</label>
        <input id="profile-height" className="settings-input" inputMode="numeric" placeholder="ex. 170"
          value={height} onChange={(e) => setHeight(e.target.value)} />
        <label className="input-label" htmlFor="profile-weight">Poids (kg)</label>
        <input id="profile-weight" className="settings-input" inputMode="decimal" placeholder="ex. 68,5"
          value={weight} onChange={(e) => setWeight(e.target.value)} />
      </div>
      <fieldset className="nutrition-profile-activity-choice">
        <legend className="input-label">Niveau d’activité</legend>
        {[{ id: '', label: 'Automatique' }, ...ACTIVITY_LEVELS].map((l) => (
          <label key={l.id || 'auto'} className={`nutrition-sex-option${activity === l.id ? ' selected' : ''}`}>
            <input type="radio" name="activity" value={l.id} checked={activity === l.id} onChange={() => setActivity(l.id)} />
            {l.label}
          </label>
        ))}
        <p className="nutrition-profile-hint">
          {activity
            ? `${activityLevel(activity).label} : ${activityLevel(activity).hint}.`
            : 'Automatique : estimé d’après vos pas des 14 derniers jours (modérément actif sans montre).'}
        </p>
      </fieldset>
      <p className="nutrition-profile-hint">
        Un nouveau poids est enregistré comme une pesée du jour. Tout reste sur cet appareil.
      </p>
      {error && <p className="nutrition-profile-error" role="alert">{error}</p>}
      <div className="nutrition-profile-actions">
        <button type="submit" className="btn" disabled={saving}>Enregistrer</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Annuler</button>
      </div>
    </form>
  )
}

// Ce qui manque encore, dans l'ordre du formulaire.
const MISSING_LABELS = [['weight', 'poids'], ['height', 'taille'], ['sex', 'sexe'], ['age', 'âge']]

/**
 * Profil corporel utilisé pour les repères : chaque valeur indique sa provenance.
 * Une valeur par défaut n'est jamais affichée comme si elle était vraie (VC-3) : tant que le profil est vide,
 * la carte invite à le compléter ; ensuite, seules les valeurs connues apparaissent. IMC et besoin en énergie
 * (seulement si leurs entrées sont connues) restent derrière « détails » : pas de chiffre imposé par défaut (I152).
 */
export default function BodyProfileCard({ profile, composition, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [details, toggleDetails] = useDetailsMode()
  const { origins } = profile
  const known = (key) => origins[key] !== 'default'
  const missing = MISSING_LABELS.filter(([key]) => !known(key)).map(([, label]) => label)
  const allDefault = missing.length === MISSING_LABELS.length
  const bmi = known('weight') && known('height') ? computeBmi(profile.weightKg, profile.heightCm) : null
  const dailyKcal = missing.length === 0 ? computeDailyEnergyKcal(profile) : null
  const hasDetails = bmi != null || dailyKcal != null
  const compositionLine = compositionParts(composition)

  if (editing) {
    return (
      <div className="nutrition-profile-card">
        <h3 className="nutrition-profile-title">Votre profil</h3>
        <ProfileForm
          profile={profile}
          onCancel={() => setEditing(false)}
          onSaved={() => { setEditing(false); onSaved() }}
        />
      </div>
    )
  }

  const head = (
    <div className="nutrition-profile-head">
      <h3 className="nutrition-profile-title">Votre profil</h3>
      <span className="nutrition-profile-head-actions">
        {hasDetails && <DetailsToggle on={details} onToggle={toggleDetails} />}
        <button type="button" className="nutrition-profile-edit" onClick={() => setEditing(true)}>
          {allDefault ? 'Compléter mon profil' : 'Modifier'}
        </button>
      </span>
    </div>
  )

  if (allDefault) {
    return (
      <div className="nutrition-profile-card">
        {head}
        <p className="nutrition-profile-hint">
          Complétez votre profil pour voir vos repères (protéines, fer, vitamines…) ajustés à vous.
          Tout reste sur cet appareil.
        </p>
        {compositionLine.length > 0 && (
          <p className="nutrition-profile-line">{compositionLine.join(SEP)}<Hint>(Withings)</Hint></p>
        )}
      </div>
    )
  }

  const weightHint = () => (origins.weight === 'withings'
    ? `(Withings, ${formatDayMonth(profile.weightAt)})`
    : `(saisi le ${formatDayMonth(profile.weightAt)})`)
  const join = (parts) => parts.filter(Boolean).map((p, i) => <span key={i}>{i > 0 && SEP}{p}</span>)
  const bodyParts = join([
    known('weight') && <><span>{formatNumber(profile.weightKg)} kg</span><Hint>{weightHint()}</Hint></>,
    known('height') && <><span>{profile.heightCm} cm</span>{origins.height === 'withings' && <Hint>(Withings)</Hint>}</>,
    details && bmi != null && <span>IMC{'\u00a0'}{formatNumber(bmi)}</span>,
  ])
  const energyParts = join([
    known('sex') && <span>{SEX_LABEL[profile.sex]}</span>,
    known('age') && <span>{profile.age} ans</span>,
    <span className="nutrition-profile-activity">
      <span>{activityLevel(profile.activity).label}</span>
      {origins.activity === 'steps' && (
        <Hint>(≈ {formatInt(profile.meanSteps)} pas/jour sur {profile.stepsDays} jours)</Hint>
      )}
      {origins.activity === 'default' && <Hint>(par défaut)</Hint>}
    </span>,
    details && dailyKcal != null && <strong>~{formatNumber(dailyKcal)} kcal/jour</strong>,
  ])

  // Deux lignes au lieu d'une ligne par valeur (D1) : le corps (et sa composition s'il y en a une), puis ce qui fixe l'énergie.
  return (
    <div className="nutrition-profile-card">
      {head}
      {bodyParts.length > 0 && <p className="nutrition-profile-line">{bodyParts}</p>}
      {compositionLine.length > 0 && (
        <p className="nutrition-profile-line">{compositionLine.join(SEP)}<Hint>(Withings)</Hint></p>
      )}
      <p className="nutrition-profile-line">{energyParts}</p>
      {missing.length > 0 && (
        <p className="nutrition-profile-hint">
          À compléter pour ajuster vos repères : {missing.join(', ')}
          {!known('weight') && !known('height') && (
            <> (ou connectez une balance <Link to="/connectors">Withings</Link>)</>
          )}.
        </p>
      )}
    </div>
  )
}
