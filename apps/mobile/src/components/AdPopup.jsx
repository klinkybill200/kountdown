import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Image,
  Linking,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Star, ExternalLink, Zap } from "lucide-react-native";
import { useInAppPurchase } from "@/utils/iap";

const DURATION = 7;

const APPS = [
  {
    name: "Maxee.me",
    tagline: "Your personal link-in-bio",
    url: "https://maxee.me",
    image:
      "https://api.urlbox.io/v1/NTYqWgJv5s0qDIxN/jpeg?url=https%3A%2F%2Fmaxee.me%2F&full_page=true&width=1024&max_height=2048&quality=80",
    accent: "#6C63FF",
  },
  {
    name: "Smoxit",
    tagline: "Quit smoking, for good",
    url: "https://smoxit.app",
    image:
      "https://api.urlbox.io/v1/NTYqWgJv5s0qDIxN/jpeg?url=https%3A%2F%2Fsmoxit.app%2F&full_page=true&width=1024&max_height=2048&quality=80",
    accent: "#00C48C",
  },
];

const FEATURES = [
  "Unlimited saved dates & countdowns",
  "No ads, ever",
  "Premium share card designs",
];

export default function AdPopup({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [canSkip] = useState(true); // always skippable per App Store Guideline 2.5.18
  const [activeApp, setActiveApp] = useState(0);
  const [purchasing, setPurchasing] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const { initiate, offerings, purchasePackage, restorePurchases } =
    useInAppPurchase();

  // Always just the one lifetime package
  const lifetimePkg = offerings?.current?.availablePackages?.[0] ?? null;
  const priceString = lifetimePkg?.product?.priceString ?? "€4.99";

  useEffect(() => {
    if (!visible) return;
    setSecondsLeft(DURATION);
    setActiveApp(0);
    progressAnim.setValue(0);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: DURATION * 1000,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    const appCycle = setInterval(() => {
      setActiveApp((a) => (a + 1) % APPS.length);
    }, 3500);

    initiate();

    return () => {
      clearInterval(interval);
      clearInterval(appCycle);
    };
  }, [visible]);

  const handleUpgrade = async () => {
    if (!lifetimePkg) return;
    setPurchasing(true);
    try {
      const result = await purchasePackage(lifetimePkg);
      if (result.success) onClose();
    } catch (e) {
      console.error("Purchase failed:", e);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      await restorePurchases();
      onClose();
    } catch (e) {
      console.error("Restore failed:", e);
    } finally {
      setPurchasing(false);
    }
  };

  const app = APPS[activeApp];
  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={canSkip ? onClose : undefined}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.92)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "#1A1A1A",
            borderRadius: 28,
            width: "100%",
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#2E2E2E",
          }}
        >
          {/* Progress bar */}
          <View style={{ height: 3, backgroundColor: "#2E2E2E" }}>
            <Animated.View
              style={{ height: 3, backgroundColor: "#FFB300", width: barWidth }}
            />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 20,
              paddingBottom: 12,
            }}
          >
            <View>
              <Text
                style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}
              >
                More From the developer
              </Text>
              <Text style={{ color: "#6B6B6B", fontSize: 13, marginTop: 2 }}>
                Support Kountdown — go Pro
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={{
                backgroundColor: "#2E2E2E",
                borderRadius: 20,
                padding: 8,
              }}
            >
              <X color="#FFFFFF" size={18} />
            </Pressable>
          </View>

          {/* App showcase */}
          <Pressable
            onPress={() => Linking.openURL(app.url)}
            style={{
              marginHorizontal: 30,
              marginBottom: 26,
              borderRadius: 18,
              overflow: "hidden",
              backgroundColor: "#111",
            }}
          >
            <Image
              source={{ uri: app.image }}
              style={{ width: "100%", height: 350 }}
              resizeMode="cover"
            />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "rgba(0,0,0,0.75)",
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text
                  style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}
                >
                  {app.name}
                </Text>
                <Text style={{ color: "#A0A0A0", fontSize: 12 }}>
                  {app.tagline}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: app.accent,
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <ExternalLink color="#FFFFFF" size={13} />
                <Text
                  style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 13 }}
                >
                  Visit
                </Text>
              </View>
            </View>
          </Pressable>

          {/* App dots */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
              marginBottom: 16,
            }}
          >
            {APPS.map((_, i) => (
              <Pressable key={i} onPress={() => setActiveApp(i)}>
                <View
                  style={{
                    width: i === activeApp ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === activeApp ? "#FFB300" : "#3E3E3E",
                  }}
                />
              </Pressable>
            ))}
          </View>

          {/* Pro features */}
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 14,
              backgroundColor: "#242424",
              borderRadius: 16,
              padding: 14,
              gap: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <Star color="#FFB300" size={15} fill="#FFB300" />
              <Text
                style={{ color: "#FFB300", fontWeight: "700", fontSize: 13 }}
              >
                KOUNTDOWN PRO — LIFETIME
              </Text>
            </View>
            {FEATURES.map((f) => (
              <View
                key={f}
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Zap color="#FFB300" size={14} fill="#FFB300" />
                <Text style={{ color: "#FFFFFF", fontSize: 14 }}>{f}</Text>
              </View>
            ))}
          </View>

          {/* Upgrade button */}
          <View style={{ marginHorizontal: 20, marginBottom: 4, gap: 8 }}>
            <Pressable
              onPress={handleUpgrade}
              disabled={purchasing || !lifetimePkg}
              style={{
                backgroundColor: "#FFB300",
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: !lifetimePkg ? 0.5 : 1,
              }}
            >
              {purchasing ? (
                <ActivityIndicator color="#121212" />
              ) : (
                <>
                  <Star color="#121212" size={18} fill="#121212" />
                  <Text
                    style={{
                      color: "#121212",
                      fontWeight: "700",
                      fontSize: 16,
                    }}
                  >
                    {`Unlock for ${priceString} — one time`}
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={handleRestore}
              disabled={purchasing}
              style={{ alignItems: "center", paddingVertical: 10 }}
            >
              <Text style={{ color: "#555", fontSize: 13 }}>
                Restore Purchase
              </Text>
            </Pressable>
          </View>

          <View style={{ height: insets.bottom > 0 ? insets.bottom : 16 }} />
        </View>
      </View>
    </Modal>
  );
}
