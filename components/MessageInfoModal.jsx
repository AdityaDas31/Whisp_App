import React, { useEffect } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Image,
    StyleSheet
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MessageInfoModal({
    visible,
    onClose,
    message,
    users = [],
    myId
}) {

    if (!message) return null;

    const senderId =
        typeof message.sender === "object"
            ? message.sender._id
            : message.sender;


    const isGroupChat = users.length > 2;

    // remove sender from list
    const getUserId = (u) => String(u?._id || u?.id);

    const receivers =
        users.filter(u =>
            getUserId(u) !== String(senderId)
        );

    const deliveredUsers =
        isGroupChat
            ? receivers.filter(u =>
                message.deliveredTo?.some(d =>
                    String(d.user) === getUserId(u)
                )
            )
            : message.status !== "sent"
                ? receivers
                : [];

    const seenUsers =
        isGroupChat
            ? receivers.filter(u =>
                message.seenBy?.some(s =>
                    String(s.user) === getUserId(u)
                )
            )
            : message.status === "seen"
                ? receivers
                : [];


    // 🐞 DEBUG LOGGER
    // useEffect(() => {

    //     if (!visible) return;

    //     console.log("------ MESSAGE INFO DEBUG ------");

    //     console.log("messageId:", message._id);

    //     console.log("status:", message.status);

    //     console.log("senderId:", senderId);

    //     console.log("users:", users.map(u => ({
    //         id: u._id,
    //         name: u.name
    //     })));

    //     console.log("receivers:", receivers.map(u => u._id));

    //     console.log("deliveredUsers:", deliveredUsers.map(u => u._id));

    //     console.log("seenUsers:", seenUsers.map(u => u._id));

    //     console.log("--------------------------------");

    // }, [visible]);


    const getUser = (id) => {

        if (id === myId) {
            return {
                name: "You",
                profileImage: null
            };
        }

        return users.find(u => u._id === id);

    };


    const renderUser = ({ item }) => {

        const user = getUser(item._id || item);

        return (

            <View style={styles.userRow}>

                <View style={styles.avatar}>

                    {

                        user?.profileImage?.url

                            ? (

                                <Image
                                    source={{ uri: user.profileImage.url }}
                                    style={styles.avatarImg}
                                />

                            )

                            : (

                                <Ionicons
                                    name="person"
                                    size={18}
                                    color="#fff"
                                />

                            )

                    }

                </View>


                <View style={{ flex: 1 }}>

                    <Text style={styles.userName}>
                        {user?.name || "User"}
                    </Text>

                    <Text style={styles.timeLabel}>
                        {getTime(item._id || item)
                            ? new Date(getTime(item._id || item)).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })
                            : ""}
                    </Text>

                </View>

            </View>

        );

    };


    const previewText = () => {

        if (
            message.content === "This message was deleted"
            || message.content === "You deleted this message"
            || message.content === "This message was deleted by admin"
        ) {
            return message.content;
        }

        switch (message.type) {

            case "text":
                return message.content;

            case "location":
                return "📍 Location shared";

            case "contact":
                return `👤 ${message.contact?.name || "Contact"}`;

            case "poll":
                return `🗳 ${message.poll?.topic || "Poll"}`;

            case "media":

                if (message.media?.format === "image")
                    return "📷 Photo";

                if (message.media?.format === "video")
                    return "🎥 Video";

                return "📎 File";

            default:
                return "Message";

        }

    };

    const getTime = (userId) => {
        const seen = message.seenBy?.find(s => String(s.user) === String(userId));
        if (seen) return seen.seenAt;

        const delivered = message.deliveredTo?.find(d => String(d.user) === String(userId));
        if (delivered) return delivered.deliveredAt;

        return null;
    };


    return (

        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >

            <SafeAreaView style={styles.container}>

                {/* HEADER */}

                <View style={styles.header}>

                    <TouchableOpacity onPress={onClose}>

                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color="#0A84FF"
                        />

                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>
                        Message info
                    </Text>

                </View>


                {/* MESSAGE */}

                <View style={styles.messageCard}>

                    <Text style={styles.messageText}>
                        {previewText()}
                    </Text>

                </View>


                {/* SENT */}

                <View style={styles.section}>

                    <Text style={styles.sectionTitle}>
                        Sent
                    </Text>

                    <Text style={styles.sectionValue}>

                        {new Date(message.createdAt)
                            .toLocaleString([], {

                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"

                            })}

                    </Text>

                </View>


                {/* SEEN */}

                <View style={styles.section}>

                    <View style={styles.sectionHeader}>

                        <Ionicons
                            name="checkmark-done"
                            size={18}
                            color="#0A84FF"
                        />

                        <Text style={styles.sectionTitle}>
                            Seen
                        </Text>

                    </View>


                    {

                        seenUsers.length

                            ? (

                                <FlatList
                                    data={seenUsers}
                                    renderItem={renderUser}
                                    keyExtractor={(item) =>
                                        String(item._id || item.id)
                                    }
                                />

                            )

                            : (

                                <Text style={styles.emptyText}>
                                    Not seen yet
                                </Text>

                            )

                    }

                </View>


                {/* DELIVERED */}

                <View style={styles.section}>

                    <View style={styles.sectionHeader}>

                        <Ionicons
                            name="checkmark"
                            size={18}
                            color="#999"
                        />

                        <Text style={styles.sectionTitle}>
                            Delivered
                        </Text>

                    </View>


                    {

                        deliveredUsers.length

                            ? (

                                <FlatList
                                    data={deliveredUsers}
                                    renderItem={renderUser}
                                    keyExtractor={(item) => item._id}
                                />

                            )

                            : (

                                <Text style={styles.emptyText}>
                                    Pending
                                </Text>

                            )

                    }

                </View>


            </SafeAreaView>

        </Modal>

    );

}



const styles = StyleSheet.create({

    container: {

        flex: 1,
        backgroundColor: "#F2F2F7",
        paddingHorizontal: 18

    },


    header: {

        flexDirection: "row",
        alignItems: "center",

        marginBottom: 18,
        marginTop: 10

    },


    headerTitle: {

        fontSize: 18,
        fontWeight: "600",

        marginLeft: 12

    },


    messageCard: {

        backgroundColor: "#fff",

        padding: 14,

        borderRadius: 14,

        marginBottom: 22,

        shadowColor: "#000",

        shadowOpacity: 0.06,

        shadowRadius: 6,

        elevation: 2

    },


    messageText: {

        fontSize: 15,

        color: "#222"

    },


    section: {

        backgroundColor: "#fff",

        borderRadius: 14,

        padding: 14,

        marginBottom: 16

    },


    sectionHeader: {

        flexDirection: "row",

        alignItems: "center",

        marginBottom: 10,

        gap: 6

    },


    sectionTitle: {

        fontSize: 14,

        fontWeight: "600"

    },


    sectionValue: {

        fontSize: 15,

        color: "#555"

    },


    emptyText: {

        fontSize: 14,

        opacity: 0.6

    },


    userRow: {

        flexDirection: "row",

        alignItems: "center",

        marginBottom: 14

    },


    avatar: {

        width: 36,
        height: 36,

        borderRadius: 18,

        backgroundColor: "#0A84FF",

        justifyContent: "center",
        alignItems: "center",

        marginRight: 12

    },


    avatarImg: {

        width: 36,
        height: 36,

        borderRadius: 18

    },


    userName: {

        fontSize: 15,

        fontWeight: "500"

    },


    timeLabel: {

        fontSize: 12,

        opacity: 0.6,

        marginTop: 2

    }

});