package com.healthtrack.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.core.integrity.IntegrityManagerFactory;
import com.google.android.play.core.integrity.StandardIntegrityException;
import com.google.android.play.core.integrity.StandardIntegrityManager;
import com.google.android.play.core.integrity.StandardIntegrityManager.PrepareIntegrityTokenRequest;
import com.google.android.play.core.integrity.StandardIntegrityManager.StandardIntegrityTokenProvider;
import com.google.android.play.core.integrity.StandardIntegrityManager.StandardIntegrityTokenRequest;
import com.google.android.play.core.integrity.model.StandardIntegrityErrorCode;

/**
 * Play Integrity, variante play seulement (src/services/playIntegrity.js, jalon 6b-2b). Demande un jeton « standard »
 * lié à `requestHash` (empreinte de l'identifiant d'installation aléatoire) ; le relais Halcya le fait décoder par
 * Google et vérifie que l'app vient de Google Play, sur un appareil certifié. Le plugin ne lit ni ne garde rien.
 */
@CapacitorPlugin(name = "PlayIntegrity")
public class PlayIntegrityPlugin extends Plugin {

    /** Projet Google Cloud healthtrack-824b26, relié à l'app dans la Play Console (journal/INFRA.md). */
    private static final long CLOUD_PROJECT_NUMBER = 81378799481L;

    private StandardIntegrityManager manager;
    /** Fournisseur préparé une fois (opération lente), réutilisé pour chaque jeton. */
    private StandardIntegrityTokenProvider provider;

    @Override
    public void load() {
        manager = IntegrityManagerFactory.createStandard(getContext());
    }

    @PluginMethod
    public void request(PluginCall call) {
        String requestHash = call.getString("requestHash");
        if (requestHash == null || requestHash.isEmpty() || requestHash.length() > 500) {
            call.reject("requestHash invalide", "BAD_REQUEST");
            return;
        }
        withProvider(call, p -> requestToken(call, p, requestHash, true));
    }

    private interface ProviderTask {
        void run(StandardIntegrityTokenProvider provider);
    }

    private void withProvider(PluginCall call, ProviderTask task) {
        if (provider != null) {
            task.run(provider);
            return;
        }
        manager
            .prepareIntegrityToken(PrepareIntegrityTokenRequest.builder().setCloudProjectNumber(CLOUD_PROJECT_NUMBER).build())
            .addOnSuccessListener(p -> {
                provider = p;
                task.run(p);
            })
            .addOnFailureListener(e -> call.reject(String.valueOf(e.getMessage()), errorCode(e)));
    }

    private void requestToken(PluginCall call, StandardIntegrityTokenProvider p, String requestHash, boolean retry) {
        p
            .request(StandardIntegrityTokenRequest.builder().setRequestHash(requestHash).build())
            .addOnSuccessListener(response -> {
                JSObject ret = new JSObject();
                ret.put("token", response.token());
                call.resolve(ret);
            })
            .addOnFailureListener(e -> {
                // Fournisseur périmé (Google conseille de le préparer de nouveau) : une seule nouvelle tentative
                if (retry && e instanceof StandardIntegrityException
                    && ((StandardIntegrityException) e).getErrorCode() == StandardIntegrityErrorCode.INTEGRITY_TOKEN_PROVIDER_INVALID) {
                    provider = null;
                    withProvider(call, fresh -> requestToken(call, fresh, requestHash, false));
                    return;
                }
                call.reject(String.valueOf(e.getMessage()), errorCode(e));
            });
    }

    private static String errorCode(Exception e) {
        return e instanceof StandardIntegrityException
            ? String.valueOf(((StandardIntegrityException) e).getErrorCode())
            : "UNKNOWN";
    }
}
