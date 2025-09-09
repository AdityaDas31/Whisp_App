// screens/ChatScreenThemeScreen.jsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useChatTheme } from "../context/ChatThemeContext";
import { useNavigation } from "@react-navigation/native";

const PRESET_THEMES = [
  { id: "default", name: "Default", bg: "#F7F8FA", my: "#DCF8C6", other: "#FFFFFF", wallpaper: null, button: "#0A84FF", buttonText: "#FFFFFF", myText: "#000000", otherText: "#000000", normalText: "#000000" },
  { id: "dark", name: "Dark", bg: "#111111", my: "#1E90FF", other: "#2C2C2C", wallpaper: null, button: "#1E90FF", buttonText: "#FFFFFF", myText: "#FFFFFF", otherText: "#FFFFFF", normalText: "#FFFFFF" },
  { id: "sun", name: "Sun", bg: "#FFF7E6", my: "#FFD57E", other: "#FFF", wallpaper: null, button: "#FF9500", buttonText: "#FFFFFF", myText: "#333333", otherText: "#000000", normalText: "#000000" },
  { id: "ocean", name: "Ocean", bg: "#E8F6FF", my: "#A2DBFF", other: "#FFFFFF", wallpaper: null, button: "#0077B6", buttonText: "#FFFFFF", button: "#40b2f9ff", buttonText: "#FFFFFF", myText: "#002B5B", otherText: "#000000", normalText: "#000000" },
  { id: "naruto", name: "Naruto", bg: "#E6D7B9", my: "#F89C1C", other: "#49B9F2", wallpaper: "https://i.pinimg.com/736x/eb/76/90/eb7690967b22c0895a0a05aeb64d2e7b.jpg", button: "#F89C1C", buttonText: "#FFFFFF", myText: "#1B2A49", otherText: "#000000", normalText: "#000000" },
  { id: "galaxy", name: "Galaxy", bg: "#0D1B2A", my: "#1B263B", other: "#415A77", wallpaper: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=800", button: "#333943ff", buttonText: "#FFFFFF", myText: "#E0E0E0", otherText: "#E0E0E0", normalText: "#FFFFFF" },
  { id: "rose", name: "Rose", bg: "#FFF0F5", my: "#FFB6C1", other: "#FFFFFF", wallpaper: null, button: "#FF69B4", buttonText: "#FFFFFF", myText: "#800020", otherText: "#000000", normalText: "#000000" },
  { id: "matrix", name: "Matrix", bg: "#000000", my: "#00FF41", other: "#0D0D0D", wallpaper: "https://wallpaperaccess.com/full/138728.jpg", button: "#00FF41", buttonText: "#000000", myText: "#333333", otherText: "#FFFFFF", normalText: "#E0E0E0" },
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.themeRowContainer}
        >
          {PRESET_THEMES.map((t) => {
            const isSelected =
              t.bg === theme.backgroundColor &&
              t.my === theme.myMessage &&
              t.other === theme.otherMessage &&
              t.wallpaper === theme.wallpaper &&
              t.button === theme.buttonBg &&
              t.buttonText === theme.buttonText &&
              t.myText === theme.myTextColor &&
              t.otherText === theme.otherTextColor &&
              t.normalText === theme.textColor;

            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.themeCard, isSelected && styles.selectedRow]}
                onPress={() =>
                  setTheme({
                    backgroundColor: t.bg,
                    wallpaper: t.wallpaper || null,
                    myMessage: t.my,
                    otherMessage: t.other,
                    buttonBg: t.button,
                    buttonText: t.buttonText,
                    myTextColor: t.myText,
                    otherTextColor: t.otherText,
                    textColor: t.normalText,
                  })
                }
              >
                <View style={styles.preview}>
                  <View style={[styles.previewBg, { backgroundColor: t.bg }]}>
                    <View style={[styles.previewBubble, { backgroundColor: t.other }]} />
                    <View
                      style={[
                        styles.previewBubble,
                        { backgroundColor: t.my, alignSelf: "flex-end" },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.themeName}>{t.name}</Text>
                {isSelected && <Ionicons name="checkmark" size={20} color="#0A84FF" />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>


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
                // setPartial({ wallpaper: null });
                setPartial({ wallpaper: t.wallpaper || null });
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


  themeRowContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },

  themeCard: {
    width: 140,              // fixed card width
    alignItems: "center",
    padding: 12,
    marginRight: 12,         // space between cards
    backgroundColor: "#fff",
    borderRadius: 12,
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
  themeName: { flex: 1, fontSize: 16, marginTop: 10 },

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
