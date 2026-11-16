/**
 * La caméra de la scène, en nombres : la même pour le rendu 3D, l'image fixe du palier bas et la projection des
 * bulles (`stage.project`). Unités de l'île : Pilou mesure 1,24, plateau de rayon 1,3, +z vers l'écran.
 */
export const CAMERA = Object.freeze({
  fov: 30,
  position: [0, 1.25, 7.4],
  target: [0, 0.42, 0],
  near: 0.1,
  far: 100,
})

function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]] }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]] }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] }
function norm(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] }

/**
 * Projette un point du monde en pixels CSS d'un cadre `width × height`.
 * @returns {{ x: number, y: number, scale: number, behind: boolean, depth: number }}
 */
export function projectPoint(point, width, height, cam = CAMERA) {
  const f = norm(sub(cam.target, cam.position))
  const r = norm(cross(f, [0, 1, 0]))
  const u = cross(r, f)
  const d = sub(point, cam.position)
  const depth = dot(d, f)
  const t = Math.tan(((cam.fov / 2) * Math.PI) / 180)
  const aspect = width / height
  const ndcX = dot(d, r) / (depth * t * aspect)
  const ndcY = dot(d, u) / (depth * t)
  const ref = Math.hypot(...sub(cam.target, cam.position))
  return {
    x: (ndcX * 0.5 + 0.5) * width,
    y: (1 - (ndcY * 0.5 + 0.5)) * height,
    scale: ref / depth,
    behind: point[2] < -0.05,
    depth,
  }
}
