import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/store/useStore";
import { format, differenceInDays } from "date-fns";
import { useRouter } from "expo-router";
import { Trash2, ChevronRight, Clock, Plus } from "lucide-react-native";
import { MotiView } from "moti";

const { width } = Dimensions.get("window");

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { savedDates, removeDate } = useStore();

  const renderItem = ({ item, index }) => {
    const targetDate = new Date(item.date);
    const now = new Date();
    const daysDiff = Math.abs(differenceInDays(now, targetDate));
    const isCountdown = item.type === "countdown";

    return (
      <MotiView
        from={{ opacity: 0, translateX: -20 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ delay: index * 100 }}
      >
        <Pressable
          onPress={() => router.push(`/detail/${item.id}`)}
          style={{
            backgroundColor: "#1E1E1E",
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              backgroundColor: "#2E2E2E",
              overflow: "hidden",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {item.photo ? (
              <Image
                source={{ uri: item.photo }}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <Clock color="#FFB300" size={24} />
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "600" }}
              numberOfLines={1}
            >
              {item.label}
            </Text>
            <Text style={{ color: "#A0A0A0", fontSize: 14 }}>
              {isCountdown ? "Counting down" : "Since"}{" "}
              {format(targetDate, "MMM d, yyyy")}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Text style={{ color: "#FFB300", fontSize: 20, fontWeight: "700" }}>
              {daysDiff.toLocaleString()}
            </Text>
            <Text
              style={{
                color: "#6B6B6B",
                fontSize: 10,
                textTransform: "uppercase",
              }}
            >
              Days {isCountdown ? "Left" : "Old"}
            </Text>
          </View>

          <Pressable onPress={() => removeDate(item.id)} style={{ padding: 8 }}>
            <Trash2 color="#FF4444" size={18} />
          </Pressable>
        </Pressable>
      </MotiView>
    );
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: "#121212", paddingTop: insets.top }}
    >
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 32, fontWeight: "800", color: "#FFFFFF" }}>
          Vault
        </Text>
        <Pressable
          onPress={() => router.navigate("/")}
          style={{
            backgroundColor: "#FFB300",
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Plus color="#121212" size={24} />
        </Pressable>
      </View>

      <FlatList
        data={savedDates}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 20,
        }}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 100,
            }}
          >
            <Clock color="#2E2E2E" size={64} />
            <Text
              style={{
                color: "#6B6B6B",
                fontSize: 16,
                marginTop: 16,
                textAlign: "center",
              }}
            >
              Your vault is empty.{"\n"}Save a date to see it here!
            </Text>
          </View>
        }
      />
    </View>
  );
}
