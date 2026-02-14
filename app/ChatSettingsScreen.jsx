import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { debugPrintMessages, resetDB, readLogFile, resetLogFile } from "../db/chatDB";

export default function ChatSettingsScreen() {
    const { width } = useWindowDimensions();

    const guidelineBaseWidth = 375;
    const scale = (size) => (width / guidelineBaseWidth) * size;
    const isTablet = width >= 768;

    const styles = createStyles(width);


    const navigation = useNavigation();

    const clearAllData = async () => {
        try {
            // await AsyncStorage.clear();
            console.log('AsyncStorage cleared successfully!');
        } catch (error) {
            console.error('Error clearing AsyncStorage:', error);
        }
    };

    const resetLocalDatabase = async () => {
        await resetDB();
    }

    const viewLocalDatabase = async () => {
        await debugPrintMessages();
    }

    const logLocalDatabase = async () => {
        const logs = await readLogFile();
        console.log(logs);
    }

    const resetLocalDatabaseLogs = async () => {
        await resetLogFile();

    }

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
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
                    <TouchableOpacity style={styles.option} onPress={resetLocalDatabaseLogs}>
                        <Ionicons name="time-outline" size={24} color="#0A84FF" />
                        <Text style={styles.optionText}>Reaset Log Local Database</Text>
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

    return StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: "#F7F8FA",
            // backgroundColor: "red",
        },

        header: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: scale(16),
            paddingVertical: scale(14),
            borderBottomWidth: 1,
            borderBottomColor: "#E5E5EA",
            backgroundColor: "#fff",
        },

        headerTitle: {
            fontSize: scale(isTablet ? 20 : 18),
            fontWeight: "600",
            marginLeft: scale(15),
            color: "#1C1C1E",
        },

        section: {
            marginTop: scale(20),
            backgroundColor: "#fff",
            borderRadius: isTablet ? scale(12) : 0,
            marginHorizontal: isTablet ? width * 0.05 : 0,
        },

        sectionTitle: {
            fontSize: scale(14),
            fontWeight: "600",
            paddingHorizontal: scale(20),
            paddingTop: scale(12),
            paddingBottom: scale(6),
            color: "#8E8E93",
        },

        option: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: scale(16),
            paddingHorizontal: scale(20),
            borderBottomWidth: 1,
            borderBottomColor: "#E5E5EA",
        },

        optionText: {
            fontSize: scale(16),
            marginLeft: scale(15),
            color: "#1C1C1E",
        },
    });
};
