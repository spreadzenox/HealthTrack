import { APP_NAME } from './brand'
import { resolveDistribution } from './distribution'

/** Page de l'app sur le Play Store : les testeurs y trouvent « Envoyer des commentaires privés au développeur ». */
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=fr.jpesquet.sante'
const GITHUB_ISSUES_URL = 'https://github.com/spreadzenox/HealthTrack/issues/new'

/**
 * Lien « Envoyer un avis » (AVIS, audit du 25/10) selon la variante. Rien n'est joint : ni journal ni donnée de
 * santé, seulement le numéro de version dans le titre du ticket (sideload).
 */
export function feedbackLink(distribution, version) {
  if (resolveDistribution(distribution) === 'play') {
    return {
      url: PLAY_STORE_URL,
      label: 'Donner mon avis sur le Play Store',
      hint: 'Sur la page Halcya du Play Store : « Envoyer des commentaires privés au développeur » pendant le test, « Noter cette application » ensuite.',
    }
  }
  const title = `Avis — ${APP_NAME} v${version}`
  return {
    url: `${GITHUB_ISSUES_URL}?${new URLSearchParams({ title })}`,
    label: 'Envoyer un avis',
    hint: 'Un ticket GitHub s’ouvre avec le numéro de version : décrivez ce qui vous gêne ou vous plaît.',
  }
}
