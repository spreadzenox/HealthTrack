package com.healthtrack.app.huawei;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;

/**
 * Authentification HiChain ISO d'une montre **déjà appairée** (opération 2, journal/protocoles/huawei.md
 * §6.2–§6.3), côté téléphone, pour le client Java « synchro seule » : la clé longue durée (gardée depuis
 * l'appairage fait par l'app) suffit, jamais de PIN ni de liaison ici. Même calcul que runHichain
 * (src/devices/huawei/hichain.js), vérifié par les vecteurs communs.
 *
 * Déroulé : startMessage() → réponse de la montre → tokenMessage(…) → réponse → confirmMessage(…) ;
 * ensuite frameKey() donne la clé de chiffrement des trames de cette connexion.
 */
public final class IsoAuth {

    public static final int SERVICE = 1;
    public static final int COMMAND = 0x28;
    public static final int OP_AUTH = 2;
    public static final int MSG_START = 0x11;
    public static final int MSG_TOKEN = 0x12;
    public static final int MSG_CONFIRM = 0x13;

    private static final String GROUP_NAME = "health_group_name";
    private static final String APP_ID = "com.huawei.health";

    /** Échec typé : `key_rejected` (jeton différent : la montre ne reconnaît plus la clé), `watch_error`, `format`. */
    public static final class AuthException extends Exception {
        public final String code;

        public AuthException(String code, String message) {
            super(message);
            this.code = code;
        }
    }

    /** Réponse 1/0x28 lue : message final (étiquette 4 ≠ 0) ou charge utile JSON. */
    public static final class Reply {
        public final boolean last;
        public final Map<String, Object> payload;

        Reply(boolean last, Map<String, Object> payload) {
            this.last = last;
            this.payload = payload;
        }
    }

    private final byte[] authToken;
    private final byte[] idSelf;
    private final Random random;
    private byte[] randSelf;
    private byte[] randPeer;
    private byte[] idPeer;
    private byte[] psk;
    private byte[] sessionKey;

    public IsoAuth(byte[] authToken, String authId, Random random) {
        this.authToken = authToken.clone();
        this.idSelf = authId.getBytes(StandardCharsets.UTF_8);
        this.random = random != null ? random : new SecureRandom();
    }

    // --- messages ---

    /** Message de début (0x0011) : aléa et graine du téléphone. */
    public byte[] startMessage() throws GeneralSecurityException {
        randSelf = LinkCipher.bytes(random, 16);
        byte[] seed = LinkCipher.bytes(random, 32);
        psk = LinkCipher.hmacSha256(authToken, seed);
        String payload = "\"isoSalt\":" + MiniJson.quote(hex(randSelf))
                + ",\"peerAuthId\":" + MiniJson.quote(hex(idSelf))
                + ",\"operationCode\":" + OP_AUTH
                + ",\"seed\":" + MiniJson.quote(hex(seed))
                + ",\"peerUserType\":0"
                + ",\"pkgName\":\"com.huawei.devicegroupmanage\""
                + ",\"serviceType\":" + MiniJson.quote(groupId())
                + ",\"keyLength\":32";
        return envelope(MSG_START, payload, true);
    }

    /** Vérifie le jeton de la montre puis rend le message « jeton du téléphone » (0x0012). */
    public byte[] tokenMessage(Reply start) throws GeneralSecurityException, AuthException {
        if (start.last) throw new AuthException("format", "La montre a clos l'échange HiChain dès le début");
        randPeer = hexField(start.payload, "isoSalt", 16);
        idPeer = hexField(start.payload, "peerAuthId", -1);
        byte[] theirs = hexField(start.payload, "token", 32);
        byte[] expected = LinkCipher.hmacSha256(psk, randPeer, randSelf, idSelf, idPeer);
        if (!MessageDigest.isEqual(expected, theirs)) {
            throw new AuthException("key_rejected", "Clé refusée par la montre (jeton différent)");
        }
        byte[] token = LinkCipher.hmacSha256(psk, randSelf, randPeer, idPeer, idSelf);
        return envelope(MSG_TOKEN, "\"peerAuthId\":" + MiniJson.quote(hex(idSelf)) + ",\"token\":" + MiniJson.quote(hex(token)), true);
    }

    /** Vérifie le code de retour de la montre, dérive la clé de session, rend la confirmation (0x0013). */
    public byte[] confirmMessage(Reply tokenReply) throws GeneralSecurityException, AuthException {
        if (tokenReply.last) throw new AuthException("format", "Code de retour de la montre absent");
        byte[] mac = hexField(tokenReply.payload, "returnCodeMac", 32);
        if (!MessageDigest.isEqual(LinkCipher.hmacSha256(psk, new byte[4]), mac)) {
            throw new AuthException("key_rejected", "Code de retour de la montre invalide");
        }
        sessionKey = LinkCipher.hkdfSha256(psk, concat(randSelf, randPeer), utf8("hichain_iso_session_key"), 32);
        byte[] nonce = LinkCipher.bytes(random, 12);
        byte[] encResult = LinkCipher.aesGcmEncrypt(sessionKey, nonce, new byte[4], utf8("hichain_iso_result"));
        String payload = "\"nonce\":" + MiniJson.quote(hex(nonce)) + ",\"encResult\":" + MiniJson.quote(hex(encResult)) + ",\"operationCode\":" + OP_AUTH;
        return envelope(MSG_CONFIRM, payload, false);
    }

    /** Clé des trames de cette connexion (§6.3, point 9). */
    public byte[] frameKey() throws GeneralSecurityException {
        if (sessionKey == null) throw new IllegalStateException("Authentification pas terminée");
        return LinkCipher.hkdfSha256(sessionKey, concat(randSelf, randPeer), utf8("hichain_return_key"), 32);
    }

    private static byte[] envelope(int message, String payload, boolean authOnly) {
        String json = "{\"authForm\":0,\"groupAndModuleVersion\":\"2.0.1\",\"message\":" + message
                + ",\"payload\":{" + payload + ",\"version\":{\"minVersion\":\"1.0.0\",\"currentVersion\":\"2.0.16\"}}"
                + (authOnly ? ",\"isDeviceLevel\":false" : "") + "}";
        return utf8(json);
    }

    // --- trames 1/0x28 ---

    /** Étiquettes d'un message du téléphone : 1 = JSON, 2 = opération, 3 = identifiant de requête (8 o). */
    public static List<LinkCodec.Tlv> requestTlvs(byte[] json, long requestId) {
        byte[] id = new byte[8];
        for (int k = 7; k >= 0; k--) {
            id[k] = (byte) requestId;
            requestId >>>= 8;
        }
        List<LinkCodec.Tlv> out = new ArrayList<>();
        out.add(new LinkCodec.Tlv(1, json));
        out.add(LinkCodec.Tlv.ofByte(2, OP_AUTH));
        out.add(new LinkCodec.Tlv(3, id));
        return out;
    }

    /** Lit une réponse 1/0x28 ; lève `watch_error` si la montre refuse l'étape, `format` si illisible. */
    @SuppressWarnings("unchecked")
    public static Reply parseReply(List<LinkCodec.Tlv> tlvs) throws AuthException {
        long rc = LinkCodec.resultCode(tlvs);
        long type = LinkCodec.uint(LinkCodec.find(tlvs, 4));
        if (type > 0) return new Reply(true, null);
        byte[] body = LinkCodec.find(tlvs, 1);
        if (body == null || body.length == 0) {
            if (rc >= 0 && rc != LinkCodec.RESULT_SUCCESS) throw new AuthException("watch_error", "La montre a répondu par une erreur (code " + rc + ")");
            throw new AuthException("format", "Réponse HiChain sans charge utile");
        }
        Map<String, Object> json = MiniJson.parseObject(new String(body, StandardCharsets.UTF_8));
        if (json == null) throw new AuthException("format", "Réponse HiChain illisible (pas du JSON)");
        Object p = json.get("payload");
        Map<String, Object> payload = p instanceof Map ? (Map<String, Object>) p : json;
        Object err = payload.containsKey("errorCode") ? payload.get("errorCode") : json.get("errorCode");
        if (err instanceof Number && ((Number) err).longValue() != 0) {
            throw new AuthException("watch_error", "La montre a refusé l'étape HiChain (erreur " + ((Number) err).longValue() + ")");
        }
        return new Reply(false, payload);
    }

    // --- utilitaires ---

    /** Identifiant du groupe : SHA-256 de « nom|app » en hexadécimal majuscule (§6.2). */
    public static String groupId() throws GeneralSecurityException {
        return hex(MessageDigest.getInstance("SHA-256").digest(utf8(GROUP_NAME + "|" + APP_ID)));
    }

    private static byte[] hexField(Map<String, Object> payload, String field, int length) throws AuthException {
        Object v = payload == null ? null : payload.get(field);
        if (!(v instanceof String)) throw new AuthException("format", "Champ « " + field + " » absent de la réponse de la montre");
        byte[] b;
        try {
            b = unhex((String) v);
        } catch (IllegalArgumentException e) {
            throw new AuthException("format", "Champ « " + field + " » : hexadécimal invalide");
        }
        if (length >= 0 && b.length != length) throw new AuthException("format", "Champ « " + field + " » : " + b.length + " octets au lieu de " + length);
        return b;
    }

    static byte[] utf8(String s) {
        return s.getBytes(StandardCharsets.UTF_8);
    }

    static byte[] concat(byte[]... parts) {
        int n = 0;
        for (byte[] p : parts) n += p.length;
        byte[] out = new byte[n];
        int i = 0;
        for (byte[] p : parts) {
            System.arraycopy(p, 0, out, i, p.length);
            i += p.length;
        }
        return out;
    }

    /** Hexadécimal majuscule. */
    public static String hex(byte[] b) {
        StringBuilder s = new StringBuilder(b.length * 2);
        for (byte x : b) s.append(String.format(Locale.ROOT, "%02X", x & 0xFF));
        return s.toString();
    }

    public static byte[] unhex(String h) {
        String c = h.replaceAll("\\s+", "");
        if (c.length() % 2 != 0) throw new IllegalArgumentException("Hexadécimal invalide");
        byte[] out = new byte[c.length() / 2];
        for (int k = 0; k < out.length; k++) {
            int hi = Character.digit(c.charAt(2 * k), 16);
            int lo = Character.digit(c.charAt(2 * k + 1), 16);
            if (hi < 0 || lo < 0) throw new IllegalArgumentException("Hexadécimal invalide");
            out[k] = (byte) ((hi << 4) | lo);
        }
        return out;
    }
}
