import WebKit
import XCTest
@testable import App

/// Taille du texte d'iOS suivie par la vue web, comme la taille de police d'Android (écart noté le 4/11, Android v771) :
/// le rem grandit comme avec le zoom du texte d'Android, plafonné à 2 comme sa plus grande police.
final class TextSizeTests: XCTestCase {
    func testTailleParDefautSansChangement() {
        XCTAssertEqual(TextSize.scale(for: .large), 1, accuracy: 0.001)
        XCTAssertEqual(TextSize.script(for: .large), "document.documentElement.style.setProperty('font-size', '100%')")
    }

    func testTresGrandTexteAgrandit() {
        XCTAssertEqual(TextSize.scale(for: .extraExtraExtraLarge), 23.0 / 17.0, accuracy: 0.01)
        XCTAssertEqual(TextSize.script(for: .extraExtraExtraLarge), "document.documentElement.style.setProperty('font-size', '135%')")
    }

    func testPlafonneALaPlusGrandePoliceDAndroid() {
        XCTAssertEqual(TextSize.scale(for: .accessibilityExtraExtraExtraLarge), 2, accuracy: 0.001)
    }

    func testPetitTexteReduit() {
        XCTAssertLessThan(TextSize.scale(for: .extraSmall), 1)
    }

    /// Changement dans les réglages, app ouverte : la page de l'app le prend tout de suite.
    @MainActor
    func testLaVueWebSuitUnChangementDeTaille() async throws {
        let fenetres = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.flatMap(\.windows)
        let racine = (UIApplication.shared.delegate?.window ?? nil)?.rootViewController ?? fenetres.first?.rootViewController
        let vue = try XCTUnwrap(racine as? HalcyaBridgeViewController, "vue principale : \(String(describing: racine))")
        vue.loadViewIfNeeded()
        let webView = try XCTUnwrap(vue.webView)
        for (category, attendu) in [(UIContentSizeCategory.extraExtraExtraLarge, "135%"), (.large, "100%")] {
            NotificationCenter.default.post(name: UIContentSizeCategory.didChangeNotification, object: nil,
                                            userInfo: [UIContentSizeCategory.newValueUserInfoKey: category])
            var lu = ""
            for _ in 0..<30 {
                try await Task.sleep(nanoseconds: 100_000_000)
                // String() : jamais de résultat indéfini (le pont de WKWebView le supporte mal)
                let js = "String(document.documentElement.style.getPropertyValue('font-size'))"
                lu = (try? await webView.evaluateJavaScript(js)) as? String ?? ""
                if lu == attendu { break }
            }
            XCTAssertEqual(lu, attendu, "taille \(category.rawValue)")
        }
    }
}
