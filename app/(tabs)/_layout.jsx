import { Tabs } from "expo-router";
import React from "react";
import { ActivityIndicator, View, Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol} from "@/components/ui/IconSymbol";
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="story"
        options={{
          title: "Status",
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              {/* Main Circle */}
              <Feather name="circle" size={size || 28} color={color} />

              {/* Small Badge */}
              <MaterialCommunityIcons
                name="checkbox-blank-circle"
                size={8}
                color="#00E5FF"
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                }}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}


const emojis = ["😀", "😃", "😄", "😁", "😆", "🥹", "😅", "😂", "🤣", "🥲", "☺", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😶‍🌫️", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🫢", "🫡", "🤫", "🫠", "🤥", "😶", "🫥", "😐", "🫤", "😑", "🫨"];