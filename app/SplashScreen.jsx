// app/SplashScreen.jsx
import { View, StyleSheet, Image, Text, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppStatusBar from "../components/AppStatusBar";

export default function SplashScreen() {
  const { width, height } = useWindowDimensions();

  const guidelineBaseWidth = 375;
  const guidelineBaseHeight = 812;

  const scale = (size) => (width / guidelineBaseWidth) * size;
  const verticalScale = (size) => (height / guidelineBaseHeight) * size;

  const isTablet = width >= 768;

  const styles = createStyles(scale, verticalScale, isTablet);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <AppStatusBar backgroundColor="#0d0d0d" style="light" />

      <View style={styles.container}>
        {/* Logo Center */}
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.icon}
          resizeMode="contain"
        />

        {/* Bottom Text */}
        <View style={styles.bottomContainer}>
          <Text style={styles.title}>Whisp</Text>
          <Text style={styles.subtitle}>Connect. Chat. Whisper.</Text>
        </View>
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
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: scale(20),
    },

    icon: {
      width: isTablet ? scale(200) : scale(150),
      height: isTablet ? scale(220) : scale(170),
    },

    bottomContainer: {
      position: "absolute",
      bottom: verticalScale(40),
      alignItems: "center",
    },

    title: {
      fontSize: isTablet ? scale(36) : scale(26),
      fontWeight: "bold",
      color: "#fff",
      letterSpacing: scale(2),
      textAlign: "center",
    },

    subtitle: {
      fontSize: isTablet ? scale(18) : scale(14),
      color: "#aaa",
      marginTop: verticalScale(8),
      textAlign: "center",
    },
  });
}