#!/usr/bin/env node
/**
 * CLI du workflow « Play — abonnements » : `node scripts/play/subscriptions-cli.mjs` (depuis app/).
 * Variables : PLAY_ACCESS_TOKEN (jeton androidpublisher ; absent → affiche seulement le catalogue prévu),
 * PLAY_PACKAGE (fr.jpesquet.sante par défaut), GITHUB_STEP_SUMMARY (facultatif).
 * Code de sortie : 0 catalogue en place (ou vérifié), 2 refus à réessayer (accès, profil de paiement), 1 autre erreur.
 */
import { appendFileSync } from 'node:fs'
import { buildCatalog, ensureCatalog, formatPrice, isPaymentProfilePending, PRODUCTS } from './subscriptions.mjs'
import { isAccessDenied } from './publish.mjs'

const { PLAY_ACCESS_TOKEN: token, GITHUB_STEP_SUMMARY: summaryFile } = process.env
const packageName = process.env.PLAY_PACKAGE || 'fr.jpesquet.sante'

const summary = (lines) => {
  if (summaryFile) appendFileSync(summaryFile, `${lines.join('\n')}\n`)
  console.log(lines.join('\n'))
}

const planned = PRODUCTS.flatMap((product) => {
  const { subscription } = buildCatalog(packageName, product)
  const { trial } = product
  return [
    `- Abonnement \`${product.productId}\` (${product.tier}) — « ${subscription.listings[0].title} » : ${subscription.listings[0].benefits.join(' · ')}`,
    ...product.basePlans.map((p) => `  - Formule \`${p.basePlanId}\` : ${formatPrice({ currencyCode: 'EUR', ...p.price })} / ${p.period}, grâce ${p.grace}, suspension ${p.hold}`),
    trial
      ? `  - Offre \`${trial.offerId}\` sur \`${trial.basePlanId}\` : gratuit ${trial.duration}, réservé à qui n’a jamais eu l’abonnement`
      : '  - Sans essai gratuit',
  ]
})
if (!token) {
  summary(['### Abonnements : catalogue prévu (aucun jeton, rien n’est envoyé)', '', ...planned])
  process.exit(0)
}

let exitCode = 0
for (const product of PRODUCTS) {
  try {
    const r = await ensureCatalog({ packageName, token, product, log: console.log })
    summary([
      `### Abonnement \`${r.productId}\` : ${r.created ? 'créé' : 'déjà présent'}`,
      '',
      ...r.plans.map((p) => `- Formule \`${p.basePlanId}\` : ${p.state}, ${p.price} / ${p.period}`),
      product.trial ? `- Offre \`${product.trial.offerId}\` : ${r.offerState}${r.offerCreated ? ' (créée)' : ''}` : '- Sans essai gratuit',
      r.addedBasePlans.length ? `- Formules ajoutées : ${r.addedBasePlans.join(', ')}` : null,
      r.activated.length ? `- Activés à ce passage : ${r.activated.join(', ')}` : '- Rien à activer.',
      ...r.drift.map((d) => `- ⚠️ Écart de prix : ${d}`),
    ].filter(Boolean))
    if (r.drift.length) console.log(`::warning title=Abonnements : écart de prix::${r.drift.join(' ; ')}`)
  } catch (err) {
    if (isAccessDenied(err) || isPaymentProfilePending(err)) {
      const why = isAccessDenied(err)
        ? 'gh-deployer n’a peut-être pas le droit de gérer les produits (« Gérer la présence sur le Store ») ou l’invitation n’est pas encore propagée'
        : 'le profil de paiement n’est sans doute pas encore vérifié par Google (virement de test à confirmer, P13)'
      console.log(`::warning title=Abonnements : refus de Google Play (à réessayer)::${product.productId} : ${err.message} — ${why}.`)
      summary([`### Abonnement \`${product.productId}\` : refus de Google Play (à réessayer)`, '', `- Erreur exacte : ${err.message}`, `- Cause probable : ${why}.`, '- Rien n’a été contourné. Relancer : Actions → « Play — abonnements » → Run workflow.'])
      if (exitCode !== 1) exitCode = 2
      continue
    }
    console.log(`::error title=Abonnements : échec::${product.productId} : ${err.message}`)
    summary([`### Abonnement \`${product.productId}\` : échec`, '', `- ${err.message}`])
    exitCode = 1
  }
}
if (exitCode) summary(['', 'Catalogue prévu :', ...planned])
process.exit(exitCode)
