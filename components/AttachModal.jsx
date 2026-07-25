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
import { useTheme } from "../context/ThemeContext";

export default function ({ visible, onClose, options = [], onSelect }) {
  const { theme } = useTheme();

  const styles = createStyles( theme);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
                  <Ionicons name={item.icon} size={26} color="#fff" />
                </View>

                <Text style={styles.cardText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </TouchableOpacity>
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

    container: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 20,
      paddingBottom: Platform.OS === "ios" ? 36 : 24,
      paddingHorizontal: 16,
    },

    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 16,
    },

    cardsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },

    card: {
      width: "47%",
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      paddingVertical: 20,
      alignItems: "center",
      marginBottom: 16,

      // depth
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },

    iconCircle: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 10,
    },

    cardText: {
      fontSize: 15,
      fontWeight: "500",
      color: theme.colors.text,
      textAlign: "center",
    },
  });
};
