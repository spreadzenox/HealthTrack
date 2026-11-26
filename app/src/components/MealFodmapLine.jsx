/**
 * Carte d'un repas (N4) : « Riche en fructanes : oignon », un groupe FODMAP par ligne, simple d'abord. Le chevron
 * dit en mots si c'est un peu ou bien plus que le repère de départ ; puis où se trouve le groupe ; les grammes
 * (une fourchette quand les mesures publiées divergent), les repères et les sources sur une ligne à part, en petit
 * (POLISH-SIM-77 : « ≈ 0,73 g · repère 0,3 g », « Varney 2017 » n'étaient pas compris). Rien quand aucun groupe ne dépasse son repère (un groupe inconnu n'est jamais présenté comme
 * bas). Repères = hypothèses de départ (règle 6). Plusieurs groupes (UPG-9, « Ventre, sans technique » : « 4 lignes
 * rouges ») : une seule phrase, « Parfois mal digérés : oignon, lentilles, pomme », et les groupes derrière « Détails ».
 */
import { useState } from 'react'
import { useNutritionTable } from '../data/nutritionTable'
import measurements from '../data/fodmapMeasurements.json'
import { estimateMealFodmap, mealFodmapHighlights } from '../services/fodmapGroups'
import { FODMAP_GROUPS } from '../services/fodmapChallenge'
import { shortFoodName } from '../utils/format'
import DetailsToggle from './DetailsToggle'
import './MealFodmapLine.css'
import { appLocale } from '../i18n/locale.js'

const LABELS = Object.fromEntries(FODMAP_GROUPS.map((g) => [g.id, g.label.toLowerCase()]))
LABELS.gos = 'GOS'
LABELS.fructose = 'fructose en excès'

const ARTICLES = { fructans: 'les', gos: 'les', fructose: 'le', lactose: 'le', sorbitol: 'le', mannitol: 'le' }
const HINTS = Object.fromEntries(FODMAP_GROUPS.map((g) => [g.id, g.hint]))
/** « les fructanes (blé, oignon, ail) ou les GOS (pois chiches, lentilles) » */
const groupsInWords = (highlights) => highlights
  .map((h) => `${ARTICLES[h.group]} ${h.group === 'fructose' ? 'fructose' : LABELS[h.group]} (${HINTS[h.group]})`)
  .join(' ou ')

/** « Ciqual (Anses), Ferjančič 2024 » : les sources des teneurs affichées (attribution des licences CC BY). */
function citeSources(highlights) {
  const keys = [...new Set(highlights.flatMap((h) => h.sources))]
  return keys.map((k) => (k === 'Ciqual' ? 'Ciqual (Anses)' : measurements.sources[k]?.cite ?? k)).join(', ')
}

const grams = (v) => v.toLocaleString(appLocale(), { maximumFractionDigits: v < 1 ? 2 : 1 })
/**
 * « Bien plus que ce qui gêne certaines personnes. » (25/11, « Ventre, sans technique » : « 2,3 à 6,6 g … pour un
 * repère de 0,3 g » ne disait pas si c'est beaucoup). Bien plus = au moins 3 fois le repère, même au bas de la
 * fourchette ; sous le repère au bas de la fourchette, ou teneur à confiance basse : « Peut-être ».
 */
function amountInWords(h) {
  if (h.g < h.cutoff) return 'Peut-être plus que ce qui gêne certaines personnes : les mesures varient.'
  if (h.probable) return 'Peut-être plus que ce qui gêne certaines personnes : teneur mal connue.'
  return `${h.g >= 3 * h.cutoff ? 'Bien' : 'Un peu'} plus que ce qui gêne certaines personnes.`
}

/** « Fructanes : 1,4 à 4,4 g selon les mesures, repère 0,3 g. » : les grammes, en petit, pour qui veut creuser. */
function gramsLine(h) {
  const label = LABELS[h.group].charAt(0).toUpperCase() + LABELS[h.group].slice(1)
  const amount = h.high != null ? `${grams(h.g)} à ${grams(h.high)} g selon les mesures` : `environ ${grams(h.g)} g`
  return `${label} : ${amount}, repère ${grams(h.cutoff)} g.`
}

const foodList = (foods) => foods.map((f) => shortFoodName(f).toLowerCase()).join(', ')

export default function MealFodmapLine({ items }) {
  const table = useNutritionTable()
  const [open, setOpen] = useState(false)
  if (!table) return null
  const highlights = mealFodmapHighlights(estimateMealFodmap(items, table, measurements))
  if (highlights.length === 0) return null
  const folded = highlights.length > 1 && !open
  // Dans l'ordre du repas, chaque aliment une fois.
  const rank = (f) => { const i = (items ?? []).findIndex((it) => it.ingredient === f); return i < 0 ? Infinity : i }
  const allFoods = [...new Set(highlights.flatMap((h) => h.foods))].sort((a, b) => rank(a) - rank(b))
  return (
    <div className="meal-fodmap" data-testid="meal-fodmap">
      {folded ? (
        <p className="meal-fodmap-summary" data-testid="meal-fodmap-summary">
          <span className="meal-fodmap-tag">Parfois mal digérés</span>{' '}{foodList(allFoods)}
        </p>
      ) : (
      <ul className="meal-fodmap-list">
        {highlights.map((h) => (
          <li key={h.group}>
            <span className="meal-fodmap-tag">{h.probable ? 'Probablement riche' : 'Riche'} en {LABELS[h.group]}</span>
            {' '}{foodList(h.foods)}
            {open && <span className="meal-fodmap-detail">{amountInWords(h)}</span>}
          </li>
        ))}
      </ul>
      )}
      <DetailsToggle on={open} onToggle={() => setOpen((v) => !v)} />
      {open && (
        <>
          <p className="meal-fodmap-note" data-testid="meal-fodmap-note">
            Certaines personnes digèrent mal {groupsInWords(highlights)}, d’autres très bien : vos repas et votre
            confort digestif diront ce qu’il en est pour vous.
          </p>
          <p className="meal-fodmap-sources" data-testid="meal-fodmap-sources">
            {highlights.map(gramsLine).join(' ')} Repères de départ : Varney 2017. Teneurs : {citeSources(highlights)}.
          </p>
        </>
      )}
    </div>
  )
}
