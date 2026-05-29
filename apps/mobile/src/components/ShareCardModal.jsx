/**
 * ShareCardModal — fully fixed
 *
 * Root causes fixed:
 * 1. encodeToBase64() doesn't exist in all Skia versions → use encodeToBytes()
 * 2. AdPopup was a Modal rendered after ShareCardModal's Modal
 *    → nested Modals silently fail on iOS. Now it's an absolute View overlay
 *    inside the same Modal. No nesting.
 * 3. useImage(null) can throw → use empty string fallback
 * 4. 500ms snapshot delay so Canvas finishes painting before capture
 */
import React, { useRef, useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Share,
  Alert,
  Platform,
  ActivityIndicator,
  Dimensions,
  Animated,
  Linking,
  Image,
  StyleSheet,
} from "react-native";
import {
  Canvas,
  Fill,
  RoundedRect,
  LinearGradient,
  vec,
  Text as SkiaText,
  matchFont,
  Circle,
  Line,
  Image as SkiaImage,
  useImage,
} from "@shopify/react-native-skia";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { X, Share2, Star, ExternalLink } from "lucide-react-native";
import { useStore } from "@/store/useStore";
import { useInAppPurchase } from "@/utils/iap";

const { width: SW } = Dimensions.get("window");
const CARD_W = SW - 48;
const CARD_H = CARD_W * 1.25;
const AD_DURATION = 7;

const AD_APPS = [
  {
    name: "Maxee.me",
    tagline: "Optimize your Small Business",
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

function stripEmoji(str) {
  return (str || "")
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    .replace(/[\u{FE00}-\u{FEFF}]/gu, "")
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const makeFontStyle = (size, weight = "normal") => ({
  fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  fontSize: size,
  fontWeight: weight,
});

let hFont = null,
  uFont = null,
  lFont = null,
  sFont = null,
  bFont = null;
if (Platform.OS !== "web") {
  try {
    hFont = matchFont(makeFontStyle(68, "bold"));
    uFont = matchFont(makeFontStyle(24, "bold"));
    lFont = matchFont(makeFontStyle(20, "normal"));
    sFont = matchFont(makeFontStyle(15, "normal"));
    bFont = matchFont(makeFontStyle(16, "bold"));
  } catch (e) {
    console.warn("Skia font init failed:", e);
  }
}

function mText(font, text) {
  if (!font || !text) return (text?.length ?? 0) * 13;
  try {
    return font.measureText(text).width;
  } catch {
    return (text?.length ?? 0) * 13;
  }
}

// ─── Ad overlay — a plain absolute View, NOT a Modal ─────────────────────────
function AdOverlay({ onDone, onUpgrade, purchasing }) {
  const [secondsLeft, setSecondsLeft] = useState(AD_DURATION);
  const [canSkip] = useState(true); // always skippable per App Store Guideline 2.5.18
  const [activeApp, setActiveApp] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progressAnim.setValue(0);
    setSecondsLeft(AD_DURATION);
    setActiveApp(0);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: AD_DURATION * 1000,
      useNativeDriver: false,
    }).start();

    const countdown = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    const cycle = setInterval(
      () => setActiveApp((a) => (a + 1) % AD_APPS.length),
      3500,
    );

    return () => {
      clearInterval(countdown);
      clearInterval(cycle);
    };
  }, []);

  const app = AD_APPS[activeApp];
  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        { borderRadius: 28, overflow: "hidden", backgroundColor: "#111111" },
      ]}
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
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
            More From the developer
          </Text>
          <Text style={{ color: "#6B6B6B", fontSize: 13, marginTop: 2 }}>
            Support Kountdown — go ad-free with Pro
          </Text>
        </View>
        {canSkip ? (
          <Pressable
            onPress={onDone}
            hitSlop={16}
            style={{ backgroundColor: "#2E2E2E", borderRadius: 20, padding: 8 }}
          >
            <X color="#FFFFFF" size={18} />
          </Pressable>
        ) : (
          <View
            style={{
              backgroundColor: "#2E2E2E",
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 8,
              alignItems: "center",
              minWidth: 44,
            }}
          >
            <Text style={{ color: "#FFB300", fontWeight: "700", fontSize: 18 }}>
              {secondsLeft}
            </Text>
          </View>
        )}
      </View>

      {/* App preview */}
      <Pressable
        onPress={() => Linking.openURL(app.url)}
        style={{
          marginHorizontal: 20,
          borderRadius: 16,
          overflow: "hidden",
          height: 240,
          backgroundColor: "#000",
        }}
      >
        <Image
          source={{ uri: app.image }}
          style={{
            width: "100%",
            height: "250%",
            top: 0,
            position: "absolute",
          }}
          resizeMode="cover"
        />
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.78)",
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
              {app.name}
            </Text>
            <Text style={{ color: "#A0A0A0", fontSize: 12 }}>
              {app.tagline}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: app.accent,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 7,
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}
          >
            <ExternalLink color="#FFFFFF" size={13} />
            <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 13 }}>
              Visit
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Dots */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 6,
          marginVertical: 18,
        }}
      >
        {AD_APPS.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === activeApp ? 20 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === activeApp ? "#FFB300" : "#3E3E3E",
            }}
          />
        ))}
      </View>

      {/* Upgrade CTA */}
      <Pressable
        onPress={onUpgrade}
        disabled={purchasing}
        style={{
          marginHorizontal: 20,
          marginBottom: 10,
          backgroundColor: "#FFB300",
          borderRadius: 16,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: purchasing ? 0.65 : 1,
        }}
      >
        {purchasing ? (
          <ActivityIndicator color="#121212" />
        ) : (
          <>
            <Star color="#121212" size={18} fill="#121212" />
            <Text style={{ color: "#121212", fontWeight: "700", fontSize: 16 }}>
              Upgrade to Pro — €4.99
            </Text>
          </>
        )}
      </Pressable>

      {/* Inactive share button with countdown */}
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 20,
          backgroundColor: "#2A2A2A",
          borderRadius: 16,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderWidth: 1,
          borderColor: "#3A3A3A",
        }}
      >
        <Share2 color="#555" size={18} />
        <Text style={{ color: "#555", fontWeight: "700", fontSize: 16 }}>
          Share card
        </Text>
        <View style={{
          backgroundColor: "#333",
          borderRadius: 10,
          paddingHorizontal: 8,
          paddingVertical: 3,
          marginLeft: 4,
        }}>
          <Text style={{ color: "#FFB300", fontWeight: "700", fontSize: 13 }}>
            {secondsLeft}s
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Inner component — hooks always called unconditionally ────────────────────
function ShareCardInner({
  visible,
  onClose,
  label,
  heroValue,
  unitLabel,
  subStats,
  dateStr,
  type,
  photoUri,
  date,
}) {
  const canvasRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const { isPro } = useStore();
  const { initiate, offerings, purchasePackage } = useInAppPurchase();

  // useImage must always be called — pass empty string instead of null when no photo
  const bgImage = useImage(photoUri || "");

  // Build public live-timer link — recipients can see the live counter in their browser
  const baseUrl = (process.env.EXPO_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  const shareUrl =
    baseUrl && date
      ? `${baseUrl}/share?label=${encodeURIComponent(
          label || "",
        )}&date=${encodeURIComponent(date)}&type=${encodeURIComponent(
          type || "age",
        )}`
      : null;

  const cx = CARD_W / 2;
  const cleanLabel = stripEmoji(
    label || (type === "countdown" ? "Countdown" : "This day"),
  );
  const typeTag = type === "countdown" ? "COUNTDOWN" : "SINCE";
  const heroText = String(heroValue ?? "0");
  const labelStr =
    cleanLabel.length > 26 ? cleanLabel.substring(0, 25) + "…" : cleanLabel;
  const heroW = mText(hFont, heroText);
  const unitW = mText(uFont, (unitLabel ?? "").toUpperCase());
  const labelW = mText(lFont, labelStr);
  const tagW = mText(sFont, typeTag);

  const executeShare = async () => {
    setSharing(true);
    try {
      // Canvas must be fully painted — 500ms is reliable
      await new Promise((r) => setTimeout(r, 500));

      const snapshot = canvasRef.current?.makeImageSnapshot();
      if (!snapshot)
        throw new Error(
          "Canvas snapshot returned null. The card may not be visible yet.",
        );

      // encodeToBytes() is the universal Skia API
      // (encodeToBase64 does NOT exist in all versions of react-native-skia)
      const bytes = snapshot.encodeToBytes();
      if (!bytes || bytes.length === 0)
        throw new Error("Image encoding returned empty data.");

      // Chunked base64 — avoids call-stack overflow on large images
      const CHUNK = 8192;
      let binary = "";
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      const base64 = btoa(binary);

      const uri = `${FileSystem.cacheDirectory}kountdown-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: "base64",
      });

      // Message includes the live-timer link so recipients can open it in a browser
      const linkLine = shareUrl ? `\n\n🔗 Live timer: ${shareUrl}` : "";
      const message = `${cleanLabel} — ${heroText} ${
        unitLabel ?? ""
      }${linkLine}\n\nShared via Kountdown`;

      // Save image to camera roll
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === "granted") {
        await MediaLibrary.saveToLibraryAsync(uri);
      }

      // Share text + link via native Share Sheet (works reliably in all apps)
      await Share.share(
        { message, title: message },
        { dialogTitle: "Share your Kountdown" },
      );
    } catch (e) {
      console.error("[ShareCard] error:", e);
      Alert.alert(
        "Couldn't share",
        e?.message ?? "Something went wrong. Try again.",
      );
    } finally {
      setSharing(false);
    }
  };

  const handleSharePress = () => {
    if (!isPro) {
      initiate(); // warm up IAP quietly
      setShowAd(true);
    } else {
      executeShare();
    }
  };

  // Called when user dismisses the ad (skip button)
  const handleAdDone = () => {
    setShowAd(false);
    executeShare();
  };

  const handleUpgrade = async () => {
    setPurchasing(true);
    try {
      const pkg = offerings?.current?.availablePackages?.[0];
      if (!pkg) {
        Alert.alert(
          "Store not ready",
          "In-app purchases are not configured yet. Connect RevenueCat in your project settings.",
        );
        return;
      }
      const result = await purchasePackage(pkg);
      if (result.success) {
        setShowAd(false);
        Alert.alert(
          "Welcome to Pro!",
          "Ads removed. Thank you for your support!",
        );
      } else if (!result.cancelled) {
        Alert.alert("Purchase failed", result.error ?? "Please try again.");
      }
    } catch (e) {
      console.error("Purchase error:", e);
      Alert.alert("Purchase error", e?.message ?? "Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.9)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            backgroundColor: "#1A1A1A",
            borderRadius: 28,
            padding: 20,
            width: "100%",
            alignItems: "center",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              marginBottom: 18,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 18 }}>
              Share Card
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X color="#FFFFFF" size={22} />
            </Pressable>
          </View>

          {/* Skia canvas */}
          <Canvas
            ref={canvasRef}
            style={{ width: CARD_W, height: CARD_H, borderRadius: 20 }}
          >
            <Fill color="#0C0C0C" />
            <RoundedRect x={0} y={0} width={CARD_W} height={CARD_H} r={20}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(CARD_W, CARD_H)}
                colors={["#1E1A10", "#0F0F0F"]}
              />
            </RoundedRect>

            {/* Photo background — only render when image is loaded AND photoUri is set */}
            {bgImage && photoUri ? (
              <SkiaImage
                image={bgImage}
                fit="cover"
                x={0}
                y={0}
                width={CARD_W}
                height={CARD_H}
                opacity={0.3}
              />
            ) : null}

            <Circle
              cx={CARD_W * 0.8}
              cy={CARD_H * 0.22}
              r={90}
              color="#FFB300"
              opacity={0.06}
            />
            <Circle
              cx={CARD_W * 0.15}
              cy={CARD_H * 0.72}
              r={110}
              color="#FF8C00"
              opacity={0.05}
            />

            <RoundedRect x={0} y={0} width={CARD_W} height={5} r={3}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(CARD_W, 0)}
                colors={["#FFB300", "#FF6F00"]}
              />
            </RoundedRect>

            {sFont && (
              <SkiaText
                x={CARD_W - tagW - 20}
                y={32}
                text={typeTag}
                font={sFont}
                color="#FFB300"
                opacity={0.6}
              />
            )}
            {hFont && (
              <SkiaText
                x={cx - heroW / 2}
                y={CARD_H * 0.36}
                text={heroText}
                font={hFont}
                color="#FFB300"
              />
            )}
            {uFont && (
              <SkiaText
                x={cx - unitW / 2}
                y={CARD_H * 0.36 + 40}
                text={(unitLabel ?? "").toUpperCase()}
                font={uFont}
                color="#FFFFFF"
                opacity={0.6}
              />
            )}

            <Line
              p1={vec(cx - 60, CARD_H * 0.52)}
              p2={vec(cx + 60, CARD_H * 0.52)}
              color="#FFB300"
              strokeWidth={1}
              opacity={1}
            />

            {lFont && (
              <SkiaText
                x={cx - Math.min(labelW, CARD_W - 40) / 2}
                y={CARD_H * 0.6}
                text={labelStr}
                font={lFont}
                color="#FFFFFF"
                opacity={1}
              />
            )}

            {sFont &&
              subStats &&
              subStats.map((s, i) => {
                const tw = mText(sFont, s);
                const gap = (CARD_W - 40) / (subStats.length + 1);
                return (
                  <SkiaText
                    key={i}
                    x={20 + gap * (i + 1) - tw / 2}
                    y={CARD_H * 0.71}
                    text={s}
                    font={sFont}
                    color="#FFFFFF"
                    opacity={0.3}
                  />
                );
              })}

            {sFont && dateStr ? (
              <SkiaText
                x={cx - mText(sFont, dateStr) / 2}
                y={CARD_H * 0.79}
                text={dateStr}
                font={sFont}
                color="#FFFFFF"
                opacity={0.6}
              />
            ) : null}

            <RoundedRect
              x={cx - 54}
              y={CARD_H - 50}
              width={108}
              height={36}
              r={13}
              color="#FFB300"
              opacity={0.2}
            />
            {bFont && (
              <SkiaText
                x={cx - mText(bFont, "Kountdown") / 2}
                y={CARD_H - 28}
                text="Kountdown"
                font={bFont}
                color="#FFB300"
                opacity={0.55}
              />
            )}
          </Canvas>

          {/* Share button */}
          <Pressable
            onPress={handleSharePress}
            disabled={sharing}
            style={{
              marginTop: 18,
              backgroundColor: "#FFB300",
              borderRadius: 16,
              paddingVertical: 16,
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              opacity: sharing ? 0.65 : 1,
            }}
          >
            {sharing ? (
              <ActivityIndicator color="#121212" />
            ) : (
              <>
                <Share2 color="#121212" size={20} />
                <Text
                  style={{ color: "#121212", fontWeight: "700", fontSize: 17 }}
                >
                  Share this card
                </Text>
              </>
            )}
          </Pressable>

          <Text
            style={{
              color: "#444",
              fontSize: 12,
              marginTop: 10,
              textAlign: "center",
            }}
          >
            {isPro
              ? "Kountdown Pro — no ads"
              : "WhatsApp · Mail · Instagram · iMessage"}
          </Text>
          <Text
            style={{
              color: "#666",
              fontSize: 11,
              marginTop: 6,
              textAlign: "center",
            }}
          >
            🖼 Karte wird in Fotos gespeichert · 🔗 Link wird geteilt
          </Text>

          {/* ── Ad overlay — absolute View in THIS modal, NOT a nested Modal ── */}
          {showAd && (
            <AdOverlay
              onDone={handleAdDone}
              onUpgrade={handleUpgrade}
              purchasing={purchasing}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Public wrapper — web-safe ────────────────────────────────────────────────
export default function ShareCardModal(props) {
  if (Platform.OS === "web") return null;
  return <ShareCardInner {...props} />;
}
