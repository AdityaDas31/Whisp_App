import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { getAppLockEnabled } from "../utils/appSettings";
import LockScreen from "./LockScreen";

export default function AppLockGate({ children }) {
  const appState = useRef(AppState.currentState);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  // Move authenticate here
  const authenticate = async () => {
    const enabled = await getAppLockEnabled();

    if (!enabled) {
      setIsUnlocked(true);
      setChecking(false);
      return;
    }

    setChecking(true);

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Whisp",
      fallbackLabel: "Use device password",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });

    if (result.success) {
      setUnlocked(true);

      // Show unlock state for 700ms
      setTimeout(() => {
        setIsUnlocked(true);
      }, 700);
    } else {
      setUnlocked(false);
      setIsUnlocked(false);
    }

    setChecking(false);
  };

  useEffect(() => {
    authenticate();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        authenticate();
      }

      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  if (!isUnlocked) {
    return <LockScreen loading={checking} onRetry={authenticate} unlocked={unlocked}/>;
  }

  return children;
}
