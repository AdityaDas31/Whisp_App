import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext"; // make sure path is correct

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { user, fetchProfile } = useAuth();

    // fetch profile when screen mounts
    useEffect(() => {
        fetchProfile();
    }, []);

    return (
        <SafeAreaProvider style={styles.safeArea} edges={["top"]}>
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
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#F7F8FA" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5EA",
        backgroundColor: "#fff",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginLeft: 15,
        color: "#1C1C1E",
    },
    profileSection: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5EA",
        backgroundColor: "#fff",
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    profileInfo: {
        flex: 1,
        marginLeft: 15,
    },
    profileName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1C1C1E",
    },
    profileSubText: {
        fontSize: 14,
        color: "#8E8E93",
    },
    section: {
        marginTop: 20,
        backgroundColor: "#fff",
    },
    option: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5EA",
    },
    optionText: {
        fontSize: 16,
        marginLeft: 15,
        color: "#1C1C1E",
    },
});
