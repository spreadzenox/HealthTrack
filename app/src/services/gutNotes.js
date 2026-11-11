import { ANALYSIS_LIMITS, listEntries } from '../storage/localHealthStorage'
import { GUT_TYPE } from './today'

/**
 * Toutes les notes digestives, avec la même limite qu'Analyses (POLISH-SIM-32) : le compte à rebours de l'Accueil
 * compte les jours notés depuis le début, d'affilée ou non, comme le moteur ; une fenêtre de 42 jours faisait
 * diverger les deux écrans.
 */
export const readGutNotes = () => listEntries({ type: GUT_TYPE, limit: ANALYSIS_LIMITS.default })
