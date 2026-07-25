import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Switch,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  debugPrintMessages,
  resetDB,
  readLogFile,
  resetLogFile,
} from "../db/chatDB";
import { useTheme } from "../context/ThemeContext";
import AppStatusBar from "../components/AppStatusBar";

export default function ChatSettingsScreen() {
  const { width } = useWindowDimensions();

  const guidelineBaseWidth = 375;
  const scale = (size) => (width / guidelineBaseWidth) * size;
  const isTablet = width >= 768;

  const { mode, setMode, theme } = useTheme();

  const styles = createStyles(width, theme);

  const navigation = useNavigation();

  const clearAllData = async () => {
    try {
      // await AsyncStorage.clear();
      console.log("AsyncStorage cleared successfully!");
    } catch (error) {
      console.error("Error clearing AsyncStorage:", error);
    }
  };

  const resetLocalDatabase = async () => {
    await resetDB();
  };

  const viewLocalDatabase = async () => {
    await debugPrintMessages();
  };

  const logLocalDatabase = async () => {
    const logs = await readLogFile();
    console.log(logs);
  };

  const resetLocalDatabaseLogs = async () => {
    await resetLogFile();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppStatusBar />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0A84FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat Settings</Text>
      </View>

      <ScrollView>
        {/* Section 1 - Themes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <View style={styles.themeCard}>
            <Text style={styles.themeTitle}>Theme</Text>

            <View style={styles.themeSelector}>
              <TouchableOpacity
                onPress={() => setMode("light")}
                style={[
                  styles.themeButton,
                  mode === "light" && styles.activeTheme,
                ]}
              >
                <Ionicons
                  name="sunny-outline"
                  size={22}
                  color={mode === "light" ? "#FFF" : theme.colors.text}
                />

                <Text
                  style={[
                    styles.themeButtonText,
                    mode === "light" && {
                      color: "#FFF",
                    },
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMode("dark")}
                style={[
                  styles.themeButton,
                  mode === "dark" && styles.activeTheme,
                ]}
              >
                <MaterialIcons
                  name="dark-mode"
                  size={22}
                  color={mode === "dark" ? "#FFF" : theme.colors.text}
                />

                <Text
                  style={[
                    styles.themeButtonText,
                    {
                      color: mode === "dark" ? "#FFF" : theme.colors.text,
                    },
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMode("system")}
                style={[
                  styles.themeButton,
                  mode === "system" && styles.activeTheme,
                ]}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={22}
                  color={mode === "system" ? "#FFF" : theme.colors.text}
                />

                <Text
                  style={[
                    styles.themeButtonText,
                    {
                      color: mode === "system" ? "#FFF" : theme.colors.text,
                    },
                  ]}
                >
                  System
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate("ChatScreenThemeScreen")}
          >
            <Ionicons name="brush-outline" size={24} color="#0A84FF" />
            <Text style={styles.optionText}>Chat Screen Theme</Text>
          </TouchableOpacity>
        </View>

        {/* Section 2 - Chats & Backup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chat Management</Text>

          <TouchableOpacity style={styles.option}>
            <Ionicons name="cloud-upload-outline" size={24} color="#0A84FF" />
            <Text style={styles.optionText}>Chat Backup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate("SplashScreen")}
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={24}
              color="#0A84FF"
            />
            <Text style={styles.optionText}>Transfer Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={clearAllData}>
            <Ionicons name="time-outline" size={24} color="#0A84FF" />
            <Text style={styles.optionText}>Chat History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={viewLocalDatabase}>
            <Ionicons name="time-outline" size={24} color="#0A84FF" />
            <Text style={styles.optionText}>View Local Database</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={resetLocalDatabase}>
            <Ionicons name="time-outline" size={24} color="#0A84FF" />
            <Text style={styles.optionText}>Reset Local Database</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={logLocalDatabase}>
            <Ionicons name="time-outline" size={24} color="#0A84FF" />
            <Text style={styles.optionText}>Log Local Database</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={resetLocalDatabaseLogs}
          >
            <Ionicons name="time-outline" size={24} color="#0A84FF" />
            <Text style={styles.optionText}>Reaset Log Local Database</Text>
          </TouchableOpacity>
        </View>
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
      fontSize: scale(16),
      marginLeft: scale(15),
      color: theme.colors.text,
    },
    themeCard: {
      margin: 16,
      padding: 18,
      borderRadius: 18,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    themeTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 15,
      color: theme.colors.text,
    },

    themeSelector: {
      flexDirection: "row",
      justifyContent: "space-between",
    },

    themeButton: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 12,
      marginHorizontal: 4,
      borderRadius: 14,
    },

    activeTheme: {
      backgroundColor: theme.colors.primary,
    },

    themeButtonText: {
      marginTop: 5,
      color: theme.colors.text,
      fontWeight: "600",
    },
  });
};
