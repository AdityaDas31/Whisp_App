// components/PollModal.js
import React from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from "react-native";

export default function PollModal({
    visible,
    onClose,
    pollTopic,
    setPollTopic,
    pollOptions,
    updatePollOption,
    addPollOption,
    submitPoll,
}) {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <TouchableOpacity style={styles.modalOverlay} onPress={onClose} />

            <View style={styles.pollModal}>
                <Text style={styles.title}>Create Poll</Text>

                {/* Poll Topic */}
                <TextInput
                    placeholder="Poll Topic"
                    value={pollTopic}
                    onChangeText={setPollTopic}
                    style={styles.pollInput}
                />

                {/* Poll Options */}
                {pollOptions.map((opt, idx) => (
                    <TextInput
                        key={idx}
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChangeText={(text) => updatePollOption(idx, text)}
                        style={styles.pollInput}
                    />
                ))}

                {/* Add Option */}
                <TouchableOpacity onPress={addPollOption} style={styles.addOptionBtn}>
                    <Text style={styles.addOptionText}>+ Add Option</Text>
                </TouchableOpacity>

                {/* Submit Poll */}
                <TouchableOpacity onPress={submitPoll} style={styles.submitPollBtn}>
                    <Text style={styles.submitPollText}>Send Poll</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
    pollModal: { position: "absolute", bottom: 0, width: "100%", backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, },
    pollInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginVertical: 6, },
    addOptionBtn: { marginVertical: 6, },
    submitPollBtn: { backgroundColor: "#0A84FF", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 10 },
});
