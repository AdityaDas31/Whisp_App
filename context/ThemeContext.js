import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";

const ThemeContext = createContext();

const lightTheme = {
  mode: "light",

  colors: {
    background: "#F7F8FA",
    card: "#FFFFFF",
    text: "#1C1C1E",
    secondaryText: "#6C6C6C",
    border: "#E5E5EA",
    primary: "#0A84FF",
    overlay: "rgba(0,0,0,0.45)",
    shadow: "#000",
  },
};

const darkTheme = {
  mode: "dark",

  colors: {
    background: "#121212",
    card: "#1E1E1E",
    text: "#FFFFFF",
    secondaryText: "#B0B0B0",
    border: "#2A2A2A",
    primary: "#0A84FF",
    overlay: "rgba(255,255,255,0.45)",
    shadow: "#000",
  },
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("system");
  const [systemTheme, setSystemTheme] = useState(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    AsyncStorage.getItem("themeMode").then((value) => {
      if (value) setMode(value);
    });

    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });

    return () => listener.remove();
  }, []);

  const changeTheme = async (newMode) => {
    setMode(newMode);
    await AsyncStorage.setItem("themeMode", newMode);
  };

  const currentTheme =
    mode === "system"
      ? systemTheme === "dark"
        ? darkTheme
        : lightTheme
      : mode === "dark"
      ? darkTheme
      : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        mode,
        setMode: changeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);