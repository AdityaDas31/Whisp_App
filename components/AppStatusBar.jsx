import React from "react";
import { StatusBar as RNStatusBar, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function AppStatusBar({
  backgroundColor = "black",
  style = "light",
}) {
  return (
    <>
      {/* Android background color */}
      {Platform.OS === "android" && (
        <RNStatusBar backgroundColor={backgroundColor} translucent={false} />
      )}

      {/* Expo status bar style */}
      <StatusBar style={style} />
    </>
  );
}