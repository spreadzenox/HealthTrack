/**
 * Nom du repas, modifiable (POLISH-SIM-49) : le nom proposé par l'IA (« Pâtes à la carbonara ») doit pouvoir suivre
 * les aliments corrigés. Vide = repas sans nom (la carte montre alors ses aliments).
 */
export default function MealNameField({ id, value, onChange, disabled = false }) {
  return (
    <div className="sme-time meal-name-field">
      <label htmlFor={id}>Nom</label>
      <input
        id={id}
        type="text"
        maxLength={80}
        placeholder="Sans nom"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

