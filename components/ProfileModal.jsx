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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import Avatar from "./Avatar";
import { useRouter } from "expo-router";
import { useChats } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";

export default function ProfileModal({ visible, onClose, profileData }) {
    const [tab, setTab] = useState("profile");
    const [admins, setAdmins] = useState(
        Array.isArray(profileData.groupAdmins) ? profileData.groupAdmins : [],
    );

    const router = useRouter();

    const {
        openChat,
        makeGroupAdmin,
        deleteGroup,
        leaveGroup,
        removeMemberFromGroup,
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

        const chat =
            await removeMemberFromGroup(

                profileData.chatId,

                member._id

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

    return (
        <Modal visible={visible} animationType="fade">
            <StatusBar barStyle="light-content" backgroundColor="#0B0D10" />

            <View style={styles.container}>
                {/* HEADER */}
                <SafeAreaView>
                    <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={26} color="#fff" />
                    </TouchableOpacity>
                </SafeAreaView>

                {/* HERO */}
                <View style={styles.hero}>
                    <View style={styles.avatarWrap}>
                        <Avatar
                            uri={profileData?.profileImage}
                            name={profileData?.name}
                            size={120}
                            style={styles.avatar}
                        />
                        <View style={styles.onlineDot} />
                    </View>

                    <Text style={styles.name}>{profileData?.name}</Text>

                    <Text style={styles.subtitle}>Online</Text>
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
                            <Text style={styles.bio}>
                                Available on Whisp ✨ Let’s talk code, design, and ideas.
                            </Text>

                            <View style={styles.divider} />

                            <Text style={styles.sectionTitle}>Chat Controls</Text>

                            <ActionRow
                                icon="notifications-off-outline"
                                label="Mute Notifications"
                            />

                            <ActionRow icon="time-outline" label="Disappearing Messages" />
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

                                        .map(member => (


                                            <TouchableOpacity

                                                key={member._id}

                                                style={styles.memberRow}

                                                onPress={() => openMemberChat(member)}


                                                onLongPress={() => {


                                                    if (!isAdmin) return;


                                                    if (

                                                        String(member._id)

                                                        ===

                                                        String(user._id)

                                                    ) return;


                                                    const isTargetAdmin =
                                                        admins.some(

                                                            ad =>
                                                                String(ad._id || ad)
                                                                === String(member._id)

                                                        );


                                                    Alert.alert(

                                                        "Member options",

                                                        member.name,

                                                        [

                                                            !isTargetAdmin && {

                                                                text: "Make admin",

                                                                onPress: () => makeAdminHandler(member)

                                                            },


                                                            {

                                                                text: "Remove from group",

                                                                style: "destructive",

                                                                onPress: () => removeMemberHandler(member)

                                                            },


                                                            {

                                                                text: "Cancel",

                                                                style: "cancel"

                                                            }

                                                        ].filter(Boolean)

                                                    );

                                                }}

                                            >


                                                <Avatar

                                                    uri={member.profileImage?.url}

                                                    name={member.name}

                                                    size={44}

                                                />


                                                <View style={{ flex: 1, marginLeft: 12 }}>

                                                    <Text style={styles.memberName}>

                                                        {member.name}

                                                    </Text>

                                                </View>


                                                {admins.some(

                                                    ad =>
                                                        String(ad._id || ad)
                                                        === String(member._id)

                                                ) && (

                                                        <Text style={styles.adminBadge}>

                                                            ADMIN

                                                        </Text>

                                                    )}

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

                    {tab === "media" && (
                        <Text style={styles.placeholder}>
                            Shared media will appear here
                        </Text>
                    )}

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

function ActionRow({ icon, label, danger, onPress }) {
    return (
        <TouchableOpacity
            style={styles.actionRow}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Ionicons name={icon} size={22} color={danger ? "#FF453A" : "#fff"} />
            <Text style={[styles.actionText, danger && { color: "#FF453A" }]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B0D10",
    },

    backBtn: {
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 6 : 16,
    },

    hero: {
        alignItems: "center",
        marginTop: 20,
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
        color: "#fff",
    },

    subtitle: {
        marginTop: 4,
        fontSize: 14,
        color: "rgba(255,255,255,0.6)",
    },

    tabs: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 28,
        borderBottomWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },

    tab: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },

    activeTab: {
        borderBottomWidth: 2,
        borderColor: "#4DA3FF",
    },

    tabText: {
        fontSize: 14,
        color: "rgba(255,255,255,0.6)",
        fontWeight: "500",
    },

    activeTabText: {
        color: "#fff",
    },

    content: {
        padding: 20,
    },

    sectionTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#fff",
        marginBottom: 8,
    },

    bio: {
        fontSize: 14,
        lineHeight: 20,
        color: "rgba(255,255,255,0.7)",
    },

    divider: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.08)",
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
        color: "#fff",
    },

    placeholder: {
        textAlign: "center",
        marginTop: 40,
        color: "rgba(255,255,255,0.5)",
    },
    memberRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
    },
    memberName: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "500",
    },
    adminBadge: {
        fontSize: 11,
        color: "#0A84FF",
        fontWeight: "700",
        backgroundColor: "rgba(10,132,255,0.15)",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    leftText: {
        color: "#8e8e93",
        fontSize: 12,
    },
});
