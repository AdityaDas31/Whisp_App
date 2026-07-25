// components/PollModal.js
import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

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
  const { theme } = useTheme();

  const styles = createStyles(theme);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Poll</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#111" />
            </TouchableOpacity>
          </View>

          {/* POLL QUESTION */}
          <TextInput
            placeholder="Ask a question"
            value={pollTopic}
            onChangeText={setPollTopic}
            placeholderTextColor="#A1A1A1"
            style={styles.questionInput}
          />

          {/* OPTIONS */}
          {pollOptions.map((opt, idx) => (
            <View key={idx} style={styles.optionRow}>
              <View style={styles.optionDot} />
              <TextInput
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChangeText={(text) => updatePollOption(idx, text)}
                placeholderTextColor="#A1A1A1"
                style={styles.optionInput}
              />
            </View>
          ))}

          {/* ADD OPTION */}
          <TouchableOpacity onPress={addPollOption} style={styles.addOptionBtn}>
            <Ionicons name="add-circle-outline" size={20} color="#0A84FF" />
            <Text style={styles.addOptionText}>Add option</Text>
          </TouchableOpacity>

          {/* SEND BUTTON */}
          <TouchableOpacity style={styles.sendBtn} onPress={submitPoll}>
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}


const createStyles = (theme) => {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: "flex-end",
    },

    sheet: {
      backgroundColor: theme.colors.background,
      padding: 16,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: Platform.OS === "ios" ? 32 : 20,
    },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },

    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
    },

    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },

    questionInput: {
      fontSize: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
      color: theme.colors.text,
    },

    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 8,
    },

    optionDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
      marginRight: 12,
    },

    optionInput: {
      flex: 1,
      fontSize: 15,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
      color: theme.colors.text,
    },

    addOptionBtn: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 14,
    },

    addOptionText: {
      marginLeft: 6,
      color: theme.colors.primary,
      fontSize: 15,
      fontWeight: "500",
    },

    sendBtn: {
      marginTop: 24,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      borderRadius: 12,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },

    sendText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
  });
};
