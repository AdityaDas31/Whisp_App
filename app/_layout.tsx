import * as SplashScreen from "expo-splash-screen";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";

import { useColorScheme } from "@/hooks/useColorScheme";
import { AuthProvider } from "../context/AuthContext";
import { ChatProvider } from "../context/ChatContext";
import { ChatThemeProvider } from "../context/ChatThemeContext";
import Splash from "./SplashScreen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // ✅ Notifications hook
  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // ✅ Fonts hook
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (!showSplash && loaded) {
      SplashScreen.hideAsync();
    }
  }, [showSplash, loaded]);

  // ✅ Loading state
  if (showSplash || !loaded) {
    return <Splash onFinish={() => setShowSplash(false)} />;
  }

  return (
    <AuthProvider>
      <ChatThemeProvider>
        <ChatProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="LoginScreen"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="GetStart" options={{ headerShown: false }} />
              <Stack.Screen
                name="RegisterScreen"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ChatScreen"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="SettingsScreen"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ProfileScreen"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ChatSettingsScreen"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ChatScreenThemeScreen"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="SplashScreen"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="+not-found" />
              <StatusBar style="auto" />
            </Stack>
          </ThemeProvider>
        </ChatProvider>
      </ChatThemeProvider>
    </AuthProvider>
  );
}
