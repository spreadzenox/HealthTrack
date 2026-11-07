/**
 * Onglet « Agir » (ORG-1, ORG-1b, revue design du 07/11) : ce que la personne fait de ses analyses. Fonction pure,
 * sans React : En cours (le test FODMAP vivant ; les essais d'ORG-8 viendront s'ajouter), Proposés par vos analyses
 * (un groupe FODMAP repéré par une analyse digestive), Terminés (les groupes testés et leur résultat). La
 * réintroduction FODMAP n'est proposée que quand une analyse digestive repère un groupe (leçon 17).
 */
import { FODMAP_GROUPS, currentChallenge, findFood, groupResults } from './fodmapChallenge'
import { challengeSummary } from './fodmapReminder'

const norm = (s) => String(s || '').toLowerCase()

/** « Tester les fructanes », « Tester le lactose ». */
const THE = { fructans: 'les fructanes', gos: 'les GOS', fructose: 'le fructose', lactose: 'le lactose', sorbitol: 'le sorbitol', mannitol: 'le mannitol' }

/** Groupes FODMAP cités par les pistes digestives (« Fructanes → digestion »). */
export function fodmapGroupsInPistes(gutTitles) {
  const titles = (gutTitles || []).map(norm)
  return FODMAP_GROUPS.filter((g) => titles.some((t) => t.includes(norm(g.label)) || (g.id === 'gos' && t.includes('galacto'))))
}

/**
 * @param {{ challenges: object[], gut: object[], pistes: { gut: string[] } | null, now?: Date }} input
 * @returns {{ current: Array<{ id, title, detail, to }>, proposed: Array<{ id, title, detail, to }>,
 *   done: Array<{ id, title, detail, to }> }}
 */
export function actSections({ challenges = [], gut = [], pistes = null, now = new Date() }) {
  const live = currentChallenge(challenges, gut, now)
  const current = live
    ? [{ id: 'fodmap-live', title: `Test FODMAP : ${FODMAP_GROUPS.find((g) => g.id === live.entry.payload.group)?.label ?? ''}`.trim(), detail: challengeSummary(live), to: '/reintroduction' }]
    : []

  const results = groupResults(challenges, gut, now)
  const done = []
  for (const g of FODMAP_GROUPS) {
    const r = results[g.id]
    const foods = Object.entries(r.byFood)
    if (!foods.length) continue
    const detail = g.perFood
      ? foods.map(([food, v]) => `${findFood(g.id, food)?.label ?? food} : ${v.tag}`).join(' · ')
      : r.verdict?.tag ?? ''
    done.push({ id: `fodmap-${g.id}`, title: `Test FODMAP : ${g.label}`, detail, to: '/reintroduction' })
  }

  const busy = current.length > 0
  const proposed = fodmapGroupsInPistes(pistes?.gut)
    .filter((g) => !done.some((d) => d.id === `fodmap-${g.id}`) && !(busy && live.entry.payload.group === g.id))
    .map((g) => ({ id: `fodmap-${g.id}`, title: `Tester ${THE[g.id] ?? g.label}`, detail: `Vos analyses digestives repèrent un lien avec ${g.hint}.`, to: '/reintroduction' }))

  return { current, proposed, done }
}
