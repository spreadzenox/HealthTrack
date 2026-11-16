// lumiereReference.js — la lumière dorée de référence du brief (§ 7.5) : soleil bas en contre-jour, appoint de
// face, environnement PMREM généré au démarrage (ciel abricot, sol d'herbe, un nuage clair pour les reflets des
// yeux), courbe Khronos Neutral. Elle sert au banc d'essai, aux images pré-rendues et au test du menthe ; la scène
// de l'Accueil (lot SCÈNE) a sa propre lumière, qui doit garder ces valeurs pour que le test reste vrai.

// mêmes valeurs que GOLDEN de la scène (scene/light.js) : le test du menthe vaut pour l'Accueil
export const LUMIERE = {
  soleil: { couleur: '#FFCFA0', intensite: 2.6, elevation: 15, azimut: -150 }, // degrés ; ±180 = pile derrière Pilou
  appoint: { couleur: '#FFE4D2', intensite: 1.35, elevation: 30, azimut: 39 },
  hemi: { ciel: '#FFF1E4', sol: '#9DB87A', intensite: 0.8 },
  environnement: 0.6,
  exposition: 1.0,
  brume: '#FFC9A6',
}

const dirFrom = (THREE, elev, azim) => {
  const e = (elev * Math.PI) / 180, a = (azim * Math.PI) / 180
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e))
}

/** Ajoute à scene les lumières et l'environnement de référence. Rend { soleil, appoint, dirSoleil, dispose }. */
export function lumiereReference(THREE, renderer, scene, L = LUMIERE) {
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = L.exposition
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const dirSoleil = dirFrom(THREE, L.soleil.elevation, L.soleil.azimut)
  const soleil = new THREE.DirectionalLight(new THREE.Color(L.soleil.couleur), L.soleil.intensite)
  soleil.position.copy(dirSoleil).multiplyScalar(10)
  const appoint = new THREE.DirectionalLight(new THREE.Color(L.appoint.couleur), L.appoint.intensite)
  appoint.position.copy(dirFrom(THREE, L.appoint.elevation, L.appoint.azimut)).multiplyScalar(10)
  const hemi = new THREE.HemisphereLight(new THREE.Color(L.hemi.ciel), new THREE.Color(L.hemi.sol), L.hemi.intensite)
  scene.add(soleil, appoint, hemi)

  // environnement : ciel abricot, sol d'herbe, un nuage clair (reflets des yeux et du vernis)
  const env = new THREE.Scene()
  const sky = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uSun: { value: dirSoleil } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `varying vec3 vD; uniform vec3 uSun;
      void main(){ float y = vD.y;
        vec3 top = vec3(1., .86, .7) * .9, hor = vec3(1., .78, .62) * 1.05, ground = vec3(.34, .52, .26) * .45;
        vec3 c = y > 0. ? mix(hor, top, pow(y, .6)) : mix(hor * .8, ground, smoothstep(0., .25, -y));
        c += vec3(1., .82, .6) * 2.2 * pow(max(dot(vD, uSun), 0.), 40.);
        vec2 cl = vec2(atan(vD.x, vD.z) + .8, y - .72);
        c += vec3(1.) * 1.1 * exp(-dot(cl * vec2(1.6, 4.), cl * vec2(1.6, 4.)));
        gl_FragColor = vec4(c, 1.); }`,
  }))
  env.add(sky)
  const pm = new THREE.PMREMGenerator(renderer)
  const rt = pm.fromScene(env, 0, 0.1, 50)
  scene.environment = rt.texture
  scene.environmentIntensity = L.environnement
  pm.dispose()
  sky.geometry.dispose()
  sky.material.dispose()
  return {
    soleil, appoint, dirSoleil,
    dispose() { rt.dispose(); scene.remove(soleil, appoint, hemi); scene.environment = null },
  }
}
