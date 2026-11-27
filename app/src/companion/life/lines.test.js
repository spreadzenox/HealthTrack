import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  EXPRESSIONS,
  WELLBEING_MIRROR,
  finishedLine,
  gutLine,
  habitLine,
  idleLine,
  isLateHour,
  mealLine,
  reactionFor,
  undoLine,
  welcomeBackLine,
  wellbeingLine,
} from './lines'
import { FORBIDDEN_WORDING, SLOP_WORDING, stripComments } from '../../data/wordingRules.js'

const at = (h) => new Date(2026, 10, 16, h, 5).toISOString()

describe('repas : il réagit au geste, la variante suit le cercle', () => {
  it('matin, midi, soir', () => {
    expect(mealLine({ at: at(8) }, 'Pilou').sub).toBe('Bravo, Pilou est rassasié… et bien réveillé !')
    expect(mealLine({ at: at(13) }, 'Pilou').sub).toBe('Bravo, Pilou est rassasié.')
    expect(mealLine({ at: at(20) }, 'Bulle').sub).toBe('Bravo, Bulle a bien dîné.')
    expect(mealLine({ at: at(13) }).text).toBe('Merci, c’était délicieux !')
  })

  it('jamais le contenu de l’assiette : même réponse quel que soit le plat', () => {
    const a = mealLine({ at: at(13), payload: { dish: 'Frites', kcal: 900 } }, 'P')
    const b = mealLine({ at: at(13), payload: { dish: 'Salade', kcal: 200 } }, 'P')
    expect(a).toEqual(b)
    expect(JSON.stringify(a)).not.toMatch(/kcal|calorie/i)
  })
})

describe('le miroir du bien-être', () => {
  it('une phrase par cran, celles de la SPEC', () => {
    expect(wellbeingLine(5).text).toBe('Super ! Ça se fête.')
    expect(wellbeingLine(4).text).toBe('Ça me fait plaisir.')
    expect(wellbeingLine(3).text).toBe('D’accord, merci.')
    expect(wellbeingLine(2).text).toBe('Merci de me le dire.')
    expect(wellbeingLine(1).text).toBe('Journée difficile ? Je reste près de vous.')
  })

  it('une note basse le rend tendre, jamais triste', () => {
    expect(wellbeingLine(1).expr).toBe('reconfortant')
    for (const m of Object.values(WELLBEING_MIRROR)) expect(EXPRESSIONS).toContain(m.expr)
  })
})

describe('habitudes : « Non » vaut « Oui »', () => {
  it('méditation : il médite avec vous', () => {
    const r = habitLine('meditation', 'Méditation', true, 'Pilou')
    expect(r.move).toBe('meditate')
    expect(r.text).toBe('Respirez avec moi…')
    expect(r.then).toBe('Merci pour ce moment calme.')
    expect(r.sub).toBe('Fait ! Pilou médite avec vous')
  })

  it('non : « Pas grave, à demain ! », sans reproche', () => {
    const r = habitLine('reading', 'Lecture', false)
    expect(r.text).toBe('Pas grave, à demain !')
    expect(r.move).toBe('shrug')
  })
})

describe('digestion du soir', () => {
  it('une note basse change les mots, pas son attitude', () => {
    expect(gutLine('tranquille').text).toBe('Merci, bonne soirée.')
    expect(gutLine('pain').text).toBe('Merci de me l’avoir dit. Reposez-vous bien.')
    expect(gutLine('pain').expr).toBe(gutLine('tranquille').expr)
  })
})

describe('digestion notée dans la journée (POLISH-SIM-123)', () => {
  it('une note du moment ne parle ni du soir ni de la journée', () => {
    const matin = reactionFor({ type: 'gut', at: '2026-11-15T07:35:00Z', payload: { level: 'discomfort' } })
    expect(matin.text).toBe('Merci de me l’avoir dit.')
    expect(matin.sub).toBe('Digestion · noté')
    expect(matin.say).not.toMatch(/soirée|Reposez-vous|du jour/)
    expect(reactionFor({ type: 'gut', payload: { level: 'calm' } }).text).toBe('C’est noté, merci !')
    // Le bilan du soir garde ses mots
    expect(reactionFor({ type: 'gut', payload: { level: 'pain', scope: 'day' } }).text).toBe('Merci de me l’avoir dit. Reposez-vous bien.')
  })
})

describe('fin de journée et retour', () => {
  it('avant 21 h la fête sobre, ensuite il dort', () => {
    expect(finishedLine(20, 'Pilou')).toMatchObject({ title: 'Plus rien à faire, bravo !', move: 'party' })
    expect(finishedLine(21, 'Pilou')).toMatchObject({ title: 'À demain.', text: 'Pilou dort sur son îlot. Bonne nuit.', expr: 'endormi' })
  })

  it('« Bon retour » sans compteur ni série', () => {
    expect(welcomeBackLine(0)).toBeNull()
    expect(welcomeBackLine(1).text).toBe('Bon retour ! Content de vous voir.')
    expect(welcomeBackLine(4).text).toBe('Bon retour ! On repart d’aujourd’hui.')
    expect(welcomeBackLine(4).text).not.toMatch(/\d/)
  })

  it('au repos, rien ne presse', () => {
    expect(idleLine({ remaining: 3, hour: 8 }).text).toBe('Bonjour ! Je suis là quand vous voulez.')
    expect(idleLine({ remaining: 0, hour: 22 }).expr).toBe('endormi')
  })

  it('après minuit, c’est encore la nuit, comme sur l’Accueil : ni « Bonjour » ni « Bonne soirée »', () => {
    for (const hour of [0, 2, 4]) {
      const line = idleLine({ remaining: 3, hour })
      expect(line.expr).toBe('endormi')
      expect(line.text).toBe('Bonne nuit. Le reste peut attendre demain.')
      expect(idleLine({ remaining: 0, hour }).text).toBe('Bonne nuit.')
    }
    expect(idleLine({ remaining: 3, hour: 5 }).text).toBe('Bonjour ! Je suis là quand vous voulez.')
    expect(finishedLine(2).expr).toBe('endormi')
    expect(finishedLine(5).expr).toBe('rayonnant')
    expect(isLateHour(2)).toBe(true)
    expect(isLateHour(19)).toBe(true)
    expect(isLateHour(5)).toBe(false)
    expect(isLateHour(18)).toBe(false)
  })
})

describe('reactionFor', () => {
  it('saisies à la main seulement', () => {
    expect(reactionFor({ type: 'food', at: at(13) })?.expr).toBe('rassasie')
    expect(reactionFor({ type: 'wellbeing', source: 'app_wellbeing', at: at(9), payload: { score: 5 } })?.text).toBe('Super ! Ça se fête.')
    expect(reactionFor({ type: 'wellbeing', source: 'face_sense', at: at(9), payload: { score: 1 } })).toBeNull()
    expect(reactionFor({ type: 'habit', at: at(12), payload: { habit: 'reading', label: 'Lecture', done: false } })?.move).toBe('shrug')
    expect(reactionFor({ type: 'gut', at: at(20), payload: { level: 'tranquille', scope: 'day' } })?.text).toBe('Merci, bonne soirée.')
    expect(reactionFor({ type: 'steps', at: at(9) })).toBeNull()
    expect(reactionFor(null)).toBeNull()
  })

  it('annuler : il rembobine', () => {
    expect(undoLine().move).toBe('rewind')
  })
})

describe('textes du lot VIE', () => {
  const dir = path.resolve('src/companion/life')
  const files = fs.readdirSync(dir).filter((f) => /\.jsx?$/.test(f) && !/\.test\./.test(f))

  it('aucun mot interdit ni formule « slop »', () => {
    const found = []
    for (const f of files) {
      const text = stripComments(fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
      for (const { re, why } of [...FORBIDDEN_WORDING, ...SLOP_WORDING]) if (re.test(text.replace(/\s+/g, ' '))) found.push(`${f} : ${why}`)
    }
    expect(found).toEqual([])
  })

  it('jamais triste, déçu ni culpabilisant', () => {
    for (const f of files) {
      const text = stripComments(fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
      expect(text, f).not.toMatch(/déçu|triste|dommage|raté|oublié|série perdue|jours? manqués?/i)
    }
  })
})
