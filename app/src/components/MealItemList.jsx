import { frenchLigatures, shortFoodName } from '../utils/format'

/**
 * Aliments d'un repas, un par ligne, quantité à droite en mono (Journal et page Repas). Remplace la liste « à la
 * suite » de D1, dont le « · » restait seul en fin de ligne dès qu'un nom Ciqual était un peu long. Nom complet en
 * infobulle.
 * @param {{ items: { ingredient: string, quantity?: string }[], max: number, moreLabel?: (n: number) => string,
 *   moreClassName?: string }} props
 */
export default function MealItemList({ items, max, moreLabel = (n) => `+${n}`, moreClassName = 'meal-more' }) {
  return (
    <ul className="meal-items meal-item-list">
      {items.slice(0, max).map((item, i) => (
        <li key={i} title={frenchLigatures(item.ingredient)}>
          <span className="meal-item-name">{shortFoodName(item.ingredient)}</span>
          {item.quantity && <span className="meal-item-qty">{item.quantity}</span>}
        </li>
      ))}
      {items.length > max && <li className={moreClassName}>{moreLabel(items.length - max)}</li>}
    </ul>
  )
}
