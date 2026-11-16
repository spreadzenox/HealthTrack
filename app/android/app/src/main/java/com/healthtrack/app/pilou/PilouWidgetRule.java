package com.healthtrack.app.pilou;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Ce que montre le widget de Pilou (specs/journee.SPEC.md § 9), en Java pur : même règle que
 * app/src/companion/world/widget.js, que l'app applique à chaque saisie. Le widget la refait seul toutes les 30 min
 * (heure, soir, nuit) et au changement de jour (4 h) : les bulles du jour reviennent toutes, rien ne s'accumule, et il
 * ne dit jamais ce qui a été oublié.
 */
public final class PilouWidgetRule {

    /** Le jour de Pilou change à 4 h. */
    public static final int DAY_CHANGE_MINUTE = 4 * 60;
    public static final int DEFAULT_WAKE = 7 * 60;
    public static final int DEFAULT_BED = 22 * 60 + 30;
    public static final int EVENING = 17 * 60 + 48;
    private static final int WAKING_MINUTES = 60;
    private static final int FED_MINUTES = 90;
    private static final int MAX_BUBBLES = 4;
    public static final String NIGHT_TITLE = "Le reste peut attendre demain";
    private static final String[] WEEKDAYS = {"Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"};

    /** État gardé par l'app (PilouWidgetPlugin.update). */
    public static final class State {
        public String day;              // jour de Pilou de la dernière mise à jour (AAAA-MM-JJ)
        public List<String> planned = new ArrayList<>();   // toutes les choses à noter d'un jour
        public List<String> remaining = new ArrayList<>(); // ce qui reste ce jour-là
        public long lastMealAt;         // ms epoch, 0 si aucun
        public int wake = -1;           // minutes depuis minuit, -1 = inconnu
        public int bed = -1;
        public int usageDay;            // jour d'usage (1…), 0 = inconnu
        public String name = "Pilou";
    }

    /** Ce que le widget affiche. */
    public static final class View {
        public String pose;
        public String title;
        public String day;
        public String bubbles;
        public String accessibility;
    }

    private PilouWidgetRule() {
    }

    /** Jour de Pilou d'une heure locale : il change à 4 h. */
    public static String worldDay(LocalDateTime now) {
        return now.minusMinutes(DAY_CHANGE_MINUTE).toLocalDate().toString();
    }

    static boolean asleep(int minute, int wake, int bed) {
        return bed > wake ? (minute >= bed || minute < wake) : (minute >= bed && minute < wake);
    }

    /** Une des six poses : dort, se-reveille, content, rassasie, soir, fete. */
    public static String pose(int minute, int remaining, long minutesSinceMeal, int wake, int bed) {
        int w = wake >= 0 ? wake : DEFAULT_WAKE;
        int b = bed >= 0 ? bed : DEFAULT_BED;
        if (asleep(minute, w, b)) return "dort";
        if (remaining == 0) return "fete";
        if (minute >= w && minute < w + WAKING_MINUTES) return "se-reveille";
        if (minute >= EVENING || minute < w) return "soir";
        if (minutesSinceMeal >= 0 && minutesSinceMeal < FED_MINUTES) return "rassasie";
        return "content";
    }

    public static String remainingText(int n) {
        if (n <= 0) return "Plus rien à faire";
        return n == 1 ? "Encore 1 chose" : "Encore " + n + " choses";
    }

    public static String dayText(LocalDate date, int usageDay) {
        String wd = WEEKDAYS[date.getDayOfWeek().getValue() - DayOfWeek.MONDAY.getValue()];
        return usageDay >= 1 && usageDay <= 7 ? wd + " · jour " + usageDay : wd;
    }

    private static String poseText(String pose) {
        switch (pose) {
            case "dort": return "dort";
            case "se-reveille": return "se réveille";
            case "rassasie": return "est rassasié";
            case "soir": return "profite du soir";
            case "fete": return "fait la fête";
            default: return "est content";
        }
    }

    /** Vue du widget à `now` (heure locale), `nowMs` pour le dernier repas. */
    public static View render(State s, LocalDateTime now, long nowMs) {
        State st = s != null ? s : new State();
        boolean sameDay = worldDay(now).equals(st.day);
        List<String> left = sameDay ? st.remaining : st.planned;
        if (left == null) left = Collections.emptyList();
        int usage = sameDay ? st.usageDay : 0;
        long sinceMeal = sameDay && st.lastMealAt > 0 ? (nowMs - st.lastMealAt) / 60000L : -1;
        int minute = now.getHour() * 60 + now.getMinute();

        View v = new View();
        v.pose = pose(minute, left.size(), sinceMeal, st.wake, st.bed);
        // la nuit, Pilou dort : pas de compte de ce qui reste, il attendra demain (specs/ile.SPEC.md § 5)
        boolean night = "dort".equals(v.pose) && !left.isEmpty();
        v.title = night ? NIGHT_TITLE : remainingText(left.size());
        v.day = dayText(now.toLocalDate(), usage);
        if (night) left = Collections.emptyList();
        List<String> shown = left.subList(0, Math.min(MAX_BUBBLES, left.size()));
        StringBuilder b = new StringBuilder(String.join(" · ", shown));
        if (left.size() > shown.size()) b.append(" · +").append(left.size() - shown.size());
        v.bubbles = b.toString();
        String who = st.name == null || st.name.trim().isEmpty() ? "Pilou" : st.name.trim();
        v.accessibility = who + " " + poseText(v.pose) + ". "
                + (left.isEmpty() ? v.title + "." : v.title + " : " + String.join(", ", left) + ".")
                + " " + v.day + ".";
        return v;
    }
}
