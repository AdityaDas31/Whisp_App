// components/ContactsModal.js
import React from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    FlatList,
    StyleSheet,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ContactsModal({
    visible,
    onClose,
    contactsList = [],
    searchQuery,
    setSearchQuery,
    filteredContacts = [],
    onSelectContact,
}) {
    const renderItem = ({ item }) => {
        const initial = item.name?.[0]?.toUpperCase() || "?";
        const phone = item.phoneNumbers?.[0]?.number;

        return (
            <TouchableOpacity
                style={styles.contactRow}
                onPress={() => {
                    onSelectContact(item);
                    onClose();
                }}
            >
                {/* Avatar */}
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initial}</Text>
                </View>

                {/* Info */}
                <View style={styles.contactInfo}>
                    <Text style={styles.contactName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text
                        style={[
                            styles.contactPhone,
                            !phone && styles.noPhone,
                        ]}
                        numberOfLines={1}
                    >
                        {phone || "No phone number"}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <SafeAreaView style={styles.sheet} edges={["top"]}>
                    {/* HEADER */}
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            Share Contact ({contactsList.length})
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeBtn}
                        >
                            <Ionicons name="close" size={22} color="#111" />
                        </TouchableOpacity>
                    </View>

                    {/* SEARCH */}
                    <View style={styles.searchBar}>
                        <Ionicons
                            name="search"
                            size={18}
                            color="#666"
                            style={{ marginRight: 8 }}
                        />
                        <TextInput
                            placeholder="Search contacts"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#999"
                            style={styles.searchInput}
                        />
                    </View>

                    {/* LIST */}
                    <FlatList
                        data={filteredContacts}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                    />
                </SafeAreaView>
            </View>
        </Modal>
    );
}


const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "flex-end",
    },

    sheet: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === "ios" ? 30 : 20,
        maxHeight: "90%",
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
    },

    title: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111",
    },

    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },

    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F2F2F2",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === "ios" ? 10 : 6,
        marginBottom: 12,
    },

    searchInput: {
        flex: 1,
        fontSize: 15,
        color: "#111",
    },

    contactRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
    },

    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#0A84FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    avatarText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },

    contactInfo: {
        flex: 1,
        borderBottomWidth: 1,
        borderColor: "#F0F0F0",
        paddingBottom: 12,
    },

    contactName: {
        fontSize: 16,
        fontWeight: "500",
        color: "#111",
    },

    contactPhone: {
        fontSize: 14,
        color: "#666",
        marginTop: 2,
    },

    noPhone: {
        color: "#AAA",
    },
});
