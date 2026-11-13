import Foundation

/// Sonde vocale sur iPhone (étape I8) : la réponse de `SFSpeechRecognizer` pour le français, rendue sous la forme de
/// VoiceProbePlugin.java d'Android, pour que `voiceVerdict` (`src/services/voiceProbe.js`) serve tel quel. iOS ne
/// dit pas si une langue est « en cours de téléchargement » ou « téléchargeable » : seulement disponible, et sur le
/// téléphone ou non.
public enum VoiceRule {
    public static let language = "fr-FR"

    /// `locales` : `SFSpeechRecognizer.supportedLocales()`, en identifiants BCP 47 (« fr-FR »).
    public static func result(available: Bool, onDevice: Bool, locales: [String]) -> [String: Any] {
        let french = locales.contains { $0.lowercased().hasPrefix("fr") }
        return [
            "language": language,
            "available": available,
            "onDevice": onDevice,
            "defaultService": "Apple (Speech)",
            "services": ["com.apple.speech"],
            "supportFrom": "ios",
            "support": [
                "installed": french && available && onDevice ? [language] : [String](),
                "pending": [String](),
                "supported": [String](),
                "online": french && available && !onDevice ? [language] : [String](),
            ],
            "errors": [String](),
        ]
    }
}
