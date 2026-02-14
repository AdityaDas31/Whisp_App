import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ImagePicker from "expo-image-picker";
import { CountryPicker } from "react-native-country-codes-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const { width } = useWindowDimensions();
  const styles = createStyles(width);
  const navigation = useNavigation();
  const { registerWithEmail, registerWithPhone, verifyOtp, loading } = useAuth();

  const otpRefs = useRef([]);

  const [showPicker, setShowPicker] = useState(false);
  const [countryCode, setCountryCode] = useState("IN");
  const [callingCode, setCallingCode] = useState("91");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otpType, setOtpType] = useState(null);
  const [otp, setOtp] = useState("");
  const [selectedOtpMethod, setSelectedOtpMethod] = useState(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSendOtp = async (type) => {
    try {
      setSelectedOtpMethod(type);

      const payload = {
        name: fullName,
        email,
        password,
        phoneNumber: phone,
        countryCode: callingCode,
        profileImage,
      };

      if (type === "email") {
        await registerWithEmail(payload);
        setOtpType("email");
      } else {
        await registerWithPhone(payload);
        setOtpType("phone");
      }

      setShowOtpForm(true);
      alert("OTP sent successfully!");
    } catch (err) {
      setSelectedOtpMethod(null);
      alert(err.message || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await verifyOtp({
        otp,
        name: fullName,
        password,
        countryCode: callingCode,
        email,
        phoneNumber: phone,
        profileImage,
      });

      alert("Registration successful!");
      navigation.navigate("(tabs)");
    } catch (err) {
      alert(err.message || "OTP verification failed");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
      >
        {!showOtpForm ? (
          <>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Ionicons name="person-circle-outline" size={120} color="#ccc" />
            )}

            <Text style={styles.heading}>Create Your Account</Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              {/* Country Picker */}
              <View style={styles.phoneRow}>
                <TouchableOpacity
                  style={styles.codeBox}
                  onPress={() => setShowPicker(true)}
                >
                  <Text style={styles.codeText}>+{callingCode}</Text>
                </TouchableOpacity>

                <TextInput
                  style={[styles.input, { flex: 1, marginLeft: 8 }]}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <CountryPicker
                show={showPicker}
                pickerButtonOnPress={(item) => {
                  setCallingCode(item.dial_code.replace("+", ""));
                  setCountryCode(item.code);
                  setShowPicker(false);
                }}
                onBackdropPress={() => setShowPicker(false)}
              />

              {/* Password */}
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#555"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                <Text style={styles.imagePickerText}>
                  Choose Profile Image
                </Text>
              </TouchableOpacity>
            </View>

            {/* OTP Buttons */}
            <View style={styles.otpButton}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => handleSendOtp("email")}
              >
                <Text style={styles.buttonText}>Send In Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                onPress={() => handleSendOtp("phone")}
              >
                <Text style={styles.buttonText}>Send In Phone</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
              <Text style={styles.loginLink}>
                Already have an account? <Text style={styles.highlight}>Login</Text>
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.heading}>Verify OTP</Text>

            <View style={styles.otpContainer}>
              {Array(4)
                .fill()
                .map((_, index) => (
                  <TextInput
                    key={index}
                    style={styles.otpInput}
                    keyboardType="number-pad"
                    maxLength={1}
                    ref={(ref) => (otpRefs.current[index] = ref)}
                    onChangeText={(value) => {
                      const newOtp = otp.split("");
                      newOtp[index] = value;
                      setOtp(newOtp.join(""));
                      if (value && index < 3) {
                        otpRefs.current[index + 1]?.focus();
                      }
                    }}
                  />
                ))}
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleVerifyOtp}
            >
              <Text style={styles.buttonText}>Verify OTP</Text>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const createStyles = (width) => {
  const scale = (size) => (width / 375) * size;

  return StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: scale(24),
      backgroundColor: "#f9f9f9",
    },
    profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      marginBottom: 14,
    },
    heading: {
      fontSize: scale(24),
      fontWeight: "700",
      marginBottom: 20,
    },
    form: {
      width: "100%",
    },
    input: {
      padding: scale(14),
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 12,
      marginBottom: 14,
      backgroundColor: "#fff",
    },
    phoneRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 14,
    },
    codeBox: {
      padding: 12,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 12,
      backgroundColor: "#fff",
    },
    codeText: {
      fontSize: 16,
    },
    passwordContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 14,
      backgroundColor: "#fff",
    },
    imagePicker: {
      alignItems: "center",
      marginBottom: 20,
    },
    imagePickerText: {
      color: "#4A90E2",
    },
    otpButton: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
    },
    button: {
      flex: 1,
      backgroundColor: "#4A90E2",
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      marginHorizontal: 6,
    },
    buttonText: {
      color: "#fff",
      fontWeight: "600",
    },
    otpContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 24,
    },
    otpInput: {
      width: 50,
      height: 55,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 12,
      textAlign: "center",
      fontSize: 20,
      marginHorizontal: 6,
      backgroundColor: "#fff",
    },
    loginLink: {
      fontSize: 14,
      color: "#333",
      marginTop: 10,
      textAlign: "center",
    },
  });

};
