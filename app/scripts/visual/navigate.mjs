// Navigation du banc de captures (VISUAL-FLAKY-1, 06/11).
// Attendre « networkidle » échouait environ une fois sur quatre (délai de 20 s) : une requête de l'app ou du
// serveur Vite peut rester ouverte. On attend donc la fin du chargement, un réseau au repos au mieux (sans
// échouer), puis que React ait rendu quelque chose dans #root. Un chargement raté est retenté une fois.
export async function gotoRoute(page, url, { loadTimeout = 20000, idleTimeout = 5000, renderTimeout = 10000 } = {}) {
  try {
    await page.goto(url, { waitUntil: 'load', timeout: loadTimeout })
  } catch {
    await page.goto(url, { waitUntil: 'load', timeout: loadTimeout })
  }
  await page.waitForLoadState('networkidle', { timeout: idleTimeout }).catch(() => {})
  await page.locator('#root > *').first().waitFor({ timeout: renderTimeout })
}
