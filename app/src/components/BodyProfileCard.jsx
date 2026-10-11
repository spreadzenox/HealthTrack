import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createEntry } from '../storage/localHealthStorage'
import { getBodySettings, setBodySettings } from '../settings/bodySettings'
import { computeBmi } from '../services/bodyProfile'
import { computeDailyEnergyKcal, ACTIVITY_LEVELS, activityLevel } from '../services/nutrientReferenceIntakes'

const formatNumber = (v) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(v)
const formatInt = (v) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v)
const formatDate = (iso) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(new Date(iso))

const SEX_LABEL = { M: 'Homme', F: 'Femme' }

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
        <legend className="input-label">Niveau d'activité</legend>
        {[{ id: '', label: 'Automatique' }, ...ACTIVITY_LEVELS].map((l) => (
          <label key={l.id || 'auto'} className={`nutrition-sex-option${activity === l.id ? ' selected' : ''}`}>
            <input type="radio" name="activity" value={l.id} checked={activity === l.id} onChange={() => setActivity(l.id)} />
            {l.label}
          </label>
        ))}
        <p className="nutrition-profile-hint">
          {activity
            ? `${activityLevel(activity).label} : ${activityLevel(activity).hint}.`
            : 'Automatique : estimé d\'après vos pas des 14 derniers jours (modérément actif sans montre).'}
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

/**
 * Profil corporel utilisé pour les repères : chaque valeur indique sa provenance,
 * et une valeur par défaut est signalée (elle fausse l'énergie, les protéines, le fer…).
 */
export default function BodyProfileCard({ profile, onSaved }) {
  const [editing, setEditing] = useState(false)
  const { origins } = profile
  // L'activité par défaut (×1,55) est une hypothèse raisonnable : elle ne déclenche pas l'avertissement.
  const bodyOrigins = [origins.weight, origins.height, origins.sex, origins.age]
  const anyDefault = bodyOrigins.some((o) => o === 'default')
  const allDefault = bodyOrigins.every((o) => o === 'default')
  const bmi = computeBmi(profile.weightKg, profile.heightCm)
  const dailyKcal = computeDailyEnergyKcal(profile)

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

  const weightHint = origins.weight === 'withings'
    ? `(Withings, ${formatDate(profile.weightAt)})`
    : origins.weight === 'manual'
      ? `(saisi le ${formatDate(profile.weightAt)})`
      : '(par défaut)'

  return (
    <div className="nutrition-profile-card">
      <div className="nutrition-profile-head">
        <h3 className="nutrition-profile-title">Votre profil</h3>
        <button type="button" className="nutrition-profile-edit" onClick={() => setEditing(true)}>
          {allDefault ? 'Compléter mon profil' : 'Modifier'}
        </button>
      </div>
      <div>
        <strong>Poids :</strong> {formatNumber(profile.weightKg)} kg<Hint>{weightHint}</Hint>
      </div>
      <div>
        <strong>Taille :</strong> {profile.heightCm} cm
        {origins.height === 'withings' && <Hint>(Withings)</Hint>}
        {origins.height === 'default' && <Hint>(par défaut)</Hint>}
      </div>
      <div>
        <strong>Sexe :</strong>{' '}
        {profile.sex ? <span>{SEX_LABEL[profile.sex]}</span> : <span>non renseigné</span>}
        {origins.sex === 'default' && <Hint>(par défaut : homme)</Hint>}
      </div>
      <div>
        <strong>Âge :</strong>{' '}
        {profile.age ? `${profile.age} ans` : 'non renseigné'}
        {origins.age === 'default' && <Hint>(30 ans par défaut)</Hint>}
      </div>
      <div className="nutrition-profile-activity">
        <strong>Activité :</strong> <span>{activityLevel(profile.activity).label}</span>
        {origins.activity === 'steps' && (
          <Hint>(≈ {formatInt(profile.meanSteps)} pas/jour en moyenne sur {profile.stepsDays} jours)</Hint>
        )}
        {origins.activity === 'default' && <Hint>(par défaut)</Hint>}
      </div>
      {bmi != null && <div><strong>IMC :</strong> {formatNumber(bmi)}</div>}
      <div><strong>Énergie recommandée :</strong> ~{formatNumber(dailyKcal)} kcal/jour</div>
      {anyDefault && (
        <p className="nutrition-profile-hint">
          Les valeurs par défaut faussent vos repères (énergie, protéines, fer…) : complétez votre profil
          {origins.weight === 'default' && origins.height === 'default' && (
            <> ou connectez une balance <Link to="/connectors">Withings</Link></>
          )}.
        </p>
      )}
    </div>
  )
}
