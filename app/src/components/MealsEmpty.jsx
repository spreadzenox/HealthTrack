import LineIcon from './LineIcon'

/**
 * Repas vierges. Retours du premier testeur du 06/11 (4) : « Aucun repas enregistré pour l’instant » et un bouton
 * « Ajouter mon premier repas », sans texte d’explication. Le bouton est un label du champ photo de la page
 * (`inputId`) : il ouvre directement l’appareil photo, comme « Photo du repas ».
 */
export default function MealsEmpty({ inputId }) {
  return (
    <div className="meals-empty">
      <p className="meals-empty-title">Aucun repas enregistré pour l’instant</p>
      <label htmlFor={inputId} className="meals-empty-btn">
        <LineIcon name="camera" size={20} /> Ajouter mon premier repas
      </label>
    </div>
  )
}
