import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  FlatList,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, ChevronLeft, ChevronRight } from "lucide-react-native";
import { MotiView } from "moti";

const { width: SW } = Dimensions.get("window");

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTHS_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

const currentYear = new Date().getFullYear();
const MAX_YEAR = currentYear + 50;
const YEARS = Array.from(
  { length: MAX_YEAR - 1899 },
  (_, i) => MAX_YEAR - i,
);

export default function CustomDatePicker({
  visible,
  value,
  onChange,
  onClose,
  maxDate,
}) {
  const insets = useSafeAreaInsets();
  const parsed = value ? new Date(value) : new Date();

  const [selYear, setSelYear] = useState(parsed.getFullYear());
  const [selMonth, setSelMonth] = useState(parsed.getMonth());
  const [selDay, setSelDay] = useState(parsed.getDate());
  const [view, setView] = useState("day"); // "year" | "month" | "day"

  const yearListRef = useRef(null);

  useEffect(() => {
    if (visible) {
      const d = value ? new Date(value) : new Date();
      setSelYear(d.getFullYear());
      setSelMonth(d.getMonth());
      setSelDay(d.getDate());
      setView("day");
    }
  }, [visible]);

  const daysInMonth = getDaysInMonth(selYear, selMonth);
  const firstDay = getFirstDayOfMonth(selYear, selMonth);

  const maxDateObj = maxDate ? new Date(maxDate) : null;

  const isDateDisabled = (y, m, d) => {
    if (!maxDateObj) return false;
    const date = new Date(y, m, d);
    return date > maxDateObj;
  };

  const confirm = () => {
    const day = Math.min(selDay, daysInMonth);
    const iso = `${selYear}-${String(selMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(iso);
    onClose();
  };

  const scrollToYear = (yr) => {
    const idx = YEARS.indexOf(yr);
    if (idx >= 0 && yearListRef.current) {
      yearListRef.current.scrollToIndex({
        index: idx,
        animated: false,
        viewPosition: 0.5,
      });
    }
  };

  // Render year picker
  const renderYearPicker = () => (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ flex: 1 }}
    >
      <Text
        style={{
          color: "#A0A0A0",
          fontSize: 13,
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        Select Year
      </Text>
      <FlatList
        ref={yearListRef}
        data={YEARS}
        keyExtractor={(y) => String(y)}
        numColumns={4}
        columnWrapperStyle={{ justifyContent: "space-around", marginBottom: 6 }}
        initialScrollIndex={Math.max(0, YEARS.indexOf(selYear))}
        getItemLayout={(_, idx) => ({
          length: 48,
          offset: 48 * Math.floor(idx / 4),
          index: idx,
        })}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: yr }) => {
          const isSelected = yr === selYear;
          const isDisabled = maxDateObj && yr > maxDateObj.getFullYear();
          return (
            <Pressable
              onPress={() => {
                if (!isDisabled) {
                  setSelYear(yr);
                  setView("month");
                }
              }}
              style={{
                width: (SW - 80) / 4,
                height: 44,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isSelected ? "#FFB300" : "transparent",
                opacity: isDisabled ? 0.3 : 1,
              }}
            >
              <Text
                style={{
                  color: isSelected ? "#121212" : "#FFFFFF",
                  fontWeight: isSelected ? "700" : "400",
                  fontSize: 15,
                }}
              >
                {yr}
              </Text>
            </Pressable>
          );
        }}
      />
    </MotiView>
  );

  // Render month picker
  const renderMonthPicker = () => (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ flex: 1 }}
    >
      <Text
        style={{
          color: "#A0A0A0",
          fontSize: 13,
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        Select Month — {selYear}
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-around",
          gap: 10,
        }}
      >
        {MONTHS.map((m, i) => {
          const isSelected = i === selMonth;
          const isDisabled =
            maxDateObj &&
            selYear === maxDateObj.getFullYear() &&
            i > maxDateObj.getMonth();
          return (
            <Pressable
              key={m}
              onPress={() => {
                if (!isDisabled) {
                  setSelMonth(i);
                  setView("day");
                }
              }}
              style={{
                width: (SW - 80) / 3 - 8,
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: isSelected ? "#FFB300" : "#2A2A2A",
                opacity: isDisabled ? 0.3 : 1,
              }}
            >
              <Text
                style={{
                  color: isSelected ? "#121212" : "#FFFFFF",
                  fontWeight: isSelected ? "700" : "500",
                  fontSize: 15,
                }}
              >
                {MONTHS_FULL[i]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </MotiView>
  );

  // Render day picker
  const renderDayPicker = () => {
    const days = [];
    // Empty slots for first day offset
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }

    return (
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ flex: 1 }}
      >
        <Text
          style={{
            color: "#A0A0A0",
            fontSize: 13,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {MONTHS_FULL[selMonth]} {selYear}
        </Text>
        {/* Day of week header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            marginBottom: 8,
          }}
        >
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <Text
              key={d}
              style={{
                color: "#555",
                fontSize: 12,
                width: (SW - 80) / 7,
                textAlign: "center",
              }}
            >
              {d}
            </Text>
          ))}
        </View>
        {/* Day grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {days.map((day, idx) => {
            if (!day)
              return (
                <View
                  key={`e${idx}`}
                  style={{ width: (SW - 80) / 7, height: 40 }}
                />
              );
            const isSelected = day === selDay;
            const isDisabled = isDateDisabled(selYear, selMonth, day);
            const isToday =
              new Date().getDate() === day &&
              new Date().getMonth() === selMonth &&
              new Date().getFullYear() === selYear;
            return (
              <Pressable
                key={day}
                onPress={() => {
                  if (!isDisabled) setSelDay(day);
                }}
                style={{
                  width: (SW - 80) / 7,
                  height: 40,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isSelected
                    ? "#FFB300"
                    : isToday
                      ? "#2A2A2A"
                      : "transparent",
                  opacity: isDisabled ? 0.25 : 1,
                }}
              >
                <Text
                  style={{
                    color: isSelected
                      ? "#121212"
                      : isToday
                        ? "#FFB300"
                        : "#FFFFFF",
                    fontWeight: isSelected || isToday ? "700" : "400",
                    fontSize: 15,
                  }}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </MotiView>
    );
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
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.6)",
        }}
      >
        <View
          style={{
            backgroundColor: "#1A1A1A",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 12,
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 20,
            maxHeight: "75%",
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: "#3E3E3E",
              borderRadius: 2,
              alignSelf: "center",
              marginBottom: 16,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            {/* Breadcrumb nav */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setView("year")}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: view === "year" ? "#FFB300" : "#2A2A2A",
                }}
              >
                <Text
                  style={{
                    color: view === "year" ? "#121212" : "#FFFFFF",
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  {selYear}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setView("month")}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: view === "month" ? "#FFB300" : "#2A2A2A",
                }}
              >
                <Text
                  style={{
                    color: view === "month" ? "#121212" : "#FFFFFF",
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  {MONTHS[selMonth]}
                </Text>
              </Pressable>
              {view === "day" && (
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 10,
                    backgroundColor: "#FFB300",
                  }}
                >
                  <Text
                    style={{
                      color: "#121212",
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    {selDay}
                  </Text>
                </View>
              )}
            </View>

            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <X color="#FFFFFF" size={22} />
            </Pressable>
          </View>

          {/* Content */}
          <View style={{ minHeight: 280 }}>
            {view === "year" && renderYearPicker()}
            {view === "month" && renderMonthPicker()}
            {view === "day" && renderDayPicker()}
          </View>

          {/* Confirm */}
          <Pressable
            onPress={confirm}
            style={{
              backgroundColor: "#FFB300",
              borderRadius: 16,
              padding: 16,
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <Text style={{ color: "#121212", fontWeight: "700", fontSize: 17 }}>
              Confirm — {MONTHS_FULL[selMonth]} {selDay}, {selYear}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
