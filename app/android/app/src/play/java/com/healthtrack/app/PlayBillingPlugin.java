package com.healthtrack.app;

import android.app.Activity;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Google Play Billing, variante play seulement (src/services/playBilling.js, jalon 6c-2). Le plugin ne fait que relayer
 * la Play Billing Library : formules et prix (`getProducts`), achat (`purchase`, avec l'identifiant de compte masqué),
 * abonnements du compte Google Play (`queryPurchases`). Il n'accuse jamais réception d'un achat et n'accorde aucun
 * droit : c'est le relais Halcya qui revérifie chaque jeton chez Google et accuse réception côté serveur.
 */
@CapacitorPlugin(name = "PlayBilling")
public class PlayBillingPlugin extends Plugin {

    private BillingClient client;
    private final List<Runnable> waiting = new ArrayList<>();
    private final List<PluginCall> waitingCalls = new ArrayList<>();
    private boolean connecting;
    private final Map<String, ProductDetails> details = new HashMap<>();
    /** L'achat en cours : résolu par onPurchasesUpdated. */
    private PluginCall purchaseCall;

    @Override
    public void load() {
        client = BillingClient.newBuilder(getContext())
            .setListener(this::onPurchasesUpdated)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection()
            .build();
    }

    @Override
    protected void handleOnDestroy() {
        if (client != null) client.endConnection();
    }

    /** Lance `task` une fois le service Play Billing connecté ; sinon rejette `call` avec le code de Google. */
    private void whenReady(PluginCall call, Runnable task) {
        if (client.isReady()) {
            task.run();
            return;
        }
        synchronized (waiting) {
            waiting.add(task);
            waitingCalls.add(call);
            if (connecting) return;
            connecting = true;
        }
        client.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                List<Runnable> tasks;
                List<PluginCall> calls;
                synchronized (waiting) {
                    connecting = false;
                    tasks = new ArrayList<>(waiting);
                    calls = new ArrayList<>(waitingCalls);
                    waiting.clear();
                    waitingCalls.clear();
                }
                boolean ok = result.getResponseCode() == BillingClient.BillingResponseCode.OK;
                for (int i = 0; i < tasks.size(); i++) {
                    if (ok) tasks.get(i).run();
                    else reject(calls.get(i), result);
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                // Reconnexion automatique de la bibliothèque (enableAutoServiceReconnection) au prochain appel
            }
        });
    }

    private static void reject(PluginCall call, BillingResult result) {
        call.reject("Play Billing : " + result.getDebugMessage(), String.valueOf(result.getResponseCode()));
    }

    /** { productIds: string[] } → { products: [{ productId, offers: [{ basePlanId, offerId, offerToken, phases }] }] } */
    @PluginMethod
    public void getProducts(PluginCall call) {
        final List<String> ids = productIds(call);
        if (ids == null) {
            call.reject("productIds attendu");
            return;
        }
        whenReady(call, () -> queryDetails(ids, call, (list) -> {
            JSArray products = new JSArray();
            for (ProductDetails pd : list) products.put(toJson(pd));
            JSObject ret = new JSObject();
            ret.put("products", products);
            call.resolve(ret);
        }));
    }

    private static List<String> productIds(PluginCall call) {
        JSArray arr = call.getArray("productIds", null);
        if (arr == null) return null;
        List<String> ids = new ArrayList<>();
        for (int i = 0; i < arr.length(); i++) {
            String id = arr.optString(i, null);
            if (id != null) ids.add(id);
        }
        return ids;
    }

    private interface DetailsReady {
        void accept(List<ProductDetails> list);
    }

    private void queryDetails(List<String> ids, PluginCall call, DetailsReady then) {
        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        for (String id : ids) {
            products.add(QueryProductDetailsParams.Product.newBuilder()
                .setProductId(id)
                .setProductType(BillingClient.ProductType.SUBS)
                .build());
        }
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder().setProductList(products).build();
        client.queryProductDetailsAsync(params, (result, res) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                reject(call, result);
                return;
            }
            List<ProductDetails> list = res.getProductDetailsList();
            synchronized (details) {
                for (ProductDetails pd : list) details.put(pd.getProductId(), pd);
            }
            then.accept(list);
        });
    }

    private static JSObject toJson(ProductDetails pd) {
        JSObject ret = new JSObject();
        ret.put("productId", pd.getProductId());
        JSArray offers = new JSArray();
        List<ProductDetails.SubscriptionOfferDetails> all = pd.getSubscriptionOfferDetails();
        if (all != null) {
            for (ProductDetails.SubscriptionOfferDetails o : all) {
                JSObject offer = new JSObject();
                offer.put("basePlanId", o.getBasePlanId());
                offer.put("offerId", o.getOfferId());
                offer.put("offerToken", o.getOfferToken());
                JSArray phases = new JSArray();
                for (ProductDetails.PricingPhase p : o.getPricingPhases().getPricingPhaseList()) {
                    JSObject phase = new JSObject();
                    phase.put("formattedPrice", p.getFormattedPrice());
                    phase.put("priceMicros", p.getPriceAmountMicros());
                    phase.put("currency", p.getPriceCurrencyCode());
                    phase.put("billingPeriod", p.getBillingPeriod());
                    phase.put("cycles", p.getBillingCycleCount());
                    phase.put("recurrenceMode", p.getRecurrenceMode());
                    phases.put(phase);
                }
                offer.put("phases", phases);
                offers.put(offer);
            }
        }
        ret.put("offers", offers);
        return ret;
    }

    /** { productId, offerToken, obfuscatedAccountId } → { status: purchased | pending | cancelled, purchases } */
    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        String offerToken = call.getString("offerToken");
        String accountId = call.getString("obfuscatedAccountId");
        if (productId == null || offerToken == null) {
            call.reject("productId et offerToken attendus");
            return;
        }
        if (purchaseCall != null) {
            call.reject("Un achat est déjà en cours");
            return;
        }
        whenReady(call, () -> {
            ProductDetails pd;
            synchronized (details) {
                pd = details.get(productId);
            }
            if (pd != null) {
                launch(call, pd, offerToken, accountId);
                return;
            }
            List<String> ids = new ArrayList<>();
            ids.add(productId);
            queryDetails(ids, call, (list) -> {
                if (list.isEmpty()) call.reject("Formule introuvable dans Google Play", "ITEM_UNAVAILABLE");
                else launch(call, list.get(0), offerToken, accountId);
            });
        });
    }

    private void launch(PluginCall call, ProductDetails pd, String offerToken, String accountId) {
        Activity activity = getActivity();
        List<BillingFlowParams.ProductDetailsParams> items = new ArrayList<>();
        items.add(BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(pd).setOfferToken(offerToken).build());
        BillingFlowParams.Builder flow = BillingFlowParams.newBuilder().setProductDetailsParamsList(items);
        if (accountId != null && !accountId.isEmpty()) flow.setObfuscatedAccountId(accountId);
        BillingFlowParams params = flow.build();
        activity.runOnUiThread(() -> {
            purchaseCall = call;
            BillingResult result = client.launchBillingFlow(activity, params);
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                purchaseCall = null;
                reject(call, result);
            }
        });
    }

    private void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        int code = result.getResponseCode();
        JSArray list = toJson(purchases);
        JSObject event = new JSObject();
        event.put("code", code);
        event.put("purchases", list);
        notifyListeners("purchasesUpdated", event);

        PluginCall call = purchaseCall;
        purchaseCall = null;
        if (call == null) return;
        if (code == BillingClient.BillingResponseCode.OK) {
            call.resolve(purchaseResult(purchases, list));
        } else if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            JSObject ret = new JSObject();
            ret.put("status", "cancelled");
            ret.put("purchases", new JSArray());
            call.resolve(ret);
        } else if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            // Déjà abonné sur ce compte Google : on rend l'abonnement existant, que le relais revérifiera
            client.queryPurchasesAsync(subsQuery(), (r, owned) -> call.resolve(purchaseResult(owned, toJson(owned))));
        } else {
            reject(call, result);
        }
    }

    private static JSObject purchaseResult(List<Purchase> purchases, JSArray list) {
        boolean done = false;
        if (purchases != null) {
            for (Purchase p : purchases) {
                if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) done = true;
            }
        }
        JSObject ret = new JSObject();
        ret.put("status", done ? "purchased" : "pending");
        ret.put("purchases", list);
        return ret;
    }

    /** → { purchases: [{ purchaseToken, products, state, acknowledged, autoRenewing, purchaseTime }] } */
    @PluginMethod
    public void queryPurchases(PluginCall call) {
        whenReady(call, () -> client.queryPurchasesAsync(subsQuery(), (result, purchases) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                reject(call, result);
                return;
            }
            JSObject ret = new JSObject();
            ret.put("purchases", toJson(purchases));
            call.resolve(ret);
        }));
    }

    private static QueryPurchasesParams subsQuery() {
        return QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build();
    }

    private static JSArray toJson(List<Purchase> purchases) {
        JSArray list = new JSArray();
        if (purchases == null) return list;
        for (Purchase p : purchases) {
            JSObject o = new JSObject();
            o.put("purchaseToken", p.getPurchaseToken());
            o.put("products", new JSArray(p.getProducts()));
            int state = p.getPurchaseState();
            o.put("state", state == Purchase.PurchaseState.PURCHASED ? "purchased"
                : state == Purchase.PurchaseState.PENDING ? "pending" : "unspecified");
            o.put("acknowledged", p.isAcknowledged());
            o.put("autoRenewing", p.isAutoRenewing());
            o.put("purchaseTime", p.getPurchaseTime());
            list.put(o);
        }
        return list;
    }
}
