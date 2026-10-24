package com.healthtrack.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.UUID;

/**
 * Repère propre à ce téléphone (src/services/restoreGuard.js) : un identifiant aléatoire rangé dans
 * getNoBackupFilesDir, qu'Android ne sauvegarde jamais. Après une restauration (nouveau téléphone, réinstallation),
 * il est neuf alors que le localStorage restauré garde l'ancien : le JS retire alors les secrets de l'ancien téléphone.
 */
@CapacitorPlugin(name = "BackupMarker")
public class BackupMarkerPlugin extends Plugin {

    private static final String FILE = "device_marker";

    @PluginMethod
    public void marker(PluginCall call) {
        try {
            File f = new File(getContext().getNoBackupFilesDir(), FILE);
            String id = f.exists() ? new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8).trim() : "";
            if (id.isEmpty()) {
                id = UUID.randomUUID().toString();
                Files.write(f.toPath(), id.getBytes(StandardCharsets.UTF_8));
            }
            JSObject ret = new JSObject();
            ret.put("id", id);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("repère indisponible");
        }
    }
}
