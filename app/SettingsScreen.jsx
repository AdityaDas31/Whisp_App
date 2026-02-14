import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext"; // make sure path is correct

export default function SettingsScreen() {
    const { width } = useWindowDimensions();

    const guidelineBaseWidth = 375;
    const scale = (size) => (width / guidelineBaseWidth) * size;
    const isTablet = width >= 768;

    const styles = createStyles(width);

    const navigation = useNavigation();
    const { user, fetchProfile } = useAuth();

    // fetch profile when screen mounts
    useEffect(() => {
        fetchProfile();
    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#0A84FF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView>
                {/* Profile Section */}
                <TouchableOpacity
                    style={styles.profileSection}
                    onPress={() => navigation.navigate("ProfileScreen")}
                >
                    <Image
                        source={{
                            uri: user?.profileImage?.url || "https://i.pravatar.cc/150?img=12",
                        }}
                        style={styles.avatar}
                    />
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{user?.name || "User"}</Text>
                        <Text style={styles.profileSubText}>
                            {user?.phoneNumber
                                ? `+${user.countryCode} ${user.phoneNumber}`
                                : user?.email || "No contact info"}
                        </Text>
                        <Text style={styles.profileSubText}>
                            {user?.status}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={22} color="#8E8E93" />
                </TouchableOpacity>

                {/* Options */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.option}>
                        <Ionicons name="key-outline" size={24} color="#0A84FF" />
                        <Text style={styles.optionText}>Account</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.option} onPress={() => navigation.navigate("ChatSettingsScreen")}>
                        <Ionicons name="chatbubble-outline" size={24} color="#0A84FF" />
                        <Text style={styles.optionText}>Chats</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.option}>
                        <Ionicons name="lock-closed-outline" size={24} color="#0A84FF" />
                        <Text style={styles.optionText}>Privacy</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (width) => {
    const guidelineBaseWidth = 375;
    const scale = (size) => (width / guidelineBaseWidth) * size;
    const isTablet = width >= 768;

    const avatarSize = isTablet
        ? Math.min(width * 0.12, 90)
        : Math.min(width * 0.16, 70);

    return StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: "#F7F8FA" },
        header: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: scale(20),
            paddingVertical: scale(14),
            borderBottomWidth: 1,
            borderBottomColor: "#E5E5EA",
            backgroundColor: "#fff",
        },

        headerTitle: {
            fontSize: scale(isTablet ? 20 : 18),
            fontWeight: "600",
            marginLeft: scale(14),
            color: "#1C1C1E",
        },

        profileSection: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: scale(20),
            paddingVertical: scale(18),
            borderBottomWidth: 1,
            borderBottomColor: "#E5E5EA",
            backgroundColor: "#fff",
        },

        avatar: {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
        },

        profileInfo: {
            flex: 1,
            marginLeft: scale(16),
        },

        profileName: {
            fontSize: scale(isTablet ? 20 : 17),
            fontWeight: "600",
            color: "#1C1C1E",
            marginBottom: scale(4),
        },

        profileSubText: {
            fontSize: scale(14),
            color: "#8E8E93",
            marginBottom: scale(2),
        },

        section: {
            marginTop: scale(24),
            backgroundColor: "#fff",
        },

        option: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: scale(18),
            paddingHorizontal: scale(20),
            borderBottomWidth: 1,
            borderBottomColor: "#E5E5EA",
        },

        optionText: {
            fontSize: scale(isTablet ? 18 : 16),
            marginLeft: scale(18),
            color: "#1C1C1E",
        },
    });
};

