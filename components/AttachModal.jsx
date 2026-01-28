// components/AttachModal.js
import React from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AttachModal({
    visible,
    onClose,
    options = [],
    onSelect,
}) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <SafeAreaView style={styles.container}>
                    <Text style={styles.title}>Share something</Text>

                    <View style={styles.cardsWrap}>
                        {options.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.card}
                                activeOpacity={0.85}
                                onPress={() => {
                                    onSelect(item.type);
                                    onClose();
                                }}
                            >
                                <View style={styles.iconCircle}>
                                    <Ionicons
                                        name={item.icon}
                                        size={26}
                                        color="#fff"
                                    />
                                </View>

                                <Text style={styles.cardText}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </SafeAreaView>
            </TouchableOpacity>
        </Modal>
    );
}


const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "flex-end",
    },

    container: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 20,
        paddingBottom: Platform.OS === "ios" ? 36 : 24,
        paddingHorizontal: 16,
    },

    title: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111",
        marginBottom: 16,
    },

    cardsWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },

    card: {
        width: "47%",
        backgroundColor: "#F7F8FA",
        borderRadius: 20,
        paddingVertical: 20,
        alignItems: "center",
        marginBottom: 16,

        // depth
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },

    iconCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: "#0A84FF",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },

    cardText: {
        fontSize: 15,
        fontWeight: "500",
        color: "#111",
        textAlign: "center",
    },
});
