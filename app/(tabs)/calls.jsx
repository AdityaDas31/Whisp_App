import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import AppStatusBar from "../../components/AppStatusBar";

import { Feather } from "@expo/vector-icons";
import { getCallHistory, deleteCallLog } from "../../services/callService";
import { useCall } from "../../context/CallContext";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function CallsScreen() {
  const { user } = useAuth();
  const { startCall } = useCall();

  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);

  const isFocused = useIsFocused();

  const { theme } = useTheme();
  const styles = createStyles(theme);

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

              setCalls((prev) => prev.filter((c) => c.callId !== callId));
            } catch (err) {
              console.log("Delete call log error:", err);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }) => {
    const isCaller =
      item.callerId?._id === user._id || item.callerId === user._id;

    const otherUser = isCaller ? item.receiverId : item.callerId;

    const icon =
      item.status === "missed"
        ? "phone-missed"
        : isCaller
          ? "phone-outgoing"
          : "phone-incoming";

    const color = item.status === "missed" ? "red" : "#4CAF50";

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
            user.profileImage,
          )
        }
        onLongPress={() => handleDelete(item.callId)}
      >
        <Image
          source={{
            uri: otherUser.profileImage?.url || otherUser.profileImage,
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
      <AppStatusBar backgroundColor={theme.colors.background} style="dark" />
      <FlatList
        data={calls}
        keyExtractor={(item) => item.callId}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadCalls} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Feather
                name="phone-call"
                size={70}
                color={theme.colors.secondaryText}
              />

              <Text style={styles.emptyTitle}>No Calls Yet</Text>

              <Text style={styles.emptySubtitle}>
                Your call history will appear here after you make or receive
                calls.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    item: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      borderBottomWidth: 0.5,
      borderColor: theme.colors.border,
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
      color: theme.colors.text,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 3,
    },

    sub: {
      color: theme.colors.secondaryText,
      marginLeft: 6,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
      marginTop: 100,
    },

    emptyTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.colors.text,
      marginTop: 20,
    },

    emptySubtitle: {
      marginTop: 10,
      fontSize: 15,
      color: theme.colors.secondaryText,
      textAlign: "center",
      lineHeight: 22,
    },
  });
};
