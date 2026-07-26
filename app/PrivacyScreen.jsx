import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppStatusBar from "../components/AppStatusBar";
import { useTheme } from "../context/ThemeContext";
import { getAppLockEnabled, setAppLockEnabled } from "../utils/appSettings";

export default function PrivacyScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { theme } = useTheme();

  const styles = createStyles(width, theme);

  // Temporary Switch States
  const [readReceipts, setReadReceipts] = useState(true);
  const [typingIndicator, setTypingIndicator] = useState(true);
  const [appLock, setAppLock] = useState(false);
  const [securityNotification, setSecurityNotification] = useState(true);
  const [screenSecurity, setScreenSecurity] = useState(false);
  const [syncContacts, setSyncContacts] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const enabled = await getAppLockEnabled();
      // console.log("Saved App Lock Setting:", enabled);
      setAppLock(enabled);
    };

    loadSettings();
  }, []);

  // useEffect(() => {
  //   const check = async () => {
  //     console.log("========== DEVICE INFO ==========");

  //     const hardware = await LocalAuthentication.hasHardwareAsync();
  //     console.log("Hardware:", hardware);

  //     const enrolled = await LocalAuthentication.isEnrolledAsync();
  //     console.log("Enrolled:", enrolled);

  //     const types =
  //       await LocalAuthentication.supportedAuthenticationTypesAsync();

  //     console.log("Supported Types:", types);

  //     console.log("===============================");
  //   };

  //   check();
  // }, []);

  const handleAppLock = async (value) => {
    // console.log("======================================");
    // console.log("App Lock Switch:", value ? "ON" : "OFF");

    // User turned OFF App Lock
    if (!value) {
      console.log("Disabling App Lock...");

      setAppLock(false);
      await setAppLockEnabled(false);

      // console.log("App Lock Disabled");
      // console.log("======================================");
      return;
    }

    try {
      // console.log("Checking device capability...");

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      // console.log("Has biometric hardware:", hasHardware);

      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      // console.log("Supported authentication types:", supportedTypes);

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      // console.log("Has enrolled biometrics:", isEnrolled);

      if (!hasHardware || !isEnrolled) {
        // console.log("Device is NOT ready for biometric authentication.");

        Alert.alert(
          "Screen Lock Required",
          "Please set up Fingerprint, Face Unlock or a Screen Lock in your phone settings first.",
        );

        return;
      }

      // console.log("Launching authentication dialog...");

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Enable App Lock",
        cancelLabel: "Cancel",
        fallbackLabel: "Use device password",
        disableDeviceFallback: false,
      });

      // console.log("Authentication Result:");
      // console.log(result);

      if (result.success) {
        // console.log("Authentication SUCCESS");

        setAppLock(true);
        await setAppLockEnabled(true);

        // console.log("App Lock Enabled");
      } else {
        // console.log("Authentication FAILED");
        // console.log("Failure Reason:", result.error);

        setAppLock(false);
        await setAppLockEnabled(false);
      }
    } catch (error) {
      // console.log("Unexpected Error:");
      // console.log(error);

      Alert.alert("Error", "Unable to enable App Lock.");
    }

    // console.log("======================================");
  };
  const renderSwitch = (
    icon,
    text,
    value,
    onValueChange,
    iconLibrary = "ionicons",
  ) => (
    <View style={styles.option}>
      {iconLibrary === "ionicons" ? (
        <Ionicons name={icon} size={24} color="#0A84FF" />
      ) : (
        <MaterialIcons name={icon} size={24} color="#0A84FF" />
      )}

      <Text style={styles.optionText}>{text}</Text>

      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor="#fff"
        trackColor={{
          false: "#767577",
          true: theme.colors.primary,
        }}
      />
    </View>
  );

  const renderOption = (
    icon,
    text,
    screen = null,
    iconLibrary = "ionicons",
  ) => (
    <TouchableOpacity
      style={styles.option}
      onPress={() => {
        if (screen) navigation.navigate(screen);
      }}
    >
      {iconLibrary === "ionicons" ? (
        <Ionicons name={icon} size={24} color="#0A84FF" />
      ) : (
        <MaterialIcons name={icon} size={24} color="#0A84FF" />
      )}

      <Text style={styles.optionText}>{text}</Text>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.secondaryText}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppStatusBar />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0A84FF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Privacy</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Privacy</Text>

          {renderOption("time-outline", "Last Seen & Online")}
          {renderOption("person-circle-outline", "Profile Photo")}
          {renderOption("information-circle-outline", "About")}
          {renderOption("images-outline", "Status Privacy")}
          {renderOption("location-outline", "Live Location")}
          {renderOption("call-outline", "Calls")}
        </View>

        {/* Messaging */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Messaging</Text>

          {renderSwitch(
            "checkmark-done-outline",
            "Read Receipts",
            readReceipts,
            setReadReceipts,
          )}

          {renderSwitch(
            "chatbubble-ellipses-outline",
            "Typing Indicator",
            typingIndicator,
            setTypingIndicator,
          )}

          {renderOption("ban-outline", "Blocked Contacts")}
          {renderOption("eye-off-outline", "Hidden Chats")}
          {renderOption("timer-outline", "Disappearing Messages")}
          {renderOption("hourglass-outline", "Default Message Timer")}
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          {renderSwitch(
            "lock-closed-outline",
            "App Lock",
            appLock,
            handleAppLock,
          )}

          {renderSwitch(
            "shield-checkmark-outline",
            "Screen Security",
            screenSecurity,
            setScreenSecurity,
          )}

          {renderOption(
            "verified-user",
            "Two-Step Verification",
            null,
            "material",
          )}

          {renderOption("security", "End-to-End Encryption", null, "material")}

          {renderSwitch(
            "notifications-outline",
            "Security Notifications",
            securityNotification,
            setSecurityNotification,
          )}
        </View>

        {/* Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Groups</Text>

          {renderOption("people-outline", "Who Can Add Me")}
          {renderOption("mail-open-outline", "Group Invites")}
        </View>

        {/* Advanced */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>

          {renderSwitch(
            "sync-outline",
            "Sync Contacts",
            syncContacts,
            setSyncContacts,
          )}

          {renderOption("share-social-outline", "Data Sharing")}
          {renderOption("shield-outline", "Privacy Checkup")}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (width, theme) => {
  const guidelineBaseWidth = 375;
  const scale = (size) => (width / guidelineBaseWidth) * size;
  const isTablet = width >= 768;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: scale(16),
      paddingVertical: scale(14),
      borderBottomWidth: 1,
      backgroundColor: theme.colors.card,
      borderBottomColor: theme.colors.border,
    },

    headerTitle: {
      fontSize: scale(isTablet ? 20 : 18),
      fontWeight: "600",
      marginLeft: scale(15),
      color: theme.colors.text,
    },

    section: {
      marginTop: scale(20),
      backgroundColor: theme.colors.card,
      borderRadius: isTablet ? scale(12) : 0,
      marginHorizontal: isTablet ? width * 0.05 : 0,
    },

    sectionTitle: {
      fontSize: scale(14),
      fontWeight: "600",
      paddingHorizontal: scale(20),
      paddingTop: scale(12),
      paddingBottom: scale(6),
      color: theme.colors.secondaryText,
    },

    option: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: scale(16),
      paddingHorizontal: scale(20),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },

    optionText: {
      flex: 1,
      fontSize: scale(16),
      marginLeft: scale(15),
      color: theme.colors.text,
    },
  });
};
