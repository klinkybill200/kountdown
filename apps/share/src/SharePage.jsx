
import { useState, useEffect } from "react";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  differenceInYears,
  differenceInMonths,
  differenceInWeeks,
  format,
  isValid,
} from "date-fns";

function getStats(dateStr, type) {
  const target = new Date(dateStr);
  if (!isValid(target)) return null;
  const now = new Date();
  if (type === "countdown") {
    const totalSecs = differenceInSeconds(target, now);
    if (totalSecs < 0) return { expired: true };
    return {
      totalDays: differenceInDays(target, now),
      totalHours: differenceInHours(target, now),
      totalMinutes: differenceInMinutes(target, now),
      totalSeconds: totalSecs,
      hours: differenceInHours(target, now) % 24,
      minutes: differenceInMinutes(target, now) % 60,
      seconds: totalSecs % 60,
    };
  }
  const totalSecs = differenceInSeconds(now, target);
  return {
    totalDays: differenceInDays(now, target),
    totalHours: differenceInHours(now, target),
    totalMinutes: differenceInMinutes(now, target),
    totalSeconds: totalSecs,
    years: differenceInYears(now, target),
    months: differenceInMonths(now, target),
    weeks: differenceInWeeks(now, target),
    hours: differenceInHours(now, target) % 24,
    minutes: differenceInMinutes(now, target) % 60,
    seconds: totalSecs % 60,
  };
}

const UNITS_AGE = [
  "days",
  "hours",
  "minutes",
  "seconds",
  "weeks",
  "months",
  "years",
];
const UNITS_CD = ["days", "hours", "minutes", "seconds"];
const UNIT_LABELS = {
  days: "Days",
  hours: "Hours",
  minutes: "Minutes",
  seconds: "Seconds",
  weeks: "Weeks",
  months: "Months",
  years: "Years",
};

function getHeroVal(stats, unit, type) {
  if (!stats || stats.expired) return "0";
  const map =
    type === "countdown"
      ? {
          days: stats.totalDays,
          hours: stats.totalHours,
          minutes: stats.totalMinutes,
          seconds: stats.totalSeconds,
        }
      : {
          days: stats.totalDays,
          hours: stats.totalHours,
          minutes: stats.totalMinutes,
          seconds: stats.totalSeconds,
          weeks: stats.totalWeeks,
          months: stats.totalMonths,
          years: stats.years,
        };
  return Math.max(0, map[unit] ?? 0).toLocaleString();
}

function formatDate(dateStr) {
  try {
    return format(new Date(dateStr), "MMMM do, yyyy");
  } catch {
    return "";
  }
}

export default function SharePage() {
  const [params, setParams] = useState({
    label: "A special moment",
    date: "",
    type: "age",
  });
  const [stats, setStats] = useState(null);
  const [unitIndex, setUnitIndex] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setParams({
      label: sp.get("label") || "A special moment",
      date: sp.get("date") || new Date().toISOString().split("T")[0],
      type: sp.get("type") || "age",
    });
  }, []);

  useEffect(() => {
    if (!params.date) return;
    setStats(getStats(params.date, params.type));
    const t = setInterval(
      () => setStats(getStats(params.date, params.type)),
      1000
    );
    return () => clearInterval(t);
  }, [params]);

  const UNITS = params.type === "countdown" ? UNITS_CD : UNITS_AGE;
  const currentUnit = UNITS[unitIndex];
  const value = getHeroVal(stats, currentUnit, params.type);
  const dateDisplay = params.date ? formatDate(params.date) : "";

  const subStatItems =
    params.type === "countdown"
      ? [
          { label: "Hours", v: stats?.hours ?? 0 },
          { label: "Minutes", v: stats?.minutes ?? 0 },
          { label: "Seconds", v: stats?.seconds ?? 0 },
        ]
      : [
          { label: "Years", v: stats?.years ?? 0 },
          { label: "Months", v: stats?.months ?? 0 },
          { label: "Weeks", v: stats?.weeks ?? 0 },
        ];

  const cycleUnit = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 300);
    setUnitIndex((i) => (i + 1) % UNITS.length);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0F0F0F",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
        padding: "20px",
        overflowX: "hidden",
      }}
    >
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0F0F0F; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes scaleIn {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .fade-1 { animation: fadeUp 0.6s ease both; }
        .fade-2 { animation: fadeUp 0.6s 0.1s ease both; }
        .fade-3 { animation: fadeUp 0.6s 0.2s ease both; }
        .fade-4 { animation: fadeUp 0.6s 0.3s ease both; }
        .hero-shimmer {
          background: linear-gradient(120deg, #FFB300, #FF8C00, #FFD54F, #FFB300);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .pulse-anim { animation: scaleIn 0.3s ease; }
        .live-dot { animation: livePulse 1.5s ease infinite; }
        .hero-card {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          cursor: pointer;
          user-select: none;
        }
        .hero-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 64px rgba(255,179,0,0.15);
        }
        .hero-card:active { transform: scale(0.98); }
        .dl-btn {
          transition: transform 0.15s ease, filter 0.15s ease;
          text-decoration: none;
          cursor: pointer;
        }
        .dl-btn:hover { transform: scale(1.04); filter: brightness(1.05); }
        .dl-btn:active { transform: scale(0.97); }
        .dot { transition: width 0.25s ease, background-color 0.25s ease; }
      `}</style>

      {/* Ambient glow orbs */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-15%",
            right: "-10%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,179,0,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "0%",
            left: "-10%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,140,0,0.05) 0%, transparent 70%)",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Logo */}
        <div
          className="fade-1"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: "linear-gradient(135deg, #FFB300, #FF6F00)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(255,179,0,0.3)",
            }}
          >
            <span style={{ fontSize: 20 }}>⏱</span>
          </div>
          <span
            style={{
              color: "#FFB300",
              fontWeight: "800",
              fontSize: 22,
              letterSpacing: -0.5,
            }}
          >
            Kountdown
          </span>
        </div>

        {/* Title */}
        <div className="fade-1" style={{ textAlign: "center" }}>
          <p
            style={{
              color: "#555",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 2.5,
              marginBottom: 10,
              fontWeight: "600",
            }}
          >
            {params.type === "countdown" ? "Counting down to" : "Time since"}
          </p>
          <h1
            style={{
              color: "#FFFFFF",
              fontSize: 30,
              fontWeight: "800",
              letterSpacing: -0.8,
              lineHeight: 1.2,
            }}
          >
            {params.label}
          </h1>
          {dateDisplay && (
            <p style={{ color: "#444", fontSize: 13, marginTop: 8 }}>
              {dateDisplay}
            </p>
          )}
        </div>

        {/* Hero Card */}
        <div
          className={`hero-card fade-2 ${pulse ? "pulse-anim" : ""}`}
          onClick={cycleUnit}
          style={{
            width: "100%",
            background: "linear-gradient(150deg, #1C1C1C 0%, #111111 100%)",
            borderRadius: 28,
            padding: "44px 32px 32px",
            border: "1px solid rgba(255,179,0,0.14)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
          }}
        >
          {/* Top bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: "linear-gradient(90deg, #FFB300, #FF6F00)",
            }}
          />

          {/* Hero value */}
          <span
            className="hero-shimmer"
            style={{
              fontSize: value.length > 9 ? 42 : value.length > 6 ? 58 : 78,
              fontWeight: "900",
              letterSpacing: value.length > 9 ? -1 : -4,
              lineHeight: 1,
              marginBottom: 6,
              wordBreak: "break-all",
              textAlign: "center",
            }}
          >
            {value}
          </span>
          <span
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 22,
              fontWeight: "600",
              marginBottom: 20,
            }}
          >
            {UNIT_LABELS[currentUnit]}{" "}
            {params.type === "countdown" ? "Remaining" : "Ago"}
          </span>

          {/* Dots */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {UNITS.map((u, i) => (
              <div
                key={u}
                className="dot"
                style={{
                  height: 6,
                  borderRadius: 3,
                  width: i === unitIndex ? 20 : 6,
                  backgroundColor: i === unitIndex ? "#FFB300" : "#2E2E2E",
                }}
              />
            ))}
          </div>
          <span style={{ color: "#3E3E3E", fontSize: 12, marginBottom: 24 }}>
            Tap to switch unit
          </span>

          {/* Sub stats */}
          <div
            style={{
              display: "flex",
              gap: 28,
              flexWrap: "wrap",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            {subStatItems.map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div
                  style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}
                >
                  {s.v.toLocaleString()}
                </div>
                <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Live badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(34,197,94,0.08)",
              borderRadius: 20,
              padding: "6px 14px",
              border: "1px solid rgba(34,197,94,0.15)",
            }}
          >
            <div
              className="live-dot"
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: "#22C55E",
                boxShadow: "0 0 8px rgba(34,197,94,0.6)",
              }}
            />
            <span style={{ color: "#22C55E", fontSize: 12, fontWeight: "600" }}>
              Live — updates every second
            </span>
          </div>
        </div>

        {/* Download card */}
        <div
          className="fade-3"
          style={{
            width: "100%",
            background: "linear-gradient(150deg, #181208, #0F0C06)",
            borderRadius: 24,
            padding: "28px 24px",
            border: "1px solid rgba(255,179,0,0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
        >
          <p style={{ color: "#888", fontSize: 13, textAlign: "center" }}>
            Track your own moments — Download the app
          </p>
          <p
            style={{
              color: "#FFFFFF",
              fontWeight: "800",
              fontSize: 19,
              textAlign: "center",
              letterSpacing: -0.3,
            }}
          >
            Download <span style={{ color: "#FFB300" }}>Kountdown</span>
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {/* App Store */}
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="dl-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#FFFFFF",
                borderRadius: 14,
                padding: "12px 18px",
              }}
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="black">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div>
                <div style={{ fontSize: 10, color: "#777", lineHeight: 1.2 }}>
                  Download on the
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: "#000",
                    fontWeight: "800",
                    lineHeight: 1.2,
                  }}
                >
                  App Store
                </div>
              </div>
            </a>

            {/* Google Play */}
            <a
              href="https://play.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="dl-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#FFFFFF",
                borderRadius: 14,
                padding: "12px 18px",
              }}
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3.18 23.77c.3.17.64.23.98.17L15.65 12 11.8 8.15 3.18 23.77z"
                  fill="#EA4335"
                />
                <path
                  d="M20.65 10.3l-3.13-1.78-4.19 3.72 4.19 3.72 3.16-1.8c.9-.51.9-1.85-.03-1.86z"
                  fill="#FBBC04"
                />
                <path
                  d="M3.18.26C2.87.5 2.68.9 2.68 1.41v21.18c0 .51.2.91.5 1.18l.07.06 11.86-11.86v-.15L3.18.26z"
                  fill="#4285F4"
                />
                <path
                  d="M15.65 12L3.76.12C4.1.06 4.46.12 4.76.3l13.04 7.41-2.15 4.29z"
                  fill="#34A853"
                />
              </svg>
              <div>
                <div style={{ fontSize: 10, color: "#777", lineHeight: 1.2 }}>
                  Get it on
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: "#000",
                    fontWeight: "800",
                    lineHeight: 1.2,
                  }}
                >
                  Google Play
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div
          className="fade-4"
          style={{ textAlign: "center", paddingBottom: 12 }}
        >
          <p style={{ color: "#FFFFFF", fontSize: 12 }}>
            Shared via{" "}
            <span style={{ color: "#FFB300", fontWeight: "700" }}>
              Kountdown
            </span>{" "}
            · Every moment counts
          </p>
        </div>
      </div>
    </div>
  );
}