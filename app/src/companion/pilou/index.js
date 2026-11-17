// index.js — Pilou tel que le contrat le décrit (app/src/companion/CONTRAT.md § 3) : createPilou(THREE, options).
// La scène (lot SCÈNE) charge ce fichier par import.meta.glob ; il n'importe pas three lui-même.
// Le moteur est dans createPilou.js (corps, yeux, antenne, montre) et animateur.js (expressions, réactions,
// ressorts) ; ce fichier n'en est que l'adaptateur, aux noms du contrat.
import { createPilou as construire, IRIS_DEFAUT } from './createPilou.js'
import { HAUTEUR_TOTALE, H, BY } from './forme.js'
import { HAPTIQUE } from './gestes.js'
import { equiperPilou } from '../studio/pourPilou.js'
import { createPlaceholderPilou } from '../scene/placeholderPilou.js'

export { EXPRESSIONS as TEXTES_PILOU, texteHumeur, DOUZE } from './animateur.js'
export { createGestes, HAPTIQUE } from './gestes.js'
export { LUMIERE, lumiereReference } from './lumiereReference.js'

// Pilou mesure 1,24 dans le repère de l'île (CONTRAT § 3) ; le modèle de la planche fait 1,44 sans l'antenne
export const ECHELLE = 1.24 / (H + BY)
export const HAUTEUR_AVEC_ANTENNE = HAUTEUR_TOTALE * ECHELLE

// couleur de l'iris pour chaque couleur d'yeux de la fiche (PILOU-DOUBLE.md, palette de double/traits.js)
export const IRIS = {
  marron_fonce: '#5A3624', marron: '#83502C', noisette: '#7E6830', vert: '#4A7A42',
  gris: '#6E7C84', bleu: '#3A68AA', bleu_clair: '#5E9ACE',
}
export const irisDeFiche = (fiche) => IRIS[fiche?.yeux?.couleur] || IRIS_DEFAUT

const SEQUENCES = ['surpris', 'reveil', 'fier', 'reconfortant', 'mange']
const GESTES = { tap: 'toucher', doubletap: 'saut', swipe: 'glisser' }

/**
 * @param {typeof import('three')} THREE
 * @param {{ quality?: 'haut'|'moyen'|'bas', reducedMotion?: boolean, seed?: number, envMap?: any, traits?: object|null,
 *   now?: () => Date, nom?: string, ombre?: boolean }} options
 */
function createPilouFigurine(THREE, options = {}) {
  const { quality = 'haut', reducedMotion = false, seed = 7, envMap = null, traits = null, now, nom, ombre = false, balance } = options
  const p = construire(THREE, {
    qualite: quality === 'moyen' || quality === 'bas' ? 'moyen' : 'haut',
    reduit: reducedMotion, seed, envMap, maintenant: now, nom, ombre, balance, iris: irisDeFiche(traits),
  })
  const object3d = new THREE.Group()
  object3d.name = 'pilou-contrat'
  object3d.scale.setScalar(ECHELLE)
  object3d.add(p.object)
  let t = 0
  let fiche = traits
  let onEnd = null // { at, fn } : fin de séquence annoncée
  const ndc = new THREE.Vector2()
  const ray = new THREE.Raycaster()
  const box = new THREE.Box3()
  const v = new THREE.Vector3()

  const api = {
    object3d,
    /** Avance l'animation : fonction du temps (ms), update(t) deux fois de suite donne la même pose. */
    update(time, _dt, camera) {
      t = time
      const etat = p.update(time, camera)
      if (onEnd && time >= onEnd.at) { const fn = onEnd.fn; onEnd = null; fn() }
      return etat
    },
    /** Le texte de l'état (« Pilou est content ») : la scène l'affiche et le lecteur d'écran le lit. */
    etat: () => p.etat(t),
    setNom: (n) => p.setNom(n),
    /** Un état qui dure ('humeur' = revenir à l'humeur du jour). Une séquence passe par play(). */
    setExpression(name, { fadeMs = 400 } = {}) {
      if (name === 'humeur') { p.animateur.suivreHumeur(t, fadeMs); return }
      if (SEQUENCES.includes(name)) { api.play(name); return }
      p.animateur.setExpression(name, t, { fondu: fadeMs })
    },
    /** Une séquence jouée une fois (surpris, reveil, fier, reconfortant, mange), puis retour à l'humeur du jour. */
    play(name, { onEnd: fn } = {}) {
      p.animateur.setExpression(name, t, { retour: name === 'mange' ? undefined : 'humeur' })
      const duree = { surpris: 1000, reveil: 2400, fier: 1000, reconfortant: 4200, mange: 1500 }[name] ?? 1000
      onEnd = fn ? { at: t + duree, fn } : null
    },
    /** Humeur du jour 0…1 : elle ne redescend jamais dans la journée (nouvelleJournee la remet à zéro). */
    setMood(m) { p.setHumeur(m, t) },
    nouvelleJournee() { p.nouvelleJournee(t) },
    /** 'camera' (il vous regarde), null (regard libre) ou un point du monde { x, y, z }. */
    lookAt(target) {
      if (target === 'camera') { p.regarderPoint(null, t); p.regarderCamera(true, t); return }
      p.regarderCamera(false, t)
      p.regarderPoint(target ? v.set(target.x, target.y, target.z ?? 0) : null, t)
    },
    /** Gestes de la SPEC (§ 7) : tap, longpress-start, longpress-end, doubletap, swipe, tickle (+ tickle-end). */
    react(gesture, detail = {}) {
      if (gesture === 'longpress-start') return p.geste({ geste: 'appui' }, t)
      if (gesture === 'longpress-end') return p.geste({ geste: 'fin-appui' }, t)
      if (gesture === 'tickle') {
        p.animateur.react('chatouille', t, { dur: detail.durationMs ?? 900 })
        return HAPTIQUE.chatouille
      }
      if (gesture === 'tickle-end') return p.geste({ geste: 'fin-chatouille' }, t)
      const g = GESTES[gesture]
      return g ? p.geste({ geste: g, dir: detail.dir ?? 1 }, t) : []
    },
    /** Petit saut d'éclatement de bulle ; side = bras qui se lève ; la lueur du point ambre monte d'un cran. */
    jump({ height = 0.2, side } = {}) {
      p.animateur.react('sautille', t, { haut: height, cote: side })
      p.lueur(t)
    },
    setReducedMotion(on) { p.setReduit(on) },
    /** Fiche du double numérique (ou null = Pilou d'origine) : ici la couleur de l'iris ; les pièces 3D (cheveux,
     * lunettes…) sont posées par le lot STUDIO sur kit.body avec kit.vinyl. */
    setTraits(f) { fiche = f || null; p.setIris(irisDeFiche(fiche)) },
    get traits() { return fiche },
    setAccessory(name, on) { p.setAccessoire(name, on) },
    /** Peintre des traits du visage (lot STUDIO) ; `cle` change quand la fiche change. */
    setPeintre(T, cle) { p.setPeintre?.(T, cle) },
    anchors: p.anchors,
    kit: p.kit,
    /** Vrai si le point (coordonnées normalisées −1…1) touche Pilou : la silhouette, ou sa boîte élargie. */
    hitTest(ndcX, ndcY, camera, marge = 0.04) {
      ndc.set(ndcX, ndcY)
      ray.setFromCamera(ndc, camera)
      if (p.toucher(ray)) return true
      box.setFromObject(p.kit.corps)
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
      for (const cx of [box.min.x, box.max.x]) for (const cy of [box.min.y, box.max.y]) for (const cz of [box.min.z, box.max.z]) {
        v.set(cx, cy, cz).project(camera)
        x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y)
      }
      return ndcX >= x0 - marge && ndcX <= x1 + marge && ndcY >= y0 - marge && ndcY <= y1 + marge
    },
    /** 'belly', 'corps' ou null : pour reconnaître le chatouillis (sur le ventre). */
    hitZone(ndcX, ndcY, camera) {
      ndc.set(ndcX, ndcY)
      ray.setFromCamera(ndc, camera)
      return p.toucher(ray)
    },
    /** Lumière principale (direction vers la lumière, repère du monde) : caustiques de l'iris et du point ambre. */
    setLight(dir) { p.setLumiere(dir) },
    stats() { const s = p.stats(); return { triangles: s.triangles, drawCalls: s.dessins } },
    dispose() { p.dispose(); object3d.removeFromParent() },
  }
  // traits du double numérique (lot STUDIO) : pièces 3D sur kit.body et peinture du visage
  return equiperPilou(THREE, api)
}

const METHODES = ['update', 'etat', 'setNom', 'setExpression', 'play', 'setMood', 'nouvelleJournee', 'lookAt', 'react', 'jump',
  'setReducedMotion', 'setTraits', 'setAccessory', 'hitTest', 'hitZone', 'setLight', 'stats']

/**
 * createPilou(THREE, options) — le Pilou figurine, avec un repli sûr : s'il ne peut pas se construire ou si une image
 * échoue (shader, contexte, exception), il cède sa place au Pilou simple de la scène, sans erreur visible. Un Pilou
 * plus simple sur un vieil appareil est acceptable ; un Accueil qui plante ne l'est pas (brief § 7.9).
 */
export function createPilou(THREE, options = {}) {
  const object3d = new THREE.Group()
  object3d.name = 'pilou'
  let impl = null
  let repli = false
  const replier = (err) => {
    if (repli) return
    repli = true
    console.warn('Pilou : figurine indisponible, Pilou simple', err)
    try { impl?.dispose?.() } catch { /* déjà dans un état incertain */ }
    while (object3d.children.length) object3d.remove(object3d.children[0])
    impl = createPlaceholderPilou(THREE, options)
    object3d.add(impl.object3d)
    api.anchors = impl.anchors
    api.kit = impl.kit
  }
  const api = {
    object3d,
    get repli() { return repli },
    get traits() { return impl?.traits ?? null },
    dispose() { try { impl?.dispose?.() } finally { object3d.removeFromParent() } },
  }
  for (const m of METHODES) {
    api[m] = (...args) => {
      try { return impl?.[m]?.(...args) } catch (err) {
        if (repli) throw err
        replier(err)
        return impl?.[m]?.(...args)
      }
    }
  }
  try {
    impl = (options.__fabrique || createPilouFigurine)(THREE, options)
    object3d.add(impl.object3d)
    api.anchors = impl.anchors
    api.kit = impl.kit
  } catch (err) { replier(err) }
  return api
}
