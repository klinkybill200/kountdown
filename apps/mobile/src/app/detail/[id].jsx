import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/store/useStore";
import {
  format,
  differenceInDays,
  differenceInYears,
  differenceInMonths,
  differenceInWeeks,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
} from "date-fns";
import {
  ChevronLeft,
  Share2,
  Trash2,
  Calendar,
  ImagePlus,
} from "lucide-react-native";
import { MotiView, AnimatePresence } from "moti";
import * as ImagePicker from "expo-image-picker";
import ShareCardModal from "@/components/ShareCardModal";

const { width } = Dimensions.get("window");

// Units for "age" entries
const AGE_UNITS = [
  "days",
  "hours",
  "minutes",
  "seconds",
  "weeks",
  "months",
  "years",
];
// Units for "countdown" entries
const CD_UNITS = ["days", "hours", "minutes", "seconds"];
const UNIT_LABELS = {
  days: "Days",
  hours: "Hours",
  minutes: "Minutes",
  seconds: "Seconds",
  weeks: "Weeks",
  months: "Months",
  years: "Years",
};

export default function DetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { savedDates, removeDate, updateDate } = useStore();

  const [unitIndex, setUnitIndex] = useState(0);
  const [now, setNow] = useState(new Date());
  const [showShareModal, setShowShareModal] = useState(false);

  const item = useMemo(
    () => savedDates.find((d) => d.id === id),
    [savedDates, id],
  );

  const isCountdown = item?.type === "countdown";
  const UNITS = isCountdown ? CD_UNITS : AGE_UNITS;

  // Live ticker — always runs, needed for countdowns but harmless for age entries
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    if (!item) return null;
    const target = new Date(item.date);
    const diff = (fn) => Math.abs(fn(now, target));
    const sign = (fn) => fn(target, now); // positive = future (countdown)

    if (isCountdown) {
      const totalDays = sign(differenceInDays);
      const totalHours = sign(differenceInHours);
      const totalMins = sign(differenceInMinutes);
      const totalSecs = sign(differenceInSeconds);
      return {
        days: totalDays,
        hours: totalHours % 24,
        minutes: totalMins % 60,
        seconds: totalSecs % 60,
        totalDays,
        totalHours,
        totalMinutes: totalMins,
        totalSeconds: totalSecs,
        // for sub-stat display
        years: 0,
        months: 0,
        weeks: 0,
      };
    } else {
      return {
        totalYears: diff(differenceInYears),
        totalMonths: diff(differenceInMonths),
        totalWeeks: diff(differenceInWeeks),
        totalDays: diff(differenceInDays),
        totalHours: diff(differenceInHours),
        totalMinutes: diff(differenceInMinutes),
        totalSeconds: diff(differenceInSeconds),
      };
    }
  }, [item, now, isCountdown]);

  const currentUnit = UNITS[unitIndex];

  const heroValue = useMemo(() => {
    if (!stats) return "0";
    if (isCountdown) {
      const map = {
        days: stats.totalDays,
        hours: stats.totalHours,
        minutes: stats.totalMinutes,
        seconds: stats.totalSeconds,
      };
      const v = map[currentUnit] ?? 0;
      return Math.max(0, v).toLocaleString();
    } else {
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
    }
  }, [stats, currentUnit, isCountdown]);

  const cycleUnit = () => setUnitIndex((p) => (p + 1) % UNITS.length);

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      updateDate(id, { photo: result.assets[0].uri });
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Entry", "Remove this from your vault?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          removeDate(id);
          router.back();
        },
      },
    ]);
  };

  if (!item) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#121212",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#FFFFFF" }}>Not found</Text>
      </View>
    );
  }

  const targetDate = new Date(item.date);

  const subStats = isCountdown
    ? [
        `${stats?.hours ?? 0}h`,
        `${stats?.minutes ?? 0}m`,
        `${Math.abs((stats?.totalSeconds ?? 0) % 60)}s`,
      ]
    : [
        `${stats?.totalYears ?? 0}y`,
        `${stats?.totalMonths ?? 0}mo`,
        `${stats?.totalWeeks ?? 0}w`,
        `${stats?.totalDays ?? 0}d`,
      ];

  const dateStr = format(targetDate, "MMMM do, yyyy");

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: insets.top + 12,
          left: 16,
          zIndex: 10,
          backgroundColor: "rgba(0,0,0,0.5)",
          borderRadius: 20,
          padding: 8,
        }}
      >
        <ChevronLeft color="#FFFFFF" size={24} />
      </Pressable>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Hero photo or title */}
        {item.photo ? (
          <View style={{ width: "100%", height: 300 }}>
            <Image
              source={{ uri: item.photo }}
              style={{ width: "100%", height: "100%" }}
            />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 120,
                backgroundColor: "rgba(18,18,18,0.85)",
                padding: 20,
                justifyContent: "flex-end",
              }}
            >
              <Text
                style={{ color: "#FFFFFF", fontSize: 28, fontWeight: "800" }}
              >
                {item.label}
              </Text>
            </View>
            {/* Change photo button */}
            <Pressable
              onPress={handleAddPhoto}
              style={{
                position: "absolute",
                top: insets.top + 12,
                right: 16,
                backgroundColor: "rgba(0,0,0,0.55)",
                borderRadius: 20,
                padding: 9,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ImagePlus color="#FFB300" size={18} />
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              paddingTop: insets.top + 60,
              paddingHorizontal: 20,
              paddingBottom: 8,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 32, fontWeight: "800" }}>
              {item.label}
            </Text>
          </View>
        )}

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={{ paddingHorizontal: 20, marginTop: 20 }}
        >
          {/* Tappable hero card */}
          <Pressable onPress={cycleUnit} activeOpacity={0.85}>
            <View
              style={{
                backgroundColor: "#1E1E1E",
                borderRadius: 24,
                padding: 32,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#FFB30033",
              }}
            >
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
                      color: "#FFB300",
                      fontSize: 64,
                      fontWeight: "900",
                      letterSpacing: -2,
                    }}
                  >
                    {heroValue}
                  </Text>
                  <Text
                    style={{ color: "#FFFFFF", fontSize: 20, marginTop: 4 }}
                  >
                    {UNIT_LABELS[currentUnit]}{" "}
                    {isCountdown ? "Remaining" : "Ago"}
                  </Text>
                </MotiView>
              </AnimatePresence>

              {/* Dot indicators */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 6,
                  marginTop: 18,
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
            </View>
          </Pressable>

          {/* Sub-stat tiles */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 12,
            }}
          >
            {(isCountdown
              ? [
                  { label: "Days", value: stats?.totalDays ?? 0 },
                  { label: "Hours", value: stats?.hours ?? 0 },
                  { label: "Minutes", value: stats?.minutes ?? 0 },
                  {
                    label: "Seconds",
                    value: Math.abs((stats?.totalSeconds ?? 0) % 60),
                  },
                ]
              : [
                  { label: "Years", value: stats?.totalYears ?? 0 },
                  { label: "Months", value: stats?.totalMonths ?? 0 },
                  { label: "Weeks", value: stats?.totalWeeks ?? 0 },
                ]
            ).map((s) => (
              <View
                key={s.label}
                style={{
                  flex: 1,
                  minWidth: "28%",
                  backgroundColor: "#1E1E1E",
                  borderRadius: 16,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "700" }}
                >
                  {s.value.toLocaleString()}
                </Text>
                <Text style={{ color: "#6B6B6B", fontSize: 12 }}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Date info */}
          <View
            style={{
              marginTop: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: "#1E1E1E",
              padding: 16,
              borderRadius: 16,
            }}
          >
            <Calendar color="#FFB300" size={20} />
            <View>
              <Text style={{ color: "#6B6B6B", fontSize: 12 }}>
                {isCountdown ? "Target Date" : "Date"}
              </Text>
              <Text style={{ color: "#FFFFFF", fontSize: 16 }}>{dateStr}</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
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
            {/* Add / change photo */}
            {!item.photo && (
              <Pressable
                onPress={handleAddPhoto}
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
                <ImagePlus color="#FFB300" size={20} />
                <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  Add Photo
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleDelete}
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
              <Trash2 color="#FF4444" size={20} />
              <Text style={{ color: "#FF4444", fontWeight: "600" }}>
                Delete
              </Text>
            </Pressable>
          </View>
        </MotiView>
      </ScrollView>

      <ShareCardModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        label={item.label}
        heroValue={heroValue}
        unitLabel={UNIT_LABELS[currentUnit]}
        subStats={subStats}
        dateStr={dateStr}
        type={item.type}
        photoUri={item.photo ?? null}
        date={item.date}
      />
    </View>
  );
}
