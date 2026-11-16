/**
 * La scène 3D de l'Accueil (étape 8) : un seul canevas WebGL, l'île, Pilou, la lumière dorée en contre-jour, les
 * fleurs ; paliers de qualité mesurés, pause hors écran. Chargé à la demande par `<CompanionScene>` (three.js n'est
 * jamais importé ailleurs). Le ciel est peint en CSS derrière le canevas transparent (aucun coût 3D).
 */
import * as THREE from 'three'
import { CAMERA } from './camera'
import { createIsland } from './island'
import { createFlowerBed } from './flowers'
import { createPlaceholderPilou } from './placeholderPilou'
import { GOLDEN, directionOf, normalizeLight } from './light'
import { TIER_SETTINGS, pixelRatioFor } from './quality'

/** Environnement PMREM généré au démarrage : ciel abricot, sol d'herbe, un nuage clair pour les reflets des yeux. */
function buildEnvironment(renderer, light, size) {
  if (!size) return null
  const envScene = new THREE.Scene()
  const sunDir = new THREE.Vector3(...directionOf(light.sun.elevationDeg, light.sun.azimuthDeg))
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      uTop: { value: new THREE.Color(light.sky.top) },
      uBottom: { value: new THREE.Color(light.sky.bottom) },
      uGround: { value: new THREE.Color(light.hemi.ground) },
      uSun: { value: sunDir },
      uSunCol: { value: new THREE.Color(light.sun.color) },
    },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform vec3 uTop, uBottom, uGround, uSun, uSunCol; varying vec3 vD;
      void main(){
        vec3 d = normalize(vD);
        vec3 c = mix(uBottom, uTop, smoothstep(0., .8, d.y));
        c = mix(uGround * .7, c, smoothstep(-.08, .03, d.y));
        c += uSunCol * pow(max(dot(d, uSun), 0.), 12.) * 1.4;
        float cloud = smoothstep(.93, .975, max(dot(d, normalize(vec3(.55, .5, .67))), 0.));
        c += vec3(1., .95, .9) * cloud * 1.6;
        gl_FragColor = vec4(c, 1.);
      }`,
  })
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), mat))
  const pm = new THREE.PMREMGenerator(renderer)
  const tex = pm.fromScene(envScene, 0, 0.1, 50, { size }).texture
  pm.dispose()
  mat.dispose()
  return tex
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ width: number, height: number, tier: 'haut'|'moyen', reducedMotion: boolean, createPilou?: Function, light?: object }} opts
 */
export function createStage(canvas, { width, height, tier = 'haut', reducedMotion = false, createPilou, light: initialLight } = {}) {
  const settings = TIER_SETTINGS[tier] || TIER_SETTINGS.moyen
  const dpr = pixelRatioFor(tier, typeof window !== 'undefined' ? window.devicePixelRatio : 1)
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: dpr < 2,
    powerPreference: 'low-power',
    preserveDrawingBuffer: false,
  })
  renderer.setPixelRatio(dpr)
  renderer.setSize(width, height, false)
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(CAMERA.fov, width / height, CAMERA.near, CAMERA.far)
  camera.position.set(...CAMERA.position)
  camera.lookAt(new THREE.Vector3(...CAMERA.target))
  camera.updateMatrixWorld()

  // lumière : soleil bas en contre-jour, appoint de face plus faible, hémisphère (ciel / herbe)
  const sun = new THREE.DirectionalLight()
  const fill = new THREE.DirectionalLight()
  const hemi = new THREE.HemisphereLight()
  scene.add(sun, fill, hemi)
  fill.position.set(0.55, 0.5, 0.67).multiplyScalar(8)

  let light = normalizeLight(initialLight || GOLDEN)
  function applyLight(next) {
    light = normalizeLight(next)
    sun.color.set(light.sun.color)
    sun.intensity = light.sun.intensity
    sun.position.set(...directionOf(light.sun.elevationDeg, light.sun.azimuthDeg)).multiplyScalar(8)
    fill.color.set(light.fill.color)
    fill.intensity = light.fill.intensity
    hemi.color.set(light.hemi.sky)
    hemi.groundColor.set(light.hemi.ground)
    hemi.intensity = light.hemi.intensity
    if (scene.environment) scene.environment.dispose()
    scene.environment = buildEnvironment(renderer, light, settings.envSize)
    scene.environmentIntensity = 0.6
  }
  applyLight(light)

  const world = new THREE.Group()
  scene.add(world)
  const island = createIsland({ quality: tier, tufts: settings.tufts })
  world.add(island.group)
  const flowers = createFlowerBed({ topY: island.topY, reducedMotion })
  world.add(flowers.group)

  const make = createPilou || ((T, o) => createPlaceholderPilou(T, o))
  let pilou = make(THREE, { quality: tier, reducedMotion, seed: 3, envMap: scene.environment, traits: null, now: () => new Date() })
  world.add(pilou.object3d)
  pilou.object3d.position.z = 0.02

  // poussières lentes dans la lumière (palier haut seulement)
  let dust = null
  if (settings.dust) {
    const n = settings.dust
    const p = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const a = (i * 2.39996) % (Math.PI * 2)
      p.set([Math.cos(a) * (1.2 + (i % 5) * 0.35), 0.3 + ((i * 37) % 100) / 45, Math.sin(a) * 1.4 - 0.4], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    dust = new THREE.Points(g, new THREE.PointsMaterial({ color: '#FFE2B8', size: 0.035, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }))
    scene.add(dust)
  }

  let rm = reducedMotion
  const v = new THREE.Vector3()

  function render(t) {
    // le monde flotte de ±0,045 (6,9 s)
    world.position.y = rm ? 0 : 0.045 * Math.sin((t / 6900) * Math.PI * 2)
    pilou.update(t, 0)
    const growing = flowers.update(t)
    if (dust && !rm) {
      dust.rotation.y = t / 90000
      dust.position.y = 0.05 * Math.sin(t / 5000)
    }
    if (dust) dust.visible = !rm
    renderer.render(scene, camera)
    return growing
  }

  return {
    renderer,
    scene,
    camera,
    get pilou() {
      return pilou
    },
    tier,
    render,
    /** Remplace le Pilou simple par celui du lot PILOU dès qu'il est chargé. */
    swapPilou(factory) {
      const next = factory(THREE, { quality: tier, reducedMotion: rm, seed: 3, envMap: scene.environment, traits: null, now: () => new Date() })
      world.remove(pilou.object3d)
      pilou.dispose?.()
      pilou = next
      world.add(pilou.object3d)
    },
    applyLight,
    get light() {
      return light
    },
    flowers,
    setReducedMotion(value) {
      rm = Boolean(value)
      pilou.setReducedMotion?.(rm)
      flowers.setReducedMotion(rm)
    },
    resize(w, h) {
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    },
    /** Point du monde → px CSS dans le canevas. */
    project(x, y, z, w, h) {
      v.set(x, y + world.position.y, z).project(camera)
      return { x: (v.x * 0.5 + 0.5) * w, y: (1 - (v.y * 0.5 + 0.5)) * h }
    },
    pilouHit(ndcX, ndcY) {
      return pilou.hitTest ? pilou.hitTest(ndcX, ndcY, camera) : false
    },
    /** Rendu + attente du GPU (1 pixel relu) : sert à mesurer le vrai temps d'image pendant la fenêtre de mesure. */
    renderSynced(t) {
      render(t)
      const gl = renderer.getContext()
      const px = new Uint8Array(4)
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
    },
    stats() {
      let triangles = 0
      scene.traverse((o) => {
        if (o.isMesh && o.visible) {
          const g = o.geometry
          const per = (g.index ? g.index.count : g.attributes.position.count) / 3
          triangles += per * (o.isInstancedMesh ? o.count : 1)
        }
      })
      return { triangles: Math.round(triangles), drawCalls: renderer.info.render.calls, pilou: pilou.stats?.() }
    },
    dispose() {
      pilou.dispose?.()
      island.dispose()
      scene.environment?.dispose?.()
      renderer.dispose()
    },
  }
}
