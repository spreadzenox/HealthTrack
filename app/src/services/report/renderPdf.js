/**
 * Rapport pour le médecin (jalon 7, I175 étape 2 + N6) : dessine en PDF A4 le modèle de `buildReport`.
 *
 * Deux pages : « En bref » (ventre, semaine par semaine, réintroduction, pistes, sommeil) puis « Détail »
 * (calendrier avec les sous-groupes FODMAP du jour, décompte par sous-groupe, aliments fréquents, sources).
 * Tout est fait sur le téléphone : `pdf-lib` et `fontkit` (MIT) sont chargés à la demande par l'appelant
 * (`import()` dynamique) pour ne pas alourdir le premier lancement, et les polices Figtree et IBM Plex Mono
 * (SIL OFL 1.1) sont embarquées dans le fichier, sans réseau.
 *
 * Les listes longues sont coupées (« … et N autres ») pour que le rapport tienne toujours en deux pages.
 */
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { findGroup } from '../fodmapChallenge'
import { CUTOFFS_SOURCE } from '../fodmapGroups'

const W = 595.28
const H = 841.89
const M = 48 // marges
const CW = W - 2 * M

const hex = (h) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255)
// Tokens de l'identité visuelle (journal/DESIGN.md).
const C = {
  ink: hex('#10231D'), muted: hex('#4A5E57'), border: hex('#E3E8E6'), surface: hex('#F4F6F5'),
  brand: hex('#0B7A5E'), mint: hex('#E3F5EE'), mintLabel: hex('#0B6B53'), peach: hex('#FFEBDD'), peachLabel: hex('#8A3A12'),
  lilac: hex('#ECE9FF'), lilacText: hex('#3E3870'), white: hex('#FFFFFF'),
  calm: hex('#B9DCCD'), discomfort: hex('#FFB84D'), pain: hex('#C2410C'),
}
const LEVEL_COLORS = { calm: C.calm, discomfort: C.discomfort, pain: C.pain }
const LEVEL_LABELS = { calm: 'Calme', discomfort: 'Gêne', pain: 'Douleur' }

/** Abréviations des sous-groupes dans les cases du calendrier (légende sous le calendrier). */
export const FODMAP_ABBR = { fructans: 'Fn', gos: 'G', fructose: 'Fr', lactose: 'L', sorbitol: 'S', mannitol: 'M' }
const FODMAP_ORDER = Object.keys(FODMAP_ABBR)

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const WEEKDAYS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.']
const parseKey = (k) => k.split('-').map(Number)
/** « 26 oct. 2026 » (ou « 26 oct. » sans l'année). */
export function frDate(key, withYear = true) {
  const [y, m, d] = parseKey(key)
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ''}`
}
const weekdayIndex = (key) => {
  const [y, m, d] = parseKey(key)
  return (new Date(y, m - 1, d, 12).getDay() + 6) % 7
}
const pct = (x) => `${Math.round(x * 100)} %`
const hours = (min) => `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`

/** Remplace les caractères absents de la police (sous-ensemble latin) par un équivalent sûr. */
const FALLBACK = { '→': '›', '≥': '>=', '≤': '<=', '×': 'x', ' ': ' ', ' ': ' ' }
function sanitizer(font) {
  const set = new Set(font.getCharacterSet())
  return (s) => [...String(s ?? '')].map((ch) => {
    if (set.has(ch.codePointAt(0))) return ch
    const f = FALLBACK[ch]
    return f !== undefined && [...f].every((c) => set.has(c.codePointAt(0))) ? f : ''
  }).join('')
}

/**
 * Polices du rapport depuis les fichiers de l'app (Vite : URL des fichiers `?url`, lus hors ligne). TTF issus des WOFF
 * de Fontsource par `scripts/fonts/woff-to-ttf.mjs` (fontkit ne sait pas découper WOFF2).
 * @returns {Promise<{ regular: ArrayBuffer, bold: ArrayBuffer, heavy: ArrayBuffer, mono: ArrayBuffer }>}
 */
export async function loadReportFonts() {
  const [regular, bold, heavy, mono] = await Promise.all([
    import('../../assets/fonts/report/figtree-400.ttf?url'),
    import('../../assets/fonts/report/figtree-700.ttf?url'),
    import('../../assets/fonts/report/figtree-800.ttf?url'),
    import('../../assets/fonts/report/ibm-plex-mono-400.ttf?url'),
  ].map((p) => p.then((m) => fetch(m.default)).then((r) => r.arrayBuffer())))
  return { regular, bold, heavy, mono }
}

/**
 * @param {ReturnType<import('./buildReport').buildReport>} report
 * @param {{ fonts: { regular, bold, heavy, mono }, onText?: (text: string, page: number) => void }} opts
 *   `onText` reçoit chaque texte dessiné (tests : le texte d'un PDF à polices embarquées n'est pas lisible tel quel).
 * @returns {Promise<Uint8Array>}
 */
export async function renderReportPdf(report, { fonts, onText } = {}) {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const embed = (bytes) => doc.embedFont(bytes, { subset: true })
  const F = {
    regular: await embed(fonts.regular), bold: await embed(fonts.bold),
    heavy: await embed(fonts.heavy), mono: await embed(fonts.mono),
  }
  const clean = Object.fromEntries(Object.entries(F).map(([k, f]) => [k, sanitizer(f)]))

  doc.setTitle(`${report.title} — ${report.app}`)
  doc.setAuthor(report.app)
  doc.setCreator(report.app)
  doc.setProducer(report.app)
  doc.setSubject(report.disclaimer)
  doc.setLanguage('fr-FR')
  doc.setCreationDate(new Date(report.generatedAt))

  let page
  let pageNo = 0
  let y

  const width = (text, font = 'regular', size = 10) => F[font].widthOfTextAtSize(clean[font](text), size)
  const text = (s, x, yy, { font = 'regular', size = 10, color = C.ink } = {}) => {
    const t = clean[font](s)
    if (!t) return
    page.drawText(t, { x, y: yy, size, font: F[font], color })
    onText?.(t, pageNo)
  }
  /** Coupe un texte en lignes de largeur `max`. */
  const wrap = (s, max, font = 'regular', size = 10) => {
    const lines = []
    let line = ''
    for (const word of clean[font](s).split(' ')) {
      const next = line ? `${line} ${word}` : word
      if (line && F[font].widthOfTextAtSize(next, size) > max) {
        lines.push(line)
        line = word
      } else line = next
    }
    if (line) lines.push(line)
    return lines
  }
  const para = (s, { x = M, max = CW, font = 'regular', size = 10, color = C.ink, lead = 1.4 } = {}) => {
    for (const l of wrap(s, max, font, size)) {
      text(l, x, y, { font, size, color })
      y -= size * lead
    }
  }
  const rect = (x, yy, w, h, color, border) => page.drawRectangle({ x, y: yy, width: w, height: h, color, borderColor: border, borderWidth: border ? 0.8 : 0 })
  const heading = (s) => {
    y -= 10
    text(s, M, y, { font: 'bold', size: 13 })
    y -= 18
  }
  const newPage = (title) => {
    page = doc.addPage([W, H])
    pageNo += 1
    y = H - M
    text(`${report.app} · ${report.title}`.toUpperCase(), M, y, { font: 'mono', size: 8, color: C.muted })
    y -= 30
    text(title, M, y, { font: 'heavy', size: 24 })
    y -= 20
    const p = report.period
    text(`du ${frDate(p.from)} au ${frDate(p.to)} · ${p.weeks} semaines · ${report.gut.notedDays} jours notés sur ${p.days}`, M, y, { font: 'mono', size: 9, color: C.muted })
    y -= 16
  }
  const footer = (total) => {
    const t = `${report.app}${report.appVersion ? ` ${report.appVersion}` : ''} · ${report.disclaimer}`
    doc.getPages().forEach((p, i) => {
      page = p
      pageNo = i + 1
      text(t, M, 28, { size: 7.5, color: C.muted })
      const n = `${i + 1}/${total}`
      text(n, W - M - width(n, 'mono', 8), 28, { font: 'mono', size: 8, color: C.muted })
    })
  }

  // ── Page 1 : En bref ────────────────────────────────────────────────────────────────────────────────────
  newPage('En bref')

  // Encart « pas un diagnostic » (menthe).
  const box = wrap(`${report.disclaimer} Les données viennent du téléphone et des montres de la personne ; elles n’ont pas été vérifiées par un professionnel.`, CW - 28, 'regular', 9.5)
  const boxH = box.length * 13 + 16
  rect(M, y - boxH + 6, CW, boxH, C.mint)
  y -= 8
  for (const l of box) {
    text(l, M + 14, y, { size: 9.5, color: C.mintLabel })
    y -= 13
  }
  y -= 8

  heading('Ventre')
  const g = report.gut
  if (!g.notedDays) {
    para('Aucune note du ventre sur la période.', { color: C.muted })
  } else {
    const bar = 14
    let x = M
    for (const id of ['calm', 'discomfort', 'pain']) {
      const w = CW * g.shares[id]
      if (w > 0) rect(x, y - bar + 4, w, bar, LEVEL_COLORS[id])
      x += w
    }
    y -= bar + 8
    let lx = M
    for (const id of ['calm', 'discomfort', 'pain']) {
      rect(lx, y - 1, 8, 8, LEVEL_COLORS[id])
      const t = `${LEVEL_LABELS[id]} ${g[id]} j (${pct(g.shares[id])})`
      text(t, lx + 12, y, { size: 9 })
      lx += width(t, 'regular', 9) + 30
    }
    y -= 14
    para('Chaque jour noté prend sa note la plus forte (douleur > gêne > calme). Un jour sans note n’est pas compté.', { size: 8.5, color: C.muted })
  }

  heading('Semaine par semaine')
  const cols = [M, M + 150, M + 230, M + 290, M + 350]
  const head = ['Semaine', 'Jours notés', 'Calme', 'Gêne', 'Douleur']
  head.forEach((h, i) => text(h, cols[i], y, { font: 'bold', size: 8.5, color: C.muted }))
  y -= 13
  const weekly = report.weekly
  const weekLine = weekly.length > 4 ? 10.5 : 13
  for (const w of weekly) {
    text(`${frDate(w.from, false)} – ${frDate(w.to, false)}`, cols[0], y, { font: 'mono', size: 8.5 })
    ;[w.notedDays, w.calm, w.discomfort, w.pain].forEach((v, i) => text(String(v), cols[i + 1], y, { font: 'mono', size: 8.5 }))
    // Mini barre empilée.
    if (w.notedDays) {
      let bx = M + 410
      for (const id of ['calm', 'discomfort', 'pain']) {
        const bw = (CW - 410) * (w[id] / 7)
        if (bw > 0) rect(bx, y - 1, bw, 7, LEVEL_COLORS[id])
        bx += bw
      }
    }
    y -= weekLine
  }

  heading('Réintroduction FODMAP guidée')
  if (!report.challenges.length) {
    para('Aucun test de réintroduction fait.', { color: C.muted })
  } else {
    const shown = report.challenges.slice(0, 6)
    for (const c of shown) {
      text(c.group, M, y, { font: 'bold', size: 9.5 })
      const s = c.state === 'done' ? c.sentence : `${c.food} : test en cours (commencé le ${frDate(c.startedAt.slice(0, 10), false)}).`
      const lines = wrap(s, CW - 90, 'regular', 9.5)
      lines.forEach((l, i) => text(l, M + 90, y - i * 12.5, { size: 9.5 }))
      y -= Math.max(1, lines.length) * 12.5 + 2
    }
    if (report.challenges.length > shown.length) para(`… et ${report.challenges.length - shown.length} autres tests.`, { size: 8.5, color: C.muted })
  }

  heading('Pistes repas › ventre')
  const L = report.links
  if (L.status !== 'links' || !L.items.length) {
    const why = L.status === 'no_notes' ? 'Aucune note du ventre.'
      : L.status === 'collecting' ? `Pas encore assez de notes du ventre (${L.noteDays}/${L.minDays} jours) : on préfère attendre plutôt que de montrer de faux suspects.`
        : 'Aucun lien n’a passé toutes les vérifications.'
    para(why, { color: C.muted })
  } else {
    const shown = L.items.slice(0, 5)
    for (const l of shown) {
      const tag = l.strength
      const tw = width(tag, 'mono', 8) + 12
      rect(M, y - 4, tw, 14, C.peach)
      text(tag, M + 6, y, { font: 'mono', size: 8, color: C.peachLabel })
      text(`${l.label} › ventre · ${l.when}`, M + tw + 8, y, { font: 'bold', size: 9.5 })
      y -= 13
      text(`gêne ou douleur ${l.exposed.symptoms} fois sur ${l.exposed.n} ; les autres fois, ${l.unexposed.symptoms} sur ${l.unexposed.n}`, M + tw + 8, y, { font: 'mono', size: 8, color: C.muted })
      y -= 16
    }
    if (L.items.length > shown.length) para(`… et ${L.items.length - shown.length} autres pistes.`, { size: 8.5, color: C.muted })
  }
  para(`Analyse sur tout le journal (${L.noteDays ?? 0} jours notés), pas seulement la période ; ${L.comparisons ?? 0} comparaisons faites, corrigées pour leur nombre. Un lien repéré n’est pas une cause.`, { size: 8.5, color: C.muted })

  heading('Sommeil mesuré')
  if (!report.sleep) para('Aucune nuit mesurée sur la période.', { color: C.muted })
  else {
    const s = report.sleep
    para(`${s.nights} nuits mesurées · durée moyenne ${hours(s.meanMinutes)}${s.regularity ? ` · horaires ${s.regularity} (14 derniers jours)` : ''}`, { font: 'mono', size: 9 })
  }

  if (report.wellbeing) {
    heading('Bien-être estimé')
    const wb = report.wellbeing
    para(`${String(wb.mean).replace('.', ',')} / ${wb.scale} en moyenne sur ${wb.days} jours. ${wb.note}`, { size: 9.5 })
  }

  // ── Page 2 : Détail ─────────────────────────────────────────────────────────────────────────────────────
  newPage('Détail')
  heading('Calendrier du ventre')
  const cal = report.calendar
  const lead = weekdayIndex(cal[0].date)
  const rows = Math.ceil((lead + cal.length) / 7)
  const cellW = CW / 7
  const cellH = Math.min(34, Math.max(20, 300 / rows))
  WEEKDAYS.forEach((d, i) => text(d, M + i * cellW + 4, y, { font: 'mono', size: 8, color: C.muted }))
  y -= 6
  cal.forEach((d, i) => {
    const pos = lead + i
    const cx = M + (pos % 7) * cellW
    const cy = y - (Math.floor(pos / 7) + 1) * cellH
    rect(cx + 1.5, cy + 1.5, cellW - 3, cellH - 3, d.level ? LEVEL_COLORS[d.level] : C.surface, d.level ? undefined : C.border)
    const ink = d.level === 'pain' ? C.white : C.ink
    text(String(parseKey(d.date)[2]), cx + 5, cy + cellH - 11, { font: 'mono', size: 7.5, color: ink })
    const abbr = FODMAP_ORDER.filter((k) => d.fodmapGroups?.includes(k)).map((k) => FODMAP_ABBR[k]).join(' ')
    if (abbr) text(abbr, cx + 5, cy + 5, { font: 'mono', size: 7, color: ink })
  })
  y -= rows * cellH + 14
  let lx = M
  for (const id of ['calm', 'discomfort', 'pain']) {
    rect(lx, y - 1, 8, 8, LEVEL_COLORS[id])
    text(LEVEL_LABELS[id], lx + 12, y, { size: 8.5 })
    lx += width(LEVEL_LABELS[id], 'regular', 8.5) + 26
  }
  rect(lx, y - 1, 8, 8, C.surface, C.border)
  text('non noté', lx + 12, y, { size: 8.5 })
  y -= 14
  para(`Dans une case, un repas du jour riche en : ${FODMAP_ORDER.map((k) => `${FODMAP_ABBR[k]} = ${findGroup(k)?.label ?? k}`).join(' · ')}.`, { size: 8.5, color: C.muted })

  heading('FODMAP par sous-groupe')
  if (!report.fodmapGroups.length) para('Aucun repas riche en un sous-groupe FODMAP noté sur la période.', { color: C.muted })
  else {
    const fc = [M, M + 130, M + 240, M + 340]
    ;['Sous-groupe', 'Jours riches', 'dont notés', 'gêne ou douleur'].forEach((h, i) => text(h, fc[i], y, { font: 'bold', size: 8.5, color: C.muted }))
    y -= 13
    for (const f of report.fodmapGroups) {
      text(f.label, fc[0], y, { size: 9.5 })
      ;[f.days, f.notedDays, f.symptomDays].forEach((v, i) => text(String(v), fc[i + 1], y, { font: 'mono', size: 9 }))
      y -= 13
    }
    para('Simple décompte des jours, pas une analyse : les liens vérifiés sont dans les pistes (page 1).', { size: 8.5, color: C.muted })
  }
  para(`« Riche » : au-dessus d’un repère général par portion (${CUTOFFS_SOURCE}), une hypothèse de départ ; les données de la personne priment. Teneurs : table Ciqual (Anses, CC BY 4.0) et mesures publiées.`, { size: 8, color: C.muted })

  heading('Aliments les plus fréquents')
  if (!report.topFoods.length) para('Aucun repas noté sur la période.', { color: C.muted })
  else para(report.topFoods.map((f) => `${f.label} (${f.days} j)`).join(' · '), { size: 9.5 })

  // Forme des selles (I176) : section absente sans aucune note (la saisie est facultative).
  if (report.stool) {
    const st = report.stool
    heading('Forme des selles')
    para(`${st.total} ${st.total > 1 ? 'notes' : 'note'} sur ${st.days} ${st.days > 1 ? 'jours' : 'jour'} : dures (Bristol 1–2) ${st.hard} · normales (3–5) ${st.normal} · liquides (6–7) ${st.loose}.`, { size: 9.5 })
    para('Saisie facultative : un jour sans note ne veut pas dire sans selles.', { size: 8.5, color: C.muted })
  }

  heading('Sources des données')
  para(report.sources.length ? report.sources.join(' · ') : 'Aucune donnée sur la période.', { size: 9.5, color: report.sources.length ? C.ink : C.muted })
  y -= 4
  para(`Rapport créé le ${frDate(report.period.to)} sur le téléphone, par l’app ${report.app}${report.appVersion ? ` (version ${report.appVersion})` : ''}.`, { size: 8.5, color: C.muted })

  footer(doc.getPageCount())
  return doc.save()
}

