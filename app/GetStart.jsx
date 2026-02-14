import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GetStart() {
    const { width, height } = useWindowDimensions();

    const guidelineBaseWidth = 375;
    const scale = (size) => (width / guidelineBaseWidth) * size;
    const isTablet = width >= 768;

    const styles = createStyles(width, height);



    const router = useRouter();
    const navigation = useNavigation();


    return (
        <SafeAreaView style={styles.container}>

            {/* Image */}
            <Image
                source={{ uri: "https://cdn-icons-png.flaticon.com/512/4712/4712109.png" }} // replace with your own asset
                style={styles.image}
                resizeMode="contain"
            />

            {/* Heading */}
            <Text style={styles.heading}>Welcome to Whisp</Text>

            {/* Welcome Text */}
            <Text style={styles.text}>
                Welcome to <Text style={styles.highlight}>Whisp</Text>.{"\n"}
                A place where your chats are private, fast, and always with you.
            </Text>

            {/* Button */}
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("RegisterScreen")}>
                <Text style={styles.buttonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.icon} />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const createStyles = (width, height) => {
    const guidelineBaseWidth = 375;
    const scale = (size) => (width / guidelineBaseWidth) * size;
    const isTablet = width >= 768;

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: "#fff",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: scale(24),
        },

        image: {
            width: Math.min(width * 0.6, scale(260)),
            height: Math.min(width * 0.6, scale(260)),
            marginBottom: scale(30),
        },

        heading: {
            fontSize: scale(isTablet ? 34 : 28),
            fontWeight: "700",
            color: "#333",
            marginBottom: scale(16),
            textAlign: "center",
        },

        text: {
            fontSize: scale(16),
            color: "#666",
            textAlign: "center",
            marginBottom: scale(40),
            lineHeight: scale(22),
            maxWidth: isTablet ? width * 0.6 : "100%",
        },

        highlight: {
            fontWeight: "600",
            color: "#000",
        },

        button: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#4F46E5",
            paddingVertical: scale(16),
            paddingHorizontal: scale(36),
            borderRadius: scale(30),
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 5,
            elevation: 3,
        },

        buttonText: {
            color: "#fff",
            fontSize: scale(18),
            fontWeight: "600",
            marginRight: scale(8),
        },

        icon: {
            marginLeft: scale(4),
        },
    });
};

