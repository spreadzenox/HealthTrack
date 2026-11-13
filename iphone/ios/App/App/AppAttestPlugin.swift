import Capacitor
import DeviceCheck
import HalcyaRules

/// App Attest sur iPhone (I6), l'équivalent de Play Integrity : une clé P-256 tirée dans la Secure Enclave, attestée
/// une fois par Apple pour le relais, puis une assertion par requête sensible (analyse, crédits), selon le contrat
/// spécifié par Android le 2/11 (`journal/IDEES.md` de HealthTrack, I6-RELAIS-5). La page compose le défi et le
/// clientData (`src/ios/appAttest.js`) ; ici, seulement la Secure Enclave. Aucune donnée de santé : la clé est tirée
/// au hasard, le corps n'entre que par son condensat. Branché côté JS quand le relais aura ses routes.
@objc(AppAttestPlugin)
public class AppAttestPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppAttestPlugin"
    public let jsName = "AppAttest"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "generateKey", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "attestKey", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "generateAssertion", returnType: CAPPluginReturnPromise),
    ]

    /// Faux sur le simulateur (pas de Secure Enclave) : la page envoie alors `X-Integrity-Status: unsupported`.
    @objc func isSupported(_ call: CAPPluginCall) {
        call.resolve(["supported": DCAppAttestService.shared.isSupported])
    }

    @objc func generateKey(_ call: CAPPluginCall) {
        DCAppAttestService.shared.generateKey { keyId, error in
            guard let keyId, error == nil else { return call.reject("clé indisponible", Self.code(error)) }
            call.resolve(["keyId": keyId])
        }
    }

    /// { keyId, challenge (base64, 32 octets) } → { attestation (base64 de l'objet CBOR d'Apple) }
    @objc func attestKey(_ call: CAPPluginCall) {
        guard let keyId = call.getString("keyId"),
              let hash = AppAttestRule.attestationHash(challengeBase64: call.getString("challenge") ?? "") else {
            return call.reject("défi invalide", "invalid_input")
        }
        DCAppAttestService.shared.attestKey(keyId, clientDataHash: hash) { attestation, error in
            guard let attestation, error == nil else { return call.reject("attestation refusée", Self.code(error)) }
            call.resolve(["attestation": attestation.base64EncodedString()])
        }
    }

    /// { keyId, clientData } → { assertion (base64) }
    @objc func generateAssertion(_ call: CAPPluginCall) {
        guard let keyId = call.getString("keyId"),
              let hash = AppAttestRule.assertionHash(clientData: call.getString("clientData") ?? "") else {
            return call.reject("requête invalide", "invalid_input")
        }
        DCAppAttestService.shared.generateAssertion(keyId, clientDataHash: hash) { assertion, error in
            guard let assertion, error == nil else { return call.reject("assertion refusée", Self.code(error)) }
            call.resolve(["assertion": assertion.base64EncodedString()])
        }
    }

    /// `invalid_key` : clé perdue (restauration sur un autre iPhone, réinstallation) ; la page en tire une neuve.
    private static func code(_ error: Error?) -> String {
        guard let error = error as? DCError else { return "unknown" }
        switch error.code {
        case .invalidKey: return "invalid_key"
        case .invalidInput: return "invalid_input"
        case .featureUnsupported: return "unsupported"
        case .serverUnavailable: return "server_unavailable"
        default: return "unknown"
        }
    }
}
