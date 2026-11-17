// sprites.js — les petits Pilou pré-rendus (CONTRAT § 3, brief § 7.9) : une image par expression, 240 px de haut,
// fond transparent, rendues depuis le vrai modèle par `node src/companion/pilou/banc/capture.mjs --petits`.
// Pour la petite tête dans Données, le widget, les notifications, la mosaïque (lots VIE et MONDE) : pas de second
// canevas WebGL. Le texte qui accompagne l'image reste obligatoire (brief § 8).
const urls = import.meta.glob('./sprites/*.webp', { eager: true, query: '?url', import: 'default' })

export const SPRITES = Object.fromEntries(Object.entries(urls).map(([k, v]) => [k.replace('./sprites/', '').replace('.webp', ''), v]))

/** URL de l'image de Pilou pour une expression (Tranquille si elle n'existe pas). */
export function pilouSprite(expression = 'tranquille') {
  return SPRITES[expression] ?? SPRITES.tranquille
}
