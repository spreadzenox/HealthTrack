/**
 * Le proxy de `registerPlugin` (@capacitor/core) fabrique une méthode native pour n'importe quel nom, y compris `then` :
 * renvoyé tel quel par une fonction async, il est pris pour une promesse, l'appelant attend pour toujours et la console
 * affiche « "PlayBilling.then()" is not implemented » (trouvé par le premier lancement play sur l'émulateur, VC-9).
 * Cette enveloppe masque `then` et laisse passer tout le reste.
 */
export function notThenable(plugin) {
  return new Proxy(plugin, { get: (target, prop) => (prop === 'then' ? undefined : target[prop]) })
}
