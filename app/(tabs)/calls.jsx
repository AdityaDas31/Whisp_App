import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Image,
    TouchableOpacity,
    RefreshControl,
    Alert
} from "react-native";

import { Feather } from "@expo/vector-icons";
import { getCallHistory, deleteCallLog } from "../../services/callService";
import { useCall } from "../../context/CallContext";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";


export default function CallsScreen() {

    const { user } = useAuth();
    const { startCall } = useCall();

    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(false);

    const isFocused = useIsFocused();

    const loadCalls = async () => {
        try {
            setLoading(true);
            const data = await getCallHistory(user._id);
            setCalls(data);
        } catch (err) {
            console.log("Call history error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            loadCalls();
        }
    }, [isFocused]);

    const formatDuration = (seconds) => {

        if (!seconds) return "";

        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        return `${mins}m ${secs}s`;
    };

    const handleDelete = (callId) => {

        Alert.alert(
            "Delete Call Log",
            "Are you sure you want to delete this call log?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {

                            await deleteCallLog(callId);

                            setCalls((prev) =>
                                prev.filter((c) => c.callId !== callId)
                            );

                        } catch (err) {
                            console.log("Delete call log error:", err);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => {

        const isCaller =
            item.callerId?._id === user._id ||
            item.callerId === user._id;

        const otherUser = isCaller
            ? item.receiverId
            : item.callerId;

        const icon =
            item.status === "missed"
                ? "phone-missed"
                : isCaller
                    ? "phone-outgoing"
                    : "phone-incoming";

        const color =
            item.status === "missed"
                ? "red"
                : "#4CAF50";

        const renderRightActions = () => (
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.callId)}
            >
                <Feather name="trash-2" size={20} color="#fff" />
            </TouchableOpacity>
        );

        return (
            <TouchableOpacity
                style={styles.item}
                onPress={() =>
                    startCall(
                        otherUser._id,
                        otherUser.name,
                        otherUser.profileImage,
                        user._id,
                        user.name,
                        user.profileImage
                    )
                }
                onLongPress={() => handleDelete(item.callId)}
            >
                <Image
                    source={{
                        uri: otherUser.profileImage?.url || otherUser.profileImage
                    }}
                    style={styles.avatar}
                />

                <View style={styles.info}>
                    <Text style={styles.name}>{otherUser.name}</Text>

                    <View style={styles.row}>
                        <Feather name={icon} size={16} color={color} />
                        <Text style={styles.sub}>
                            {" "}
                            {item.status} {formatDuration(item.duration)}
                        </Text>
                    </View>
                </View>

                <Feather name="phone" size={20} color="#555" />
            </TouchableOpacity>

        );
    };

    return (
        <SafeAreaView style={styles.container}>

            <FlatList
                data={calls}
                keyExtractor={(item) => item.callId}
                renderItem={renderItem}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={loadCalls}
                    />
                }
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#fff",
    },

    item: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderBottomWidth: 0.5,
        borderColor: "#ddd",
    },

    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },

    info: {
        flex: 1,
        marginLeft: 12,
    },

    name: {
        fontSize: 16,
        fontWeight: "600",
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 3,
    },

    sub: {
        color: "#666",
        marginLeft: 6,
    },
});