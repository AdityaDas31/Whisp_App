// context/ChatThemeContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "chat_theme_v1";

const defaultTheme = {
  backgroundColor: "#F7F8FA", // safe area / background color
  wallpaper: null,            // uri string or null
  myMessage: "#DCF8C6",       // outgoing bubble
  otherMessage: "#FFFFFF",    // incoming bubble
};

const ChatThemeContext = createContext({
  theme: defaultTheme,
  setTheme: () => {},
  setPartial: () => {},
  resetTheme: () => {},
  loading: true,
});

export const ChatThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(defaultTheme);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setThemeState({ ...defaultTheme, ...parsed });
        }
      } catch (err) {
        console.warn("ChatTheme: failed to load theme", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (newTheme) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTheme));
    } catch (err) {
      console.warn("ChatTheme: failed to save theme", err);
    }
  };

  // replace entire theme
  const setTheme = (newTheme) => {
    const merged = { ...defaultTheme, ...newTheme };
    setThemeState(merged);
    persist(merged);
  };

  // merge partial updates
  const setPartial = (patch) => {
    const merged = { ...theme, ...patch };
    setThemeState(merged);
    persist(merged);
  };

  const resetTheme = async () => {
    setThemeState(defaultTheme);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn("ChatTheme: failed to remove theme", err);
    }
  };

  return (
    <ChatThemeContext.Provider
      value={{ theme, setTheme, setPartial, resetTheme, loading }}
    >
      {children}
    </ChatThemeContext.Provider>
  );
};

export const useChatTheme = () => useContext(ChatThemeContext);
