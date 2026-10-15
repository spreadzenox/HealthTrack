package com.healthtrack.app.huawei;

import java.io.Closeable;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

/**
 * Session bloquante avec une montre Huawei pour le client Java « synchro seule » : même rôle que
 * createSession (src/devices/huawei/session.js). Un fil lit le transport et rassemble les messages ;
 * `request` envoie (chiffré une fois la clé posée) puis attend la réponse au même service / à la même
 * commande, les autres messages de la montre étant mis de côté (`unsolicited`). Aucun appel Android :
 * le transport réel est un socket RFCOMM, celui des tests rejoue une transcription du pilote JS.
 */
public final class WatchLink implements Closeable {

    /** Flux d'octets vers la montre. `read` bloque, rend -1 à la fermeture. */
    public interface Transport {
        void write(byte[] bytes) throws IOException;

        int read(byte[] buffer) throws IOException;

        void close() throws IOException;
    }

    private static final LinkCodec.Message CLOSED = new LinkCodec.Message(-1, -1, new byte[0]);

    private final Transport transport;
    private final BlockingQueue<LinkCodec.Message> inbox = new LinkedBlockingQueue<>();
    private final List<LinkCodec.Message> unsolicited = new ArrayList<>();
    private final Thread reader;
    private volatile String readError;
    private LinkCipher cipher;
    private int maxFrameSize = 244;
    private boolean closed;

    public WatchLink(Transport transport) {
        this.transport = transport;
        reader = new Thread(this::readLoop, "huawei-link-reader");
        reader.setDaemon(true);
        reader.start();
    }

    private void readLoop() {
        LinkCodec.Reassembler reassembler = new LinkCodec.Reassembler();
        byte[] buffer = new byte[1024];
        try {
            for (int n; (n = transport.read(buffer)) >= 0; ) {
                try {
                    inbox.addAll(reassembler.push(buffer, n));
                } catch (IllegalArgumentException e) {
                    // trame illisible : on la saute, comme le JS (journalisée par l'appelant au besoin)
                    reassembler = new LinkCodec.Reassembler();
                }
            }
        } catch (IOException e) {
            readError = e.getMessage();
        } finally {
            inbox.add(CLOSED);
        }
    }

    public void setCipher(LinkCipher cipher) {
        this.cipher = cipher;
    }

    public boolean encrypted() {
        return cipher != null;
    }

    public void setMaxFrameSize(int n) {
        if (n > 16) maxFrameSize = n;
    }

    /** Messages reçus sans avoir été demandés (déjà déchiffrés si possible). */
    public List<LinkCodec.Message> unsolicited() {
        return unsolicited;
    }

    public void send(int serviceId, int commandId, List<LinkCodec.Tlv> tlvs, boolean plain) throws IOException, GeneralSecurityException {
        if (closed) throw new IOException("Connexion fermée");
        List<LinkCodec.Tlv> body = cipher != null && !plain ? cipher.seal(tlvs) : tlvs;
        for (byte[] frame : LinkCodec.encodeFrames(serviceId, commandId, body, maxFrameSize)) transport.write(frame);
    }

    /** Envoie puis attend la réponse au même service / à la même commande. */
    public LinkCodec.Message request(int serviceId, int commandId, List<LinkCodec.Tlv> tlvs, boolean plain, long timeoutMs)
            throws IOException, GeneralSecurityException {
        send(serviceId, commandId, tlvs, plain);
        return await(serviceId, commandId, timeoutMs);
    }

    /** Attend un message de la montre pour ce service / cette commande. */
    public LinkCodec.Message await(int serviceId, int commandId, long timeoutMs) throws IOException, GeneralSecurityException {
        long deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(timeoutMs);
        for (;;) {
            long left = deadline - System.nanoTime();
            LinkCodec.Message m;
            try {
                m = left > 0 ? inbox.poll(left, TimeUnit.NANOSECONDS) : null;
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IOException("Synchro interrompue");
            }
            if (m == null) throw new IOException("Pas de réponse de la montre (" + serviceId + "/" + commandId + ") en " + Math.round(timeoutMs / 1000.0) + " s");
            if (m == CLOSED) {
                inbox.add(CLOSED);
                throw new IOException("Connexion coupée par la montre" + (readError != null ? " (" + readError + ")" : ""));
            }
            LinkCodec.Message open = decrypt(m);
            if (open.serviceId == serviceId && open.commandId == commandId) return open;
            unsolicited.add(open);
        }
    }

    private LinkCodec.Message decrypt(LinkCodec.Message m) throws GeneralSecurityException {
        if (!LinkCipher.isSealed(m.tlvs) || cipher == null) return m;
        return new LinkCodec.Message(m.serviceId, m.commandId, cipher.open(m.tlvs));
    }

    @Override
    public void close() {
        closed = true;
        try {
            transport.close();
        } catch (IOException ignored) {
            // déjà fermé
        }
        reader.interrupt();
    }
}
