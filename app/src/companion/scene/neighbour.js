/**
 * L'îlot voisin du premier mois (SPEC île § 8) : un petit îlot qui flotte à droite, plus bas que le plateau et un peu
 * devant, en miroir du nuage du J6 (à gauche) : l'îlot de Pilou devenu adulte ne le cache pas, les bulles passent au-dessus. Même socle que l'île de Pilou, en petit, sans ombre de contact ; il suit la
 * saison. Il apparaît en 900 ms (`back`) s'il arrive pendant que l'Accueil est ouvert, d'un coup sinon.
 */
import { EASE, seg } from './curves'
import { createIsland } from './island'

export const NEIGHBOUR = Object.freeze({ position: [1.72, -0.68, 0.7], scale: 0.24, appearMs: 900 })

/** Taille relative de l'îlot voisin, 0 → 1, `ms` depuis son arrivée (`null` = déjà là à l'ouverture). */
export function neighbourArrival(ms, { reducedMotion = false } = {}) {
  if (ms == null || ms >= NEIGHBOUR.appearMs) return 1
  if (ms <= 0) return 0
  if (reducedMotion) return 1
  return Math.max(0, EASE.back(seg(ms, 0, NEIGHBOUR.appearMs)))
}

export function createNeighbour({ quality = 'moyen', season } = {}) {
  const islet = createIsland({ quality: quality === 'haut' ? 'moyen' : quality, tufts: 90, seed: 11, season })
  const group = islet.group
  group.name = 'ilot-voisin'
  const shadow = group.getObjectByName('ombre')
  if (shadow) group.remove(shadow)
  group.position.set(...NEIGHBOUR.position)
  group.rotation.y = -0.6
  group.visible = false
  let bornAt = null // ms de la scène, ou null si présent dès l'ouverture
  let pending = false
  let shown = false

  const setK = (k) => group.scale.setScalar(NEIGHBOUR.scale * Math.max(0.001, k))
  setK(1)

  return {
    group,
    get shown() {
      return shown
    },
    /** `animate` : l'îlot arrive sous les yeux (900 ms) ; sinon il est déjà là. Rien ne recule une fois là. */
    show(animate = false) {
      if (shown) return
      shown = true
      group.visible = true
      if (animate) {
        pending = true
        setK(0)
      } else setK(1)
    },
    setSeason(next) {
      islet.setSeason(next)
    },
    /** Rend true tant que l'arrivée est en cours (la boucle continue de dessiner). */
    update(t, { reducedMotion = false } = {}) {
      if (!shown) return false
      if (pending) {
        bornAt = t
        pending = false
      }
      const k = neighbourArrival(bornAt == null ? null : t - bornAt, { reducedMotion })
      setK(k)
      group.position.y = NEIGHBOUR.position[1] + (reducedMotion ? 0 : 0.03 * Math.sin(t / 4100 + 1.3))
      return bornAt != null && t - bornAt < NEIGHBOUR.appearMs
    },
    dispose() {
      islet.dispose()
    },
  }
}
