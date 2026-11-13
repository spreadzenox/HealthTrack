// swift-tools-version:5.9
// Règles des rappels du soir de Halcya sur iPhone (étape I5), testées par `swift test` sur le runner macOS de la CI.
import PackageDescription

let package = Package(
    name: "HalcyaRules",
    platforms: [.iOS(.v15), .macOS(.v12)],
    products: [.library(name: "HalcyaRules", targets: ["HalcyaRules"])],
    targets: [
        .target(name: "HalcyaRules"),
        .testTarget(name: "HalcyaRulesTests", dependencies: ["HalcyaRules"]),
    ]
)
