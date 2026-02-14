import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ImagePicker from "expo-image-picker";
import CountryPicker from "react-native-country-picker-modal";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext"; // ✅ import AuthContext
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {

  const { width, height } = useWindowDimensions();

  const guidelineBaseWidth = 375;
  const scale = (size) => (width / guidelineBaseWidth) * size;
  const isTablet = width >= 768;
  const styles = createStyles(width);


  const { registerWithEmail, registerWithPhone, verifyOtp, loading } =
    useAuth();
  const navigation = useNavigation();

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
  let refs = [];

  const [selectedOtpMethod, setSelectedOtpMethod] = useState(null);
  // Pick profile image
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

  // Send OTP
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
      setSelectedOtpMethod(null); // reset on error
      alert(err.message || "Failed to send OTP");
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    try {
      const payload = {
        otp,
        name: fullName,
        password,
        countryCode: callingCode,
        email,
        phoneNumber: phone,
        profileImage,
      };

      await verifyOtp(payload);

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
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"

      >
        {!showOtpForm ? (
          <>
            {/* Profile Image Preview */}
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Ionicons name="person-circle-outline" size={120} color="#ccc" />
            )}

            <Text style={styles.heading}>Create Your Account</Text>
            <Text style={styles.welcomeText}>
              Thank you for choosing <Text style={styles.highlight}>Whisp</Text>.
              {"\n"}
              Let’s get you started with your new account.
            </Text>

            {/* Form */}
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor="#aaa"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#aaa"
              />

              {/* Country Code + Phone */}
              <View style={styles.phoneRow}>
                <TouchableOpacity style={styles.codeBox}>
                  <CountryPicker
                    countryCode={countryCode}
                    withFlag
                    withCallingCode
                    withFilter
                    onSelect={(country) => {
                      setCountryCode(country.cca2);
                      setCallingCode(country.callingCode[0]);
                    }}
                  />
                  <Text style={styles.codeText}>+{callingCode}</Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { flex: 1, marginLeft: 8 }]}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  placeholderTextColor="#aaa"
                />
              </View>

              {/* Password */}
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1, marginBottom: 0, borderWidth: 0 },
                  ]}
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

              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                <Text style={styles.imagePickerText}>Choose Profile Image</Text>
              </TouchableOpacity>
            </View>

            {/* Send OTP */}
            <View style={styles.otpButton}>
              {(selectedOtpMethod === null || selectedOtpMethod === "email") && (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => handleSendOtp("email")}
                  disabled={loading}
                >
                  {loading && selectedOtpMethod === "email" ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send In Email</Text>
                  )}
                </TouchableOpacity>
              )}

              {(selectedOtpMethod === null || selectedOtpMethod === "phone") && (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => handleSendOtp("phone")}
                  disabled={loading}
                >
                  {loading && selectedOtpMethod === "phone" ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send In Phone</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
              <Text style={styles.loginLink}>
                Already have an account?{" "}
                <Text style={styles.highlight}>Login</Text>
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.heading}>
              {otpType === "email" ? "Verify Email OTP" : "Verify Phone OTP"}
            </Text>
            <Text style={styles.welcomeText}>
              We’ve sent an OTP to your{" "}
              <Text style={styles.highlight}>
                {otpType === "email" ? "Email" : "Phone"}
              </Text>
              . Enter it below.
            </Text>

            <View style={styles.otpContainer}>
              {Array(4)
                .fill()
                .map((_, index) => (
                  <TextInput
                    key={index}
                    style={styles.otpInput}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={otp[index] || ""}
                    onChangeText={(value) => {
                      let otpArray = otp.split("");
                      otpArray[index] = value;
                      setOtp(otpArray.join(""));
                      if (value && index < 3) refs[index + 1].focus();
                    }}
                    onKeyPress={({ nativeEvent }) => {
                      if (
                        nativeEvent.key === "Backspace" &&
                        index > 0 &&
                        !otp[index]
                      ) {
                        refs[index - 1].focus();
                      }
                    }}
                    ref={(ref) => (refs[index] = ref)}
                  />
                ))}
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? <ActivityIndicator color="#fff" /> : "Verify OTP"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowOtpForm(false);
                setSelectedOtpMethod(null);
              }}
            >
              <Text style={styles.loginLink}>Back to Registration</Text>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const createStyles = (width) => {
  const guidelineBaseWidth = 375;
  const scale = (size) => (width / guidelineBaseWidth) * size;
  const isTablet = width >= 768;

  const avatarSize = isTablet
    ? Math.min(width * 0.22, 180)
    : Math.min(width * 0.32, 140);

  const otpBoxSize = isTablet
    ? Math.min(width * 0.08, 70)
    : Math.min(width * 0.12, 55);

  return StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: scale(24),
      backgroundColor: "#f9f9f9",
    },

    profileImage: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      marginBottom: scale(14),
    },

    imagePicker: {
      marginTop: scale(12),
      alignItems: "center",
    },

    imagePickerText: {
      color: "#4A90E2",
      fontSize: scale(14),
      marginTop: scale(6),
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
    },

    phoneRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: scale(14),
    },

    codeBox: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: scale(10),
      paddingHorizontal: scale(8),
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: scale(12),
      backgroundColor: "#fff",
    },

    codeText: {
      fontSize: scale(15),
      marginLeft: scale(6),
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

    otpButton: {
      flexDirection: isTablet ? "row" : "row",
      justifyContent: "space-between",
      width: "100%",
      maxWidth: isTablet ? width * 0.6 : "100%",
      marginBottom: scale(16),
    },

    button: {
      flex: 1,
      paddingVertical: scale(16),
      backgroundColor: "#4A90E2",
      borderRadius: scale(12),
      alignItems: "center",
      marginHorizontal: scale(6),
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

    loginLink: {
      fontSize: scale(14),
      color: "#333",
      marginTop: scale(14),
      textAlign: "center",
    },

    otpContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: scale(24),
    },

    otpInput: {
      width: otpBoxSize,
      height: otpBoxSize * 1.1,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: scale(12),
      textAlign: "center",
      fontSize: scale(20),
      marginHorizontal: scale(6),
      backgroundColor: "#fff",
    },
  });
};

