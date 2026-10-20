package com.healthtrack.app.update;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

import org.junit.Test;

/** Vérification de l'APK téléchargé avant l'installateur, et états du DownloadManager. */
public class UpdateFileTest {

    private static final String ABC_SHA = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

    @Test
    public void etatsDuDownloadManager() {
        assertEquals("pending", UpdateFile.stateName(1));
        assertEquals("running", UpdateFile.stateName(2));
        assertEquals("paused", UpdateFile.stateName(4));
        assertEquals("successful", UpdateFile.stateName(8));
        assertEquals("failed", UpdateFile.stateName(16));
        assertEquals("unknown", UpdateFile.stateName(3));
    }

    @Test
    public void empreinteGithub() {
        assertEquals(ABC_SHA, UpdateFile.expectedSha256("sha256:" + ABC_SHA.toUpperCase()));
        assertNull(UpdateFile.expectedSha256(null));
        assertNull(UpdateFile.expectedSha256("sha512:" + ABC_SHA));
        assertNull(UpdateFile.expectedSha256("sha256:pasdelhexa"));
    }

    @Test
    public void sha256DuFichier() throws Exception {
        assertEquals(ABC_SHA, UpdateFile.sha256Hex(new ByteArrayInputStream("abc".getBytes(StandardCharsets.US_ASCII))));
    }

    @Test
    public void verification() {
        assertNull(UpdateFile.verify(100, 100, ABC_SHA, ABC_SHA));
        assertNull(UpdateFile.verify(100, 0, null, null));
        assertEquals(UpdateFile.EMPTY, UpdateFile.verify(0, 100, null, null));
        assertEquals(UpdateFile.SIZE_MISMATCH, UpdateFile.verify(99, 100, ABC_SHA, ABC_SHA));
        assertEquals(UpdateFile.SHA_MISMATCH, UpdateFile.verify(100, 100, "00" + ABC_SHA.substring(2), ABC_SHA));
    }
}
