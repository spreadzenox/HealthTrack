package com.healthtrack.app.huawei;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Locale;
import java.util.Map;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * Coffre de la clé longue durée de la montre pour le client Java « synchro seule » (huawei.md §9.1 c) :
 * le JS confie l'identifiant du téléphone (authId) et la clé (authToken) après chaque connexion réussie ;
 * ils sont scellés en AES-GCM par une clé qui ne sort pas du Keystore Android (WatchVaultPlugin).
 * Format : version (1 octet) ‖ longueur de l'IV (1 octet) ‖ IV ‖ chiffré + étiquette (16 o).
 * Données associées : « healthtrack-watch-vault-v1|ADRESSE » → une copie scellée ne s'ouvre que pour sa
 * montre. Sans dépendance Android : la clé est fournie par l'appelant (Keystore sur le téléphone,
 * clé logicielle dans les tests JVM). L'IV est tiré par le fournisseur (exigé par le Keystore).
 */
public final class WatchVault {

    static final int VERSION = 1;
    private static final int TAG_BITS = 128;
    private static final String AAD_PREFIX = "healthtrack-watch-vault-v1|";

    private WatchVault() {}

    /** Clé d'une montre : adresse Bluetooth, identifiant du téléphone, clé longue durée, nom, date. */
    public static final class Credentials {
        public final String address;
        public final String authId;
        public final byte[] authToken;
        public final String name;
        public final long savedAt;

        public Credentials(String address, String authId, byte[] authToken, String name, long savedAt) {
            this.address = normalizeAddress(address);
            this.authId = authId;
            this.authToken = authToken == null ? null : authToken.clone();
            this.name = name;
            this.savedAt = savedAt;
        }
    }

    /** Erreur de validation ou de format (jamais la valeur d'une clé dans le message). */
    public static final class VaultException extends Exception {
        public VaultException(String message) {
            super(message);
        }
    }

    /** Adresse « AA:BB:CC:DD:EE:FF » en majuscules, ou null si elle n'en a pas la forme. */
    public static String normalizeAddress(String address) {
        if (address == null || !address.matches("[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){5}")) return null;
        return address.toUpperCase(Locale.ROOT);
    }

    /** Vérifie ce que le JS confie : adresse, identifiant (1–64 caractères imprimables), clé de 16 à 64 octets. */
    public static void validate(Credentials c) throws VaultException {
        if (c.address == null) throw new VaultException("adresse de montre invalide");
        if (c.authId == null || c.authId.isEmpty() || c.authId.length() > 64 || !c.authId.matches("[\\x21-\\x7E]+")) {
            throw new VaultException("identifiant du téléphone invalide");
        }
        if (c.authToken == null || c.authToken.length < 16 || c.authToken.length > 64) throw new VaultException("clé de la montre invalide");
        if (c.name != null && c.name.length() > 100) throw new VaultException("nom de montre trop long");
    }

    /** Clé lue depuis le JS (authToken en hexadécimal). */
    public static Credentials fromHex(String address, String authId, String authTokenHex, String name, long savedAt) throws VaultException {
        if (authTokenHex == null || authTokenHex.length() % 2 != 0 || !authTokenHex.matches("[0-9A-Fa-f]*")) {
            throw new VaultException("clé de la montre invalide");
        }
        Credentials c = new Credentials(address, authId, IsoAuth.unhex(authTokenHex), name, savedAt);
        validate(c);
        return c;
    }

    private static byte[] aad(String address) {
        return (AAD_PREFIX + address).getBytes(StandardCharsets.UTF_8);
    }

    private static String quote(String s) {
        StringBuilder b = new StringBuilder("\"");
        for (char ch : s.toCharArray()) {
            if (ch == '"' || ch == '\\') b.append('\\').append(ch);
            else if (ch < 0x20) b.append(String.format(Locale.ROOT, "\\u%04x", (int) ch));
            else b.append(ch);
        }
        return b.append('"').toString();
    }

    static byte[] encode(Credentials c) {
        String json = "{\"authId\":" + quote(c.authId)
                + ",\"authToken\":" + quote(IsoAuth.hex(c.authToken))
                + (c.name != null ? ",\"name\":" + quote(c.name) : "")
                + ",\"savedAt\":" + c.savedAt + "}";
        return json.getBytes(StandardCharsets.UTF_8);
    }

    /** Scelle la clé d'une montre ; l'IV est choisi par le fournisseur de `key`. */
    public static byte[] seal(Credentials c, SecretKey key) throws GeneralSecurityException, VaultException {
        validate(c);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        byte[] iv = cipher.getIV();
        if (iv == null || iv.length < 12 || iv.length > 255) throw new VaultException("IV inattendu");
        cipher.updateAAD(aad(c.address));
        byte[] body = cipher.doFinal(encode(c));
        return ByteBuffer.allocate(2 + iv.length + body.length).put((byte) VERSION).put((byte) iv.length).put(iv).put(body).array();
    }

    /** Ouvre une copie scellée pour `address` ; lève si elle est d'une autre montre, altérée ou d'un autre format. */
    public static Credentials open(byte[] blob, String address, SecretKey key) throws GeneralSecurityException, VaultException {
        String addr = normalizeAddress(address);
        if (addr == null) throw new VaultException("adresse de montre invalide");
        if (blob == null || blob.length < 2 + 12 + 16) throw new VaultException("copie scellée trop courte");
        if ((blob[0] & 0xff) != VERSION) throw new VaultException("version de coffre inconnue");
        int ivLen = blob[1] & 0xff;
        if (ivLen < 12 || blob.length < 2 + ivLen + 16) throw new VaultException("copie scellée mal formée");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, blob, 2, ivLen));
        cipher.updateAAD(aad(addr));
        byte[] plain = cipher.doFinal(blob, 2 + ivLen, blob.length - 2 - ivLen);
        Map<String, Object> o = MiniJson.parseObject(new String(plain, StandardCharsets.UTF_8));
        Object savedAt = o.get("savedAt");
        return fromHex(addr, str(o.get("authId")), str(o.get("authToken")), str(o.get("name")),
                savedAt instanceof Number ? ((Number) savedAt).longValue() : 0L);
    }

    private static String str(Object v) {
        return v instanceof String ? (String) v : null;
    }
}
