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
    Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import Avatar from "./Avatar";
import { useRouter } from "expo-router";
import { useChats } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { API_BASE_URL } from "../config";

export default function ProfileModal({ visible, onClose, profileData }) {
    const [tab, setTab] = useState("profile");
    const [admins, setAdmins] = useState(

        Array.isArray(profileData.groupAdmins)
            ? profileData.groupAdmins
            : []

    );

    const router = useRouter();

    const { openChat, makeGroupAdmin, deleteGroup } = useChats();

    const { user, token } = useAuth();

    const isAdmin = admins.some(

        admin =>
            String(admin._id || admin) === String(user._id)

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

                    profileImage: member.profileImage?.url

                }

            });

        } catch (err) {

            console.log("open member chat error", err);

        }

    };

    // const deleteGroup = () => {

    //     Alert.alert(

    //         "Delete group?",
    //         "All messages will be deleted permanently",

    //         [
    //             { text: "Cancel" },

    //             {
    //                 text: "Delete",
    //                 style: "destructive",
    //                 onPress: confirmDelete
    //             }
    //         ]

    //     );

    // };

    const confirmDelete = async () => {

        const ok =
            await deleteGroup(

                profileData.chatId

            );

        if (ok) {

            onClose();

            router.replace("/");

        }

    };

    const makeAdmin = async (member) => {

        const chat = await makeGroupAdmin(

            profileData.chatId,

            member._id

        );

        if (chat) {

            setAdmins(chat.groupAdmins);

        }

    };


    return (
        <Modal visible={visible} animationType="fade">
            <StatusBar barStyle="light-content" backgroundColor="#0B0D10" />

            <View style={styles.container}>
                {/* HEADER */}
                <SafeAreaView>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.backBtn}
                    >
                        <Ionicons name="arrow-back" size={26} color="#fff" />
                    </TouchableOpacity>
                </SafeAreaView>

                {/* HERO */}
                <View style={styles.hero}>
                    <View style={styles.avatarWrap}>
                        {/* <Image
                            source={{ uri: profileData?.profileImage }}
                            style={styles.avatar}
                        /> */}
                        <Avatar
                            uri={profileData?.profileImage}
                            name={profileData?.name}
                            size={120}
                            style={styles.avatar}
                        />
                        <View style={styles.onlineDot} />
                    </View>

                    <Text style={styles.name}>
                        {profileData?.name}
                    </Text>

                    <Text style={styles.subtitle}>
                        Online
                    </Text>
                </View>

                {/* TABS */}
                <View style={styles.tabs}>
                    {["profile", "media", "settings"].map((t) => (
                        <TouchableOpacity
                            key={t}
                            onPress={() => setTab(t)}
                            style={[
                                styles.tab,
                                tab === t && styles.activeTab,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    tab === t && styles.activeTabText,
                                ]}
                            >
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
                                Available on Whisp ✨
                                Let’s talk code, design, and ideas.
                            </Text>

                            <View style={styles.divider} />

                            <Text style={styles.sectionTitle}>
                                Chat Controls
                            </Text>

                            <ActionRow
                                icon="notifications-off-outline"
                                label="Mute Notifications"
                            />

                            <ActionRow
                                icon="time-outline"
                                label="Disappearing Messages"
                            />
                            {profileData?.isGroup && (

                                <>

                                    <Text style={styles.sectionTitle}>

                                        Members

                                    </Text>


                                    {[...profileData.users]

                                        .sort((a, b) => {

                                            const aAdmin =
                                                admins.some(

                                                    admin =>
                                                        String(admin._id || admin)
                                                        === String(a._id)

                                                );

                                            const bAdmin =
                                                admins.some(

                                                    admin =>
                                                        String(admin._id || admin)
                                                        === String(b._id)

                                                );

                                            if (aAdmin) return -1;

                                            if (bAdmin) return 1;

                                            return 0;

                                        })

                                        .map(user => (

                                            <TouchableOpacity
                                                key={user._id}
                                                style={styles.memberRow}
                                                onPress={() => openMemberChat(user)}
                                                onLongPress={() => {

                                                    const isTargetAdmin =
                                                        admins.some(

                                                            admin =>
                                                                String(admin._id || admin)
                                                                === String(user._id)

                                                        );

                                                    if (isAdmin && !isTargetAdmin) {

                                                        Alert.alert(

                                                            "Make admin?",

                                                            `Make ${user.name} admin?`,

                                                            [
                                                                { text: "Cancel" },

                                                                {
                                                                    text: "Yes",
                                                                    onPress: () => makeAdmin(user)
                                                                }

                                                            ]

                                                        );

                                                    }

                                                }}
                                            >

                                                <Avatar

                                                    uri={user.profileImage?.url}

                                                    name={user.name}

                                                    size={44}

                                                />


                                                <View
                                                    style={{ flex: 1, marginLeft: 12 }}
                                                >

                                                    <Text style={styles.memberName}>

                                                        {user.name}

                                                    </Text>

                                                </View>


                                                {admins.some(

                                                    admin =>
                                                        String(admin._id || admin)
                                                        === String(user._id)

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
                        </>

                    )}

                    {tab === "media" && (
                        <Text style={styles.placeholder}>
                            Shared media will appear here
                        </Text>
                    )}

                    {tab === "settings" && (
                        <>
                            <ActionRow
                                icon="trash-outline"
                                label="Clear Chat"
                                danger
                            />
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
                                                    onPress: confirmDelete
                                                }
                                            ]
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
        <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.7}>
            <Ionicons
                name={icon}
                size={22}
                color={danger ? "#FF453A" : "#fff"}
            />
            <Text
                style={[
                    styles.actionText,
                    danger && { color: "#FF453A" },
                ]}
            >
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
        paddingVertical: 10
    },
    memberName: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "500"
    },
    adminBadge: {
        fontSize: 11,
        color: "#0A84FF",
        fontWeight: "700",
        backgroundColor: "rgba(10,132,255,0.15)",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6
    }
});
