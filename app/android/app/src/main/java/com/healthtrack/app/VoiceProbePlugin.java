package com.healthtrack.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.speech.RecognitionService;
import android.speech.RecognitionSupport;
import android.speech.RecognitionSupportCallback;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Sonde vocale (journal/IDEES.md I124) : avant d'écrire la dictée du soir (I117), savoir sur un fait si le téléphone
 * a une reconnaissance vocale **sur l'appareil** en français. Aucun micro n'est ouvert, aucune permission demandée :
 * on interroge seulement Android (disponibilité, moteur par défaut, langues installées / téléchargeables).
 * Tout est dans des try/catch : chaque champ manquant reste nul, et `errors` dit pourquoi.
 */
@CapacitorPlugin(name = "VoiceProbe")
public class VoiceProbePlugin extends Plugin {

    static final String LANGUAGE = "fr-FR";
    private static final long TIMEOUT_MS = 4000;

    @PluginMethod
    public void probe(PluginCall call) {
        Context context = getContext();
        JSObject ret = new JSObject();
        JSArray errors = new JSArray();
        ret.put("sdk", Build.VERSION.SDK_INT);
        ret.put("language", LANGUAGE);
        try {
            ret.put("available", SpeechRecognizer.isRecognitionAvailable(context));
        } catch (RuntimeException e) {
            errors.put("available: " + e);
        }
        if (Build.VERSION.SDK_INT >= 31) {
            try {
                ret.put("onDevice", SpeechRecognizer.isOnDeviceRecognitionAvailable(context));
            } catch (RuntimeException e) {
                errors.put("onDevice: " + e);
            }
        }
        // Moteur par défaut : clé « voice_recognition_service » ; illisible pour les apps récentes sur certains
        // Android (SecurityException), d'où la liste des services de reconnaissance installés en repli.
        try {
            String def = Settings.Secure.getString(context.getContentResolver(), "voice_recognition_service");
            if (def != null) {
                ComponentName c = ComponentName.unflattenFromString(def);
                ret.put("defaultService", c != null ? c.getPackageName() : def);
            }
        } catch (RuntimeException e) {
            errors.put("defaultService: " + e.getClass().getSimpleName());
        }
        try {
            JSArray services = new JSArray();
            List<ResolveInfo> found = context.getPackageManager()
                    .queryIntentServices(new Intent(RecognitionService.SERVICE_INTERFACE), PackageManager.GET_META_DATA);
            for (ResolveInfo r : found) {
                if (r.serviceInfo != null) services.put(r.serviceInfo.packageName);
            }
            ret.put("services", services);
        } catch (RuntimeException e) {
            errors.put("services: " + e);
        }
        if (Build.VERSION.SDK_INT < 33) {
            ret.put("errors", errors);
            call.resolve(ret);
            return;
        }
        // Android 13+ : langues installées / téléchargeables du moteur sur l'appareil (sinon du moteur par défaut).
        // SpeechRecognizer doit être créé et détruit sur le fil principal.
        new Handler(Looper.getMainLooper()).post(() -> checkSupport(context, call, ret, errors));
    }

    private void checkSupport(Context context, PluginCall call, JSObject ret, JSArray errors) {
        AtomicBoolean done = new AtomicBoolean(false);
        Handler main = new Handler(Looper.getMainLooper());
        SpeechRecognizer recognizer;
        try {
            boolean onDevice = ret.optBoolean("onDevice", false);
            recognizer = onDevice
                    ? SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
                    : SpeechRecognizer.createSpeechRecognizer(context);
            ret.put("supportFrom", onDevice ? "on_device" : "default");
        } catch (RuntimeException e) {
            errors.put("create: " + e);
            ret.put("errors", errors);
            call.resolve(ret);
            return;
        }
        final SpeechRecognizer r = recognizer;
        Runnable finish = () -> {
            if (!done.compareAndSet(false, true)) return;
            try {
                r.destroy();
            } catch (RuntimeException ignored) {
                // déjà détruit
            }
            ret.put("errors", errors);
            call.resolve(ret);
        };
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE, LANGUAGE);
        try {
            r.checkRecognitionSupport(intent, main::post, new RecognitionSupportCallback() {
                @Override
                public void onSupportResult(RecognitionSupport s) {
                    JSObject support = new JSObject();
                    support.put("installed", new JSArray(s.getInstalledOnDeviceLanguages()));
                    support.put("pending", new JSArray(s.getPendingOnDeviceLanguages()));
                    support.put("supported", new JSArray(s.getSupportedOnDeviceLanguages()));
                    support.put("online", new JSArray(s.getOnlineLanguages()));
                    ret.put("support", support);
                    finish.run();
                }

                @Override
                public void onError(int error) {
                    ret.put("supportError", error);
                    finish.run();
                }
            });
        } catch (RuntimeException e) {
            errors.put("support: " + e);
            finish.run();
            return;
        }
        main.postDelayed(() -> {
            if (!done.get()) ret.put("supportTimeout", true);
            finish.run();
        }, TIMEOUT_MS);
    }
}
