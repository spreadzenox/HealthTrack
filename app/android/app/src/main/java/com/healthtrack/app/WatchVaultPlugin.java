package com.healthtrack.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.healthtrack.app.huawei.WatchVault;

import java.security.KeyStore;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;

/**
 * Coffre natif de la clé de la montre (src/services/watchVault.js, huawei.md §9.1 c) : après chaque connexion
 * réussie, le JS confie l'identifiant du téléphone et la clé longue durée pour que le client Java « synchro
 * seule » puisse relire la montre app tuée. Scellés en AES-GCM (WatchVault) par une clé AES-256 créée dans le
 * Keystore Android, qui n'en sort jamais (une copie sauvegardée ailleurs ne s'ouvre pas). Rien ne repart vers
 * le JS : status dit seulement si une clé utilisable est gardée, et depuis quand.
 */
@CapacitorPlugin(name = "WatchVault")
public class WatchVaultPlugin extends Plugin {

    static final String PREFS = "healthtrack_watch_vault";
    private static final String ALIAS = "healthtrack_watch_vault";

    private static SecretKey keystoreKey(boolean create) throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        KeyStore.Entry entry = ks.getEntry(ALIAS, null);
        if (entry instanceof KeyStore.SecretKeyEntry) return ((KeyStore.SecretKeyEntry) entry).getSecretKey();
        if (!create) return null;
        KeyGenerator g = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        g.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build());
        return g.generateKey();
    }

    private static String slot(String address) {
        return "watch:" + address;
    }

    /** Clé gardée pour la montre `address`, ou null (absente, illisible, d'un autre téléphone). Pour le client Java. */
    static WatchVault.Credentials read(Context context, String address) {
        String addr = WatchVault.normalizeAddress(address);
        if (addr == null) return null;
        String b64 = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(slot(addr), null);
        if (b64 == null) return null;
        try {
            SecretKey key = keystoreKey(false);
            return key == null ? null : WatchVault.open(Base64.decode(b64, Base64.NO_WRAP), addr, key);
        } catch (Exception e) {
            return null;
        }
    }

    @PluginMethod
    public void store(PluginCall call) {
        try {
            WatchVault.Credentials c = WatchVault.fromHex(call.getString("deviceId"), call.getString("authId"),
                    call.getString("authToken"), call.getString("name"), System.currentTimeMillis());
            byte[] blob = WatchVault.seal(c, keystoreKey(true));
            getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                    .putString(slot(c.address), Base64.encodeToString(blob, Base64.NO_WRAP)).apply();
            JSObject ret = new JSObject();
            ret.put("stored", true);
            ret.put("savedAt", c.savedAt);
            call.resolve(ret);
        } catch (WatchVault.VaultException e) {
            call.reject(e.getMessage());
        } catch (Exception e) {
            call.reject("Keystore indisponible");
        }
    }

    /** { stored, savedAt? } pour la montre `deviceId` ; une copie qui ne s'ouvre plus est effacée. */
    @PluginMethod
    public void status(PluginCall call) {
        String addr = WatchVault.normalizeAddress(call.getString("deviceId"));
        JSObject ret = new JSObject();
        WatchVault.Credentials c = addr == null ? null : read(getContext(), addr);
        if (c == null && addr != null) remove(getContext(), addr);
        ret.put("stored", c != null);
        if (c != null) ret.put("savedAt", c.savedAt);
        call.resolve(ret);
    }

    @PluginMethod
    public void clear(PluginCall call) {
        String addr = WatchVault.normalizeAddress(call.getString("deviceId"));
        if (addr == null) {
            call.reject("adresse de montre invalide");
            return;
        }
        remove(getContext(), addr);
        call.resolve();
    }

    private static void remove(Context context, String address) {
        SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (p.contains(slot(address))) p.edit().remove(slot(address)).apply();
    }
}
