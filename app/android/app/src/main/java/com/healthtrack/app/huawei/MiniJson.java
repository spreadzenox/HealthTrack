package com.healthtrack.app.huawei;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Lecteur JSON minimal pour les réponses HiChain (1/0x28), sans dépendance Android (org.json n'existe
 * pas sur la JVM des tests). Lit le premier objet et ignore ce qui suit : la GT 6 Pro termine son JSON
 * par un octet NUL (journal/protocoles/huawei.md §6.9). Objets → Map, tableaux → List, nombres → Double.
 */
final class MiniJson {

    private final String s;
    private int i;

    private MiniJson(String s) {
        this.s = s;
    }

    /** Premier objet JSON au début du texte, ou null s'il n'y en a pas de lisible. */
    @SuppressWarnings("unchecked")
    static Map<String, Object> parseObject(String text) {
        if (text == null || !text.startsWith("{")) return null;
        try {
            return (Map<String, Object>) new MiniJson(text).value();
        } catch (RuntimeException e) {
            return null;
        }
    }

    private void ws() {
        while (i < s.length() && Character.isWhitespace(s.charAt(i))) i++;
    }

    private char peek() {
        if (i >= s.length()) throw new IllegalArgumentException("JSON tronqué");
        return s.charAt(i);
    }

    private void expect(char c) {
        ws();
        if (peek() != c) throw new IllegalArgumentException("« " + c + " » attendu");
        i++;
    }

    private Object value() {
        ws();
        char c = peek();
        if (c == '{') return object();
        if (c == '[') return array();
        if (c == '"') return string();
        if (s.startsWith("true", i)) {
            i += 4;
            return Boolean.TRUE;
        }
        if (s.startsWith("false", i)) {
            i += 5;
            return Boolean.FALSE;
        }
        if (s.startsWith("null", i)) {
            i += 4;
            return null;
        }
        int start = i;
        while (i < s.length() && "+-0123456789.eE".indexOf(s.charAt(i)) >= 0) i++;
        if (start == i) throw new IllegalArgumentException("Valeur JSON inattendue");
        return Double.parseDouble(s.substring(start, i));
    }

    private Map<String, Object> object() {
        Map<String, Object> out = new LinkedHashMap<>();
        expect('{');
        ws();
        if (peek() == '}') {
            i++;
            return out;
        }
        for (;;) {
            ws();
            String key = string();
            expect(':');
            out.put(key, value());
            ws();
            char c = peek();
            i++;
            if (c == '}') return out;
            if (c != ',') throw new IllegalArgumentException("« , » ou « } » attendu");
        }
    }

    private List<Object> array() {
        List<Object> out = new ArrayList<>();
        expect('[');
        ws();
        if (peek() == ']') {
            i++;
            return out;
        }
        for (;;) {
            out.add(value());
            ws();
            char c = peek();
            i++;
            if (c == ']') return out;
            if (c != ',') throw new IllegalArgumentException("« , » ou « ] » attendu");
        }
    }

    private String string() {
        if (peek() != '"') throw new IllegalArgumentException("Chaîne attendue");
        i++;
        StringBuilder b = new StringBuilder();
        for (;;) {
            char c = peek();
            i++;
            if (c == '"') return b.toString();
            if (c != '\\') {
                b.append(c);
                continue;
            }
            char e = peek();
            i++;
            switch (e) {
                case 'n': b.append('\n'); break;
                case 't': b.append('\t'); break;
                case 'r': b.append('\r'); break;
                case 'b': b.append('\b'); break;
                case 'f': b.append('\f'); break;
                case 'u':
                    b.append((char) Integer.parseInt(s.substring(i, i + 4), 16));
                    i += 4;
                    break;
                default: b.append(e);
            }
        }
    }

    /** Texte JSON d'une chaîne (guillemets et échappements). */
    static String quote(String v) {
        StringBuilder b = new StringBuilder("\"");
        for (char c : v.toCharArray()) {
            if (c == '"' || c == '\\') b.append('\\').append(c);
            else if (c < 0x20) b.append(String.format("\\u%04x", (int) c));
            else b.append(c);
        }
        return b.append('"').toString();
    }
}
