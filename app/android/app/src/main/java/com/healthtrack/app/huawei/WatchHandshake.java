package com.healthtrack.app.huawei;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

/**
 * Reconnexion authentifiée à une montre déjà appairée par l'app (journal/protocoles/huawei.md §4–§6),
 * dans l'ordre de connectAndAuthenticate (src/devices/huawei/pairing.js) pour une clé connue :
 * paramètres du lien (1/1), état (1/0x16), négociation (1/0x33), authentification ISO (1/0x28),
 * puis chiffrement des trames. Jamais de PIN ni de liaison : une clé refusée remonte `key_rejected`
 * et le client s'arrête (le réappairage se fait toujours depuis l'app, par l'utilisateur).
 */
public final class WatchHandshake {

    public static final int DEVICE_CONFIG = 1;
    private static final int LINK_PARAMS = 1;
    private static final int DEVICE_STATUS = 0x16;
    private static final int SECURITY_NEGOTIATION = 0x33;
    private static final long HICHAIN_TYPE = 100000;

    /** Ce que la montre a annoncé (§4). */
    public static final class LinkParams {
        public int maxFrameSize = -1;
        public int authVersion = -1;
        public int deviceSupportType = -1;
        public int encryptMethod = -1;

        public boolean gcm() {
            return encryptMethod == 1 || deviceSupportType == 4;
        }

        public boolean randomIv() {
            return deviceSupportType == 4;
        }
    }

    private WatchHandshake() {}

    static LinkParams parseLinkParams(List<LinkCodec.Tlv> tlvs) {
        LinkParams lp = new LinkParams();
        lp.maxFrameSize = (int) LinkCodec.uint(LinkCodec.find(tlvs, 2));
        byte[] nonce = LinkCodec.find(tlvs, 5);
        if (nonce != null && nonce.length >= 2) lp.authVersion = (int) LinkCodec.uint(Arrays.copyOf(nonce, 2));
        lp.deviceSupportType = (int) LinkCodec.uint(LinkCodec.find(tlvs, 7));
        lp.encryptMethod = (int) LinkCodec.uint(LinkCodec.find(tlvs, 0x0C));
        return lp;
    }

    /** Étiquettes de la négociation (§6.1) : mode 4 pour HiChain 3, sinon 2. */
    static List<LinkCodec.Tlv> negotiationTlvs(LinkParams lp, String authId) {
        int mode = lp.deviceSupportType == 4 ? 4 : 2;
        List<LinkCodec.Tlv> tlvs = new ArrayList<>();
        tlvs.add(LinkCodec.Tlv.ofByte(1, mode));
        tlvs.add(LinkCodec.Tlv.ofByte(2, 1));
        tlvs.add(new LinkCodec.Tlv(5, authId.getBytes(StandardCharsets.UTF_8)));
        tlvs.add(LinkCodec.Tlv.ofByte(3, 1));
        tlvs.add(LinkCodec.Tlv.ofByte(4, 0));
        if (mode == 4) {
            tlvs.add(LinkCodec.Tlv.empty(6));
            tlvs.add(new LinkCodec.Tlv(7, "Android".getBytes(StandardCharsets.UTF_8)));
        }
        if (lp.encryptMethod == 1) tlvs.add(LinkCodec.Tlv.ofByte(0x0D, 1));
        return tlvs;
    }

    /** Vrai si la réponse 1/0x33 désigne HiChain (seule méthode prise en charge ici). */
    static boolean isHichain(List<LinkCodec.Tlv> tlvs) {
        long first = LinkCodec.uint(LinkCodec.find(tlvs, 1));
        long authType = first == 1 ? HICHAIN_TYPE : -1;
        long second = LinkCodec.uint(LinkCodec.find(tlvs, 2));
        if (second >= 0) authType = second ^ (first == 4 ? 4 : 0);
        long error = LinkCodec.resultCode(tlvs);
        if (error >= 0 && error != HICHAIN_TYPE) authType = error;
        return authType == HICHAIN_TYPE || (authType >= 0 && ((authType ^ 1) == 4 || (authType ^ 2) == 4));
    }

    private static List<LinkCodec.Tlv> emptyTags(int... tags) {
        List<LinkCodec.Tlv> out = new ArrayList<>();
        for (int t : tags) out.add(LinkCodec.Tlv.empty(t));
        return out;
    }

    /**
     * Authentifie la session et pose le chiffrement des trames. `requestId` : identifiant de requête
     * HiChain (l'heure en ms, comme le JS). Lève IsoAuth.AuthException (`key_rejected`, `watch_error`,
     * `unsupported`, `format`) ou IOException (montre muette, connexion coupée).
     */
    public static LinkParams authenticate(WatchLink link, byte[] authToken, String authId, long requestId, Random random, long timeoutMs)
            throws IOException, GeneralSecurityException, IsoAuth.AuthException {
        LinkParams lp = parseLinkParams(link.request(DEVICE_CONFIG, LINK_PARAMS, emptyTags(1, 2, 3, 4), true, timeoutMs).tlvs);
        if (lp.maxFrameSize > 0) link.setMaxFrameSize(lp.maxFrameSize);
        if (lp.deviceSupportType <= 0 || lp.deviceSupportType > 4) {
            throw new IsoAuth.AuthException("unsupported", "Méthode d'authentification de la montre non prise en charge");
        }
        link.request(DEVICE_CONFIG, DEVICE_STATUS, emptyTags(1), true, timeoutMs);
        if (!isHichain(link.request(DEVICE_CONFIG, SECURITY_NEGOTIATION, negotiationTlvs(lp, authId), true, timeoutMs).tlvs)) {
            throw new IsoAuth.AuthException("unsupported", "La montre ne propose pas HiChain");
        }
        IsoAuth auth = new IsoAuth(authToken, authId, random);
        byte[] token = auth.tokenMessage(exchange(link, auth.startMessage(), requestId, timeoutMs));
        byte[] confirm = auth.confirmMessage(exchange(link, token, requestId, timeoutMs));
        exchange(link, confirm, requestId, timeoutMs);
        link.setCipher(new LinkCipher(auth.frameKey(), lp.gcm(), lp.randomIv(), 0, random));
        return lp;
    }

    private static IsoAuth.Reply exchange(WatchLink link, byte[] json, long requestId, long timeoutMs)
            throws IOException, GeneralSecurityException, IsoAuth.AuthException {
        return IsoAuth.parseReply(link.request(DEVICE_CONFIG, IsoAuth.COMMAND, IsoAuth.requestTlvs(json, requestId), true, timeoutMs).tlvs);
    }

    /** Niveau de batterie (1/8, chiffré) : premier échange qui prouve la clé des trames ; -1 si absent. */
    public static int battery(WatchLink link, long timeoutMs) throws IOException, GeneralSecurityException {
        byte[] level = link.request(DEVICE_CONFIG, 8, emptyTags(1), false, timeoutMs).get(1);
        return level != null && level.length == 1 ? level[0] & 0xFF : -1;
    }
}
