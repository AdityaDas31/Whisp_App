// app/SplashScreen.jsx
import { View, Text, StyleSheet, Animated, Easing, Image } from "react-native";
import { useEffect, useRef } from "react";

export default function SplashScreen({ onFinish }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const subtitleY = useRef(new Animated.Value(20)).current; // slide-up
  const iconScale = useRef(new Animated.Value(0)).current; // logo pop-in

  useEffect(() => {
    Animated.sequence([
      // Step 1: Show icon with bounce
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      // Step 2: Fade in title + subtitle together
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleY, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      // Step 3: Fade everything out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        delay: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish?.();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* App Icon */}
      <Animated.Image
        source={require("../assets/images/logo.png")} // 👈 replace with your logo
        style={[
          styles.icon,
          { transform: [{ scale: iconScale }] },
        ]}
      />

      {/* Title */}
      <Animated.Text
        style={[
          styles.title,
          { opacity, transform: [{ scale }] },
        ]}
      >
        Whisp
      </Animated.Text>

      {/* Subtitle */}
      <Animated.Text
        style={[
          styles.subtitle,
          { opacity, transform: [{ translateY: subtitleY }] },
        ]}
      >
        Connect. Chat. Whisper.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 155,
    height: 180,
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
    marginTop: 10,
  },
});
