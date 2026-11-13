import AVFoundation
import Foundation
import HalcyaFace

/// La caméra frontale de l'iPhone pour une rafale, comme `FaceCamera.java` d'Android : petite image (352 × 288, la plus
/// proche des 320 × 240 d'Android, pour garder le seuil de 80 px du visage), 450 ms pour que l'exposition se pose, puis
/// `frames` images espacées d'au moins 350 ms, 4 s au plus ; YUV « 420f » converti tout de suite en RVB à l'endroit
/// (portrait, sans miroir), session fermée aussitôt. Rien n'est écrit sur le disque. Appel bloquant, hors du fil principal.
public final class FrontCamera: NSObject, FaceCamera, AVCaptureVideoDataOutputSampleBufferDelegate {
    public static let warmupMs: UInt64 = 450
    public static let frameGapMs: UInt64 = 350
    public static let timeoutMs = 4000

    private let queue = DispatchQueue(label: "fr.jpesquet.sante.face-camera")
    private var wanted = 0
    private var startedAt: UInt64 = 0
    private var lastAt: UInt64 = 0
    private var frames: [FaceFrames.Rgb] = []
    private var done = DispatchSemaphore(value: 0)

    public override init() {}

    private static func nowMs() -> UInt64 { DispatchTime.now().uptimeNanoseconds / 1_000_000 }

    public func capture(frames count: Int) -> FaceCapture {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized: break
        case .notDetermined: return FaceCapture(error: "camera_denied", detail: "not_determined")
        default: return FaceCapture(error: "camera_denied")
        }
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front) else {
            return FaceCapture(error: "no_front_camera")
        }
        let t0 = Self.nowMs()
        let session = AVCaptureSession()
        session.beginConfiguration()
        session.sessionPreset = session.canSetSessionPreset(.cif352x288) ? .cif352x288 : .vga640x480
        guard let input = try? AVCaptureDeviceInput(device: device), session.canAddInput(input) else {
            session.commitConfiguration()
            return FaceCapture(error: "camera_error", detail: "input")
        }
        session.addInput(input)
        let output = AVCaptureVideoDataOutput()
        output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarFullRange]
        output.alwaysDiscardsLateVideoFrames = true
        guard session.canAddOutput(output) else {
            session.commitConfiguration()
            return FaceCapture(error: "camera_error", detail: "output")
        }
        session.addOutput(output)
        if let connection = output.connection(with: .video) {
            // Images à l'endroit (portrait) et sans miroir, comme Android
            if #available(iOS 17.0, *) {
                if connection.isVideoRotationAngleSupported(90) { connection.videoRotationAngle = 90 }
            } else if connection.isVideoOrientationSupported {
                connection.videoOrientation = .portrait
            }
            if connection.isVideoMirroringSupported {
                connection.automaticallyAdjustsVideoMirroring = false
                connection.isVideoMirrored = false
            }
        }
        session.commitConfiguration()

        queue.sync {
            wanted = count
            frames = []
            startedAt = Self.nowMs()
            lastAt = 0
            done = DispatchSemaphore(value: 0)
        }
        output.setSampleBufferDelegate(self, queue: queue)
        session.startRunning()
        guard session.isRunning else {
            output.setSampleBufferDelegate(nil, queue: nil)
            return FaceCapture(error: "camera_busy")
        }
        let finished = done.wait(timeout: .now() + .milliseconds(Self.timeoutMs)) == .success
        session.stopRunning()
        output.setSampleBufferDelegate(nil, queue: nil)
        let taken = queue.sync { () -> [FaceFrames.Rgb] in
            let f = frames
            frames = []
            return f
        }
        let openMs = Int64(Self.nowMs() - t0)
        guard finished, let first = taken.first else {
            return FaceCapture(openMs: openMs, error: "camera_timeout", detail: "\(taken.count)/\(count)")
        }
        return FaceCapture(images: taken.map(\.pixels), width: first.width, height: first.height, openMs: openMs)
    }

    public func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        let now = Self.nowMs()
        guard frames.count < wanted, now - startedAt >= Self.warmupMs, lastAt == 0 || now - lastAt >= Self.frameGapMs,
              let buffer = CMSampleBufferGetImageBuffer(sampleBuffer), let rgb = Self.rgb(buffer) else { return }
        frames.append(rgb)
        lastAt = now
        if frames.count == wanted { done.signal() }
    }

    /// « 420f » (plan Y, plan CbCr entrelacé) → 0xRRGGBB, déjà à l'endroit (rotation faite par la connexion).
    static func rgb(_ buffer: CVPixelBuffer) -> FaceFrames.Rgb? {
        guard CVPixelBufferGetPixelFormatType(buffer) == kCVPixelFormatType_420YpCbCr8BiPlanarFullRange,
              CVPixelBufferGetPlaneCount(buffer) == 2 else { return nil }
        CVPixelBufferLockBaseAddress(buffer, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(buffer, .readOnly) }
        let width = CVPixelBufferGetWidthOfPlane(buffer, 0), height = CVPixelBufferGetHeightOfPlane(buffer, 0)
        let yStride = CVPixelBufferGetBytesPerRowOfPlane(buffer, 0), uvStride = CVPixelBufferGetBytesPerRowOfPlane(buffer, 1)
        let uvHeight = CVPixelBufferGetHeightOfPlane(buffer, 1)
        guard let yBase = CVPixelBufferGetBaseAddressOfPlane(buffer, 0), let uvBase = CVPixelBufferGetBaseAddressOfPlane(buffer, 1) else { return nil }
        let y = [UInt8](UnsafeBufferPointer(start: yBase.assumingMemoryBound(to: UInt8.self), count: yStride * height))
        let uv = [UInt8](UnsafeBufferPointer(start: uvBase.assumingMemoryBound(to: UInt8.self), count: uvStride * uvHeight))
        return FaceFrames.fromYuv420(y: y, yRowStride: yStride, u: uv, uOffset: 0, v: uv, vOffset: 1,
                                     uvRowStride: uvStride, uvPixelStride: 2, width: width, height: height, rotation: 0)
    }
}
