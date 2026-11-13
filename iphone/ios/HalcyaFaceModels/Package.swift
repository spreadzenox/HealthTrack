// swift-tools-version:5.9
// Lecture du visage sur iPhone (étape I7) : les 3 modèles du Face Landmarker de MediaPipe exécutés par TensorFlow Lite C,
// comme LiteRT sur Android. Modèles et moteur sont téléchargés et vérifiés par scripts/face-models.sh dans Vendor/
// (jamais versionnés) ; tests sur simulateur iOS contre les sorties de référence d'Android (`xcodebuild test`).
import PackageDescription

let package = Package(
    name: "HalcyaFaceModels",
    platforms: [.iOS(.v15)],
    products: [.library(name: "HalcyaFaceModels", targets: ["HalcyaFaceModels"])],
    dependencies: [.package(path: "../HalcyaFace")],
    targets: [
        .binaryTarget(name: "TensorFlowLiteC", path: "Vendor/TensorFlowLiteC.xcframework"),
        .target(
            name: "HalcyaFaceModels",
            dependencies: ["TensorFlowLiteC", .product(name: "HalcyaFace", package: "HalcyaFace")],
            resources: [.copy("Models")], // les 3 .tflite vérifiés, déposés par scripts/face-models.sh
            linkerSettings: [.linkedLibrary("c++")]
        ),
        .testTarget(name: "HalcyaFaceModelsTests", dependencies: ["HalcyaFaceModels", .product(name: "HalcyaFace", package: "HalcyaFace")]),
    ]
)
