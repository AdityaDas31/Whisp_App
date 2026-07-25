import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import Avatar from "./Avatar";
import { useRouter } from "expo-router";
import { useChats } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../context/ThemeContext";
import AppStatusBar from "../components/AppStatusBar";

export default function ProfileModal({ visible, onClose, profileData }) {
  const [tab, setTab] = useState("profile");
  const [admins, setAdmins] = useState(
    Array.isArray(profileData.groupAdmins) ? profileData.groupAdmins : [],
  );

  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [groupName, setGroupName] = useState(profileData?.name || "");
  const [description, setDescription] = useState(
    profileData?.description || "",
  );
  const [groupImage, setGroupImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const { theme } = useTheme();
  const styles = createStyles(theme);

  const {
    openChat,
    makeGroupAdmin,
    deleteGroup,
    leaveGroup,
    removeMemberFromGroup,
    updateGroupInfo,
  } = useChats();

  const { user, token } = useAuth();

  const isAdmin = admins.some(
    (admin) => String(admin._id || admin) === String(user._id),
  );

  const openMemberChat = async (member) => {
    // don't open chat with yourself
    if (member._id === user._id) {
      return;
    }

    try {
      const chat = await openChat(member._id);

      router.replace({
        pathname: "/ChatScreen",

        params: {
          chatId: chat._id,

          userId: member._id,

          myId: user._id,

          name: member.name,

          profileImage: member.profileImage?.url,
        },
      });
    } catch (err) {
      console.log("open member chat error", err);
    }
  };

  const confirmDelete = async () => {
    const ok = await deleteGroup(profileData.chatId);

    if (ok) {
      onClose();

      router.replace("/");
    }
  };

  const makeAdminHandler = async (member) => {
    const chat = await makeGroupAdmin(
      profileData.chatId,

      member._id,
    );

    if (chat) {
      setAdmins(chat.groupAdmins);

      profileData.users = chat.users;

      profileData.leftUsers = chat.leftUsers;
    }
  };
  const removeMemberHandler = async (member) => {
    const chat = await removeMemberFromGroup(
      profileData.chatId,

      member._id,
    );

    if (chat) {
      // update admins list
      setAdmins(chat.groupAdmins);

      // update members instantly
      profileData.users = chat.users;

      // update left users instantly
      profileData.leftUsers = chat.leftUsers;
    }
  };

  const formatLeaveTime = (date) => {
    if (!date) return "";

    const d = new Date(date);

    return d.toLocaleString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",

      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.IMAGE], // ✅ new syntax

      allowsEditing: true,

      aspect: [1, 1],

      quality: 0.8,
    });

    if (!res.canceled) {
      setGroupImage(res.assets[0]);
    }
  };

  const updateGroupHandler = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Group name required");

      return;
    }

    setLoading(true);

    const chat = await updateGroupInfo(
      profileData.chatId,

      groupName,

      groupImage,

      description,
    );

    setLoading(false);

    if (chat) {
      profileData.name = chat.chatName;

      profileData.profileImage = chat.groupImage?.url;

      profileData.description = chat.description;

      setDescription(chat.description || "");

      router.setParams({
        name: chat.chatName,

        profileImage: chat.groupImage?.url,

        description: chat.description, // ✅ important
      });

      setEditing(false);

      Alert.alert("Success", "Group updated");
    }
  };
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <AppStatusBar />

      <View style={styles.container}>
        {/* HEADER */}
        <SafeAreaView>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color={theme.colors.text} />
          </TouchableOpacity>
        </SafeAreaView>

        {/* HERO */}

        <View style={styles.hero}>
          <TouchableOpacity
            disabled={!isAdmin}
            onPress={() => isAdmin && editing && pickImage()}
            style={styles.avatarWrap}
          >
            <Avatar
              uri={groupImage?.uri || profileData?.profileImage}
              name={profileData?.name}
              size={120}
              style={styles.avatar}
            />

            {isAdmin && editing && (
              <View style={styles.editIcon}>
                <Ionicons name="camera" size={18} color={theme.colors.text} />
              </View>
            )}
          </TouchableOpacity>

          {editing ? (
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              style={styles.input}
              placeholder="Group name"
              placeholderTextColor={theme.colors.secondaryText}
            />
          ) : (
            <Text style={styles.name}>{profileData?.name}</Text>
          )}

          {isAdmin &&
            (editing ? (
              <TouchableOpacity
                onPress={updateGroupHandler}
                style={styles.saveBtn}
              >
                <Text style={styles.saveText}>
                  {loading ? "Updating..." : "Save"}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setEditing(true)}
                style={styles.editBtn}
              >
                <Ionicons name="pencil" size={18} color={theme.colors.text} />

                <Text style={{ color: theme.colors.text, marginLeft: 6 }}>
                  Edit
                </Text>
              </TouchableOpacity>
            ))}
        </View>

        {/* TABS */}
        <View style={styles.tabs}>
          {["profile", "media", "settings"].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.activeTab]}
            >
              <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CONTENT */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {tab === "profile" && (
            <>
              <Text style={styles.sectionTitle}>About</Text>

              {editing && isAdmin ? (
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add group description..."
                  placeholderTextColor={theme.colors.secondaryText}
                  multiline
                  style={styles.descInput}
                />
              ) : (
                <Text style={styles.bio}>
                  {profileData?.description || "No description"}
                </Text>
              )}

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Chat Controls</Text>

              <ActionRow
                icon="notifications-off-outline"
                label="Mute Notifications"
                color={theme.colors.text}
              />

              <ActionRow
                icon="time-outline"
                label="Disappearing Messages"
                color={theme.colors.text}
              />
              {profileData?.isGroup && (
                <>
                  <Text style={styles.sectionTitle}>Members</Text>

                  {profileData?.isGroup && isAdmin && (
                    <ActionRow
                      icon="person-add-outline"
                      label="Add Member"
                      onPress={() => {
                        router.push({
                          pathname: "/AddMemberScreen",

                          params: {
                            chatId: profileData.chatId,
                            users: JSON.stringify(profileData.users),
                          },
                        });
                      }}
                    />
                  )}

                  {[...profileData.users]

                    .sort((a, b) => {
                      const aAdmin = admins.some(
                        (admin) => String(admin._id || admin) === String(a._id),
                      );

                      const bAdmin = admins.some(
                        (admin) => String(admin._id || admin) === String(b._id),
                      );

                      if (aAdmin) return -1;

                      if (bAdmin) return 1;

                      return 0;
                    })

                    .map((member) => (
                      <TouchableOpacity
                        key={member._id}
                        style={styles.memberRow}
                        onPress={() => openMemberChat(member)}
                        onLongPress={() => {
                          if (!isAdmin) return;

                          if (String(member._id) === String(user._id)) return;

                          const isTargetAdmin = admins.some(
                            (ad) => String(ad._id || ad) === String(member._id),
                          );

                          Alert.alert(
                            "Member options",

                            member.name,

                            [
                              !isTargetAdmin && {
                                text: "Make admin",

                                onPress: () => makeAdminHandler(member),
                              },

                              {
                                text: "Remove from group",

                                style: "destructive",

                                onPress: () => removeMemberHandler(member),
                              },

                              {
                                text: "Cancel",

                                style: "cancel",
                              },
                            ].filter(Boolean),
                          );
                        }}
                      >
                        <Avatar
                          uri={member.profileImage?.url}
                          name={member.name}
                          size={44}
                        />

                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.memberName}>{member.name}</Text>
                        </View>

                        {admins.some(
                          (ad) => String(ad._id || ad) === String(member._id),
                        ) && <Text style={styles.adminBadge}>ADMIN</Text>}
                      </TouchableOpacity>
                    ))}

                  <View style={styles.divider} />
                </>
              )}

              {profileData?.leftUsers?.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Left Members</Text>

                  {profileData.leftUsers.map((item) => (
                    <View key={item.user._id} style={styles.memberRow}>
                      <Avatar
                        uri={item.user.profileImage?.url}
                        name={item.user.name}
                        size={40}
                      />

                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.memberName}>{item.user.name}</Text>

                        <Text style={styles.leftText}>
                          Left on {formatLeaveTime(item.leftAt)}
                        </Text>
                      </View>
                    </View>
                  ))}

                  <View style={styles.divider} />
                </>
              )}
            </>
          )}


          {tab === "media" &&
            (profileData?.media?.length ? (
              <View style={styles.mediaGrid}>
                {profileData.media.map((item) => {
                  const uri = item.media?.localUri || item.media?.url;

                  return (
                    <TouchableOpacity key={item._id} style={styles.mediaItem}>
                      <Image source={{ uri }} style={styles.mediaImage} />

                      {item.media?.format === "video" && (
                        <View style={styles.videoIcon}>
                          <Ionicons name="videocam" size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.placeholder}>No media yet</Text>
            ))}

          {tab === "settings" && (
            <>
              <ActionRow icon="trash-outline" label="Clear Chat" danger />
              <ActionRow
                icon="close-circle-outline"
                label="Block User"
                danger
              />
              {profileData?.isGroup && isAdmin && (
                <ActionRow
                  icon="trash-outline"
                  label="Delete Group"
                  danger
                  onPress={() => {
                    Alert.alert(
                      "Delete group?",
                      "All messages will be deleted permanently",
                      [
                        { text: "Cancel" },

                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: confirmDelete,
                        },
                      ],
                    );
                  }}
                />
              )}
              {profileData?.isGroup && (
                <ActionRow
                  icon="exit-outline"
                  label="Leave Group"
                  danger
                  onPress={() => {
                    Alert.alert(
                      "Leave group?",
                      "You will no longer receive messages",
                      [
                        { text: "Cancel" },
                        {
                          text: "Leave",
                          style: "destructive",
                          onPress: async () => {
                            const ok = await leaveGroup(profileData.chatId);

                            if (ok) {
                              onClose();

                              router.replace("/");
                            }
                          },
                        },
                      ],
                    );
                  }}
                />
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function ActionRow({ icon, label, danger, color, onPress }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      style={styles.actionRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={22}
        color={danger ? "#FF453A" : color || theme.colors.text}
      />

      <Text
        style={[
          styles.actionText,
          { color: danger ? "#FF453A" : color || theme.colors.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const createStyles = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    backBtn: {
      paddingHorizontal: 16,
      paddingTop: Platform.OS === "ios" ? 6 : 16,
    },

    hero: {
      alignItems: "center",
      marginTop: 20,
    },

    input: {
      marginTop: 12,
      backgroundColor: theme.colors.surface,
      padding: 10,
      borderRadius: 8,
      color: theme.colors.text,
      width: 200,
      textAlign: "center",
    },

    editBtn: {
      flexDirection: "row",
      marginTop: 10,
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },

    saveBtn: {
      marginTop: 10,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 20,
    },

    saveText: {
      color: theme.colors.text,
      fontWeight: "600",
    },

    editIcon: {
      position: "absolute",
      bottom: 5,
      right: 5,
      backgroundColor: theme.colors.background,
      padding: 6,
      borderRadius: 20,
    },

    avatarWrap: {
      position: "relative",
    },

    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },

    onlineDot: {
      position: "absolute",
      bottom: 6,
      right: 6,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: "#30D158",
      borderWidth: 2,
      borderColor: "#0B0D10",
    },

    name: {
      marginTop: 14,
      fontSize: 22,
      fontWeight: "600",
      color: theme.colors.text,
    },

    subtitle: {
      marginTop: 4,
      fontSize: 14,
      color: theme.colors.secondaryText,
    },

    tabs: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 28,
      borderBottomWidth: 1,
      borderColor: theme.colors.divider,
    },

    tab: {
      paddingVertical: 12,
      paddingHorizontal: 24,
    },

    activeTab: {
      borderBottomWidth: 2,
      borderColor: theme.colors.primary,
    },

    tabText: {
      fontSize: 14,
      color: theme.colors.secondaryText,
      fontWeight: "500",
    },

    activeTabText: {
      color: theme.colors.text,
    },

    content: {
      padding: 20,
    },

    sectionTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 8,
    },
    descInput: {
      marginTop: 8,
      backgroundColor: theme.colors.surface,
      padding: 12,
      borderRadius: 10,
      color: theme.colors.text,
      minHeight: 70,
      textAlignVertical: "top",
    },

    bio: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.secondaryText,
    },

    divider: {
      height: 1,
      backgroundColor: theme.colors.divider,
      marginVertical: 20,
    },

    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
    },

    actionText: {
      marginLeft: 12,
      fontSize: 15,
      color: theme.colors.text,
    },

    placeholder: {
      textAlign: "center",
      marginTop: 40,
      color: theme.colors.secondaryText,
    },
    memberRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
    },
    memberName: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: "500",
    },
    adminBadge: {
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: "700",
      backgroundColor: "rgba(10,132,255,0.15)",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    leftText: {
      color: theme.colors.secondaryText,
      fontSize: 12,
    },

    mediaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },

    mediaItem: {
      width: "32%",
      aspectRatio: 1,
      borderRadius: 8,
      overflow: "hidden",
    },

    mediaImage: {
      width: "100%",
      height: "100%",
    },

    videoIcon: {
      position: "absolute",
      bottom: 6,
      right: 6,
      backgroundColor: theme.colors.background,
      padding: 4,
      borderRadius: 6,
    },
  });
};
