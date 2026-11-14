# P44-2 : installations Android qui ont analysé au moins un repas pendant le test (du 08/11 au 02/12).
# Entrée : événements « analyze » de Cloud Logging ; $integrity[0] : événements « integrity » de la même période.
# Écartées : CI, robots et réseau de test de Google, iPhone (repérés par les événements integrity de la même empreinte).
# « à inscrire » : au moins un jeton Play Integrity accepté ; les autres sont listées à part, à décider le 02/12.
# Rien de personnel : seulement des empreintes de 12 caractères (hashInstallId).
def p: .jsonPayload;
($integrity[0] | map(select(p.install != null)) | group_by(p.install)
  | map({ key: .[0].jsonPayload.install, value: {
      out: any(.[]; p.ci == true or p.testlab == true or p.testnet == true or p.platform == "ios"),
      passed: any(.[]; p.status == "passed") } }) | from_entries) as $seen
| map(select(p.ci != true and p.unreadable != true and (p.kind == "photo" or p.kind == "text") and p.install != null))
| group_by(p.install)
| map({ install: .[0].jsonPayload.install, n: length, first: (map(.timestamp[0:10]) | min), last: (map(.timestamp[0:10]) | max) }
    + ($seen[.[0].jsonPayload.install] // { out: false, passed: false }))
| (map(select(.out | not))) as $kept
| ($kept | map(select(.passed))) as $ok
| "Testeurs actifs (P44) : \($ok | length) installation(s) à inscrire, \($kept | length - ($ok | length)) sans jeton accepté, \(length - ($kept | length)) écartée(s) (CI, robots, réseau de test, iPhone)",
  "À inscrire dans offered.installs : \($ok | map(.install) | tojson)",
  ($kept[] | "- \(.install) : \(.n) repas, \(.first) → \(.last)\(if .passed then "" else " (sans jeton accepté)" end)")
