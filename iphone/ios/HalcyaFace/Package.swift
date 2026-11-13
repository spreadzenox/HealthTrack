// swift-tools-version:5.9
// Lecture du visage de Halcya sur iPhone (étape I7) : calculs sans caméra ni modèle, testés par `swift test` sur le runner
// macOS de la CI contre les vecteurs de référence d'Android (upstream/app/android/app/src/test/resources/face/).
import PackageDescription

let package = Package(
    name: "HalcyaFace",
    platforms: [.iOS(.v15), .macOS(.v12)],
    products: [.library(name: "HalcyaFace", targets: ["HalcyaFace"])],
    targets: [
        .target(name: "HalcyaFace"),
        .testTarget(name: "HalcyaFaceTests", dependencies: ["HalcyaFace"]),
    ]
)
