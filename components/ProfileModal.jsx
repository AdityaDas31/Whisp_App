import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileModal({ visible, onClose, profileData }) {
    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Image source={{ uri: profileData?.profileImage }} style={styles.modalImage} />
                    <Text style={styles.modalName}>{profileData?.name}</Text>

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.modalButton}>
                            <Ionicons name="notifications-off-outline" size={22} color="#FF3B30" />
                            <Text style={styles.modalButtonText}>Mute</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalButton}>
                            <Ionicons name="close-circle-outline" size={22} color="#FF3B30" />
                            <Text style={styles.modalButtonText}>Block</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.closeModal} onPress={onClose}>
                        <Text style={styles.closeModalText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
    modalContent: { backgroundColor: "#FFFFFF", padding: 20, borderRadius: 16, width: "80%", alignItems: "center", ...Platform.select({ android: { elevation: 6 }, ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } } }) },
    modalImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
    modalName: { fontSize: 20, fontWeight: "600", color: "#1C1C1E", marginBottom: 20 },
    modalActions: { flexDirection: "row", marginBottom: 20 },
    modalButton: { alignItems: "center", marginHorizontal: 16 },
    modalButtonText: { fontSize: 14, marginTop: 4, color: "#333" },
    closeModal: { backgroundColor: "#0A84FF", paddingVertical: 8, paddingHorizontal: 24, borderRadius: 20 },
    closeModalText: { color: "#FFF", fontWeight: "600" },

})