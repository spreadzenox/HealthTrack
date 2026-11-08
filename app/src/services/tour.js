/**
 * Visite guidée (ACC-8) : étapes et relance (« Voir un exemple »), hors du composant.
 */
import { FIRST_RESULTS_DAY } from '../config/firstResults'
import { APP_NAME } from '../config/brand'
import { healthStoreName } from './onboardingFlow'
import { loadOnboarding } from '../settings/onboarding'

export const TOUR_START_EVENT = 'halcya-tour-start'

/** Relance la visite (« Voir un exemple »). */
export function startTour() {
  window.dispatchEvent(new CustomEvent(TOUR_START_EVENT))
}

const W = FIRST_RESULTS_DAY.wellbeing
const D = FIRST_RESULTS_DAY.digestion

/**
 * Étapes (textes exacts de la maquette v3, journal/maquettes/accueil/TEXTES.md § 08). `days` : écran rempli de
 * données fictives de ce nombre de jours ; `reveal` : l'étape qui passe de « maintenant » à l'exemple.
 */
export function tourSteps({ hc, face, gut }) {
  const steps = [
    { route: '/', title: 'Votre écran Aujourd’hui', text: hc ? 'Vos 30 derniers jours arrivent. Le reste se remplit au fil des jours.' : 'Pour l’instant, il attend vos premières notes.', button: `Voir dans ${W} jours` },
    { route: '/', days: W, reveal: true, anchor: '.day-status', title: 'Votre bien-être du jour', text: face ? 'Lu par la caméra quand vous regardez votre téléphone, et par vos notes.' : 'D’après vos notes. Avec la lecture du visage, il se remplit tout seul.', button: 'Suivant' },
    { route: '/', days: W, anchor: '.today-sources', title: 'Vos mesures du jour', text: hc ? 'Ce que vos appareils envoient, comparé à vos habitudes.' : `Avec ${healthStoreName()} ou une montre, vos nuits et vos pas s’affichent ici.`, button: 'Suivant' },
    { route: '/journal', title: 'Le Journal', text: 'Chacune de vos journées sera gardée ici.', button: `Voir dans ${W} jours` },
    { route: '/journal', days: W, reveal: true, anchor: '.day-card', title: 'Une journée d’un coup d’œil', text: 'Sommeil, pas, cœur, repas et notes au même endroit.', button: 'Suivant' },
    { route: '/recommendations', title: 'Les analyses', text: `Elles démarrent après ${W} jours notés.`, button: `Voir au jour ${W}` },
    { route: '/recommendations', days: W, reveal: true, anchor: '[aria-labelledby="reco-pistes-wellbeing"]', title: `Au jour ${W} : vos premières pistes`, text: 'Ce qui va avec vos bons et vos mauvais jours. Des pistes, pas des causes.', button: 'Suivant' },
    { route: '/recommendations', days: W, anchor: '[aria-labelledby="reco-weigh-wellbeing"]', title: 'Le détail de chaque piste', text: 'De combien chaque facteur joue sur votre bien-être, en points sur 5.', button: 'Suivant' },
  ]
  if (gut) {
    steps.push(
      { route: '/recommendations/ventre', title: 'Votre digestion', text: `Ses analyses demandent ${D} jours notés, dont 5 avec une gêne.`, button: `Voir au jour ${D}` },
      { route: '/recommendations/ventre', days: D, reveal: true, anchor: '[aria-labelledby="reco-weigh-digestion"]', title: `Au jour ${D} : ce qui va avec votre ventre`, text: 'Repas, sommeil, écran : ce qui va avec vos jours calmes et vos jours de gêne.', button: 'Suivant' },
    )
  }
  steps.push(
    { route: '/agir', title: 'Agir', text: 'Ici, vous vérifierez une piste par vous-même.', button: `Voir au jour ${W}` },
    { route: '/agir', days: W, reveal: true, anchor: '.act-card', title: 'Vérifier par un essai', text: `${APP_NAME} vous propose deux semaines d’essai, puis compare avant et après.`, button: 'Revenir à mes données' },
    { route: '/', anchor: '.tabbar', title: 'À vous', text: 'Pour revoir cette visite : « Voir un exemple », en bas des écrans encore vides.', button: 'Terminer', last: true },
  )
  return steps
}


/** Écrans « encore vides » : les 14 premiers jours après l'accueil, « Voir un exemple » y relance la visite. */
export function stillEmpty(s = loadOnboarding(), now = Date.now()) {
  if (!s.done || s.endedBy !== 'completed' || !s.doneAt) return false
  const since = now - Date.parse(s.doneAt)
  return Number.isFinite(since) && since < FIRST_RESULTS_DAY.wellbeing * 86_400_000
}

