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
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/useColorScheme";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ChatProvider } from "../context/ChatContext";
import { ChatThemeProvider } from "../context/ChatThemeContext";
import Splash from "./SplashScreen";
import { navigationRef } from "../utils/navigationRef";
import { useRouter } from "expo-router";


SplashScreen.preventAutoHideAsync();

/* ------------------ INNER APP (HAS ACCESS TO AUTH) ------------------ */
function AppNavigator() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const router = useRouter();

  // const pendingNotification = useRef(null);
  const [pendingNotification, setPendingNotification] = useState(null);

  const notificationDataRef = useRef(null);
  const appReadyRef = useRef(false);

  // 🔔 Capture notification tap
  useEffect(() => {
    const sub =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log("🔔 Notification tapped:", data);
        setPendingNotification(data);
      });

    return () => sub.remove();
  }, []);


  // 🚀 Navigate when auth is ready
  // 2️⃣ Mark app as ready AFTER first render
  useEffect(() => {
    appReadyRef.current = true;
  }, []);

  // 3️⃣ Navigate ONLY when everything is ready
  useEffect(() => {
    console.log("🧪 CHECK NAV CONDITIONS", {
      appReady: appReadyRef.current,
      loading,
      hasUser: !!user,
      chatId: notificationDataRef.chatId,
    });

    if (
      appReadyRef.current &&
      !loading &&
      user &&
      notificationDataRef.current?.chatId
    ) {
      console.log("🚀 Navigating to ChatScreen");

      const { chatId, senderId } = notificationDataRef.current;

      router.replace({
        pathname: "/ChatScreen",
        params: {
          chatId,
          myId: user._id,
          userId: senderId,
        },
      });

      notificationDataRef.current = null;
    }
  }, [loading, user]);

  useEffect(() => {
    if (!pendingNotification) return;
    if (loading) return;
    if (!user) return;

    console.log("🚀 Navigating to ChatScreen");

    router.replace({
      pathname: "/ChatScreen",
      params: {
        chatId: pendingNotification.chatId,
        myId: user._id,
        userId: pendingNotification.senderId,
        name: pendingNotification.senderName,
        profileImage: pendingNotification.profileImage,
      },
    });

    setPendingNotification(null);
  }, [pendingNotification, loading, user]);



  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
        <Stack.Screen name="GetStart" options={{ headerShown: false }} />
        <Stack.Screen name="RegisterScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ChatScreen" options={{ headerShown: false }} />
        <Stack.Screen name="SettingsScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ProfileScreen" options={{ headerShown: false }} />
        <Stack.Screen
          name="ChatSettingsScreen"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChatScreenThemeScreen"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="SplashScreen" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}


/* ------------------ ROOT LAYOUT ------------------ */
export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (!showSplash && loaded) {
      SplashScreen.hideAsync();
    }
  }, [showSplash, loaded]);

  if (showSplash || !loaded) {
    return <Splash onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ChatThemeProvider>
          <ChatProvider>
            <AppNavigator />
          </ChatProvider>
        </ChatThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
