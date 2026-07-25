import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  useWindowDimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { SafeAreaView } from "react-native-safe-area-context";
import AppStatusBar from "../components/AppStatusBar";
import { useTheme } from "../context/ThemeContext";

export default function ProfileScreen() {
  const { width, height } = useWindowDimensions();

  const guidelineBaseWidth = 375;
  const scale = (size) => (width / guidelineBaseWidth) * size;
  const isTablet = width >= 768;
  const { theme } = useTheme();
  const styles = createStyles(width, theme);


  const navigation = useNavigation();
  const { user, fetchProfile, token, logout } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [about, setAbout] = useState(user?.about || "");
  const [profileImage, setProfileImage] = useState(user?.profileImage?.url || "");

  // Pick image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // Save profile
  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("about", about);

      if (profileImage && profileImage !== user?.profileImage?.url) {
        formData.append("profileImage", {
          uri: profileImage,
          type: "image/jpeg",
          name: "profile.jpg",
        });
      }

      await axios.put(`${API_BASE_URL}/user/updateProfile`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchProfile();
      Alert.alert("Success", "Profile updated successfully");
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
          navigation.navigate("LoginScreen");
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppStatusBar/>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0A84FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Picture */}
        <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
          <Image
            source={{
              uri: profileImage || "https://i.pravatar.cc/150?img=5",
            }}
            style={styles.avatar}
          />
          <View style={styles.editIcon}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="Enter your name"
            color={theme.colors.text}
            placeholderTextColor={theme.colors.secondaryText}
          />
        </View>

        {/* About */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>About</Text>
          <TextInput
            value={about}
            onChangeText={setAbout}
            style={styles.input}
            placeholder="Write something about you"
            color={theme.colors.text}
            placeholderTextColor={theme.colors.secondaryText}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.saveText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (width, theme) => {
  const guidelineBaseWidth = 375;
  const scale = (size) => (width / guidelineBaseWidth) * size;
  const isTablet = width >= 768;

  const avatarSize = isTablet
    ? Math.min(width * 0.22, 180)
    : Math.min(width * 0.32, 140);

  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: scale(18),
      paddingVertical: scale(14),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },

    headerTitle: {
      fontSize: scale(isTablet ? 20 : 18),
      fontWeight: "600",
      marginLeft: scale(14),
      color: theme.colors.text,
    },

    container: {
      paddingHorizontal: scale(24),
      paddingTop: scale(30),
      alignItems: "center",
    },

    avatarWrapper: {
      position: "relative",
      marginBottom: scale(30),
    },

    avatar: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
    },

    editIcon: {
      position: "absolute",
      bottom: scale(4),
      right: scale(4),
      backgroundColor: "#0A84FF",
      borderRadius: scale(18),
      padding: scale(8),
    },

    inputGroup: {
      width: "100%",
      maxWidth: isTablet ? width * 0.6 : "100%",
      marginBottom: scale(22),
    },

    label: {
      fontSize: scale(14),
      color: theme.colors.secondaryText,
      marginBottom: scale(6),
    },

    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: scale(14),
      paddingVertical: scale(14),
      paddingHorizontal: scale(14),
      fontSize: scale(16),
      backgroundColor: theme.colors.card,
    },

    saveBtn: {
      marginTop: scale(30),
      backgroundColor: "#0A84FF",
      paddingVertical: scale(16),
      borderRadius: scale(14),
      width: "100%",
      maxWidth: isTablet ? width * 0.6 : "100%",
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },

    logoutBtn: {
      marginTop: scale(30),
      backgroundColor: "#ff0a0a",
      paddingVertical: scale(16),
      borderRadius: scale(14),
      width: "100%",
      maxWidth: isTablet ? width * 0.6 : "100%",
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },

    saveText: {
      fontSize: scale(16),
      fontWeight: "600",
      color: "#fff",
    },
  });
};

