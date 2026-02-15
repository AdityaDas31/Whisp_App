// app/SplashScreen.jsx
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";


export default function SplashScreen({ onFinish }) {
  const { width, height } = useWindowDimensions();

  // Base guideline sizes (iPhone 11)
  const guidelineBaseWidth = 375;
  const guidelineBaseHeight = 812;

  const scale = (size) => (width / guidelineBaseWidth) * size;
  const verticalScale = (size) => (height / guidelineBaseHeight) * size;

  const isTablet = width >= 768;

  // Animations
  const opacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const subtitleY = useRef(new Animated.Value(verticalScale(20))).current;
  const iconScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),

        Animated.spring(scaleAnim, {
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

      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        delay: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => onFinish?.());
  }, []);

  const styles = createStyles(scale, verticalScale, isTablet);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Logo */}
        <Animated.Image
          source={require("../assets/images/logo.png")}
          style={[
            styles.icon,
            { transform: [{ scale: iconScale }] },
          ]}
          resizeMode="contain"
        />

        {/* Title */}
        <Animated.Text
          style={[
            styles.title,
            { opacity, transform: [{ scale: scaleAnim }] },
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
    </SafeAreaView>
  );
}

function createStyles(scale, verticalScale, isTablet) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#0d0d0d",
    },
    container: {
      flex: 1,
      backgroundColor: "#0d0d0d",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: scale(20),
    },

    icon: {
      width: isTablet ? scale(200) : scale(150),
      height: isTablet ? scale(220) : scale(170),
      marginBottom: verticalScale(25),
    },

    title: {
      fontSize: isTablet ? scale(48) : scale(36),
      fontWeight: "bold",
      color: "#fff",
      letterSpacing: scale(2),
      textAlign: "center",
    },

    subtitle: {
      fontSize: isTablet ? scale(18) : scale(14),
      color: "#aaa",
      marginTop: verticalScale(12),
      textAlign: "center",
    },
  });
}
