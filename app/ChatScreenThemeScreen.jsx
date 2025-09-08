// screens/ChatScreenThemeScreen.jsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useChatTheme } from "../context/ChatThemeContext";
import { useNavigation } from "@react-navigation/native";

const PRESET_THEMES = [
  { id: "default", name: "Default", bg: "#F7F8FA", my: "#DCF8C6", other: "#FFFFFF" },
  { id: "dark", name: "Dark", bg: "#111111", my: "#1E90FF", other: "#2C2C2C" },
  { id: "sun", name: "Sun", bg: "#FFF7E6", my: "#FFD57E", other: "#FFF" },
  { id: "ocean", name: "Ocean", bg: "#E8F6FF", my: "#A2DBFF", other: "#FFFFFF" },
  // add more if you want
];

export default function ChatScreenThemeScreen() {
  const { theme, setTheme, setPartial, resetTheme } = useChatTheme();
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const pickWallpaper = async () => {
    if (hasPermission === false) {
      Alert.alert("Permission denied", "Please allow photo library access in settings.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      // handle both old/new API shapes
      const canceled = result.canceled ?? result.cancelled ?? false;
      if (canceled) return;

      const uri = result.assets ? result.assets[0].uri : result.uri;
      setPartial({ wallpaper: uri });
      Alert.alert("Wallpaper set", "Wallpaper applied to chat screen.");
    } catch (err) {
      console.warn("Pick wallpaper error", err);
      Alert.alert("Error", "Could not pick image.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0A84FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat Screen Theme</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.sectionTitle}>Themes</Text>
        <View style={{ marginBottom: 20 }}>
          {PRESET_THEMES.map((t) => {
            const isSelected =
              t.bg === theme.backgroundColor &&
              t.my === theme.myMessage &&
              t.other === theme.otherMessage &&
              !theme.wallpaper; // treat wallpaper set as non-preset
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.themeRow, isSelected && styles.selectedRow]}
                onPress={() => setTheme({ backgroundColor: t.bg, wallpaper: null, myMessage: t.my, otherMessage: t.other })}
              >
                <View style={styles.preview}>
                  <View style={[styles.previewBg, { backgroundColor: t.bg }]}>
                    <View style={[styles.previewBubble, { backgroundColor: t.other }]} />
                    <View style={[styles.previewBubble, { backgroundColor: t.my, alignSelf: "flex-end" }]} />
                  </View>
                </View>
                <Text style={styles.themeName}>{t.name}</Text>
                {isSelected && <Ionicons name="checkmark" size={20} color="#0A84FF" />}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Customize</Text>

        <TouchableOpacity style={styles.option} onPress={pickWallpaper}>
          <Ionicons name="image-outline" size={22} color="#0A84FF" />
          <Text style={styles.optionText}>Wallpaper</Text>
        </TouchableOpacity>

        {theme.wallpaper ? (
          <>
            <View style={styles.wallPreviewWrap}>
              <Image source={{ uri: theme.wallpaper }} style={styles.wallPreview} />
            </View>

            <TouchableOpacity
              onPress={() => {
                setPartial({ wallpaper: null });
                Alert.alert("Removed", "Wallpaper removed. Using color background.");
              }}
              style={[styles.option, { marginTop: 10 }]}
            >
              <Ionicons name="trash-outline" size={22} color="#FF3B30" />
              <Text style={[styles.optionText, { color: "#FF3B30" }]}>Remove Wallpaper</Text>
            </TouchableOpacity>
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.actionBtn, { marginTop: 24 }]}
          onPress={() => {
            resetTheme();
            Alert.alert("Reset", "Theme reset to default.");
          }}
        >
          <Text style={styles.actionText}>Reset to Default</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 12, color: "#1C1C1E" },

  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#8E8E93", marginBottom: 8 },

  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedRow: { borderColor: "#0A84FF" },
  preview: { marginRight: 12 },
  previewBg: {
    width: 120,
    height: 48,
    borderRadius: 8,
    padding: 6,
    justifyContent: "space-between",
  },
  previewBubble: { width: 44, height: 24, borderRadius: 12 },
  themeName: { flex: 1, fontSize: 16 },

  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 8,
  },
  optionText: { fontSize: 16, marginLeft: 12 },

  wallPreviewWrap: {
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
  },
  wallPreview: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },

  actionBtn: {
    backgroundColor: "#0A84FF",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionText: { color: "#fff", fontWeight: "700" },
});
