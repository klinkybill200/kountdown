import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  format,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  isValid,
  addDays,
} from "date-fns";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Image as ImageIcon,
  Share2,
  Save,
  Trash2,
  Clock,
} from "lucide-react-native";
import { MotiView, AnimatePresence } from "moti";
import { useStore } from "@/store/useStore";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import CustomDatePicker from "@/components/CustomDatePicker";
import ShareCardModal from "@/components/ShareCardModal";

const UNITS = ["days", "hours", "minutes", "seconds"];
const UNIT_LABELS = {
  days: "Days",
  hours: "Hours",
  minutes: "Minutes",
  seconds: "Seconds",
};

export default function CountdownScreen() {
  const insets = useSafeAreaInsets();
  const { addDate, isPro } = useStore();

  const [selectedDate, setSelectedDate] = useState(
    format(addDays(new Date(), 7), "yyyy-MM-dd")
  );
  const [label, setLabel] = useState("");
  const [photo, setPhoto] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [now, setNow] = useState(new Date());
  const [unitIndex, setUnitIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const target = new Date(selectedDate);
    if (!isValid(target)) return null;

    const totalDays = differenceInDays(target, now);
    const totalHours = differenceInHours(target, now);
    const totalMinutes = differenceInMinutes(target, now);
    const totalSeconds = differenceInSeconds(target, now);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;

    return {
      days: totalDays,
      hours,
      minutes,
      totalDays,
      totalHours,
      totalMinutes,
      totalSeconds,
    };
  }, [selectedDate, now]);

  const currentUnit = UNITS[unitIndex];
  const heroValue = useMemo(() => {
    if (!stats) return "0";
    const map = {
      days: stats.totalDays,
      hours: stats.totalHours,
      minutes: stats.totalMinutes,
      seconds: stats.totalSeconds,
    };
    const val = map[currentUnit];
    if (val < 0) return "0";
    return val.toLocaleString();
  }, [stats, currentUnit]);

  const cycleUnit = () => {
    setUnitIndex((prev) => (prev + 1) % UNITS.length);
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const handleSave = () => {
    if (!label.trim()) {
      Alert.alert("Missing Label", "Please give this countdown a name.");
      return;
    }
    const res = addDate({
      label,
      date: selectedDate,
      photo,
      type: "countdown",
    });
    if (res.error === "PRO_REQUIRED") {
      Alert.alert("Pro Required", "Upgrade to Pro for unlimited countdowns!");
    } else {
      Alert.alert("Saved", "Countdown added to your vault.");
      setLabel("");
      setPhoto(null);
    }
  };

  // subStats and dateStr for the share card
  const subStats = stats
    ? [
        `${stats.totalDays}d`,
        `${stats.hours}h`,
        `${stats.minutes}m`,
        `${Math.abs(stats.totalSeconds % 60)}s`,
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
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
              color: "#FFFFFF",
              marginBottom: 8,
            }}
          >
            Countdown to
          </Text>
          <Text style={{ fontSize: 16, color: "#A0A0A0", marginBottom: 24 }}>
            The best is yet to come.
          </Text>
        </MotiView>

        {/* Hero Card – tappable to cycle units */}
        <Pressable onPress={cycleUnit} activeOpacity={0.85}>
          <MotiView
            style={{
              backgroundColor: "#1E1E1E",
              borderRadius: 24,
              padding: 32,
              alignItems: "center",
              marginBottom: 24,
              borderWidth: 1,
              borderColor: "#FFB30033",
            }}
          >
            <Clock color="#FFB300" size={32} style={{ marginBottom: 16 }} />

            {/* Animated hero number */}
            <AnimatePresence exitBeforeEnter>
              <MotiView
                key={currentUnit}
                from={{ opacity: 0, translateY: 12, scale: 0.92 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                exit={{ opacity: 0, translateY: -12, scale: 0.92 }}
                transition={{ type: "timing", duration: 220 }}
                style={{ alignItems: "center" }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    gap: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 64,
                      fontWeight: "800",
                      color: "#FFFFFF",
                      letterSpacing: -2,
                    }}
                  >
                    {heroValue}
                  </Text>
                  <Text
                    style={{
                      fontSize: 24,
                      color: "#FFB300",
                      marginBottom: 12,
                      fontWeight: "600",
                    }}
                  >
                    {UNIT_LABELS[currentUnit]}
                  </Text>
                </View>
              </MotiView>
            </AnimatePresence>

            {/* Dot indicators for current unit */}
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

            {/* Sub-stats always visible */}
            <View style={{ flexDirection: "row", marginTop: 20, gap: 24 }}>
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "600",
                    color: currentUnit === "hours" ? "#FFB300" : "#FFFFFF",
                  }}
                >
                  {stats?.hours ?? 0}
                </Text>
                <Text style={{ fontSize: 12, color: "#A0A0A0" }}>Hours</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "600",
                    color: currentUnit === "minutes" ? "#FFB300" : "#FFFFFF",
                  }}
                >
                  {stats?.minutes ?? 0}
                </Text>
                <Text style={{ fontSize: 12, color: "#A0A0A0" }}>Minutes</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "600",
                    color: currentUnit === "seconds" ? "#FFB300" : "#FFFFFF",
                  }}
                >
                  {stats ? Math.abs(stats.totalSeconds % 60) : 0}
                </Text>
                <Text style={{ fontSize: 12, color: "#A0A0A0" }}>Seconds</Text>
              </View>
            </View>
          </MotiView>
        </Pressable>

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
              Target Date — tap to change
            </Text>
            <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "600" }}>
              {format(new Date(selectedDate), "MMMM do, yyyy")}
            </Text>
          </Pressable>

          <TextInput
            placeholder="What are we counting down to?"
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

          <Pressable
            onPress={handlePickPhoto}
            style={{
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
            <Text style={{ color: "#FFFFFF" }}>Attach Photo</Text>
          </Pressable>

          {photo && (
            <Image
              source={{ uri: photo }}
              style={{ width: "100%", height: 200, borderRadius: 16 }}
            />
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
              <Text style={{ color: "#121212", fontWeight: "600" }}>Save</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <CustomDatePicker
        visible={showPicker}
        value={selectedDate}
        onChange={setSelectedDate}
        onClose={() => setShowPicker(false)}
      />
      <ShareCardModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        label={label || "My countdown"}
        heroValue={heroValue}
        unitLabel={UNIT_LABELS[currentUnit]}
        subStats={subStats}
        dateStr={dateStr}
        type="countdown"
        photoUri={photo ?? null}
        date={selectedDate}
      />
    </KeyboardAvoidingAnimatedView>
  );
}