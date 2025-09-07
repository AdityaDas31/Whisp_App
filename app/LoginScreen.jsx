import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation, useNavigationBuilder } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
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
          placeholderTextColor="#aaa"
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
            placeholderTextColor="#aaa"
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  image: {
    width: 180,
    height: 180,
    marginBottom: 30,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  highlight: {
    color: "#4A90E2",
    fontWeight: "700",
  },
  form: {
    width: "100%",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  button: {
    width: "100%",
    padding: 15,
    backgroundColor: "#4A90E2",
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotText: {
    fontSize: 14,
    color: "#4A90E2",
    marginBottom: 15,
    textAlign: "center",
  },
  loginLink: {
    fontSize: 14,
    color: "#333",
    marginTop: 10,
    textAlign: "center",
  },
});
