import { Ionicons } from "@expo/vector-icons";
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
  useWindowDimensions,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useChats } from "../../context/ChatContext";
import { API_BASE_URL } from "../../config";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppStatusBar from "../../components/AppStatusBar";
import Avatar from "../../components/Avatar";

import { mediaDevices } from "react-native-webrtc";




export default function HomeScreen() {
  const { width, height } = useWindowDimensions();

  const [contactLoading, setContactLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const [matchedContacts, setMatchedContacts] = useState([]);
  const [contactModalVisible, setContactModalVisible] = useState(false);

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const { token, user } = useAuth();
  const { chats, openChat, loadChatsFromLocalDB, dbReady, safeLoadChatsFromLocalDB } = useChats();
  const navigation = useNavigation();

  const router = useRouter();

  async function requestMicPermission() {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: "Microphone Permission",
          message: "App needs microphone access for voice calls",
          buttonPositive: "Allow",
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  useEffect(() => {
    const init = async () => {
      const hasPermission = await requestMicPermission();

      if (!hasPermission) {
        console.log("Mic permission denied");
        return;
      }

      try {
        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });

        console.log("✅ WebRTC working");
      } catch (err) {
        console.error("WebRTC error:", err);
      }
    };

    init();
  }, []);

  // useEffect(() => {
  //   getContactsAndSync();
  // }, []);

  useEffect(() => {
    if (dbReady) {
      safeLoadChatsFromLocalDB().finally(() => {
        setChatLoading(false);
      });
    }
  }, [dbReady]);


  const normalizeNumber = (num) => num.replace(/[^0-9]/g, "");

  const getContactsAndSync = async () => {
    try {
      setContactLoading(true);

      const { status } = await Contacts.requestPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need contacts permission to sync.");
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      if (!data?.length) return;

      const phoneContacts = data
        .filter((c) => c.phoneNumbers?.length > 0)
        .map((c) => ({
          name: c.name,
          numbers: c.phoneNumbers.map((p) => normalizeNumber(p.number)),
        }));

      // const numbersToSend = phoneContacts.flatMap((c) => c.numbers);
      const numbersToSend = [
        ...new Set(phoneContacts.flatMap((c) => c.numbers)),
      ];

      const res = await axios.post(
        `${API_BASE_URL}/user/sync`,
        { contacts: numbersToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const matchedUsers = res.data?.matchedUsers || [];

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
      await AsyncStorage.setItem(
        "matchedContacts",
        JSON.stringify(mergedContacts)
      );
    } catch (err) {
      console.error(err);
    } finally {
      setContactLoading(false);
    }
  };
  const loadCachedContacts = async () => {
    try {
      const cached = await AsyncStorage.getItem("matchedContacts");

      if (cached) {
        setMatchedContacts(JSON.parse(cached));
      }
    } catch (e) {
      console.log("Cache load error", e);
    }
  };

  useEffect(() => {
    loadCachedContacts();
  }, []);

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

  const renderMessagePreview = (message) => {
    if (!message) return "No messages yet";

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
        if (message.media?.format === "image") return "📷 Photo";
        if (message.media?.format === "video") return "🎥 Video";
        return "📎 File";

      default:
        return "Unsupported message";
    }
  };


  const renderStatusTick = (message) => {
    if (!message) return null;

    // normalize sender id (object OR string)
    const senderId =
      typeof message.sender === "object"
        ? message.sender?._id
        : message.sender;

    // show ticks only for MY messages
    if (senderId !== user._id) return null;

    let iconName = "checkmark";
    let color = "#999";

    if (message.status === "delivered") {
      iconName = "checkmark-done";
    }

    if (message.status === "seen") {
      iconName = "checkmark-done";
      color = "#0A84FF";
    }

    return (
      <Ionicons
        name={iconName}
        size={14}
        color={color}
        style={{ marginRight: 4 }}
      />
    );
  };

  const styles = createStyles(width, height);


  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppStatusBar backgroundColor="#fff" style="dark" />
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
        {chatLoading ? (
          <ActivityIndicator size="large" color="#0A84FF" />
        ) : chats.length > 0 ? (
          <FlatList
            data={chats}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {

              const myId = user._id;

              const otherUser = item.isGroupChat
                ? null
                : item.users.find(u => u._id !== myId);

              const displayName = item.isGroupChat
                ? item.chatName
                : otherUser?.name;

              const displayImage = item.isGroupChat

                ? item.groupImage?.url

                : otherUser?.profileImage?.url;


              const openChatHandler = async () => {

                try {

                  // GROUP CHAT
                  if (item.isGroupChat) {
                    router.push({

                      pathname: "/ChatScreen",

                      params: {
                        chatId: item._id,
                        myId,
                        name: item.chatName,
                        isGroup: true,
                        users: JSON.stringify(item.users),
                        profileImage: item.groupImage?.url || null,
                        groupAdmins:JSON.stringify(item.groupAdmins),
                        leftUsers: JSON.stringify(item.leftUsers),

                      }

                    });

                    return;
                  }


                  // 1 TO 1 CHAT
                  const chat = await openChat(otherUser._id);

                  if (!chat?._id) {

                    Alert.alert("Error", "Chat could not be opened");
                    return;

                  }

                  router.push({

                    pathname: "/ChatScreen",

                    params: {
                      chatId: chat._id,
                      myId,
                      userId: otherUser._id,
                      name: otherUser.name,
                      profileImage: otherUser.profileImage?.url
                    }

                  });

                } catch (err) {

                  console.log(err);

                }

              };


              return (

                <TouchableOpacity
                  style={styles.chatCard}
                  onPress={openChatHandler}
                >

                  {/* Avatar */}
                  <TouchableOpacity
                    onPress={() => {

                      setSelectedProfile({

                        name: displayName,

                        profileImage: displayImage

                      });

                      setProfileModalVisible(true);

                    }}
                  >

                    {/* <Image
                      source={{ uri: displayImage }}
                      name={displayName}
                      size={44}
                      style={styles.avatar}
                    /> */}
                    <Avatar
                      uri={displayImage}
                      name={displayName}
                      size={44}
                      style={styles.avatar}
                    />
                  </TouchableOpacity>


                  {/* Chat Info */}
                  <View style={styles.chatInfo}>

                    <View style={styles.chatHeader}>

                      <Text style={styles.chatName}>
                        {displayName}
                      </Text>

                      <Text style={styles.chatTime}>

                        {item.latestMessage?.createdAt &&
                          formatChatTime(item.latestMessage.createdAt)
                        }

                      </Text>

                    </View>


                    <View style={{ flexDirection: "row", alignItems: "center" }}>

                      {renderStatusTick(item.latestMessage)}

                      <Text
                        numberOfLines={1}
                        style={[
                          styles.chatMessage,
                          item.unreadCount > 0 && {
                            color: "#0A84FF",
                            fontWeight: "600"
                          }
                        ]}
                      >

                        {renderMessagePreview(item.latestMessage)}

                      </Text>

                    </View>

                  </View>


                  {/* unread badge */}
                  {item.unreadCount > 0 && (

                    <View style={styles.unreadBadge}>

                      <Text style={styles.unreadText}>
                        {item.unreadCount}
                      </Text>

                    </View>

                  )}

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
        onPress={() => {
          setContactModalVisible(true);

          if (matchedContacts.length === 0) {
            getContactsAndSync();
          }
        }}
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

          {contactLoading ? (
            <ActivityIndicator size="large" color="#0A84FF" />
          ) : (
            <FlatList
              data={matchedContacts}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.contactCard}
                  onPress={async () => {
                    const chat = await openChat(item._id);
                    setContactModalVisible(false); // close modal
                    safeLoadChatsFromLocalDB()
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
          )}

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
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                navigation.navigate("CreateGroupScreen");
                setMenuVisible(false);
              }}
            >
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

const createStyles = (width, height) => {
  const guidelineBaseWidth = 375;
  const scale = (size) => (width / guidelineBaseWidth) * size;

  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#F7F8FA" },

    header: {
      backgroundColor: "#F7F8FA",
      padding: scale(16),
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: "#E5E5EA",
    },

    headerTitle: {
      fontSize: scale(22),
      fontWeight: "700",
      color: "#1C1C1E",
    },

    headerIcons: { flexDirection: "row", alignItems: "center" },

    icon: { marginHorizontal: scale(10) },

    body: {
      flex: 1,
      paddingHorizontal: scale(12),
      paddingTop: scale(12),
    },

    chatCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: scale(14),
      marginVertical: scale(6),
      backgroundColor: "#FFFFFF",
      borderRadius: scale(12),
      elevation: 2,
    },

    avatar: {
      width: scale(50),
      height: scale(50),
      borderRadius: scale(25),
      marginRight: scale(14),
    },

    chatInfo: { flex: 1 },

    chatHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: scale(4),
    },

    chatName: {
      fontSize: scale(16),
      fontWeight: "600",
      color: "#1C1C1E",
      maxWidth: width * 0.6,
    },

    chatTime: {
      fontSize: scale(12),
      color: "#6C6C6C",
    },

    chatMessage: {
      fontSize: scale(14),
      color: "#6C6C6C",
      flex: 1,
    },

    empty: {
      textAlign: "center",
      marginTop: scale(30),
      color: "#A1A1A1",
      fontSize: scale(14),
    },

    fab: {
      position: "absolute",
      bottom: height * 0.04,
      right: width * 0.06,
      width: scale(60),
      height: scale(60),
      borderRadius: scale(30),
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#0A84FF",
      elevation: 5,
    },

    modalContainer: { flex: 1, backgroundColor: "#F7F8FA" },

    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: scale(16),
      borderBottomWidth: 1,
      borderBottomColor: "#E5E5EA",
    },

    modalTitle: {
      fontSize: scale(18),
      fontWeight: "600",
      color: "#1C1C1E",
    },

    contactCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: scale(14),
      marginVertical: scale(4),
      backgroundColor: "#FFFFFF",
      borderRadius: scale(10),
      elevation: 2,
    },

    contactName: {
      fontSize: scale(16),
      fontWeight: "500",
      color: "#1C1C1E",
    },

    contactPhone: {
      fontSize: scale(14),
      color: "#6C6C6C",
      marginTop: scale(2),
    },

    profileOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.2)",
      justifyContent: "center",
      alignItems: "center",
    },

    profileModal: {
      backgroundColor: "#FFFFFF",
      borderRadius: scale(14),
      padding: scale(20),
      width: width * 0.85,
      alignItems: "center",
    },

    profileImage: {
      width: scale(110),
      height: scale(110),
      borderRadius: scale(55),
      marginBottom: scale(12),
    },

    profileName: {
      fontSize: scale(20),
      fontWeight: "600",
      marginBottom: scale(16),
      color: "#1C1C1E",
    },

    actionRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      width: "100%",
    },

    actionButton: {
      alignItems: "center",
      marginHorizontal: scale(8),
    },

    actionLabel: {
      fontSize: scale(13),
      marginTop: scale(6),
      color: "#0A84FF",
      fontWeight: "500",
    },

    closeProfileBtn: {
      position: "absolute",
      top: scale(10),
      right: scale(10),
    },

    menuOverlay: {
      flex: 1,
      justifyContent: "flex-start",
      alignItems: "flex-end",
      backgroundColor: "rgba(0,0,0,0.2)",
      paddingTop: height * 0.07,
      paddingRight: scale(10),
    },

    menuContainer: {
      backgroundColor: "#fff",
      borderRadius: scale(8),
      paddingVertical: scale(5),
      width: width * 0.5,
      elevation: 5,
    },

    menuItem: {
      paddingVertical: scale(12),
      paddingHorizontal: scale(15),
    },

    menuText: {
      fontSize: scale(16),
      color: "#1C1C1E",
    },

    unreadBadge: {
      position: "absolute",
      right: scale(15),
      bottom: scale(15),
      backgroundColor: "#0A84FF",
      borderRadius: scale(12),
      minWidth: scale(24),
      height: scale(24),
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: scale(6),
    },

    unreadText: {
      color: "white",
      fontSize: scale(12),
      fontWeight: "600",
    },
  });
};


