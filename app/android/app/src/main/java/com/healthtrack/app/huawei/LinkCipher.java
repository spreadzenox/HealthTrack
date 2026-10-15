package com.healthtrack.app.huawei;

import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Chiffrement des trames après l'authentification (journal/protocoles/huawei.md §3 et §6.5), et
 * primitives du client Java : HMAC-SHA256, HKDF-SHA256 (RFC 5869), AES-GCM (étiquette 16 o en fin),
 * AES-CBC PKCS#7. Même comportement que createCipher (src/devices/huawei/hichain.js).
 *
 * Corps chiffré : 0x7C = [1], 0x7D = IV, 0x7E = texte chiffré. IV : 16 octets aléatoires (type 4),
 * sinon 12 aléatoires + compteur gros-boutiste sur 4 octets (1 → 0xFFFFFFFF, puis 1).
 */
public final class LinkCipher {

    public static final int TAG_ENCRYPTED = 0x7C;
    public static final int TAG_IV = 0x7D;
    public static final int TAG_DATA = 0x7E;

    private final byte[] key;
    private final boolean gcm;
    private final boolean randomIv;
    private final Random random;
    private long counter;

    public LinkCipher(byte[] key, boolean gcm, boolean randomIv, long counter, Random random) {
        this.key = key.clone();
        this.gcm = gcm;
        this.randomIv = randomIv;
        this.counter = counter;
        this.random = random != null ? random : new SecureRandom();
    }

    public LinkCipher(byte[] key, boolean gcm, boolean randomIv) {
        this(key, gcm, randomIv, 0, null);
    }

    private byte[] nextIv() {
        if (randomIv) return bytes(random, 16);
        counter = counter >= 0xFFFFFFFFL ? 1 : counter + 1;
        byte[] iv = new byte[16];
        System.arraycopy(bytes(random, 12), 0, iv, 0, 12);
        iv[12] = (byte) (counter >>> 24);
        iv[13] = (byte) (counter >>> 16);
        iv[14] = (byte) (counter >>> 8);
        iv[15] = (byte) counter;
        return iv;
    }

    /** Corps (TLV encodés ou bloc brut) → les trois étiquettes chiffrées. */
    public List<LinkCodec.Tlv> seal(byte[] plain) throws GeneralSecurityException {
        byte[] iv = nextIv();
        byte[] sealed = gcm ? aesGcmEncrypt(key, iv, plain, null) : aesCbc(Cipher.ENCRYPT_MODE, key, iv, plain);
        List<LinkCodec.Tlv> out = new ArrayList<>();
        out.add(LinkCodec.Tlv.ofByte(TAG_ENCRYPTED, 1));
        out.add(new LinkCodec.Tlv(TAG_IV, iv));
        out.add(new LinkCodec.Tlv(TAG_DATA, sealed));
        return out;
    }

    public List<LinkCodec.Tlv> seal(List<LinkCodec.Tlv> tlvs) throws GeneralSecurityException {
        return seal(LinkCodec.encodeTlvs(tlvs));
    }

    /** Vrai si le corps reçu est chiffré (0x7C = 1). */
    public static boolean isSealed(List<LinkCodec.Tlv> tlvs) {
        byte[] flag = LinkCodec.find(tlvs, TAG_ENCRYPTED);
        return flag != null && flag.length > 0 && flag[0] == 1;
    }

    /** Corps déchiffré tel quel (TLV, ou bloc de fichier brut). */
    public byte[] open(List<LinkCodec.Tlv> tlvs) throws GeneralSecurityException {
        byte[] iv = LinkCodec.find(tlvs, TAG_IV);
        byte[] data = LinkCodec.find(tlvs, TAG_DATA);
        if (iv == null || data == null) throw new GeneralSecurityException("Trame chiffrée incomplète");
        return gcm ? aesGcmDecrypt(key, iv, data, null) : aesCbc(Cipher.DECRYPT_MODE, key, iv, data);
    }

    // --- primitives ---

    public static byte[] bytes(Random random, int n) {
        byte[] b = new byte[n];
        random.nextBytes(b);
        return b;
    }

    public static byte[] hmacSha256(byte[] key, byte[]... parts) throws GeneralSecurityException {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        for (byte[] p : parts) mac.update(p);
        return mac.doFinal();
    }

    /** HKDF-SHA256 (RFC 5869) ; un sel vide vaut 32 zéros. */
    public static byte[] hkdfSha256(byte[] ikm, byte[] salt, byte[] info, int length) throws GeneralSecurityException {
        byte[] prk = hmacSha256(salt == null || salt.length == 0 ? new byte[32] : salt, ikm);
        byte[] out = new byte[length];
        byte[] t = new byte[0];
        int pos = 0;
        for (int i = 1; pos < length; i++) {
            t = hmacSha256(prk, t, info, new byte[] {(byte) i});
            int n = Math.min(t.length, length - pos);
            System.arraycopy(t, 0, out, pos, n);
            pos += n;
        }
        return out;
    }

    public static byte[] aesGcmEncrypt(byte[] key, byte[] iv, byte[] plain, byte[] aad) throws GeneralSecurityException {
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, iv));
        if (aad != null) c.updateAAD(aad);
        return c.doFinal(plain);
    }

    public static byte[] aesGcmDecrypt(byte[] key, byte[] iv, byte[] sealed, byte[] aad) throws GeneralSecurityException {
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, iv));
        if (aad != null) c.updateAAD(aad);
        return c.doFinal(sealed);
    }

    private static byte[] aesCbc(int mode, byte[] key, byte[] iv, byte[] data) throws GeneralSecurityException {
        Cipher c = Cipher.getInstance("AES/CBC/PKCS5Padding");
        c.init(mode, new SecretKeySpec(key, "AES"), new IvParameterSpec(iv));
        return c.doFinal(data);
    }
}
