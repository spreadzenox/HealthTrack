/**
 * Brancher les traits sur un Pilou 3D (contrat du compagnon § 3, `setTraits`) : à appeler par le Pilou du lot PILOU
 * (ou tout autre rendu) avec le groupe de son corps. Les pièces sont posées dans le repère du kit (pieds à y = 0,
 * galet de 1,38) ; `echelle` le ramène à la taille du corps qui les porte.
 *
 *   const traits = brancherTraits(THREE, { body, echelle: hauteurDuCorps / H })
 *   traits.setTraits(fiche)                  // ou null : Pilou d'origine
 *   traits.update({ f: paramsDuVisage, chX, chZ, pend })  // à chaque image (ressorts des cheveux et des boucles)
 *   traits.peintre                           // pour la toile du visage (drawFace(ctx, S, F, traits.peintre))
 *   traits.iris()                            // { fonce, clair, anneau, reflet } ou null : couleur de l'iris 3D
 */
import { creerPieces } from './pieces'
import { FACE0, H } from './profil'
import { PAL_YEUX } from './traits'

export { H as HAUTEUR_KIT }

export function brancherTraits(THREE, { body, echelle = 1, toon, ol } = {}) {
  const support = new THREE.Group()
  support.name = 'traits'
  support.scale.setScalar(echelle)
  body.add(support)
  const kit = { THREE, body: support }
  if (toon) kit.toon = toon
  if (ol) kit.ol = ol
  const pieces = creerPieces(kit)
  let fiche = null
  const api = {
    pieces,
    peintre: pieces.peintre,
    support,
    get fiche() { return fiche },
    setTraits(f) {
      pieces.set(f || null)
      fiche = pieces.fiche
      pieces.update({ f: { ...FACE0 } })
      return api
    },
    update(P = {}) {
      pieces.update({ f: { ...FACE0, ...(P.f || {}) }, chX: P.chX || 0, chZ: P.chZ || 0, pend: P.pend || 0 })
    },
    iris() {
      if (!fiche) return null
      const [fonce, clair, anneau, reflet] = PAL_YEUX[fiche.yeux.couleur]
      return { fonce, clair, anneau, reflet }
    },
    dispose() {
      pieces.dispose()
      body.remove(support)
    },
  }
  return api
}
