// Version iOS (HealthTrack-iOS) : dans l'app iPhone, isNativePlatform() est vrai, mais les plugins maison d'Android
// n'ont pas (encore) d'équivalent Swift. Les services s'en servent pour retomber comme dans un navigateur.

/** Vrai dans l'app iPhone quand le plugin natif `name` n'y est pas implémenté. */
export function missingOnIos(name, capacitor = typeof window !== 'undefined' ? window.Capacitor : undefined) {
  return capacitor?.getPlatform?.() === 'ios' && !capacitor.isPluginAvailable?.(name)
}
