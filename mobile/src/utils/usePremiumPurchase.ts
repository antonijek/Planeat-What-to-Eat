import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { useIAP, ErrorCode, type Purchase } from "expo-iap";
import { PRODUCT_SKUS, IAPProductId, IAPProduct, MOCK_PRODUCTS } from "../services/iapService";
import { premiumService } from "../services/premiumService";
import { useUserStore } from "../store/userStore";

function idForProductId(productId: string): IAPProductId | null {
  const entry = (Object.entries(PRODUCT_SKUS) as [IAPProductId, string][]).find(
    ([, sku]) => sku === productId
  );
  return entry ? entry[0] : null;
}

/** Applies a completed purchase locally. No backend validation yet (see AGENTS.md). */
async function applyPurchase(id: IAPProductId) {
  if (id === "monthly") {
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);
    await premiumService.setMonthly(expires);
  } else if (id === "yearly") {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    await premiumService.setYearly(expires);
  } else {
    await premiumService.setLifetime();
  }
}

export interface PurchaseFlowState {
  /** Live store products when connected, MOCK_PRODUCTS otherwise (e.g. Expo Go). */
  products: IAPProduct[];
  /** Whether the native store connection is up (false in Expo Go). */
  connected: boolean;
  purchasing: IAPProductId | null;
  restoring: boolean;
  error: string | null;
  buy: (id: IAPProductId) => Promise<void>;
  restore: () => Promise<void>;
}

export function usePremiumPurchase(): PurchaseFlowState {
  const [purchasing, setPurchasing] = useState<IAPProductId | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadUserData = useUserStore((s) => s.loadUserData);
  const pendingRestore = useRef(false);

  const {
    connected,
    products,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    restorePurchases,
    availablePurchases,
  } = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      const id = idForProductId(purchase.productId);
      try {
        if (id) {
          await applyPurchase(id);
          await loadUserData();
        }
        await finishTransaction({ purchase, isConsumable: false });
      } catch (e) {
        setError((e as Error)?.message ?? "Purchase could not be completed.");
      } finally {
        setPurchasing(null);
      }
    },
    onPurchaseError: (e) => {
      setPurchasing(null);
      if (e.code !== ErrorCode.UserCancelled) {
        setError(e.message);
      }
    },
  });

  useEffect(() => {
    if (!connected) return;
    fetchProducts({ skus: Object.values(PRODUCT_SKUS), type: "all" });
  }, [connected, fetchProducts]);

  // Once a restore's purchases land, apply the highest tier found.
  useEffect(() => {
    if (!pendingRestore.current) return;
    if (availablePurchases.length === 0) {
      pendingRestore.current = false;
      setRestoring(false);
      return;
    }
    (async () => {
      const ids = availablePurchases
        .map((p) => idForProductId(p.productId))
        .filter((x): x is IAPProductId => !!x);
      const priority: IAPProductId[] = ["lifetime", "yearly", "monthly"];
      const best = priority.find((id) => ids.includes(id));
      if (best) {
        await applyPurchase(best);
        await loadUserData();
      }
      pendingRestore.current = false;
      setRestoring(false);
    })();
  }, [availablePurchases, loadUserData]);

  const merged: IAPProduct[] = useMemo(() => {
    if (!connected) return MOCK_PRODUCTS;
    const all = [...products, ...subscriptions];
    return (Object.keys(PRODUCT_SKUS) as IAPProductId[]).map((id) => {
      const sku = PRODUCT_SKUS[id];
      const found = all.find((p) => p.id === sku);
      const mock = MOCK_PRODUCTS.find((m) => m.id === id)!;
      if (!found) return mock;
      return {
        id,
        sku,
        title: found.title,
        description: found.description,
        price: found.displayPrice,
        priceAmount: mock.priceAmount,
      };
    });
  }, [connected, products, subscriptions]);

  const buy = useCallback(
    async (id: IAPProductId) => {
      setError(null);
      const sku = PRODUCT_SKUS[id];
      if (!connected) {
        // Expo Go / no native module: simulate success so the UX can be tested.
        await applyPurchase(id);
        await loadUserData();
        return;
      }
      setPurchasing(id);
      try {
        if (id === "lifetime") {
          await requestPurchase({
            request: { apple: { sku }, google: { skus: [sku] } },
            type: "in-app",
          });
        } else {
          const sub = subscriptions.find((s) => s.id === sku);
          const offerToken =
            Platform.OS === "android"
              ? sub?.subscriptionOffers?.[0]?.offerTokenAndroid ?? undefined
              : undefined;
          await requestPurchase({
            request: {
              apple: { sku },
              google: {
                skus: [sku],
                subscriptionOffers: offerToken ? [{ sku, offerToken }] : undefined,
              },
            },
            type: "subs",
          });
        }
      } catch (e) {
        setPurchasing(null);
        setError((e as Error)?.message ?? "Purchase failed.");
      }
    },
    [connected, requestPurchase, subscriptions, loadUserData]
  );

  const restore = useCallback(async () => {
    setError(null);
    if (!connected) return;
    setRestoring(true);
    pendingRestore.current = true;
    try {
      await restorePurchases();
    } catch (e) {
      pendingRestore.current = false;
      setRestoring(false);
      setError((e as Error)?.message ?? "Restore failed.");
    }
  }, [connected, restorePurchases]);

  return { products: merged, connected, purchasing, restoring, error, buy, restore };
}
