import Purchases from "react-native-purchases";
import { Platform } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useStore } from "@/store/useStore";

export const useInAppPurchase = () => {
  const [isReady, setIsReady] = useState(false);
  const [offerings, setOfferings] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { setPro } = useStore();

  const getRevenueCatAPIKey = () => {
    if (process.env.EXPO_PUBLIC_CREATE_ENV === "DEVELOPMENT") {
      return process.env.EXPO_PUBLIC_REVENUE_CAT_TEST_STORE_API_KEY;
    }
    if (Platform.OS === "ios") {
      return process.env.EXPO_PUBLIC_REVENUE_CAT_APP_STORE_API_KEY;
    }
    if (Platform.OS === "android") {
      return process.env.EXPO_PUBLIC_REVENUE_CAT_PLAY_STORE_API_KEY;
    }
    return process.env.EXPO_PUBLIC_REVENUE_CAT_TEST_STORE_API_KEY;
  };

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      // Replace 'pro' with your actual entitlement ID from RevenueCat
      const hasPro =
        typeof customerInfo.entitlements.active["pro"] !== "undefined";
      setPro(hasPro);
      return hasPro;
    } catch (e) {
      console.error("Error checking RC subscription:", e);
      return false;
    }
  }, [setPro]);

  const initiate = useCallback(async () => {
    if (isReady) return;

    try {
      const apiKey = getRevenueCatAPIKey();
      if (!apiKey) {
        console.warn("RevenueCat API key not found");
        setIsReady(true);
        return;
      }

      Purchases.configure({ apiKey });

      // Retry offerings load logic
      let loadedOfferings = null;
      for (let i = 0; i < 3; i++) {
        try {
          loadedOfferings = await Purchases.getOfferings();
          if (loadedOfferings) break;
        } catch (err) {
          await new Promise((res) => setTimeout(res, 1500));
        }
      }

      setOfferings(loadedOfferings);
      await checkSubscriptionStatus();
      setIsReady(true);
    } catch (e) {
      console.error("RC Initialization failed:", e);
      setIsReady(true);
    }
  }, [isReady, checkSubscriptionStatus]);

  const purchasePackage = async (pkg) => {
    setIsPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const hasPro =
        typeof customerInfo.entitlements.active["pro"] !== "undefined";
      setPro(hasPro);
      setIsPurchasing(false);
      return { success: true, customerInfo };
    } catch (e) {
      setIsPurchasing(false);
      if (e.userCancelled) {
        return { success: false, cancelled: true };
      }
      return { success: false, error: e.message };
    }
  };

  const restorePurchases = async () => {
    setIsPurchasing(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasPro =
        typeof customerInfo.entitlements.active["pro"] !== "undefined";
      setPro(hasPro);
      setIsPurchasing(false);
      return { success: true, customerInfo };
    } catch (e) {
      setIsPurchasing(false);
      return { success: false, error: e.message };
    }
  };

  return {
    isReady,
    offerings,
    isPurchasing,
    initiate,
    purchasePackage,
    restorePurchases,
    checkSubscriptionStatus,
  };
};
