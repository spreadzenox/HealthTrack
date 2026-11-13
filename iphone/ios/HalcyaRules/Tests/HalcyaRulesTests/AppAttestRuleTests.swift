import Foundation
import XCTest
@testable import HalcyaRules

/// App Attest : ce que l'iPhone fait signer par la Secure Enclave, selon le contrat du relais (I6-RELAIS-5 d'Android).
final class AppAttestRuleTests: XCTestCase {
    private let corpsVide = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" // SHA-256("")

    func testAttestationSurLeCondenseDuDefiDe32Octets() throws {
        let defi = Data(repeating: 7, count: 32)
        let hash = try XCTUnwrap(AppAttestRule.attestationHash(challengeBase64: defi.base64EncodedString()))
        XCTAssertEqual(hash, AppAttestRule.sha256(defi))
        XCTAssertEqual(hash.count, 32)
    }

    func testDefiInvalideRefuse() {
        XCTAssertNil(AppAttestRule.attestationHash(challengeBase64: "pas du base64 !"))
        XCTAssertNil(AppAttestRule.attestationHash(challengeBase64: Data(repeating: 1, count: 16).base64EncodedString()))
    }

    func testAssertionSurLeCondenseDuClientData() throws {
        let clientData = "halcya-assert:install-1:1762070400000:\(corpsVide)"
        let hash = try XCTUnwrap(AppAttestRule.assertionHash(clientData: clientData))
        XCTAssertEqual(hash, AppAttestRule.sha256(Data(clientData.utf8)))
    }

    func testClientDataMalFormeRefuse() {
        XCTAssertNil(AppAttestRule.assertionHash(clientData: ""))
        XCTAssertNil(AppAttestRule.assertionHash(clientData: "autre:install-1:1762070400000:\(corpsVide)"))
        XCTAssertNil(AppAttestRule.assertionHash(clientData: "halcya-assert::1762070400000:\(corpsVide)"))
        XCTAssertNil(AppAttestRule.assertionHash(clientData: "halcya-assert:install-1:hier:\(corpsVide)"))
        XCTAssertNil(AppAttestRule.assertionHash(clientData: "halcya-assert:install-1:1762070400000:abc"))
    }
}
