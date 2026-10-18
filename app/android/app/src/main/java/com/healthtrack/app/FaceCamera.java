package com.healthtrack.app;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.ImageFormat;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCaptureSession;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraDevice;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CaptureRequest;
import android.hardware.camera2.params.StreamConfigurationMap;
import android.hardware.display.DisplayManager;
import android.media.Image;
import android.media.ImageReader;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.SystemClock;
import android.util.Size;
import android.view.Display;
import android.view.Surface;

import com.healthtrack.app.face.FaceFrames;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * Une rafale de la caméra frontale (journal/protocoles/visage.md §8) : ouverte en basse résolution (≈ 320 × 240
 * YUV), quelques images converties en RVB à l'endroit au fil de l'eau (chaque {@link Image} est rendue tout de
 * suite), caméra fermée en moins de ~2 s. Rien n'est écrit sur le disque. Appel bloquant, à faire hors du fil
 * principal ; les rappels de Camera2 tournent sur un fil à part.
 */
final class FaceCamera {

    static final int WIDTH = 320;
    static final int HEIGHT = 240;
    /** Laisse l'exposition automatique se caler avant la 1re image gardée. */
    static final long WARMUP_MS = 450;
    static final long SPACING_MS = 350;
    static final long TIMEOUT_MS = 4000;

    /** Erreurs rendues au service, comptées dans le diagnostic. */
    static final String NO_FRONT_CAMERA = "no_front_camera";
    static final String CAMERA_BUSY = "camera_busy";
    static final String CAMERA_DISABLED = "camera_disabled";
    static final String CAMERA_DENIED = "camera_denied";
    static final String CAMERA_ERROR = "camera_error";
    static final String CAMERA_TIMEOUT = "camera_timeout";

    static final class Capture {
        final List<int[]> images = new ArrayList<>();
        int width;
        int height;
        String error;
        long openMs;
    }

    private FaceCamera() {}

    @SuppressLint("MissingPermission") // vérifiée par le service avant chaque rafale
    static Capture capture(Context context, int count) {
        Capture out = new Capture();
        long t0 = SystemClock.elapsedRealtime();
        CameraManager manager = (CameraManager) context.getSystemService(Context.CAMERA_SERVICE);
        String id = null;
        int sensor = 270;
        Size size = null;
        try {
            for (String c : manager.getCameraIdList()) {
                CameraCharacteristics ch = manager.getCameraCharacteristics(c);
                Integer facing = ch.get(CameraCharacteristics.LENS_FACING);
                if (facing == null || facing != CameraCharacteristics.LENS_FACING_FRONT) continue;
                StreamConfigurationMap map = ch.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP);
                if (map == null) continue;
                id = c;
                Integer o = ch.get(CameraCharacteristics.SENSOR_ORIENTATION);
                if (o != null) sensor = o;
                size = pickSize(map.getOutputSizes(ImageFormat.YUV_420_888));
                break;
            }
        } catch (CameraAccessException | RuntimeException e) {
            out.error = CAMERA_ERROR;
            return out;
        }
        if (id == null || size == null) {
            out.error = NO_FRONT_CAMERA;
            return out;
        }
        final int rotation = FaceFrames.frontRotation(sensor, displayRotation(context));
        final int w = size.getWidth(), h = size.getHeight();

        HandlerThread thread = new HandlerThread("face-camera");
        thread.start();
        Handler handler = new Handler(thread.getLooper());
        CountDownLatch done = new CountDownLatch(1);
        final List<int[]> images = Collections.synchronizedList(new ArrayList<>());
        final int[] dims = new int[2];
        final String[] error = new String[1];
        final CameraDevice[] device = new CameraDevice[1];
        final CameraCaptureSession[] session = new CameraCaptureSession[1];
        ImageReader reader = ImageReader.newInstance(w, h, ImageFormat.YUV_420_888, 3);
        final long[] firstFrameAt = {0}, lastKeptAt = {0};
        final byte[][] planes = new byte[3][];

        reader.setOnImageAvailableListener(r -> {
            Image image = r.acquireLatestImage();
            if (image == null) return;
            try {
                long now = SystemClock.elapsedRealtime();
                if (firstFrameAt[0] == 0) firstFrameAt[0] = now;
                if (images.size() >= count || now - firstFrameAt[0] < WARMUP_MS
                        || (lastKeptAt[0] > 0 && now - lastKeptAt[0] < SPACING_MS)) return;
                Image.Plane[] p = image.getPlanes();
                for (int i = 0; i < 3; i++) planes[i] = copy(p[i].getBuffer(), planes[i]);
                FaceFrames.Rgb rgb = FaceFrames.fromYuv420(planes[0], p[0].getRowStride(), planes[1], planes[2],
                        p[1].getRowStride(), p[1].getPixelStride(), image.getWidth(), image.getHeight(), rotation);
                dims[0] = rgb.width;
                dims[1] = rgb.height;
                images.add(rgb.pixels);
                lastKeptAt[0] = now;
                if (images.size() >= count) done.countDown();
            } catch (RuntimeException e) {
                error[0] = CAMERA_ERROR;
                done.countDown();
            } finally {
                image.close();
            }
        }, handler);

        try {
            manager.openCamera(id, new CameraDevice.StateCallback() {
                @Override
                public void onOpened(CameraDevice camera) {
                    device[0] = camera;
                    startSession(camera, reader, session, error, done, handler);
                }

                @Override
                public void onDisconnected(CameraDevice camera) {
                    camera.close();
                    if (images.size() < count) error[0] = CAMERA_BUSY;
                    done.countDown();
                }

                @Override
                public void onError(CameraDevice camera, int code) {
                    camera.close();
                    error[0] = code == ERROR_CAMERA_IN_USE || code == ERROR_MAX_CAMERAS_IN_USE ? CAMERA_BUSY
                            : code == ERROR_CAMERA_DISABLED ? CAMERA_DISABLED : CAMERA_ERROR;
                    done.countDown();
                }
            }, handler);
            if (!done.await(TIMEOUT_MS, TimeUnit.MILLISECONDS) && error[0] == null) error[0] = CAMERA_TIMEOUT;
        } catch (CameraAccessException e) {
            int reason = e.getReason();
            error[0] = reason == CameraAccessException.CAMERA_IN_USE || reason == CameraAccessException.MAX_CAMERAS_IN_USE
                    ? CAMERA_BUSY : reason == CameraAccessException.CAMERA_DISABLED ? CAMERA_DISABLED : CAMERA_ERROR;
        } catch (SecurityException e) {
            error[0] = CAMERA_DENIED;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            error[0] = CAMERA_TIMEOUT;
        } catch (RuntimeException e) {
            error[0] = CAMERA_ERROR;
        } finally {
            // Fermeture sur le fil de la caméra, dans l'ordre session → appareil → lecteur.
            CountDownLatch closed = new CountDownLatch(1);
            handler.post(() -> {
                try {
                    if (session[0] != null) session[0].close();
                    if (device[0] != null) device[0].close();
                } catch (RuntimeException ignored) {
                    // déjà fermée
                }
                reader.close();
                closed.countDown();
            });
            try {
                closed.await(1, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            thread.quitSafely();
        }
        synchronized (images) {
            out.images.addAll(images.subList(0, Math.min(count, images.size())));
        }
        out.width = dims[0];
        out.height = dims[1];
        out.error = out.images.isEmpty() ? (error[0] != null ? error[0] : CAMERA_ERROR) : null;
        out.openMs = SystemClock.elapsedRealtime() - t0;
        for (int i = 0; i < 3; i++) planes[i] = null;
        return out;
    }

    @SuppressWarnings("deprecation") // createCaptureSession(List, …) : seule forme jusqu'à l'API 28 (minSdk 26)
    private static void startSession(CameraDevice camera, ImageReader reader, CameraCaptureSession[] session,
                                     String[] error, CountDownLatch done, Handler handler) {
        try {
            Surface surface = reader.getSurface();
            camera.createCaptureSession(Collections.singletonList(surface), new CameraCaptureSession.StateCallback() {
                @Override
                public void onConfigured(CameraCaptureSession s) {
                    session[0] = s;
                    try {
                        CaptureRequest.Builder b = camera.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW);
                        b.addTarget(surface);
                        b.set(CaptureRequest.CONTROL_MODE, CaptureRequest.CONTROL_MODE_AUTO);
                        s.setRepeatingRequest(b.build(), null, handler);
                    } catch (CameraAccessException | RuntimeException e) {
                        error[0] = CAMERA_ERROR;
                        done.countDown();
                    }
                }

                @Override
                public void onConfigureFailed(CameraCaptureSession s) {
                    error[0] = CAMERA_ERROR;
                    done.countDown();
                }
            }, handler);
        } catch (CameraAccessException | RuntimeException e) {
            error[0] = CAMERA_ERROR;
            done.countDown();
        }
    }

    /** La plus petite taille ≥ 320 × 240 (tailles données en paysage), sinon la plus grande disponible. */
    static Size pickSize(Size[] sizes) {
        if (sizes == null || sizes.length == 0) return null;
        Size best = null, largest = null;
        for (Size s : sizes) {
            long area = (long) s.getWidth() * s.getHeight();
            if (largest == null || area > (long) largest.getWidth() * largest.getHeight()) largest = s;
            if (s.getWidth() >= WIDTH && s.getHeight() >= HEIGHT
                    && (best == null || area < (long) best.getWidth() * best.getHeight())) best = s;
        }
        return best != null ? best : largest;
    }

    private static int displayRotation(Context context) {
        try {
            DisplayManager dm = (DisplayManager) context.getSystemService(Context.DISPLAY_SERVICE);
            Display d = dm == null ? null : dm.getDisplay(Display.DEFAULT_DISPLAY);
            int r = d == null ? Surface.ROTATION_0 : d.getRotation();
            return r == Surface.ROTATION_90 ? 90 : r == Surface.ROTATION_180 ? 180 : r == Surface.ROTATION_270 ? 270 : 0;
        } catch (RuntimeException e) {
            return 0;
        }
    }

    private static byte[] copy(ByteBuffer buffer, byte[] reuse) {
        buffer.rewind();
        int n = buffer.remaining();
        byte[] out = reuse != null && reuse.length == n ? reuse : new byte[n];
        buffer.get(out);
        return out;
    }
}
