import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import * as Contacts from "expo-contacts";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useChats } from "../../context/ChatContext";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE_URL = "http://192.168.0.100:5000/api/v1";

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [matchedContacts, setMatchedContacts] = useState([]);
  const [contactModalVisible, setContactModalVisible] = useState(false);

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const { token, user } = useAuth();
  const { chats, fetchChats, openChat } = useChats();
  const navigation = useNavigation();

  useEffect(() => {
    getContactsAndSync();
    fetchChats();
  }, []);

  const normalizeNumber = (num) => num.replace(/[^0-9]/g, "");

  const getContactsAndSync = async () => {
    try {
      setLoading(true);
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need contacts permission to sync.");
        setLoading(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      if (data.length > 0) {
        const phoneContacts = data
          .filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0)
          .map((c) => ({
            name: c.name,
            numbers: c.phoneNumbers.map((p) => normalizeNumber(p.number)),
          }));

        const numbersToSend = phoneContacts.flatMap((c) => c.numbers);

        const res = await axios.post(
          `${API_BASE_URL}/user/sync`,
          { contacts: numbersToSend },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const matchedUsers = res.data.matchedUsers;

        const mergedContacts = matchedUsers.map((user) => {
          const phoneContact = phoneContacts.find((c) =>
            c.numbers.some(
              (num) =>
                num === String(user.phoneNumber) ||
                num === `${user.countryCode}${user.phoneNumber}`
            )
          );
          return {
            ...user,
            contactName: phoneContact ? phoneContact.name : user.name,
          };
        });

        setMatchedContacts(mergedContacts);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getPreviewText = (message) => {
    if (!message) return null;

    switch (message.type) {
      case "text":
        return message.content;
      case "location":
        return "📍 Location shared";
      case "contact":
        return `👤 ${message.contact?.name || "Contact"}`;
      case "poll":
        return `🗳 ${message.poll?.topic || "Poll created"}`;
      case "media":
        return `📷 ${"Media File"}`;
      default:
        return "Unsupported message";
    }
  };

  const formatChatTime = (timestamp) => {
    const msgDate = new Date(timestamp);
    const now = new Date();

    const isToday =
      msgDate.getDate() === now.getDate() &&
      msgDate.getMonth() === now.getMonth() &&
      msgDate.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      msgDate.getDate() === yesterday.getDate() &&
      msgDate.getMonth() === yesterday.getMonth() &&
      msgDate.getFullYear() === yesterday.getFullYear();

    if (isToday) {
      return msgDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (isYesterday) {
      return "Yesterday";
    } else {
      return msgDate.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
    }
  };



  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Whisp</Text>
        <View style={styles.headerIcons}>
          <Ionicons name="camera-outline" size={22} color="#1C1C1E" style={styles.icon} />
          <Ionicons name="search-outline" size={22} color="#1C1C1E" style={styles.icon} />
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color="#1C1C1E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator size="large" color="#0A84FF" />
        ) : chats.length > 0 ? (
          <FlatList
            data={chats}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {
              const otherUser = item.users.find((u) => u._id !== user._id);
              return (
                <TouchableOpacity
                  style={styles.chatCard}
                  onPress={async () => {
                    const chat = await openChat(otherUser._id);
                    navigation.navigate("ChatScreen", {
                      chatId: chat._id,
                      name: item.isGroupChat ? item.chatName : otherUser.name,
                      profileImage: item.isGroupChat
                        ? item.groupImage?.url
                        : otherUser.profileImage?.url,
                    });
                  }}
                >
                  {/* Profile */}
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedProfile({
                        name: item.isGroupChat ? item.chatName : otherUser?.name,
                        profileImage: item.isGroupChat
                          ? item.groupImage?.url
                          : otherUser?.profileImage?.url,
                      });
                      setProfileModalVisible(true);
                    }}
                  >
                    <Image
                      source={{
                        uri: item.isGroupChat
                          ? item.groupImage?.url
                          : otherUser?.profileImage?.url,
                      }}
                      style={styles.avatar}
                    />
                  </TouchableOpacity>

                  {/* Chat Info */}
                  <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                      <Text style={styles.chatName}>
                        {item.isGroupChat ? item.chatName : otherUser?.name}
                      </Text>
                      <Text style={styles.chatTime}>{formatChatTime(item.createdAt)}</Text>
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.chatMessage,
                        item.unread && { color: "#0A84FF", fontWeight: "600" },
                      ]}
                    >
                      {getPreviewText(item.latestMessage) || "No messages yet"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <Text style={styles.empty}>No chats yet.</Text>
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setContactModalVisible(true)}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Contacts Modal */}
      <Modal
        animationType="slide"
        visible={contactModalVisible}
        onRequestClose={() => setContactModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Contact</Text>
            <TouchableOpacity onPress={() => setContactModalVisible(false)}>
              <Ionicons name="close" size={26} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={matchedContacts}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.contactCard}
                onPress={async () => {
                  const chat = await openChat(item._id);
                  setContactModalVisible(false); // close modal
                  fetchChats()
                  navigation.navigate("ChatScreen", {
                    chatId: chat._id,
                    name: item.contactName,
                    profileImage: item.profileImage?.url,
                  });
                }}
              >
                <Image
                  source={{ uri: item.profileImage?.url }}
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{item.contactName}</Text>
                  <Text style={styles.contactPhone}>
                    +{item.countryCode} {item.phoneNumber}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No contacts found on app.</Text>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Profile Modal */}
      <Modal
        animationType="fade"
        visible={profileModalVisible}
        transparent
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.profileOverlay}>
          <View style={styles.profileModal}>
            {selectedProfile && (
              <>
                <Image
                  source={{ uri: selectedProfile.profileImage }}
                  style={styles.profileImage}
                />
                <Text style={styles.profileName}>{selectedProfile.name}</Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="chatbubble-ellipses" size={26} color="#0A84FF" />
                    <Text style={styles.actionLabel}>Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="call" size={26} color="#0A84FF" />
                    <Text style={styles.actionLabel}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="videocam" size={26} color="#0A84FF" />
                    <Text style={styles.actionLabel}>Video</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="information-circle" size={26} color="#0A84FF" />
                    <Text style={styles.actionLabel}>Info</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            <TouchableOpacity
              style={styles.closeProfileBtn}
              onPress={() => setProfileModalVisible(false)}
            >
              <Ionicons name="close" size={28} color="#1C1C1E" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Menu Modal */}
      <Modal
        animationType="fade"
        visible={menuVisible}
        transparent
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPressOut={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>New Group</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>New Broadcast</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>Linked Devices</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                navigation.navigate("SettingsScreen");
                setMenuVisible(false);
              }}
            >
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F8FA" },

  // Header
  header: {
    backgroundColor: "#F7F8FA",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#1C1C1E" },
  headerIcons: { flexDirection: "row", alignItems: "center" },
  icon: { marginHorizontal: 10 },

  // Body
  body: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },

  // Chat Card
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 14 },
  chatInfo: { flex: 1, justifyContent: "center" },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  chatName: { fontSize: 16, fontWeight: "600", color: "#1C1C1E" },
  chatTime: { fontSize: 12, color: "#6C6C6C" },
  chatMessage: { fontSize: 14, color: "#6C6C6C" },
  empty: { textAlign: "center", marginTop: 30, color: "#A1A1A1" },

  // FAB
  fab: {
    position: "absolute",
    bottom: 25,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A84FF",
    shadowColor: "#0A84FF",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },

  // Modal
  modalContainer: { flex: 1, backgroundColor: "#F7F8FA" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  modalTitle: { fontSize: 18, fontWeight: "600", color: "#1C1C1E" },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginVertical: 4,
    marginHorizontal: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  contactName: { fontSize: 16, fontWeight: "500", color: "#1C1C1E" },
  contactPhone: { fontSize: 14, color: "#6C6C6C", marginTop: 2 },

  // Profile Modal
  profileOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)", justifyContent: "center", alignItems: "center" },
  profileModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 5,
  },
  profileImage: { width: 110, height: 110, borderRadius: 55, marginBottom: 12 },
  profileName: { fontSize: 20, fontWeight: "600", marginBottom: 16, color: "#1C1C1E" },
  actionRow: { flexDirection: "row", justifyContent: "space-around", width: "100%" },
  actionButton: { alignItems: "center", marginHorizontal: 12 },
  actionLabel: { fontSize: 13, marginTop: 6, color: "#0A84FF", fontWeight: "500" },
  closeProfileBtn: { position: "absolute", top: 10, right: 10 },

  menuOverlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingTop: 50,
    paddingRight: 10,
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 5,
    width: 200,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  menuText: {
    fontSize: 16,
    color: "#1C1C1E",
  },

});
