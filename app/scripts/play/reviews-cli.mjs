#!/usr/bin/env node
/**
 * Bilan anonyme des avis du Play Store dans le résumé de « Votre avis — résumé » :
 * `node scripts/play/reviews-cli.mjs` (depuis app/).
 * Variables : PLAY_ACCESS_TOKEN (jeton androidpublisher), PLAY_PACKAGE, GITHUB_STEP_SUMMARY (facultatif).
 * Toujours code 0 : une lecture impossible est expliquée dans le bilan, sans faire échouer le résumé des avis de l'app.
 */
import { appendFileSync } from 'node:fs'
import { readReviews, summarizeReviews, formatReviewSummary, explainReviewsError } from './reviews.mjs'

const { PLAY_ACCESS_TOKEN: token, GITHUB_STEP_SUMMARY: summaryFile } = process.env
const packageName = process.env.PLAY_PACKAGE || 'fr.jpesquet.sante'

const summary = (lines) => {
  if (summaryFile) appendFileSync(summaryFile, `${lines.join('\n')}\n`)
  console.log(lines.join('\n'))
}

if (!token) {
  summary(explainReviewsError(new Error('jeton absent (étape « Jeton Google Play » en échec)')))
} else {
  try {
    summary(formatReviewSummary(summarizeReviews(await readReviews({ packageName, token }))))
  } catch (err) {
    summary(explainReviewsError(err))
  }
}
