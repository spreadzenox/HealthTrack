package com.healthtrack.app.huawei;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Trames du protocole Huawei « Link v2 » côté Java (client « synchro seule », D3 d quater ③), écrit
 * d'après journal/protocoles/huawei.md §2–§3 — même comportement que src/devices/huawei/protocol.js,
 * vérifié par les vecteurs communs (src/test/resources/huawei/link-vectors.json). Aucune dépendance
 * Android : testable sur la JVM.
 *
 * Trame : 0x5A | longueur (2 o, gros-boutiste) | drapeau de tranche [| index] | charge utile | CRC-16/XMODEM.
 * TLV : étiquette (1 o) | longueur en entier variable (7 bits par octet, poids forts d'abord) | valeur.
 */
public final class LinkCodec {

    public static final int MAGIC = 0x5A;
    public static final int TAG_RESULT = 0x7F;
    public static final long RESULT_SUCCESS = 100000;

    private LinkCodec() {}

    /** Une étiquette et sa valeur. */
    public static final class Tlv {
        public final int tag;
        public final byte[] value;

        public Tlv(int tag, byte[] value) {
            this.tag = tag & 0xFF;
            this.value = value == null ? new byte[0] : value;
        }

        public static Tlv empty(int tag) {
            return new Tlv(tag, new byte[0]);
        }

        public static Tlv ofByte(int tag, int b) {
            return new Tlv(tag, new byte[] {(byte) b});
        }
    }

    /** Message rassemblé : service, commande, corps brut (après service et commande) et ses TLV (vides si ce n'en est pas). */
    public static final class Message {
        public final int serviceId;
        public final int commandId;
        public final byte[] raw;
        public final List<Tlv> tlvs;

        public Message(int serviceId, int commandId, byte[] raw) {
            this.serviceId = serviceId;
            this.commandId = commandId;
            this.raw = raw;
            this.tlvs = tryDecodeTlvs(raw);
        }

        public byte[] get(int tag) {
            return find(tlvs, tag);
        }
    }

    public static int crc16(byte[] data, int from, int to) {
        int crc = 0;
        for (int i = from; i < to; i++) {
            crc ^= (data[i] & 0xFF) << 8;
            for (int b = 0; b < 8; b++) crc = (crc & 0x8000) != 0 ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
        }
        return crc;
    }

    public static byte[] encodeVarInt(int value) {
        if (value < 0) throw new IllegalArgumentException("Entier variable négatif");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        int shift = 28;
        while (shift > 0 && (value >>> shift) == 0) shift -= 7;
        for (; shift > 0; shift -= 7) out.write(((value >>> shift) & 0x7F) | 0x80);
        out.write(value & 0x7F);
        return out.toByteArray();
    }

    /** { valeur, taille } de l'entier variable lu à `offset`. */
    public static int[] decodeVarInt(byte[] data, int offset) {
        long value = 0;
        for (int i = offset; i < data.length && i - offset < 5; i++) {
            value = value * 128 + (data[i] & 0x7F);
            if ((data[i] & 0x80) == 0) {
                if (value > Integer.MAX_VALUE) break;
                return new int[] {(int) value, i - offset + 1};
            }
        }
        throw new IllegalArgumentException("Entier variable tronqué");
    }

    public static byte[] encodeTlvs(List<Tlv> tlvs) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (Tlv t : tlvs) {
            byte[] len = encodeVarInt(t.value.length);
            out.write(t.tag);
            out.write(len, 0, len.length);
            out.write(t.value, 0, t.value.length);
        }
        return out.toByteArray();
    }

    public static List<Tlv> decodeTlvs(byte[] data) {
        List<Tlv> out = new ArrayList<>();
        int i = 0;
        while (i < data.length) {
            int tag = data[i] & 0xFF;
            int[] len = decodeVarInt(data, i + 1);
            int start = i + 1 + len[1];
            if (start + len[0] > data.length) throw new IllegalArgumentException("TLV " + tag + " tronqué");
            out.add(new Tlv(tag, Arrays.copyOfRange(data, start, start + len[0])));
            i = start + len[0];
        }
        return out;
    }

    /** Comme decodeTlvs, mais liste vide si le corps n'est pas une suite de TLV (bloc de fichier brut). */
    public static List<Tlv> tryDecodeTlvs(byte[] data) {
        try {
            return decodeTlvs(data);
        } catch (IllegalArgumentException e) {
            return new ArrayList<>();
        }
    }

    public static byte[] find(List<Tlv> tlvs, int tag) {
        for (Tlv t : tlvs) if (t.tag == (tag & 0xFF)) return t.value;
        return null;
    }

    /** Entier non signé gros-boutiste (8 octets au plus), ou -1 si absent / vide. */
    public static long uint(byte[] bytes) {
        if (bytes == null || bytes.length == 0) return -1;
        long n = 0;
        for (int i = 0; i < Math.min(8, bytes.length); i++) n = n * 256 + (bytes[i] & 0xFF);
        return n;
    }

    /** Code de résultat (étiquette 0x7F) ou -1. */
    public static long resultCode(List<Tlv> tlvs) {
        return uint(find(tlvs, TAG_RESULT));
    }

    private static byte[] frame(int slice, int index, byte[] payload, int from, int to) {
        boolean sliced = slice != 0;
        int len = (to - from) + (sliced ? 2 : 1);
        byte[] out = new byte[len + 5];
        out[0] = (byte) MAGIC;
        out[1] = (byte) (len >> 8);
        out[2] = (byte) len;
        out[3] = (byte) slice;
        int p = 4;
        if (sliced) out[p++] = (byte) index;
        System.arraycopy(payload, from, out, p, to - from);
        int crc = crc16(out, 0, out.length - 2);
        out[out.length - 2] = (byte) (crc >> 8);
        out[out.length - 1] = (byte) crc;
        return out;
    }

    /**
     * Message découpé en trames d'au plus `maxFrameSize` octets (§2) : entier s'il tient, sinon tranches
     * 1 (début), 2 (milieu), 3 (fin) avec un octet d'index, la 1re seule portant service et commande.
     */
    public static List<byte[]> encodeFrames(int serviceId, int commandId, byte[] body, int maxFrameSize) {
        byte[] payload = new byte[body.length + 2];
        payload[0] = (byte) serviceId;
        payload[1] = (byte) commandId;
        System.arraycopy(body, 0, payload, 2, body.length);
        if (payload.length + 1 > 0xFFFF) throw new IllegalArgumentException("Charge utile trop longue");
        List<byte[]> frames = new ArrayList<>();
        if (payload.length + 6 <= maxFrameSize) {
            frames.add(frame(0, 0, payload, 0, payload.length));
            return frames;
        }
        int chunk = maxFrameSize - 7;
        if (chunk < 1) throw new IllegalArgumentException("Taille de tranche trop petite");
        for (int i = 0, index = 0; i < payload.length; i += chunk, index++) {
            int end = Math.min(payload.length, i + chunk);
            int flag = i == 0 ? 1 : i + chunk >= payload.length ? 3 : 2;
            frames.add(frame(flag, index & 0xFF, payload, i, end));
        }
        return frames;
    }

    public static List<byte[]> encodeFrames(int serviceId, int commandId, List<Tlv> tlvs, int maxFrameSize) {
        return encodeFrames(serviceId, commandId, encodeTlvs(tlvs), maxFrameSize);
    }

    /**
     * Rassemble les octets reçus (une trame peut arriver en morceaux, un message en tranches) et rend
     * les messages complets. Une trame au CRC invalide lève une exception ; l'appelant la consigne.
     */
    public static final class Reassembler {
        private byte[] buffer = new byte[0];
        private final ByteArrayOutputStream slices = new ByteArrayOutputStream();

        public List<Message> push(byte[] chunk, int length) {
            byte[] merged = Arrays.copyOf(buffer, buffer.length + length);
            System.arraycopy(chunk, 0, merged, buffer.length, length);
            buffer = merged;
            List<Message> messages = new ArrayList<>();
            for (;;) {
                int start = -1;
                for (int i = 0; i < buffer.length; i++) {
                    if ((buffer[i] & 0xFF) == MAGIC) {
                        start = i;
                        break;
                    }
                }
                if (start < 0) {
                    buffer = new byte[0];
                    break;
                }
                if (start > 0) buffer = Arrays.copyOfRange(buffer, start, buffer.length);
                if (buffer.length < 3) break;
                int total = (((buffer[1] & 0xFF) << 8) | (buffer[2] & 0xFF)) + 5;
                if (buffer.length < total) break;
                byte[] frame = Arrays.copyOfRange(buffer, 0, total);
                buffer = Arrays.copyOfRange(buffer, total, buffer.length);
                int expected = ((frame[total - 2] & 0xFF) << 8) | (frame[total - 1] & 0xFF);
                if (total < 6 || crc16(frame, 0, total - 2) != expected) throw new IllegalArgumentException("Somme de contrôle (CRC) invalide");
                int slice = frame[3] & 0xFF;
                byte[] body = Arrays.copyOfRange(frame, slice != 0 ? 5 : 4, total - 2);
                byte[] payload = null;
                if (slice == 0) {
                    payload = body;
                } else if (slice == 1) {
                    slices.reset();
                    slices.write(body, 0, body.length);
                } else {
                    slices.write(body, 0, body.length);
                    if (slice == 3) {
                        payload = slices.toByteArray();
                        slices.reset();
                    }
                }
                if (payload != null && payload.length >= 2) {
                    messages.add(new Message(payload[0] & 0xFF, payload[1] & 0xFF, Arrays.copyOfRange(payload, 2, payload.length)));
                }
            }
            return messages;
        }

        public List<Message> push(byte[] chunk) {
            return push(chunk, chunk.length);
        }
    }
}
