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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function ContactsModal({
  visible,
  onClose,
  contactsList = [],
  searchQuery,
  setSearchQuery,
  filteredContacts = [],
  onSelectContact,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose} // Android back button support
    >
      <SafeAreaProvider style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Contacts ({contactsList.length})
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              placeholder="Search contacts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Contacts List */}
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => {
                onSelectContact(item);
                onClose();
              }}
            >
              {/* Avatar */}
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>

              {/* Contact info */}
              <View>
                <Text style={styles.contactName}>{item.name}</Text>
                {item.phoneNumbers?.[0]?.number ? (
                  <Text style={styles.contactPhone}>
                    📞 {item.phoneNumbers[0].number}
                  </Text>
                ) : (
                  <Text style={styles.noNumber}>No number</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  searchWrapper: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, padding: 8 },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#f2f2f2",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0A84FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contactName: { fontSize: 16, fontWeight: "500", color: "#333" },
  contactPhone: { fontSize: 14, color: "#666" },
  noNumber: { fontSize: 14, color: "#aaa" },
});
