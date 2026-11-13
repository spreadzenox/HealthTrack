import Foundation

/// Réglages et compteurs du diagnostic, comme les `SharedPreferences` « face_sense » d'Android (UserDefaults dédiés
/// dans l'app, mémoire dans les tests). Jamais un score : seulement ce qui s'est passé.
public protocol FacePrefs: AnyObject {
    func int(_ key: String) -> Int
    func long(_ key: String) -> Int64
    func string(_ key: String) -> String?
    func set(_ key: String, _ value: Any?)
    var keys: [String] { get }
}

/// Images d'une rafale prises par la caméra frontale (0xRRGGBB à l'endroit), ou la raison de l'échec (« camera_denied »…).
public struct FaceCapture {
    public var images: [[UInt32]]
    public var width: Int
    public var height: Int
    public var openMs: Int64
    public var error: String?
    public var detail: String?

    public init(images: [[UInt32]] = [], width: Int = 0, height: Int = 0, openMs: Int64 = 0, error: String? = nil, detail: String? = nil) {
        self.images = images
        self.width = width
        self.height = height
        self.openMs = openMs
        self.error = error
        self.detail = detail
    }
}

public protocol FaceCamera {
    func capture(frames: Int) -> FaceCapture
}

/// État du téléphone au moment de lire.
public struct FaceEnvironment {
    public var screenOn = true
    public var inCall = false
    public var thermal = Double.nan
    public var visible = true
    public var cameraPermission = true
    public var modelsAvailable = true

    public init(screenOn: Bool = true, inCall: Bool = false, thermal: Double = .nan, visible: Bool = true, cameraPermission: Bool = true, modelsAvailable: Bool = true) {
        self.screenOn = screenOn
        self.inCall = inCall
        self.thermal = thermal
        self.visible = visible
        self.cameraPermission = cameraPermission
        self.modelsAvailable = modelsAvailable
    }
}

/// Une lecture du visage **app à l'écran**, comme `FaceOneShot.java` de la variante play : à l'ouverture de Halcya
/// (« app_open ») ou pour le bouton « Tester » (« manual »). Garde-fous, modèles ouverts pour la lecture, rafale de 3
/// images, JSON déposé dans la boîte, compteurs du diagnostic ; les images sont oubliées dès l'inférence faite. Rend le
/// résultat (« face », « no_valid_frame », « skip:… », « camera:… », « store_error »), noté aussi dans le diagnostic.
public final class FaceOneShot {
    public static let frames = 3
    public static let attemptsKept = 12

    private let prefs: FacePrefs
    private let inbox: FaceInbox
    private let camera: FaceCamera
    private let openPipeline: () throws -> FacePipeline
    private let environment: () -> FaceEnvironment
    private let clock: () -> Int64
    private let elapsed: () -> Int64
    private let timeZone: TimeZone
    private let lock = NSLock()

    /// - Parameters:
    ///   - clock: heure murale en ms ; `elapsed` : temps monotone en ms (durées)
    public init(prefs: FacePrefs, inbox: FaceInbox, camera: FaceCamera, openPipeline: @escaping () throws -> FacePipeline,
                environment: @escaping () -> FaceEnvironment,
                clock: @escaping () -> Int64 = { Int64(Date().timeIntervalSince1970 * 1000) },
                elapsed: @escaping () -> Int64 = { Int64(DispatchTime.now().uptimeNanoseconds / 1_000_000) },
                timeZone: TimeZone = .current) {
        self.prefs = prefs
        self.inbox = inbox
        self.camera = camera
        self.openPipeline = openPipeline
        self.environment = environment
        self.clock = clock
        self.elapsed = elapsed
        self.timeZone = timeZone
    }

    /// Appel bloquant, à faire hors du fil principal ; une seule lecture à la fois.
    public func run(trigger: String) -> String {
        lock.lock()
        defer { lock.unlock() }
        let now = clock()
        Self.rollDay(prefs, now: now, timeZone: timeZone)
        let appOpen = trigger == FaceSchedule.triggerAppOpen
        let env = environment()
        var skip = FaceSchedule.decide(trigger: trigger, now: now, lastBurstAt: prefs.long("lastAppOpenAt"), burstsToday: prefs.int("dayAppOpens"),
                                       screenOn: env.screenOn, inCall: env.inCall, thermal: env.thermal)?.rawValue
        if skip == nil && !env.visible { skip = "not_visible" }
        if skip == nil && !env.cameraPermission { skip = "no_permission" }
        if skip == nil && !env.modelsAvailable { skip = "no_models" }
        if let skip { return outcome(trigger, "skip:" + skip, nil, now) }

        let t0 = elapsed()
        let pipeline: FacePipeline
        do {
            pipeline = try openPipeline()
        } catch {
            return outcome(trigger, "skip:no_models", "models:\(type(of: error))", now)
        }
        prefs.set("modelLoadMs", elapsed() - t0)

        var cap = camera.capture(frames: Self.frames)
        if let error = cap.error { return outcome(trigger, "camera:" + error, cap.detail, now) }
        let t1 = elapsed()
        var rejections: [String] = []
        let result = pipeline.burst(cap.images, width: cap.width, height: cap.height, rejections: &rejections)
        cap.images.removeAll() // images oubliées dès l'inférence faite
        let inferenceMs = elapsed() - t1
        let json = FaceRecord.json(at: now, trigger: trigger, frames: Self.frames, burst: result, rejections: rejections,
                                   cameraMs: cap.openMs, inferenceMs: inferenceMs)
        do {
            try inbox.put(json, atMs: now)
        } catch {
            return outcome(trigger, "store_error", "\(type(of: error))", now)
        }
        if appOpen {
            prefs.set("lastAppOpenAt", now)
            prefs.set("dayAppOpens", prefs.int("dayAppOpens") + 1)
            if result != nil { prefs.set("dayAppOpenFaces", prefs.int("dayAppOpenFaces") + 1) }
        }
        prefs.set("sumCameraMs", prefs.long("sumCameraMs") + cap.openMs)
        prefs.set("sumInferenceMs", prefs.long("sumInferenceMs") + inferenceMs)
        prefs.set("timed", prefs.int("timed") + 1)
        for r in rejections { prefs.set("r_" + r, prefs.int("r_" + r) + 1) }
        return outcome(trigger, result != nil ? "face" : "no_valid_frame", nil, now)
    }

    private func outcome(_ trigger: String, _ what: String, _ detail: String?, _ at: Int64) -> String {
        prefs.set("lastOutcome", what)
        prefs.set("lastTrigger", trigger)
        prefs.set("lastOutcomeAt", at)
        prefs.set("n_" + what, prefs.int("n_" + what) + 1)
        prefs.set("attempts", Self.appendAttempt(prefs.string("attempts"), at: at, trigger: trigger, source: "app", retry: false, what: what, detail: detail))
        return what
    }

    /// Nouveau jour (heure locale) : les compteurs « day… » repartent de zéro, comme `FaceSenseService.rollDay`.
    public static func rollDay(_ p: FacePrefs, now: Int64, timeZone: TimeZone = .current) {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = timeZone
        f.dateFormat = "yyyy-MM-dd"
        let day = f.string(from: Date(timeIntervalSince1970: Double(now) / 1000))
        if p.string("day") == day { return }
        p.set("day", day)
        for k in p.keys where k.hasPrefix("day") && k != "day" { p.set(k, nil) }
        for k in ["dayUnlocks", "dayBursts", "dayFaces"] { p.set(k, 0) }
    }

    /// Journal des dernières tentatives (JSON, 12 au plus) : jamais un score, seulement ce qui s'est passé.
    public static func appendAttempt(_ json: String?, at: Int64, trigger: String, source: String?, retry: Bool, what: String, detail: String?) -> String {
        var old: [Any] = []
        if let json, let data = json.data(using: .utf8) {
            guard let parsed = try? JSONSerialization.jsonObject(with: data) as? [Any] else { return json }
            old = parsed
        }
        var items = old.suffix(attemptsKept - 1).compactMap { item -> String? in
            guard let data = try? JSONSerialization.data(withJSONObject: item, options: [.sortedKeys]) else { return nil }
            return String(data: data, encoding: .utf8)
        }
        var a = "{\"at\":\(at),\"trigger\":\(FaceRecord.quote(trigger)),\"outcome\":\(FaceRecord.quote(what))"
        if let source { a += ",\"source\":\(FaceRecord.quote(source))" }
        if retry { a += ",\"retry\":true" }
        if let detail { a += ",\"detail\":\(FaceRecord.quote(detail))" }
        items.append(a + "}")
        return "[" + items.joined(separator: ",") + "]"
    }
}

/// Réglages en mémoire (tests, simulateur).
public final class MemoryFacePrefs: FacePrefs {
    public private(set) var values: [String: Any] = [:]
    public init() {}
    public func int(_ key: String) -> Int { (values[key] as? Int) ?? Int((values[key] as? Int64) ?? 0) }
    public func long(_ key: String) -> Int64 { (values[key] as? Int64) ?? Int64((values[key] as? Int) ?? 0) }
    public func string(_ key: String) -> String? { values[key] as? String }
    public func set(_ key: String, _ value: Any?) { values[key] = value }
    public var keys: [String] { Array(values.keys) }
}
