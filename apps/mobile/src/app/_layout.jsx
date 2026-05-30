import { useAuth } from "@/utils/auth/useAuth";
import { useInAppPurchase } from "@/utils/iap";
import { useStore } from "@/store/useStore";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { initiate: initiateAuth, isReady: isAuthReady } = useAuth();
  const { initiate: initiateIAP, isReady: isIAPReady, isSubscribed } = useInAppPurchase();
  const { setPro } = useStore();

  useEffect(() => {
    initiateAuth();
    initiateIAP();
  }, [initiateAuth, initiateIAP]);

  // Sync RevenueCat subscription status to local store
  useEffect(() => {
    if (isIAPReady) {
      setPro(!!isSubscribed);
    }
  }, [isSubscribed, isIAPReady, setPro]);

  const isReady = isAuthReady && isIAPReady;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="detail/[id]"
            options={{
              presentation: "modal",
              headerShown: false,
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
