// components/AttachModal.js
import React from "react";
import {
    Modal,
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AttachModal({
    visible,
    onClose,
    options = [],
    onSelect,
}) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.modalOverlay} onPress={onClose} />

            <View style={styles.attachModal}>
                {options.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.attachOption}
                        onPress={() => {
                            onSelect(item.type);
                            onClose();
                        }}
                    >
                        <Ionicons name={item.icon} size={28} color="#0A84FF" />
                        <Text style={styles.attachText}>{item.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
    attachModal: { position: "absolute", bottom: 0, width: "100%", backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, flexDirection: "row", justifyContent: "space-around", flexWrap: "wrap", bottom: 50 },
    attachOption: { width: "30%", alignItems: "center", marginVertical: 12, },
    attachText: { marginTop: 6, fontSize: 14, color: "#1C1C1E", textAlign: "center", },
});
