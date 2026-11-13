import WebKit
import XCTest
@testable import App

/// Geste de retour de l'iPhone (passage des personas du 13/11, « Stressé et pressé » : « je ne savais pas comment
/// revenir » depuis Réglages, Paramètres et Données) : balayer depuis le bord gauche remonte l'historique de la vue
/// web, comme le bouton retour d'Android. Cible hébergée par l'app : on lit la vue principale déjà chargée.
final class BackGestureTests: XCTestCase {
    func testBalayageDuBordGaucheRemonteLHistorique() throws {
        let fenetres = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.flatMap(\.windows)
        let racine = (UIApplication.shared.delegate?.window ?? nil)?.rootViewController ?? fenetres.first?.rootViewController
        let vue = try XCTUnwrap(racine as? HalcyaBridgeViewController, "vue principale : \(String(describing: racine))")
        vue.loadViewIfNeeded()
        let webView = try XCTUnwrap(vue.webView)
        XCTAssertTrue(webView.allowsBackForwardNavigationGestures)
    }
}
