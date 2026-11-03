#!/usr/bin/env node
/**
 * Bilan des plantages et ANR (Android vitals) dans le résumé de « Play — AAB » :
 * `node scripts/play/vitals-cli.mjs` (depuis app/).
 * Variables : PLAY_REPORTING_TOKEN (jeton playdeveloperreporting), VERSION_CODE (facultatif), PLAY_PACKAGE,
 * GITHUB_STEP_SUMMARY (facultatif). Toujours code 0 : une lecture impossible n'empêche jamais un envoi.
 */
import { appendFileSync } from 'node:fs'
import { readErrorIssues, formatErrorIssues, explainVitalsError } from './vitals.mjs'

const { PLAY_REPORTING_TOKEN: token, VERSION_CODE: versionCode, GITHUB_STEP_SUMMARY: summaryFile } = process.env
const packageName = process.env.PLAY_PACKAGE || 'fr.jpesquet.sante'

const summary = (lines) => {
  if (summaryFile) appendFileSync(summaryFile, `${lines.join('\n')}\n`)
  console.log(lines.join('\n'))
}

if (!token) {
  summary(explainVitalsError(new Error('jeton absent (étape « Jeton Android vitals » en échec)')))
} else {
  try {
    summary(formatErrorIssues(await readErrorIssues({ packageName, token }), { versionCode }))
  } catch (err) {
    summary(explainVitalsError(err))
  }
}
