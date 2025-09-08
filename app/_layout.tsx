import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { AuthProvider } from "../context/AuthContext";
import { ChatProvider } from "../context/ChatContext";
import { ChatThemeProvider } from "../context/ChatThemeContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
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
            <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
            <Stack.Screen name="GetStart" options={{ headerShown: false }} />
            <Stack.Screen
              name="RegisterScreen"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="ChatScreen" options={{ headerShown: false }} />
            <Stack.Screen name="SettingsScreen" options={{ headerShown: false }} />
            <Stack.Screen name="ProfileScreen" options={{ headerShown: false }} />
            <Stack.Screen name="ChatSettingsScreen" options={{ headerShown: false }} />
            <Stack.Screen name="ChatScreenThemeScreen" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
            <StatusBar style="auto" />
          </Stack>
        </ThemeProvider>
      </ChatProvider>
      </ChatThemeProvider>
    </AuthProvider>
  );
}
