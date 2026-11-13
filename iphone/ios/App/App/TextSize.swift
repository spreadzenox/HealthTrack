import UIKit
import WebKit

/// Taille du texte choisie dans l'iPhone (Réglages › Luminosité et affichage › Taille du texte, ou Accessibilité ›
/// Affichage et taille du texte) : la vue web la suit, comme la WebView d'Android suit la taille de police du système.
/// Comme le zoom du texte d'Android, qui agrandit le rem (`useNarrowBox.js` d'Android), la taille de police de `<html>`
/// est multipliée : les plafonds des mises en page communes (`min(1em, 17cqi)` des onglets…) jouent pareil.
/// (`-webkit-text-size-adjust`, essayé d'abord, multipliait le texte après ces plafonds : onglets qui se chevauchent.)
enum TextSize {
    /// Corps de texte d'iOS à la taille par défaut (« Grand ») : 17 pt.
    static let defaultBody: CGFloat = 17
    /// Plafond : 2, la plus grande police d'Android, jusqu'où les mises en page communes sont relues.
    static let maximum: CGFloat = 2

    static func scale(for category: UIContentSizeCategory) -> CGFloat {
        let traits = UITraitCollection(preferredContentSizeCategory: category)
        let body = UIFont.preferredFont(forTextStyle: .body, compatibleWith: traits).pointSize
        return min(body / defaultBody, maximum)
    }

    /// Pourcentage entier de la taille de police de `<html>` (16 px par défaut, aucune taille fixée par l'app).
    static func script(for category: UIContentSizeCategory) -> String {
        let percent = Int((scale(for: category) * 100).rounded())
        return "document.documentElement.style.setProperty('font-size', '\(percent)%')"
    }

    /// Avant le premier rendu de chaque chargement (rien à la taille par défaut), puis à chaque changement dans les
    /// réglages, sans relancer l'app. Le dernier script ajouté l'emporte si la vue web se recharge.
    static func follow(_ webView: WKWebView?, center: NotificationCenter = .default) -> NSObjectProtocol? {
        guard let webView else { return nil }
        let current = UIApplication.shared.preferredContentSizeCategory
        if scale(for: current) != 1 { addAtLoad(category: current, to: webView) }
        return center.addObserver(forName: UIContentSizeCategory.didChangeNotification, object: nil, queue: .main) { [weak webView] note in
            guard let webView else { return }
            let category = note.userInfo?[UIContentSizeCategory.newValueUserInfoKey] as? UIContentSizeCategory
                ?? UIApplication.shared.preferredContentSizeCategory
            addAtLoad(category: category, to: webView)
            webView.evaluateJavaScript(script(for: category), completionHandler: nil)
        }
    }

    private static func addAtLoad(category: UIContentSizeCategory, to webView: WKWebView) {
        webView.configuration.userContentController.addUserScript(
            WKUserScript(source: script(for: category), injectionTime: .atDocumentStart, forMainFrameOnly: true))
    }
}
