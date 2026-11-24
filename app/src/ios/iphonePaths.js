// Chemins des fichiers de l'iPhone pour les tests qui les relisent (FUSION-3). Ces tests tournent à deux endroits :
// depuis app/ (tests d'Android) et depuis iphone/upstream/app (build iOS, où scripts/upstream.sh a copié le projet
// natif dans app/ios). La racine du dépôt est le premier dossier parent qui contient iphone/ios.
import process from 'node:process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

export function repoRoot(cwd = process.cwd()) {
  for (let dir = resolve(cwd); ; dir = dirname(dir)) {
    if (existsSync(join(dir, 'iphone', 'ios')) && existsSync(join(dir, 'app'))) return dir
    if (dirname(dir) === dir) throw new Error(`racine du dépôt introuvable depuis ${cwd}`)
  }
}

/** Projet natif de l'iPhone : app/ios s'il y est (build iOS, puis après l'étape 3), sinon iphone/ios. */
export function iosDir(cwd = process.cwd()) {
  const local = resolve(cwd, 'ios')
  return existsSync(join(local, 'App')) ? local : join(repoRoot(cwd), 'iphone', 'ios')
}

/** Dossier iphone/ du dépôt (fiche App Store, abonnements). */
export const iphoneDir = (cwd = process.cwd()) => join(repoRoot(cwd), 'iphone')

/** Workflow de l'iPhone, par son nom à la racine du dépôt (ios-build.yml, ios-testflight.yml). */
export const iosWorkflow = (name, cwd = process.cwd()) => join(repoRoot(cwd), '.github', 'workflows', name)
