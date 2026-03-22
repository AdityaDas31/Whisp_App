import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";
import { useRouter } from "expo-router";
import Avatar from "../components/Avatar";

export default function CreateGroupScreen() {

  const { token } = useAuth();
  const router = useRouter();

  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [groupImage, setGroupImage] = useState(null);

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {

    loadCachedContacts();

  }, []);

  const pickImage = async () => {

    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {

      Alert.alert("Permission required");
      return;

    }

    const result =
      await ImagePicker.launchImageLibraryAsync({

        mediaTypes: ["images"],
        quality: 0.7

      });

    if (!result.canceled) {

      setGroupImage(result.assets[0]);

    }

  };


  const loadCachedContacts = async () => {

    try {

      const cached = await AsyncStorage.getItem("matchedContacts");

      if (cached) {

        setContacts(JSON.parse(cached));

      }

    } catch (err) {

      console.log("cache error", err);

    } finally {

      setLoadingContacts(false);

    }

  };


  const toggleUser = (id) => {

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


  const createGroup = async () => {

    if (!groupName) {

      Alert.alert("Enter group name");
      return;

    }

    if (selectedUsers.length < 2) {

      Alert.alert("Select at least 2 members");
      return;

    }

    try {

      setCreating(true);

      const formData = new FormData();

      formData.append("name", groupName);

      formData.append(
        "users",
        JSON.stringify(selectedUsers)
      );

      if (groupImage) {

        formData.append("groupImage", {

          uri: groupImage.uri,

          name: "group.jpg",

          type: "image/jpeg"

        });

      }


      const res = await axios.post(

        `${API_BASE_URL}/chat/group`,

        formData,

        {

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }

        }

      );


      const chat = res.data.chat;


      router.replace({

        pathname: "/ChatScreen",

        params: {

          chatId: chat._id,

          name: chat.chatName,

          isGroup: true,

          users: JSON.stringify(chat.users),

          profileImage: chat.groupImage?.url || null

        }

      });

    } catch (err) {

      console.log(err);

      Alert.alert("Error creating group");

    } finally {

      setCreating(false);

    }

  };


  const renderItem = ({ item }) => {

    const isSelected = selectedUsers.includes(item._id);

    return (

      <TouchableOpacity
        style={styles.row}
        onPress={() => toggleUser(item._id)}
      >

        <Image
          source={{ uri: item.profileImage?.url }}
          style={styles.avatar}
        />

        <View style={{ flex: 1 }}>

          <Text style={styles.name}>
            {item.contactName || item.name}
          </Text>

          <Text style={styles.phone}>
            +{item.countryCode} {item.phoneNumber}
          </Text>

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

        <Text style={styles.title}>
          New Group
        </Text>

      </View>

      <TouchableOpacity
        style={styles.groupAvatar}
        onPress={pickImage}
      >

        <Avatar

          uri={groupImage?.uri}

          name={groupName || "Group"}

          size={90}

        />

      </TouchableOpacity>

      <TextInput
        placeholder="Group name"
        placeholderTextColor="#999"
        style={styles.input}
        value={groupName}
        onChangeText={setGroupName}
      />

      {loadingContacts ? (

        <ActivityIndicator
          size="large"
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
        onPress={createGroup}
      >

        {creating ? (

          <ActivityIndicator color="#fff" />

        ) : (
          <Text style={styles.buttonText}>
            Create Group
          </Text>
        )}

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
    padding: 16
  },

  title: {
    fontSize: 20,
    fontWeight: "600"
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    margin: 12,
    padding: 12,
    borderRadius: 8
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 0.5,
    borderColor: "#eee"
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12
  },

  name: {
    fontSize: 16,
    fontWeight: "500"
  },

  phone: {
    fontSize: 12,
    color: "#666"
  },

  button: {
    backgroundColor: "#0A84FF",
    padding: 14,
    margin: 12,
    borderRadius: 8,
    alignItems: "center"
  },

  buttonText: {
    color: "#fff",
    fontSize: 16
  },

  groupAvatar: {
    alignSelf: "center",

    width: 90,
    height: 90,

    borderRadius: 45,

    backgroundColor: "#E5E5EA",

    justifyContent: "center",
    alignItems: "center",

    marginTop: 10,
    marginBottom: 10
  },

  groupAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 45
  },

  groupAvatarLetter: {
    fontSize: 32,

    color: "#0A84FF",

    fontWeight: "600"
  },

});