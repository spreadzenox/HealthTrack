/**
 * Équiper le Pilou du lot PILOU de ses traits (brief § 9 : « rebrancher traits.js sur le rendu figurine ») : les
 * pièces 3D sont posées sur `kit.body` (même repère que le kit : pieds à y = 0, galet de 1,38 posé sur BY) dans une
 * matière de vinyle satiné tirée de `kit.vinyl` (comme les cheveux amovibles d'une figurine de collection).
 *
 *   const pilou = equiperPilou(THREE, createPilou(THREE, options))
 *
 * `setTraits(fiche)` pose ou retire les pièces en plus de ce que fait déjà Pilou (couleur de l'iris) ; `update`
 * anime les ressorts ; `dispose` libère tout. `pilou.peintreTraits` est le peintre du visage (sourcils, taches,
 * barbe peinte, piercing) pour la toile du visage : `peintreTraits.peindre(ctx, X, Y, k, F, phase)` aux phases
 * `sous`, `peau`, `sourcils`, `dessus` (voir studio/visage.js).
 */
import { brancherTraits } from './brancher'

/** Vinyle satiné à partir du vinyle verni de la figurine : moins de vernis, un peu plus mat. */
export function satinDepuis(THREE, vinyl) {
  return (hex, o = {}) => {
    const m = vinyl(hex, { rough: 0.6, cc: 0.25, ccr: 0.35, sheenK: 0.5 })
    if (o.map) m.map = o.map
    if (o.transparent) m.transparent = true
    if (o.opacity !== undefined) m.opacity = o.opacity
    if (o.emissive && m.emissive) m.emissive.copy(o.emissive)
    if (o.emissiveIntensity !== undefined) m.emissiveIntensity = o.emissiveIntensity
    m.needsUpdate = true
    return m
  }
}

export function equiperPilou(THREE, pilou) {
  const kit = pilou?.kit
  if (!kit?.body || typeof kit.vinyl !== 'function') return pilou
  let traits
  try {
    traits = brancherTraits(THREE, { body: kit.body, toon: satinDepuis(THREE, kit.vinyl) })
  } catch (err) {
    console.error('Pilou : traits indisponibles, Pilou garde son apparence', err)
    return pilou // les traits ne cassent jamais Pilou
  }
  const setTraits0 = pilou.setTraits?.bind(pilou)
  const update0 = pilou.update?.bind(pilou)
  const dispose0 = pilou.dispose?.bind(pilou)
  const stats0 = pilou.stats?.bind(pilou)
  const peindre = () => pilou.setPeintre?.(traits.fiche ? traits.peintre : null, traits.fiche ? JSON.stringify(traits.fiche) : '')
  pilou.setTraits = (f) => {
    setTraits0?.(f)
    traits.setTraits(f || null)
    peindre()
  }
  pilou.update = (t, dt, camera) => {
    const etat = update0?.(t, dt, camera)
    traits.update()
    return etat
  }
  pilou.dispose = () => {
    traits.dispose()
    dispose0?.()
  }
  pilou.stats = () => {
    const s = stats0?.() || { triangles: 0, drawCalls: 0 }
    const pieces = traits.pieces.stats()
    return { ...s, triangles: s.triangles + Object.values(pieces).reduce((a, b) => a + b, 0), traits: pieces }
  }
  pilou.peintreTraits = traits.peintre
  pilou.traits3d = traits
  const initiale = pilou.traits
  if (initiale) {
    traits.setTraits(initiale)
    peindre()
  }
  return pilou
}
