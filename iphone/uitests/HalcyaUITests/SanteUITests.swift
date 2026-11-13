import XCTest

/// Test d'interface de la CI (étape I4), écrit dans ce dépôt, sans bibliothèque tierce. Le mode captures de Halcya
/// a ouvert la feuille « Accès à Santé » et attend la réponse ; scripts/ios-captures.sh lance ce test sur le même
/// simulateur, qui touche « Tout activer » puis « Autoriser ». L'app n'est pas relancée : on la remet au premier plan.
/// Simulateur vierge : aucune donnée de santé réelle.
final class SanteUITests: XCTestCase {
    private let halcya = XCUIApplication(bundleIdentifier: "fr.jpesquet.sante")

    func testAccepterLaFeuilleSante() throws {
        halcya.activate()
        let toutActiver = element("Tout activer")
        guard toutActiver.waitForExistence(timeout: 30) else {
            // Arbre d'accessibilité dans le journal du test, pour comprendre où se trouve la feuille
            print(halcya.debugDescription)
            print(XCUIApplication(bundleIdentifier: "com.apple.springboard").debugDescription)
            XCTFail("« Tout activer » introuvable sur la feuille de l'app Santé")
            return
        }
        let autoriser = halcya.buttons["Autoriser"]
        // Un toucher pendant l'animation de la feuille peut se perdre (CI du 27/10, iPhone 17 Pro) : on retouche
        // « Tout activer » tant qu'« Autoriser » reste grisé, trois fois au plus
        var actif = false
        for _ in 1...3 where !actif {
            if toutActiver.exists { toutActiver.tap() } // une fois pris, le libellé peut changer
            actif = XCTWaiter().wait(for: [condition(autoriser, "isEnabled == true")], timeout: 5) == .completed
        }
        XCTAssertTrue(actif, "« Autoriser » toujours grisé après trois touchers sur « Tout activer »")
        autoriser.tap()
        attendre(autoriser, "exists == false", 15)
    }

    /// Premier élément dont le libellé est exactement `label`, quel que soit son type (bouton, cellule, texte).
    private func element(_ label: String) -> XCUIElement {
        halcya.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).firstMatch
    }

    private func condition(_ element: XCUIElement, _ predicate: String) -> XCTNSPredicateExpectation {
        XCTNSPredicateExpectation(predicate: NSPredicate(format: predicate), object: element)
    }

    private func attendre(_ element: XCUIElement, _ predicate: String, _ timeout: TimeInterval) {
        let atteint = XCTWaiter().wait(for: [condition(element, predicate)], timeout: timeout)
        XCTAssertEqual(atteint, .completed, "« \(predicate) » non atteint")
    }
}

/// Tests d'interface du bilan du ventre du soir (étape I5), lancés par scripts/ios-captures.sh pendant le parcours des
/// captures : autoriser les notifications, puis répondre « Gêne » à la notification d'essai depuis le centre de
/// notifications, sans ouvrir l'app. L'arbre d'accessibilité est écrit dans le journal du test en cas d'échec.
final class NotificationsUITests: XCTestCase {
    private let halcya = XCUIApplication(bundleIdentifier: "fr.jpesquet.sante")
    private let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
    private let titre = "Et votre digestion aujourd’hui ?" // Android AUJ-7 : « ventre » devient « digestion »

    /// Alerte « “Halcya” souhaite vous envoyer des notifications » : « Autoriser ».
    func testAutoriserLesNotifications() throws {
        halcya.activate()
        let autoriser = springboard.alerts.buttons["Autoriser"]
        guard autoriser.waitForExistence(timeout: 20) else {
            print(springboard.debugDescription)
            XCTFail("alerte des notifications introuvable")
            return
        }
        if !toucherJusquaFermeture(autoriser) {
            print(springboard.debugDescription)
            XCTFail("alerte des notifications toujours ouverte après trois touchers")
        }
    }

    /// Touche un bouton d'alerte d'iOS jusqu'à ce qu'il disparaisse : le toucher ne prend pas toujours (29/10, PR #61,
    /// iPhone 17 Pro : alerte des notifications encore ouverte après le toucher, test réussi, essais suivants sautés).
    private func toucherJusquaFermeture(_ bouton: XCUIElement, essais: Int = 3) -> Bool {
        for _ in 0..<essais {
            if bouton.exists { bouton.tap() }
            let ferme = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: bouton)
            if XCTWaiter().wait(for: [ferme], timeout: 4) == .completed { return true }
        }
        return false
    }

    /// Bilan du ventre : bannière dépliée, puis « Gêne ».
    func testRepondreGeneDepuisLaBanniere() throws {
        guard deplierLaBanniere(titre) else { return }
        let gene = springboard.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "Gêne")).firstMatch
        guard gene.waitForExistence(timeout: 10) else {
            XCTFail("bouton « Gêne » absent de la bannière dépliée")
            return
        }
        gene.tap()
        halcya.activate()
    }

    /// Note du soir : bannière « Votre soirée ? » dépliée ; les notes qu'iOS affiche (5 demandées, de 1 à 5) sont écrites
    /// dans le journal du test, puis « 4 » est touché (ou la dernière affichée si iOS en coupe).
    func testNoterLaSoireeDepuisLaBanniere() throws {
        guard deplierLaBanniere("Votre soirée ?") else { return }
        let visibles = (1...5).map(String.init).filter { springboard.buttons[$0].waitForExistence(timeout: $0 == "1" ? 10 : 1) }
        print("actions visibles : \(visibles.joined(separator: " ")) (\(visibles.count) sur 5)")
        XCTAssertFalse(springboard.buttons["0"].exists, "plus de note 0 depuis Android v855")
        guard let choix = visibles.contains("4") ? "4" : visibles.last else {
            XCTFail("aucune note dans la bannière dépliée")
            return
        }
        springboard.buttons[choix].tap()
        halcya.activate()
    }

    /// Rappel de portion : l'app passe en arrière-plan, la bannière « Votre portion du jour » est touchée comme le soir
    /// venu ; Halcya doit revenir au premier plan (la sonde relève ensuite la page ouverte).
    func testToucherLeRappelDePortion() throws {
        XCUIDevice.shared.press(.home)
        let banniere = springboard.descendants(matching: .any)
            .matching(NSPredicate(format: "identifier == %@ AND label CONTAINS %@", "NotificationShortLookView",
                                  "Votre portion du jour"))
            .firstMatch
        guard banniere.waitForExistence(timeout: 90) else {
            print(springboard.debugDescription)
            XCTFail("bannière « Votre portion du jour » jamais apparue")
            halcya.activate()
            return
        }
        banniere.tap()
        guard halcya.wait(for: .runningForeground, timeout: 15) else {
            XCTFail("Halcya ne s'est pas ouverte au toucher")
            halcya.activate()
            return
        }
    }

    /// Attend la bannière d'une notification d'essai (jusqu'à 90 s : elle part 45 s après le signal) et la déplie par
    /// un appui long, méthode courante des tests d'interface de notifications (l'appui long dans le centre de
    /// notifications ne la dépliait pas, essais du 28/10). Faux si elle n'est jamais apparue.
    private func deplierLaBanniere(_ titre: String) -> Bool {
        let banniere = springboard.descendants(matching: .any)
            .matching(NSPredicate(format: "identifier == %@ AND label CONTAINS %@", "NotificationShortLookView", titre))
            .firstMatch
        guard banniere.waitForExistence(timeout: 90) else {
            print(springboard.debugDescription)
            XCTFail("bannière « \(titre) » jamais apparue")
            return false
        }
        banniere.press(forDuration: 1.5)
        sleep(1)
        print(springboard.debugDescription)
        return true
    }
}

/// Import d'une sauvegarde par le sélecteur de fichiers d'iOS (étape I3), lancé par scripts/ios-captures.sh pendant le
/// parcours des captures : le mode captures a écrit un ancien fichier de sauvegarde inventé dans Documents (visible
/// dans Fichiers › Sur mon iPhone › Halcya) et ouvert Vos données. Le test touche « Choisir un fichier à importer »,
/// va jusqu'au fichier et le choisit ; l'app montre alors l'aperçu de l'import. L'arbre d'accessibilité est écrit
/// dans le journal du test à chaque étape manquée.
final class DonneesUITests: XCTestCase {
    private let halcya = XCUIApplication(bundleIdentifier: "fr.jpesquet.sante")
    private let fichier = "halcya-essai-import"

    func testImporterUnFichierDepuisFichiers() throws {
        halcya.activate()
        let choisir = element("Choisir un fichier à importer")
        guard choisir.waitForExistence(timeout: 30) else {
            print(halcya.debugDescription)
            XCTFail("« Choisir un fichier à importer » introuvable")
            return
        }
        // Sélecteur refermé sans aperçu (29/10, PR #70, iPhone 16e : second toucher sur le fichier pendant la
        // fermeture du sélecteur) : tout le parcours une seconde fois avant d'échouer
        for essai in 1...2 {
            if importer(choisir) { return }
            print("aucun aperçu après le parcours \(essai)")
            print(halcya.debugDescription)
            fermerLeSelecteur(attente: 1)
        }
        XCTFail("aperçu de l'import jamais affiché")
    }

    /// Un parcours : sélecteur, Explorer › Sur mon iPhone › Halcya, fichier ; vrai si l'aperçu de l'import s'affiche.
    private func importer(_ choisir: XCUIElement) -> Bool {
        // Selon la version d'iOS, WKWebView ouvre le sélecteur directement ou propose d'abord un menu. Le sélecteur ne
        // s'ouvre pas toujours au premier toucher (29/10, PR #60, iPhone 17 Pro) : un second essai s'il manque 6 s après
        for essai in 1...2 {
            choisir.tap()
            for menu in ["Choisir un fichier", "Choisir des fichiers"] where element(menu).waitForExistence(timeout: 2) {
                element(menu).tap()
                break
            }
            if selecteurOuvert(attente: 6) { break }
            print("sélecteur de fichiers absent après le toucher \(essai)")
        }
        let cible = dossier(fichier)
        if !cible.waitForExistence(timeout: 8) {
            // Pas dans « Récents » : onglet « Explorer » (iOS 26 ; « Parcourir » avant), puis Sur mon iPhone › Halcya
            // (essai du 28/10 : sélecteur ouvert sur « Récents », onglets Récents / Partagé / Explorer)
            let onglet = ["Explorer", "Parcourir"].map(element).first { $0.waitForExistence(timeout: 3) }
            onglet?.tap()
            for etape in ["Sur mon iPhone", "Halcya"] where !cible.exists {
                let suivant = dossier(etape)
                if suivant.waitForExistence(timeout: 8) {
                    suivant.tap()
                } else {
                    print("étape « \(etape) » absente")
                    print(halcya.debugDescription)
                }
                _ = cible.waitForExistence(timeout: 3)
            }
        }
        guard cible.waitForExistence(timeout: 10) else {
            print(halcya.debugDescription)
            print("« \(fichier) » introuvable dans le sélecteur de fichiers")
            return false
        }
        cible.tap()
        // Selon la version, toucher le fichier l'ouvre, ou il faut encore toucher « Ouvrir »
        let ouvrir = halcya.buttons["Ouvrir"]
        if ouvrir.waitForExistence(timeout: 3) { ouvrir.tap() }
        let apercu = element("Ajouter à mes données")
        // Toucher perdu pendant l'animation du dossier (29/10, PR #59, iPhone 16e : fichier encore affiché, sélecteur
        // ouvert, aucun aperçu) : un second toucher si, 5 s après, le fichier est toujours là et le sélecteur ouvert
        // (pas pendant sa fermeture : PR #70)
        if !apercu.waitForExistence(timeout: 5) && cible.exists && halcya.buttons["Annuler"].exists {
            print("fichier toujours affiché 5 s après le toucher : second toucher")
            cible.tap()
            if ouvrir.waitForExistence(timeout: 3) { ouvrir.tap() }
        }
        return apercu.waitForExistence(timeout: 30)
    }

    /// Sélecteur de fichiers affiché : ses onglets (Récents, Explorer) ou son bouton « Annuler ».
    private func selecteurOuvert(attente: TimeInterval) -> Bool {
        let fin = Date().addingTimeInterval(attente)
        repeat {
            if ["Récents", "Explorer", "Parcourir"].contains(where: { halcya.buttons[$0].exists }) || halcya.buttons["Annuler"].exists {
                return true
            }
            usleep(300_000)
        } while Date() < fin
        return false
    }

    /// Sélecteur de fichiers resté ouvert après un échec : « Annuler », sinon il bloque les tests suivants (29/10, PR
    /// #59 : import en échec sur l'iPhone 16e, puis export et rapport en échec derrière le sélecteur resté ouvert).
    private func fermerLeSelecteur(attente: TimeInterval = 3) {
        let annuler = halcya.buttons["Annuler"]
        if annuler.waitForExistence(timeout: attente) { annuler.tap() }
    }

    /// Export par la feuille de partage : « Télécharger la sauvegarde » (le fichier est écrit dans Documents, puis
    /// partagé), « Enregistrer dans Fichiers », dossier Halcya, « Enregistrer », puis « Garder les deux » puisque le
    /// fichier y est déjà. La sonde compte ensuite les exports dans Documents.
    func testEnregistrerLaSauvegardeDansFichiers() throws {
        halcya.activate()
        fermerLeSelecteur(attente: 1) // reste éventuel d'un test précédent
        let exporter = element("Télécharger la sauvegarde")
        guard exporter.waitForExistence(timeout: 30) else {
            print(halcya.debugDescription)
            XCTFail("« Télécharger la sauvegarde » introuvable")
            return
        }
        toucherJusquaFeuille(exporter)
        enregistrerDansFichiers(attente: 20)
    }

    /// Toucher qui doit ouvrir la feuille de partage. 29/10 (PR #64, iPhone 17 Pro) : le toucher est arrivé (bouton vu
    /// enfoncé) sans que la page reçoive le clic : ni fichier écrit, ni feuille. On retouche tant qu'aucune feuille
    /// n'est venue en 8 s (3 fois au plus), jamais quand elle est là : un toucher derrière elle la fermerait.
    private func toucherJusquaFeuille(_ bouton: XCUIElement, essais: Int = 3) {
        let liste = halcya.otherElements["ActivityListView"]
        let fichiers = lieu("Enregistrer dans Fichiers")
        for essai in 1...essais {
            guard bouton.exists else { return }
            bouton.tap()
            for _ in 0..<8 {
                if liste.waitForExistence(timeout: 1) || fichiers.exists { return }
            }
            print("Feuille de partage absente 8 s après le toucher \(essai)")
        }
    }

    /// Rapport PDF pour le médecin (N6b) : « Créer le PDF » (la sonde a déjà touché « Préparer le rapport ») ; le PDF
    /// est créé sur l'iPhone, écrit dans Documents, puis partagé : même enregistrement dans Fichiers que l'export.
    func testEnregistrerLeRapportDansFichiers() throws {
        halcya.activate()
        fermerLeSelecteur(attente: 1) // reste éventuel d'un test précédent
        let creer = element("Créer le PDF")
        guard creer.waitForExistence(timeout: 30) else {
            print(halcya.debugDescription)
            XCTFail("« Créer le PDF » introuvable")
            return
        }
        creer.tap()
        enregistrerDansFichiers(attente: 60) // le PDF se crée d'abord (polices et rendu chargés à la demande)
    }

    /// Feuille de partage ouverte par l'app : « Enregistrer dans Fichiers », dossier Halcya, « Enregistrer », puis
    /// « Garder les deux » puisque le fichier y est déjà. Pour un PDF, la feuille s'ouvre à mi-hauteur (Aperçu,
    /// Copier, Annoter, Imprimer…) et l'action est plus bas (29/10, iPhone 16e et 17 Pro) : on la tire vers le haut
    /// par son en-tête (« Document PDF · 21 ko ») ; un glissement sur « Copier » valait un toucher et la fermait.
    private func enregistrerDansFichiers(attente: TimeInterval) {
        let fichiers = lieu("Enregistrer dans Fichiers")
        let entete = halcya.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", "Document PDF")).firstMatch
        let fin = Date().addingTimeInterval(attente)
        var tirages = 0
        while !fichiers.waitForExistence(timeout: 2) && Date() < fin {
            if tirages < 2 && entete.exists {
                entete.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
                    .press(forDuration: 0.2, thenDragTo: halcya.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.08)))
                tirages += 1
            }
        }
        guard fichiers.exists else {
            print(halcya.debugDescription)
            XCTFail("feuille de partage sans « Enregistrer dans Fichiers »")
            return
        }
        fichiers.tap()
        let enregistrer = halcya.buttons["Enregistrer"]
        guard enregistrer.waitForExistence(timeout: 20) else {
            print(halcya.debugDescription)
            XCTFail("« Enregistrer » introuvable après « Enregistrer dans Fichiers »")
            return
        }
        // Le dernier dossier utilisé peut déjà être ouvert : on repasse par Sur mon iPhone › Halcya (des dossiers : le
        // PDF « Halcya-rapport-… » du dossier ne doit pas être pris pour le dossier Halcya, 29/10, iPhone 17 Pro)
        for etape in ["Sur mon iPhone", "Halcya"] {
            let suivant = repertoire(etape)
            if suivant.waitForExistence(timeout: 3) { suivant.tap() } else { print("étape « \(etape) » absente") }
        }
        print(halcya.debugDescription)
        enregistrer.tap()
        let garder = element("Garder les deux")
        if garder.waitForExistence(timeout: 5) { garder.tap() }
        let ferme = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: enregistrer)
        if XCTWaiter().wait(for: [ferme], timeout: 15) != .completed {
            print(halcya.debugDescription)
            XCTFail("la feuille d'enregistrement ne s'est pas fermée")
        }
    }

    /// Premier élément dont le libellé est exactement `label`, quel que soit son type.
    private func element(_ label: String) -> XCUIElement {
        halcya.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).firstMatch
    }

    /// Lieu, dossier ou fichier du sélecteur : une cellule dont le libellé ou l'identifiant contient `label`
    /// (identifiant « halcya-essai-import.json, json » dans un dossier, essai du 28/10 sur l'iPhone 16e). Pas de
    /// bouton : « Halcya, Menu d'actions », le titre du dossier ouvert, ouvrirait un menu.
    private func dossier(_ label: String) -> XCUIElement {
        halcya.descendants(matching: .cell)
            .matching(NSPredicate(format: "label CONTAINS %@ OR identifier CONTAINS %@", label, label))
            .firstMatch
    }

    /// Dossier du sélecteur : comme `dossier`, sans les fichiers (dont le libellé ou l'identifiant porte une extension).
    private func repertoire(_ label: String) -> XCUIElement {
        halcya.descendants(matching: .cell)
            .matching(NSPredicate(format: "(label CONTAINS %@ OR identifier CONTAINS %@) AND NOT (label CONTAINS '.' OR identifier CONTAINS '.')", label, label))
            .firstMatch
    }

    /// Action d'une feuille (cellule ou bouton) dont le libellé contient `label` (« Enregistrer dans Fichiers ») ; les
    /// textes de la page de l'app derrière la feuille ne comptent pas.
    private func lieu(_ label: String) -> XCUIElement {
        let types = [XCUIElement.ElementType.cell, .button].map { NSNumber(value: $0.rawValue) }
        return halcya.descendants(matching: .any)
            .matching(NSPredicate(format: "elementType IN %@ AND label CONTAINS %@", types, label))
            .firstMatch
    }
}
