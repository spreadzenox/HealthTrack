import Capacitor

/// Vue principale de l'app (désignée par `Main.storyboard`) : enregistre les plugins écrits dans ce dépôt pour
/// l'iPhone, qui remplacent ceux d'Android sous le même nom (`src/ios/nativePlugins.js` › `missingOnIos`).
class HalcyaBridgeViewController: CAPBridgeViewController {
    private var textSizeObserver: NSObjectProtocol?

    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(GutEveningPlugin())
        bridge?.registerPluginInstance(EveningNotePlugin())
        bridge?.registerPluginInstance(PortionReminderPlugin())
        bridge?.registerPluginInstance(BackupMarkerPlugin())
        bridge?.registerPluginInstance(AppStoreBillingPlugin()) // inactif côté JS tant que FEATURES.billing est faux
        bridge?.registerPluginInstance(TrialReminderPlugin()) // rappel de fin d'essai (I6), même condition
        bridge?.registerPluginInstance(AppAttestPlugin()) // App Attest (I6) ; branché côté JS quand le relais aura ses routes
        bridge?.registerPluginInstance(FaceSensePlugin()) // lecture du visage à l'ouverture de l'app (I7)
        bridge?.registerPluginInstance(VoiceProbePlugin())
        bridge?.registerPluginInstance(PhoneUsagePlugin()) // temps d'écran (I8, iOS 26.4+, UE) ; branché côté JS plus tard
        bridge?.registerPluginInstance(CycleHealthPlugin()) // cycle noté dans l'app Santé (CYCLE-iOS-1), lecture seule
        #if DEBUG
        bridge?.registerPluginInstance(CaptureProbePlugin()) // build de captures seulement
        #endif
        // Geste de retour de l'iPhone : balayer depuis le bord gauche remonte l'historique de la vue web, comme le bouton
        // retour d'Android (Capacitor, sans écouteur `backButton` : `goBack()`). Persona du 13/11 : sans lui, Réglages,
        // Paramètres et Données n'avaient aucun moyen de revenir, hors roue dentée et onglets (`BackGestureTests`).
        webView?.allowsBackForwardNavigationGestures = true
        // Taille du texte de l'iPhone suivie par la vue web, comme la taille de police d'Android (`TextSize`)
        textSizeObserver = TextSize.follow(webView)
        // Capacitor devient le délégué des notifications : il relaie les gestes à ce gestionnaire
        bridge?.notificationRouter.localNotificationHandler = HalcyaNotificationHandler.shared
    }
}
