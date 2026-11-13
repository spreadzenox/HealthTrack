import Capacitor
import HalcyaRules
import Speech

/// Sonde vocale sur iPhone (étape I8) : même plugin, même méthode que `VoiceProbePlugin.java` d'Android, vu de
/// `src/services/voiceProbe.js`. Avant la dictée du soir, dire si l'iPhone reconnaît le français **sur le
/// téléphone** (sinon le son partirait chez Apple). Aucun micro n'est ouvert, aucune permission demandée.
@objc(VoiceProbePlugin)
public class VoiceProbePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "VoiceProbePlugin"
    public let jsName = "VoiceProbe"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "probe", returnType: CAPPluginReturnPromise),
    ]

    @objc func probe(_ call: CAPPluginCall) {
        let recognizer = SFSpeechRecognizer(locale: Locale(identifier: VoiceRule.language))
        let locales = SFSpeechRecognizer.supportedLocales().map { $0.identifier.replacingOccurrences(of: "_", with: "-") }
        call.resolve(VoiceRule.result(
            available: recognizer?.isAvailable ?? false,
            onDevice: recognizer?.supportsOnDeviceRecognition ?? false,
            locales: locales
        ))
    }
}
