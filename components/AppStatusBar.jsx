import React from "react";
import { Platform, StatusBar as RNStatusBar } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/context/ThemeContext";

export default function AppStatusBar() {
  const { theme } = useTheme();

  return (
    <>
      {Platform.OS === "android" && (
        <RNStatusBar
          backgroundColor={theme.colors.background}
          translucent={false}
        />
      )}

      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
    </>
  );
}