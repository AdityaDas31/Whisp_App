import React, { useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  interpolateColor,
  useAnimatedStyle,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width } = Dimensions.get("window");

export default function LockScreen({ loading, onRetry, unlocked }) {
  const { user, fetchProfile } = useAuth();

  const progress = useSharedValue(0);

  const radius = 50;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),

    stroke: interpolateColor(progress.value, [0, 1], ["#4F8CFF", "#22C55E"]),
  }));

  useEffect(() => {
    if (unlocked) {
      progress.value = withTiming(1, {
        duration: 900,
      });
    } else {
      progress.value = 0;
    }
  }, [unlocked]);

  // fetch profile when screen mounts
  useEffect(() => {
    fetchProfile();
  }, []);

  const now = useMemo(() => new Date(), []);

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const date = now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const renderButton = (value) => (
    <TouchableOpacity key={value} activeOpacity={0.75} style={styles.key}>
      <Text style={styles.keyText}>{value}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Background Glow */}
      <View style={styles.blueGlow} />
      <View style={styles.purpleGlow} />

      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.content}>
          {/* Time */}
          <View style={styles.timeContainer}>
            <Text style={styles.time}>{time}</Text>
            <Text style={styles.date}>{date}</Text>
          </View>

          {/* Brand */}
          <View style={styles.brandContainer}>
            <Text style={styles.brandTitle}>Whisp</Text>
            <Text style={styles.brandSubtitle}>Private & Secure Messaging</Text>
          </View>

          {/* Glass Card */}
          <View style={styles.card}>
            <View style={styles.avatarContainer}>
              <View
                style={{
                  width: 110,
                  height: 110,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Svg
                  width={110}
                  height={110}
                  style={{
                    position: "absolute",
                  }}
                >
                  <Circle
                    cx="55"
                    cy="55"
                    r={radius}
                    stroke="#233046"
                    strokeWidth={strokeWidth}
                    fill="none"
                  />

                  <AnimatedCircle
                    cx="55"
                    cy="55"
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={circumference}
                    animatedProps={animatedProps}
                    rotation="60"
                    origin="55,55"
                  />
                </Svg>

                <Image
                  source={{
                    uri:
                      user?.profileImage?.url ||
                      "https://i.pravatar.cc/150?img=12",
                  }}
                  style={styles.avatar}
                />
              </View>

              <View style={[styles.lockBadge, unlocked && styles.unlockBadge]}>
                <Ionicons
                  name={unlocked ? "lock-open" : "lock-closed"}
                  color="#fff"
                  size={18}
                />
              </View>
            </View>

            <Text style={styles.welcome}>Welcome Back</Text>

            <Text style={styles.username}>
              {user?.name?.split(" ")[0] || "User"}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05060A",
  },

  safe: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
  },

  content: {
    alignItems: "center",
    marginTop: 20,
  },

  blueGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 150,
    backgroundColor: "#2563EB",
    opacity: 0.22,
    top: -60,
    left: -70,
  },

  purpleGlow: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 150,
    backgroundColor: "#9333EA",
    opacity: 0.18,
    bottom: -80,
    right: -80,
  },

  timeContainer: {
    alignItems: "center",
    marginTop: 20,
  },

  time: {
    color: "#fff",
    fontSize: 54,
    fontWeight: "700",
    letterSpacing: 1,
  },

  date: {
    color: "#94A3B8",
    fontSize: 17,
    marginTop: 5,
  },

  brandContainer: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 10,
  },

  brandTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },

  brandSubtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#94A3B8",
    letterSpacing: 0.5,
  },

  card: {
    width: width * 0.88,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 35,
    alignItems: "center",
    marginTop: 28,
  },

  avatarContainer: {
    position: "relative",
  },

  avatar: {
    width: 95,
    height: 95,
    borderRadius: 50,
    // borderWidth: 3,
    // borderColor: "#4F8CFF",
  },

  unlockBadge: {
    backgroundColor: "#22C55E",
  },

  lockBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    backgroundColor: "#4F8CFF",
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },

  welcome: {
    color: "#E2E8F0",
    marginTop: 22,
    fontSize: 17,
  },

  username: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 4,
  },

  pinContainer: {
    flexDirection: "row",
    marginTop: 28,
  },

  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#64748B",
    marginHorizontal: 10,
  },

  dotFilled: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4F8CFF",
    marginHorizontal: 10,
  },

  keypad: {
    marginBottom: 25,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: 10,
  },

  key: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  keyText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "600",
  },

  iconButton: {
    width: 78,
    height: 78,
    justifyContent: "center",
    alignItems: "center",
  },
});
