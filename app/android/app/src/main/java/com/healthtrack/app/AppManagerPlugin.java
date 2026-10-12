package com.healthtrack.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Gestes sur une autre app du téléphone, toujours confirmés par l'utilisateur dans une boîte Android
 * (src/devices/huawei/setup.js : libérer la montre de l'app qui la tient) :
 * - boîte de désinstallation (ACTION_DELETE, permission REQUEST_DELETE_PACKAGES) ;
 * - page « Infos sur l'appli » (autorisations : retirer « Appareils à proximité », forcer l'arrêt).
 * Android n'autorise pas une app à en désinstaller une autre en silence.
 */
@CapacitorPlugin(name = "AppManager")
public class AppManagerPlugin extends Plugin {

    private void open(PluginCall call, String action) {
        String pkg = call.getString("package");
        if (pkg == null || !pkg.matches("[A-Za-z0-9_.]+")) {
            call.reject("Nom d'app invalide");
            return;
        }
        try {
            Intent i = new Intent(action, Uri.parse("package:" + pkg));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("Écran Android introuvable");
        }
    }

    @PluginMethod
    public void uninstall(PluginCall call) {
        open(call, Intent.ACTION_DELETE);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        open(call, Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    }
}
