import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  format,
  differenceInYears,
  differenceInMonths,
  differenceInWeeks,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  isValid,
} from "date-fns";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Image as ImageIcon,
  Share2,
  Save,
  Trash2,
} from "lucide-react-native";
import { MotiView, AnimatePresence } from "moti";
import { useStore } from "@/store/useStore";
import { useInAppPurchase } from "@/utils/iap";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import CustomDatePicker from "@/components/CustomDatePicker";
import ShareCardModal from "@/components/ShareCardModal";
import AdPopup from "@/components/AdPopup";

const { width } = Dimensions.get("window");

const UNITS = [
  "days",
  "hours",
  "minutes",
  "seconds",
  "weeks",
  "months",
  "years",
];
const UNIT_LABELS = {
  days: "Days",
  hours: "Hours",
  minutes: "Minutes",
  seconds: "Seconds",
  weeks: "Weeks",
  months: "Months",
  years: "Years",
};

export default function AgeCalcScreen() {
  const insets = useSafeAreaInsets();
  const { addDate, isPro } = useStore();
  const { initiate, isSubscribed } = useInAppPurchase();
  const isProUser = isPro || !!isSubscribed;

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [label, setLabel] = useState("");
  const [photo, setPhoto] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [unitIndex, setUnitIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUpgradeAd, setShowUpgradeAd] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentUnit = UNITS[unitIndex];

  const stats = useMemo(() => {
    const d = new Date(selectedDate);
    if (!isValid(d)) return null;
    return {
      totalYears: differenceInYears(now, d),
      totalMonths: differenceInMonths(now, d),
      totalWeeks: differenceInWeeks(now, d),
      totalDays: differenceInDays(now, d),
      totalHours: differenceInHours(now, d),
      totalMinutes: differenceInMinutes(now, d),
      totalSeconds: differenceInSeconds(now, d),
    };
  }, [selectedDate, now]);

  const heroValue = useMemo(() => {
    if (!stats) return "0";
    const map = {
      years: stats.totalYears,
      months: stats.totalMonths,
      weeks: stats.totalWeeks,
      days: stats.totalDays,
      hours: stats.totalHours,
      minutes: stats.totalMinutes,
      seconds: stats.totalSeconds,
    };
    return (map[currentUnit] ?? 0).toLocaleString();
  }, [stats, currentUnit]);

  const isMilestone = useMemo(() => {
    if (!stats) return false;
    return (
      stats.totalDays % 100 === 0 ||
      stats.totalDays % 1000 === 0 ||
      (stats.totalYears > 0 && stats.totalYears % 5 === 0)
    );
  }, [stats]);

  const cycleUnit = () => setUnitIndex((prev) => (prev + 1) % UNITS.length);

  const handleUpgradePress = () => {
    initiate();
    setShowUpgradeAd(true);
  };

  const handlePickPhoto = async (useCamera = false) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Camera Permission Required",
          "Please allow camera access in Settings to take photos.",
          [{ text: "OK" }]
        );
        return;
      }
    }
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      exif: true,
    };
    const result = useCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled) {
      const asset = result.assets[0];
      setPhoto(asset.uri);
      if (asset.exif && (asset.exif.DateTimeOriginal || asset.exif.DateTime)) {
        const exifDateStr = asset.exif.DateTimeOriginal || asset.exif.DateTime;
        const formatted = exifDateStr.replace(
          /^(\d{4}):(\d{2}):(\d{2})/,
          "$1-$2-$3"
        );
        const d = new Date(formatted);
        if (isValid(d)) setSelectedDate(formatted.split(" ")[0]);
      }
    }
  };

  const handleSave = () => {
    if (!label.trim()) {
      Alert.alert("Missing Label", "Please give this date a name.");
      return;
    }
    const res = addDate({ label, date: selectedDate, photo, type: "age" });
    if (res.error === "PRO_REQUIRED") {
      Alert.alert(
        "Pro Required",
        "You've reached the limit of 3 saved dates. Upgrade to Pro for unlimited!",
        [
          { text: "Not now", style: "cancel" },
          { text: "Upgrade", onPress: handleUpgradePress },
        ]
      );
    } else {
      Alert.alert("Saved", "Your date has been added to history.");
      setLabel("");
      setPhoto(null);
    }
  };

  const subStats = stats
    ? [
        `${stats.totalYears}y`,
        `${stats.totalMonths}mo`,
        `${stats.totalWeeks}w`,
        `${stats.totalDays}d`,
      ]
    : [];
  const dateStr = selectedDate
    ? format(new Date(selectedDate), "MMMM do, yyyy")
    : "";

  return (
    <KeyboardAvoidingAnimatedView
      style={{ flex: 1, backgroundColor: "#121212" }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: 40,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 800 }}
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
              color: "#FFFFFF",
              marginBottom: 8,
            }}
          >
            Your moments!
          </Text>
          <Text style={{ fontSize: 16, color: "#A0A0A0", marginBottom: 24 }}>
            Mark and share past days that matter.
          </Text>
        </MotiView>

        {/* Hero Card – tap to cycle units */}
        <Pressable onPress={cycleUnit} activeOpacity={0.85}>
          <MotiView
            animate={{ scale: isMilestone ? 1.05 : 1 }}
            transition={{ type: "spring", damping: 10 }}
            style={{
              backgroundColor: "#1E1E1E",
              borderRadius: 24,
              padding: 32,
              alignItems: "center",
              marginBottom: 24,
              borderWidth: isMilestone ? 2 : 1,
              borderColor: isMilestone ? "#FFB300" : "#FFB30033",
            }}
          >
            {isMilestone && (
              <Text
                style={{
                  color: "#FFB300",
                  fontWeight: "bold",
                  marginBottom: 8,
                }}
              >
                MILESTONE! 🎉
              </Text>
            )}

            <AnimatePresence exitBeforeEnter>
              <MotiView
                key={currentUnit}
                from={{ opacity: 0, translateY: 12, scale: 0.92 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                exit={{ opacity: 0, translateY: -12, scale: 0.92 }}
                transition={{ type: "timing", duration: 220 }}
                style={{ alignItems: "center" }}
              >
                <Text
                  style={{
                    fontSize: 64,
                    fontWeight: "800",
                    color: "#FFB300",
                    letterSpacing: -2,
                  }}
                >
                  {heroValue}
                </Text>
                <Text style={{ fontSize: 18, color: "#FFFFFF", marginTop: 4 }}>
                  {UNIT_LABELS[currentUnit]}
                </Text>
              </MotiView>
            </AnimatePresence>

            <View
              style={{
                flexDirection: "row",
                gap: 6,
                marginTop: 16,
                marginBottom: 4,
              }}
            >
              {UNITS.map((u, i) => (
                <View
                  key={u}
                  style={{
                    width: i === unitIndex ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === unitIndex ? "#FFB300" : "#3E3E3E",
                  }}
                />
              ))}
            </View>
            <Text style={{ color: "#555", fontSize: 12, marginTop: 6 }}>
              Tap to switch unit
            </Text>

            <View style={{ flexDirection: "row", marginTop: 20, gap: 20 }}>
              {[
                { key: "years", label: "Years", val: stats?.totalYears ?? 0 },
                {
                  key: "months",
                  label: "Months",
                  val: stats?.totalMonths ?? 0,
                },
                { key: "weeks", label: "Weeks", val: stats?.totalWeeks ?? 0 },
                { key: "days", label: "Days", val: stats?.totalDays ?? 0 },
              ].map(({ key, label: lbl, val }) => (
                <View key={key} style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: currentUnit === key ? "#FFB300" : "#FFFFFF",
                    }}
                  >
                    {val.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#A0A0A0" }}>{lbl}</Text>
                </View>
              ))}
            </View>
          </MotiView>
        </Pressable>

        {/* Inputs */}
        <View style={{ gap: 16 }}>
          <Pressable
            onPress={() => setShowPicker(true)}
            style={{
              backgroundColor: "#1E1E1E",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "#FFB30044",
            }}
          >
            <Text style={{ color: "#A0A0A0", fontSize: 13, marginBottom: 4 }}>
              Date — tap to change
            </Text>
            <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "600" }}>
              {format(new Date(selectedDate), "MMMM do, yyyy")}
            </Text>
          </Pressable>

          <TextInput
            placeholder="Name this date (e.g. Emma's Birthday)"
            placeholderTextColor="#6B6B6B"
            value={label}
            onChangeText={setLabel}
            style={{
              backgroundColor: "#1E1E1E",
              borderRadius: 16,
              padding: 16,
              color: "#FFFFFF",
              fontSize: 18,
            }}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => handlePickPhoto(false)}
              style={{
                flex: 1,
                backgroundColor: "#1E1E1E",
                borderRadius: 16,
                padding: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <ImageIcon color="#FFB300" size={20} />
              <Text style={{ color: "#FFFFFF" }}>Gallery</Text>
            </Pressable>
            <Pressable
              onPress={() => handlePickPhoto(true)}
              style={{
                flex: 1,
                backgroundColor: "#1E1E1E",
                borderRadius: 16,
                padding: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Camera color="#FFB300" size={20} />
              <Text style={{ color: "#FFFFFF" }}>Camera</Text>
            </Pressable>
          </View>

          {photo && (
            <View style={{ position: "relative" }}>
              <Image
                source={{ uri: photo }}
                style={{ width: "100%", height: 200, borderRadius: 16 }}
              />
              <Pressable
                onPress={() => setPhoto(null)}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  padding: 8,
                  borderRadius: 20,
                }}
              >
                <Trash2 color="#FF4444" size={16} />
              </Pressable>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            <Pressable
              onPress={() => setShowShareModal(true)}
              style={{
                flex: 1,
                backgroundColor: "#2E2E2E",
                borderRadius: 16,
                padding: 18,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Share2 color="#FFFFFF" size={20} />
              <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Share</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={{
                flex: 2,
                backgroundColor: "#FFB300",
                borderRadius: 16,
                padding: 18,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Save color="#121212" size={20} />
              <Text style={{ color: "#121212", fontWeight: "600" }}>
                Save to Vault
              </Text>
            </Pressable>
          </View>
        </View>

        {!isProUser && (
          <Pressable
            onPress={handleUpgradePress}
            style={{
              marginTop: 32,
              padding: 20,
              backgroundColor: "#2A2315",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#FFB30066",
            }}
          >
            <Text
              style={{
                color: "#FFB300",
                fontWeight: "700",
                fontSize: 16,
                marginBottom: 4,
              }}
            >
              Upgrade to PRO
            </Text>
            <Text style={{ color: "#A0A0A0", fontSize: 14 }}>
              Unlimited saved dates & premium sharing designs.
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <CustomDatePicker
        visible={showPicker}
        value={selectedDate}
        onChange={setSelectedDate}
        onClose={() => setShowPicker(false)}
        maxDate={new Date().toISOString().split("T")[0]}
      />

      <ShareCardModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        label={label || "This event"}
        heroValue={heroValue}
        unitLabel={UNIT_LABELS[currentUnit]}
        subStats={subStats}
        dateStr={dateStr}
        type="age"
        photoUri={photo ?? null}
        date={selectedDate}
      />

      {/* Standalone upgrade popup (triggered from banner) */}
      <AdPopup
        visible={showUpgradeAd}
        onClose={() => setShowUpgradeAd(false)}
      />
    </KeyboardAvoidingAnimatedView>
  );
}