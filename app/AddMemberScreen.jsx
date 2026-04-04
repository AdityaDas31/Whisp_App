import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";

import Avatar from "../components/Avatar";
import { useChats } from "../context/ChatContext";

export default function AddMemberScreen() {

    const router = useRouter();

    const { chatId, users } = useLocalSearchParams();

    const existingUsers =
        users
            ? JSON.parse(users)
            : [];

    const existingIds =
        existingUsers.map(u => u._id);

    const { addMemberToGroup } = useChats();

    const [contacts, setContacts] = useState([]);

    const [selectedUsers, setSelectedUsers] = useState([]);

    const [loadingContacts, setLoadingContacts] = useState(true);

    const [adding, setAdding] = useState(false);


    useEffect(() => {

        loadCachedContacts();

    }, []);


    const loadCachedContacts = async () => {

        try {

            const cached =
                await AsyncStorage.getItem("matchedContacts");

            if (cached) {

                setContacts(JSON.parse(cached));

            }

        } catch (err) {

            console.log(err);

        } finally {

            setLoadingContacts(false);

        }

    };


    const toggleUser = (id) => {

        if (existingIds.includes(id)) return;

        if (selectedUsers.includes(id)) {

            setSelectedUsers(

                selectedUsers.filter(x => x !== id)

            );

        } else {

            setSelectedUsers(

                [...selectedUsers, id]

            );

        }

    };


    const handleAddMembers = async () => {

        if (selectedUsers.length === 0) {

            Alert.alert("Select at least 1 user");

            return;

        }

        try {

            setAdding(true);

            let updatedChat = null;

            for (let id of selectedUsers) {

                updatedChat = await addMemberToGroup(

                    chatId,

                    id

                );

            }

            router.replace({

                pathname: "/ChatScreen",

                params: {

                    chatId: updatedChat._id,

                    name: updatedChat.chatName,

                    isGroup: true,

                    users: JSON.stringify(updatedChat.users),

                    groupAdmins: JSON.stringify(updatedChat.groupAdmins),

                    leftUsers: JSON.stringify(updatedChat.leftUsers),

                    profileImage: updatedChat.groupImage?.url || null

                }

            });

        } catch (err) {

            console.log(err);

        } finally {

            setAdding(false);

        }

    };


    const renderItem = ({ item }) => {

        const isAlreadyMember =
            existingIds.includes(item._id);

        const isSelected =
            selectedUsers.includes(item._id);

        return (

            <TouchableOpacity

                style={[
                    styles.row,

                    isAlreadyMember &&
                    styles.disabledRow
                ]}

                onPress={() =>
                    toggleUser(item._id)
                }

                disabled={isAlreadyMember}
            >

                <Avatar

                    uri={item.profileImage?.url}

                    name={item.name}

                    size={44}

                />

                <View style={{ flex: 1 }}>

                    <Text style={styles.name}>

                        {item.contactName || item.name}

                    </Text>

                    {isAlreadyMember && (

                        <Text style={styles.alreadyText}>

                            Already in group

                        </Text>

                    )}

                </View>

                {isSelected && (

                    <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#0A84FF"
                    />

                )}

            </TouchableOpacity>

        );

    };


    return (

        <SafeAreaView style={styles.container}>

            <View style={styles.header}>

                <TouchableOpacity
                    onPress={() => router.back()}
                >

                    <Ionicons
                        name="arrow-back"
                        size={24}
                    />

                </TouchableOpacity>

                <Text style={styles.title}>

                    Add Members

                </Text>

            </View>

            {loadingContacts ? (

                <ActivityIndicator
                    style={{ marginTop: 20 }}
                />

            ) : (

                <FlatList
                    data={contacts}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                />

            )}

            <TouchableOpacity

                style={styles.button}

                onPress={handleAddMembers}

            >

                {adding
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.buttonText}>
                        Add Members
                    </Text>
                }

            </TouchableOpacity>

        </SafeAreaView>

    );

}


const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#fff"
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16
    },

    title: {
        fontSize: 18,
        fontWeight: "600",
        marginLeft: 10
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        borderBottomWidth: 0.5,
        borderColor: "#eee"
    },

    disabledRow: {
        opacity: 0.5
    },

    name: {
        fontSize: 16,
        fontWeight: "500"
    },

    alreadyText: {
        fontSize: 12,
        color: "#0A84FF"
    },

    button: {
        backgroundColor: "#0A84FF",
        padding: 15,
        margin: 12,
        borderRadius: 8,
        alignItems: "center"
    },

    buttonText: {
        color: "#fff",
        fontSize: 16
    }

});