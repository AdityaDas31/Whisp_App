import { Tabs } from "expo-router";
import React from "react";
import { ActivityIndicator, View, Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Ionicons, MaterialIcons  } from '@expo/vector-icons';
import TabBarBackground from "@/components/ui/TabBarBackground";

import { useAuth } from "@/context/AuthContext";
import GetStart from "../GetStart";

export default function TabLayout() {
  const { user, loading } = useAuth();

  // Define your active/inactive colors
  const activeColor = "#007AFF"; // professional blue
  const inactiveColor = "#8E8E93"; // soft gray

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={activeColor} />
      </View>
    );
  }

  if (!user) {
    return <GetStart />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: "#F7F8FA", // minimal light background
          borderTopWidth: 0,
          height: 70,
          position: Platform.OS === "ios" ? "absolute" : "relative",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble-ellipses" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="story"
        options={{
          title: "",
          tabBarShowLabel: false,
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="planet" size={28} color={color} />

              {/* new story indicator */}
              <View
                style={{
                  position: "absolute",
                  top: 1,
                  right: 1,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#00E5FF",
                }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: "",
          tabBarIcon: ({ color }) => <MaterialIcons name="phone-callback" size={28} color={color} />,
        }}
      />

    </Tabs>
  );
}


const emojis = ["😀", "😃", "😄", "😁", "😆", "🥹", "😅", "😂", "🤣", "🥲", "☺", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😶‍🌫️", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🫢", "🫡", "🤫", "🫠", "🤥", "😶", "🫥", "😐", "🫤", "😑", "🫨"];