// Typographie française à l'écran : espace insécable après « et avant », :, ;, ?, !, entre un nombre et son unité
// pour qu'un guillemet ou un deux-points ne se retrouve jamais seul en début ou en fin de ligne
// (« Passez de « je / comprends » » sur le paywall, POL-PLAY-36). Les textes du code gardent
// des espaces ordinaires (lisibles et faciles à rechercher) : la correction se fait à l'affichage.

const NB = ' '
// Unités courtes qui ne doivent jamais quitter leur nombre (« 1004 / hPa » en fin de ligne, POL-PLAY-37).
// Suivies d'une lettre, ce n'est plus une unité (« 2 mois », « 5 grammes ») : on n'y touche pas.
const UNIT = /(\d) (hPa|kcal|cal|bpm|pas|km|cm|mm|ms|min|mg|µg|kg|ml|mL|Mo|Go|°C|h|j|g|l|L|m|s|%|€|°)(?![\p{L}\d])/gu

// Une date reste d'un seul tenant (« jusqu'au 18 / nov. 2026 » sur le paywall, POL-PLAY-39).
const MONTH = '(?:janv\\.|févr\\.|avr\\.|juil\\.|sept\\.|oct\\.|nov\\.|déc\\.|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)'
const DAY_MONTH = new RegExp(`(\\d(?:er)?) (${MONTH})(?![\\p{L}])`, 'gu')
const MONTH_YEAR = new RegExp(`(${MONTH}) (\\d{4})(?!\\d)`, 'gu')

const SKIP = new Set(['TEXTAREA', 'INPUT', 'CODE', 'PRE', 'SCRIPT', 'STYLE'])

export function fixFrenchSpacing(text) {
  if (!text) return text
  return text
    .replace(/« /g, `«${NB}`)
    .replace(/(\S) »/g, `$1${NB}»`)
    .replace(/(\S) ([:;?!])/g, `$1${NB}$2`)
    .replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NB}`)
    .replace(UNIT, `$1${NB}$2`)
    .replace(DAY_MONTH, `$1${NB}$2`)
    .replace(MONTH_YEAR, `$1${NB}$2`)
}

function fixNode(node) {
  if (node.nodeType !== 3) return
  const parent = node.parentNode
  if (!parent || SKIP.has(parent.nodeName) || parent.isContentEditable) return
  const fixed = fixFrenchSpacing(node.nodeValue)
  if (fixed !== node.nodeValue) node.nodeValue = fixed
}

function fixTree(root) {
  if (root.nodeType === 3) return fixNode(root)
  if (root.nodeType !== 1 || SKIP.has(root.nodeName)) return
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) fixNode(n)
}

/** Corrige `root` puis tout texte ajouté ou modifié ensuite ; renvoie la fonction d'arrêt. */
export function installFrenchSpacing(root) {
  fixTree(root)
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData') fixNode(m.target)
      else m.addedNodes.forEach(fixTree)
    }
  })
  observer.observe(root, { subtree: true, childList: true, characterData: true })
  return () => observer.disconnect()
}
