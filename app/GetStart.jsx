import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function GetStart() {
    const router = useRouter();
    const navigation = useNavigation();


    return (
        <View style={styles.container}>

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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    image: {
        width: 220,
        height: 220,
        marginBottom: 30,
    },
    heading: {
        fontSize: 28,
        fontWeight: "700",
        color: "#333",
        marginBottom: 15,
    },
    text: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 40,
        paddingHorizontal: 10,
        lineHeight: 22,
    },
    highlight: {
        fontWeight: "600",
        color: "#000",
    },
    button: {
        flexDirection: "row",   // make text & icon align in a row
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#4F46E5",
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 5,
        elevation: 3,
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
        marginRight: 8, // space between text and icon
    },
    icon: {
        marginLeft: 4,
    },
});
