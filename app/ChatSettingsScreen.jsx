import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatSettingsScreen() {
    const navigation = useNavigation();

    const clearAllData = async () => {
        try {
            await AsyncStorage.clear();
            console.log('AsyncStorage cleared successfully!');
        } catch (error) {
            console.error('Error clearing AsyncStorage:', error);
        }
    };

    return (
        <SafeAreaProvider style={styles.safeArea} edges={["top"]}>
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

                    <TouchableOpacity style={styles.option}>
                        <Ionicons name="color-palette-outline" size={24} color="#0A84FF" />
                        <Text style={styles.optionText}>Theme</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.option} onPress={() => navigation.navigate("ChatScreenThemeScreen")}>
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

                    <TouchableOpacity style={styles.option} onPress={() => navigation.navigate("SplashScreen")}>
                        <Ionicons name="swap-horizontal-outline" size={24} color="#0A84FF" />
                        <Text style={styles.optionText}>Transfer Chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.option} onPress={clearAllData}>
                        <Ionicons name="time-outline" size={24} color="#0A84FF" />
                        <Text style={styles.optionText}>Chat History</Text>
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
    section: {
        marginTop: 20,
        backgroundColor: "#fff",
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 5,
        color: "#8E8E93",
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
