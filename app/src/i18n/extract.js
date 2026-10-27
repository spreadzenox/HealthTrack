/**
 * Extraction des phrases à traduire d'un fichier source (pour le test de catalogue et un futur script) : les
 * premiers arguments littéraux de `t('…')` et les valeurs littérales de l'objet de `t.plural(n, { … })`.
 * Un appel avec un argument non littéral (variable, gabarit avec `${}`) est signalé : sa phrase ne peut pas être
 * vérifiée, il faut écrire la phrase en toutes lettres.
 */
import { parse } from '@babel/parser'

const literal = (node) => {
  if (node?.type === 'StringLiteral') return node.value
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked
  return null
}

function walk(node, visit) {
  if (!node || typeof node.type !== 'string') return
  visit(node)
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'start' || key === 'end') continue
    const v = node[key]
    if (Array.isArray(v)) v.forEach((c) => walk(c, visit))
    else if (v && typeof v.type === 'string') walk(v, visit)
  }
}

/**
 * @param {string} code
 * @returns {{ keys: string[], dynamic: number[] }} phrases trouvées, lignes des appels non vérifiables
 */
export function extractKeys(code) {
  const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] })
  const keys = []
  const dynamic = []
  walk(ast.program, (node) => {
    if (node.type !== 'CallExpression') return
    const c = node.callee
    if (c.type === 'Identifier' && c.name === 't') {
      const v = literal(node.arguments[0])
      if (v == null) dynamic.push(node.loc.start.line)
      else keys.push(v)
    } else if (c.type === 'MemberExpression' && c.object.type === 'Identifier' && c.object.name === 't'
      && c.property.type === 'Identifier' && c.property.name === 'plural') {
      const forms = node.arguments[1]
      if (forms?.type !== 'ObjectExpression') { dynamic.push(node.loc.start.line); return }
      for (const p of forms.properties) {
        const v = p.type === 'ObjectProperty' ? literal(p.value) : null
        if (v == null) dynamic.push(node.loc.start.line)
        else keys.push(v)
      }
    }
  })
  return { keys, dynamic }
}
