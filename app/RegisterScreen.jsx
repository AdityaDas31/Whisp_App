import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ImagePicker from "expo-image-picker";
import CountryPicker from "react-native-country-picker-modal";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext"; // ✅ import AuthContext

export default function RegisterScreen() {
  const { registerWithEmail, registerWithPhone, verifyOtp, loading } = useAuth();
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

  // Pick profile image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      if (type === "email") {
        const payload = {
          name: fullName,
          email,
          password,
          phoneNumber: phone,
          countryCode: callingCode,
          profileImage,
        };
        console.log("Sending Email OTP request with data:", payload);
        await registerWithEmail(payload);
        setOtpType("email");
      } else {
        const payload = {
          name: fullName,
          email,
          password,
          phoneNumber: phone,
          countryCode: callingCode,
          profileImage,
        };
        console.log("Sending Phone OTP request with data:", payload);
        await registerWithPhone(payload);
        setOtpType("phone");
      }

      setShowOtpForm(true);
      alert("OTP sent successfully!");
    } catch (err) {
      console.error("Error while sending OTP:", err);
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
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid={true}
      extraScrollHeight={20}
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
            Thank you for choosing <Text style={styles.highlight}>Whisp</Text>.{"\n"}
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

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Text style={styles.imagePickerText}>Choose Profile Image</Text>
            </TouchableOpacity>
          </View>

          {/* Send OTP */}
          <View style={styles.otpButton}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleSendOtp("email")}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Sending..." : "Send In Email"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleSendOtp("phone")}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Sending..." : "Send In Phone"}
              </Text>
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
            {Array(4).fill().map((_, index) => (
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
                  if (nativeEvent.key === "Backspace" && index > 0 && !otp[index]) {
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
              {loading ? "Verifying..." : "Verify OTP"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowOtpForm(false)}>
            <Text style={styles.loginLink}>Back to Registration</Text>
          </TouchableOpacity>
        </>
      )}
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
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  imagePicker: {
    marginTop: 10,
    alignItems: "center",
  },
  imagePickerText: {
    color: "#4A90E2",
    fontSize: 14,
    marginTop: 5,
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
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  codeBox: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  codeText: {
    fontSize: 16,
    marginLeft: 4,
    color: "#333",
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
  otpButton: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    width: "45%",
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
  loginLink: {
    fontSize: 14,
    color: "#333",
    marginTop: 10,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  otpInput: {
    width: 50,
    height: 55,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    textAlign: "center",
    fontSize: 20,
    marginHorizontal: 5,
    backgroundColor: "#fff",
  },

});
