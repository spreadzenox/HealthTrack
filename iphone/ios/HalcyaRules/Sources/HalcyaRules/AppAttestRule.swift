import CryptoKit
import Foundation

/// App Attest sur iPhone (I6), l'équivalent de Play Integrity : ce que l'iPhone signe pour le relais, selon le contrat
/// spécifié par Android le 2/11 (`journal/IDEES.md` de HealthTrack, I208, I6-RELAIS-5). L'attestation de la clé porte
/// sur SHA-256(défi du relais, 32 octets) ; chaque assertion sur SHA-256(clientData), où clientData =
/// « halcya-assert:<installId>:<horodatage ms>:<SHA-256 du corps> » est composé par la page (`src/ios/appAttest.js`).
public enum AppAttestRule {
    public static let challengeBytes = 32

    public static func sha256(_ data: Data) -> Data { Data(SHA256.hash(data: data)) }

    /// `clientDataHash` de l'attestation : nil si le défi n'est pas du base64 de 32 octets
    public static func attestationHash(challengeBase64: String) -> Data? {
        guard let challenge = Data(base64Encoded: challengeBase64), challenge.count == challengeBytes else { return nil }
        return sha256(challenge)
    }

    /// `clientDataHash` d'une assertion : nil si clientData n'a pas la forme convenue avec le relais
    public static func assertionHash(clientData: String) -> Data? {
        let parts = clientData.split(separator: ":", omittingEmptySubsequences: false)
        guard parts.count == 4, parts[0] == "halcya-assert", !parts[1].isEmpty, Int64(parts[2]) != nil,
              parts[3].count == 64, parts[3].allSatisfy(\.isHexDigit) else { return nil }
        return sha256(Data(clientData.utf8))
    }
}
