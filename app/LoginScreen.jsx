import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  useWindowDimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation, useNavigationBuilder } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const { width, height } = useWindowDimensions();

  const guidelineBaseWidth = 375;
  const scale = (size) => (width / guidelineBaseWidth) * size;
  const isTablet = width >= 768;

  const styles = createStyles(width, height);


  const navigation = useNavigation();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();

  // Login

  const handelLogin = async () => {
    try {
      const payload = {
        phoneNumber: emailOrPhone,
        password
      }

      console.log(payload)

      await login(payload)
      alert("Login Successful");
      navigation.navigate("(tabs)");
    } catch (error) {
      alert(error.message || "Login failed")
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        {/* Logo / Icon */}
        {/* <Ionicons name="person-circle-outline" size={120} color="#ccc" /> */}
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/4712/4712109.png" }} // replace with your own asset
          style={styles.image}
          resizeMode="contain"
        />


        {/* Heading */}
        <Text style={styles.heading}>Welcome Back</Text>

        {/* Subtext */}
        <Text style={styles.welcomeText}>
          Log in to continue using <Text style={styles.highlight}>Whisp</Text>.
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email or Phone"
            keyboardType="phone-pad"
            placeholderTextColor="#A1A1A1"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
          />

          {/* Password with show/hide */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#A1A1A1"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color="#555"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.button} onPress={handelLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        {/* Forgot Password */}
        <TouchableOpacity>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Link to Register */}
        <TouchableOpacity onPress={() => navigation.navigate("RegisterScreen")}>
          <Text style={styles.loginLink}>
            Don’t have an account?{" "}
            <Text style={styles.highlight}>Register</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const createStyles = (width, height) => {
  const guidelineBaseWidth = 375;
  const scale = (size) => (width / guidelineBaseWidth) * size;
  const isTablet = width >= 768;

  return StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: scale(24),
      backgroundColor: "#f9f9f9",
    },

    image: {
      width: Math.min(width * 0.45, scale(220)),
      height: Math.min(width * 0.45, scale(220)),
      marginBottom: scale(30),
    },

    heading: {
      fontSize: scale(isTablet ? 30 : 26),
      fontWeight: "700",
      color: "#333",
      marginBottom: scale(10),
      textAlign: "center",
    },

    welcomeText: {
      fontSize: scale(15),
      color: "#555",
      textAlign: "center",
      marginBottom: scale(28),
      lineHeight: scale(22),
      maxWidth: isTablet ? width * 0.6 : "100%",
    },

    highlight: {
      color: "#4A90E2",
      fontWeight: "700",
    },

    form: {
      width: "100%",
      maxWidth: isTablet ? width * 0.6 : "100%",
      marginBottom: scale(20),
    },

    input: {
      width: "100%",
      paddingVertical: scale(14),
      paddingHorizontal: scale(14),
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: scale(12),
      marginBottom: scale(14),
      backgroundColor: "#fff",
      fontSize: scale(15),
      color: "#333",
    },

    passwordContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: scale(12),
      backgroundColor: "#fff",
      paddingHorizontal: scale(12),
      marginBottom: scale(14),
    },

    button: {
      width: "100%",
      maxWidth: isTablet ? width * 0.6 : "100%",
      paddingVertical: scale(16),
      backgroundColor: "#4A90E2",
      borderRadius: scale(12),
      alignItems: "center",
      marginBottom: scale(16),
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },

    buttonText: {
      color: "#fff",
      fontSize: scale(16),
      fontWeight: "600",
    },

    forgotText: {
      fontSize: scale(14),
      color: "#4A90E2",
      marginBottom: scale(16),
      textAlign: "center",
    },

    loginLink: {
      fontSize: scale(14),
      color: "#333",
      marginTop: scale(10),
      textAlign: "center",
    },
  });
};

