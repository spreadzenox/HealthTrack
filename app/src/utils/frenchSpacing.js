// Typographie française à l'écran : espace insécable après « et avant », :, ;, ?, !
// pour qu'un guillemet ou un deux-points ne se retrouve jamais seul en début ou en fin de ligne
// (« Passez de « je / comprends » » sur le paywall, POL-PLAY-36). Les textes du code gardent
// des espaces ordinaires (lisibles et faciles à rechercher) : la correction se fait à l'affichage.

const NB = ' '
const SKIP = new Set(['TEXTAREA', 'INPUT', 'CODE', 'PRE', 'SCRIPT', 'STYLE'])

export function fixFrenchSpacing(text) {
  if (!text) return text
  return text
    .replace(/« /g, `«${NB}`)
    .replace(/(\S) »/g, `$1${NB}»`)
    .replace(/(\S) ([:;?!])/g, `$1${NB}$2`)
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
