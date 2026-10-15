package com.healthtrack.app.huawei;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.fail;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;

import org.junit.BeforeClass;
import org.junit.Test;

/** Coffre de la clé de la montre (huawei.md §9.1 c) : scellé / ouvert, lié à l'adresse, jamais la clé en clair. */
public class WatchVaultTest {

    private static final String ADDR = "a4:c1:38:0d:12:ef";
    private static final String TOKEN = "00112233445566778899AABBCCDDEEFF00112233445566778899AABBCCDDEEFF";
    private static SecretKey key;
    private static SecretKey otherKey;

    @BeforeClass
    public static void keys() throws Exception {
        KeyGenerator g = KeyGenerator.getInstance("AES");
        g.init(256);
        key = g.generateKey();
        otherKey = g.generateKey();
    }

    private static WatchVault.Credentials creds() throws Exception {
        return WatchVault.fromHex(ADDR, "a1b2c3d4e5f60718", TOKEN, "HUAWEI WATCH GT 6 Pro-12EF", 1760500000000L);
    }

    @Test
    public void sealThenOpenGivesTheSameKey() throws Exception {
        byte[] blob = WatchVault.seal(creds(), key);
        WatchVault.Credentials c = WatchVault.open(blob, "A4:C1:38:0D:12:EF", key);
        assertEquals("A4:C1:38:0D:12:EF", c.address);
        assertEquals("a1b2c3d4e5f60718", c.authId);
        assertArrayEquals(IsoAuth.unhex(TOKEN), c.authToken);
        assertEquals("HUAWEI WATCH GT 6 Pro-12EF", c.name);
        assertEquals(1760500000000L, c.savedAt);
    }

    @Test
    public void blobNeverContainsTheKeyInClear() throws Exception {
        byte[] blob = WatchVault.seal(creds(), key);
        String text = new String(blob, StandardCharsets.ISO_8859_1);
        assertFalse(text.contains(TOKEN));
        assertFalse(text.contains("a1b2c3d4e5f60718"));
        assertFalse(text.contains(new String(IsoAuth.unhex(TOKEN), StandardCharsets.ISO_8859_1)));
        assertEquals(WatchVault.VERSION, blob[0]);
    }

    @Test
    public void eachSealUsesAFreshIv() throws Exception {
        byte[] a = WatchVault.seal(creds(), key);
        byte[] b = WatchVault.seal(creds(), key);
        assertFalse(java.util.Arrays.equals(a, b));
    }

    @Test
    public void openRefusesAnotherWatchAKeyOrTampering() throws Exception {
        byte[] blob = WatchVault.seal(creds(), key);
        expectGcmFailure(blob, "A4:C1:38:0D:12:EE", key);
        expectGcmFailure(blob, ADDR, otherKey);
        byte[] tampered = blob.clone();
        tampered[tampered.length - 1] ^= 1;
        expectGcmFailure(tampered, ADDR, key);
    }

    private static void expectGcmFailure(byte[] blob, String address, SecretKey k) throws Exception {
        try {
            WatchVault.open(blob, address, k);
            fail("aurait dû refuser");
        } catch (GeneralSecurityException expected) {
            // étiquette GCM invalide
        }
    }

    @Test
    public void openRefusesMalformedBlobs() throws Exception {
        expectVault(null);
        expectVault(new byte[10]);
        byte[] blob = WatchVault.seal(creds(), key);
        byte[] wrongVersion = blob.clone();
        wrongVersion[0] = 9;
        expectVault(wrongVersion);
    }

    private static void expectVault(byte[] blob) throws Exception {
        try {
            WatchVault.open(blob, ADDR, key);
            fail("aurait dû refuser");
        } catch (WatchVault.VaultException expected) {
            // format
        }
    }

    @Test
    public void validationRejectsBadInput() {
        String[][] bad = {
            {"pas-une-adresse", "id", TOKEN},
            {ADDR, "", TOKEN},
            {ADDR, "id avec espace", TOKEN},
            {ADDR, "id", "0011"},
            {ADDR, "id", "zz" + TOKEN.substring(2)},
            {ADDR, "id", TOKEN + "0"},
            {ADDR, "id", null},
        };
        for (String[] b : bad) {
            try {
                WatchVault.fromHex(b[0], b[1], b[2], null, 0);
                fail("accepté à tort : " + b[0] + " / " + b[1]);
            } catch (WatchVault.VaultException expected) {
                // le message ne contient jamais la clé
                assertFalse(expected.getMessage().contains(TOKEN));
            }
        }
    }

    @Test
    public void nameIsOptionalAndEscaped() throws Exception {
        WatchVault.Credentials c = WatchVault.fromHex(ADDR, "id", TOKEN, null, 5);
        assertNull(WatchVault.open(WatchVault.seal(c, key), ADDR, key).name);
        WatchVault.Credentials q = WatchVault.fromHex(ADDR, "id", TOKEN, "Montre \"bleue\" \\ ok", 5);
        assertEquals("Montre \"bleue\" \\ ok", WatchVault.open(WatchVault.seal(q, key), ADDR, key).name);
    }

    @Test
    public void addressIsNormalized() {
        assertEquals("A4:C1:38:0D:12:EF", WatchVault.normalizeAddress(ADDR));
        assertNull(WatchVault.normalizeAddress("A4C1380D12EF"));
        assertNull(WatchVault.normalizeAddress(null));
    }
}
