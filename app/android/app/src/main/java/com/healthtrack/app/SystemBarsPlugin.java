package com.healthtrack.app;

import android.os.Build;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.WebViewListener;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Locale;

/**
 * Couleur des icônes des barres système (heure, batterie, gestes) selon le thème de l'app
 * (src/theme/theme.js) : sombres sur le thème clair, claires sur le thème sombre. L'app est affichée
 * sous des barres transparentes (edge-to-edge), Android ne peut donc pas deviner seul.
 *
 * Encarts sous Android 14 et avant (POL-PLAY-9) : MainActivity y active aussi le bord à bord
 * (EdgeToEdge.enable), mais le plugin SystemBars de Capacitor n'injecte --safe-area-inset-* qu'à
 * partir d'Android 15. On le fait ici pour les versions antérieures, avec les mêmes variables CSS
 * (src/index.css → --safe-top / --safe-bottom) ; clavier ouvert : marge basse de la hauteur du
 * clavier et encart bas à 0, comme Capacitor. À partir d'Android 15, rien ne change.
 */
@CapacitorPlugin(name = "SystemBars")
public class SystemBarsPlugin extends Plugin {

    @Override
    public void load() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) return;
        View container = (View) getBridge().getWebView().getParent();
        ViewCompat.setOnApplyWindowInsetsListener(container, (v, insets) -> {
            Insets bars = insets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            boolean keyboard = insets.isVisible(WindowInsetsCompat.Type.ime());
            int keyboardBottom = keyboard ? insets.getInsets(WindowInsetsCompat.Type.ime()).bottom : 0;
            Log.i("HalcyaInsets", "status=" + insets.getInsets(WindowInsetsCompat.Type.statusBars())
                    + " nav=" + insets.getInsets(WindowInsetsCompat.Type.navigationBars())
                    + " caption=" + insets.getInsets(WindowInsetsCompat.Type.captionBar())
                    + " cutout=" + insets.getInsets(WindowInsetsCompat.Type.displayCutout())
                    + " ime=" + keyboardBottom + " viewTop=" + v.getTop());
            injectSafeArea(bars.top, bars.right, keyboard ? 0 : bars.bottom, bars.left);
            ViewGroup.MarginLayoutParams lp = (ViewGroup.MarginLayoutParams) v.getLayoutParams();
            if (lp.bottomMargin != keyboardBottom) {
                lp.bottomMargin = keyboardBottom;
                v.setLayoutParams(lp);
            }
            // Encarts traduits en variables CSS : la WebView n'a pas à les appliquer une 2ᵉ fois (env()).
            return WindowInsetsCompat.CONSUMED;
        });
        // Une page rechargée perd les variables : on les réinjecte dès qu'elle s'affiche.
        getBridge().addWebViewListener(new WebViewListener() {
            @Override
            public void onPageCommitVisible(WebView view, String url) {
                ViewCompat.requestApplyInsets(container);
            }
        });
        ViewCompat.requestApplyInsets(container);
    }

    /** Derniers encarts injectés (dp), relus par la page au démarrage si un rechargement les a effacés. */
    private volatile int[] lastInsetsDp;

    private void injectSafeArea(int top, int right, int bottom, int left) {
        float density = getActivity().getResources().getDisplayMetrics().density;
        lastInsetsDp = new int[] {
                Math.round(top / density), Math.round(right / density),
                Math.round(bottom / density), Math.round(left / density)};
        String script = String.format(Locale.US,
                "try{var s=document.documentElement.style;"
                        + "s.setProperty('--safe-area-inset-top','%dpx');"
                        + "s.setProperty('--safe-area-inset-right','%dpx');"
                        + "s.setProperty('--safe-area-inset-bottom','%dpx');"
                        + "s.setProperty('--safe-area-inset-left','%dpx');}catch(e){}",
                Math.round(top / density), Math.round(right / density),
                Math.round(bottom / density), Math.round(left / density));
        getBridge().executeOnMainThread(() -> {
            WebView webView = getBridge().getWebView();
            if (webView != null) webView.evaluateJavascript(script, null);
        });
    }

    @PluginMethod
    public void getInsets(PluginCall call) {
        int[] dp = lastInsetsDp;
        JSObject result = new JSObject();
        result.put("known", dp != null);
        if (dp != null) {
            result.put("top", dp[0]);
            result.put("right", dp[1]);
            result.put("bottom", dp[2]);
            result.put("left", dp[3]);
        }
        call.resolve(result);
    }

    @PluginMethod
    public void setStyle(PluginCall call) {
        boolean dark = Boolean.TRUE.equals(call.getBoolean("dark", false));
        getActivity().runOnUiThread(() -> {
            Window window = getActivity().getWindow();
            WindowInsetsControllerCompat bars =
                    WindowCompat.getInsetsController(window, window.getDecorView());
            bars.setAppearanceLightStatusBars(!dark);
            bars.setAppearanceLightNavigationBars(!dark);
            call.resolve();
        });
    }
}
