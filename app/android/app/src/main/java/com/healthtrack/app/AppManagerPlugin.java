package com.healthtrack.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Gestes sur une autre app du téléphone, toujours confirmés par l'utilisateur dans une boîte Android
 * (src/devices/huawei/setup.js : libérer la montre de l'app qui la tient) :
 * - boîte de désinstallation (ACTION_DELETE, permission REQUEST_DELETE_PACKAGES) ;
 * - page « Infos sur l'appli » (autorisations : retirer « Appareils à proximité », forcer l'arrêt).
 * Et la liste des apps du catalogue installées (src/devices/phoneApps.js), en un seul appel.
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

    /**
     * Paquets installés parmi `packages` (déclarés dans les {@code <queries>} du manifeste), en un seul aller-retour :
     * {@code getPackageInfo(pkg, 0)} ne lit ni activités ni signatures (rapide, même pour une grosse app).
     */
    @PluginMethod
    public void installedPackages(PluginCall call) {
        JSArray packages = call.getArray("packages");
        if (packages == null) {
            call.reject("Liste de paquets absente");
            return;
        }
        PackageManager pm = getContext().getPackageManager();
        JSArray installed = new JSArray();
        for (int i = 0; i < packages.length(); i++) {
            String pkg = packages.optString(i, null);
            if (pkg == null || !pkg.matches("[A-Za-z0-9_.]+")) continue;
            try {
                pm.getPackageInfo(pkg, 0);
                installed.put(pkg);
            } catch (PackageManager.NameNotFoundException e) {
                // absent (ou invisible faute de <queries>)
            }
        }
        JSObject ret = new JSObject();
        ret.put("installed", installed);
        call.resolve(ret);
    }
}
