import AsyncStorage from "@react-native-async-storage/async-storage";

const APP_LOCK_KEY = "APP_LOCK_ENABLED";

export const setAppLockEnabled = async (value) => {
  await AsyncStorage.setItem(APP_LOCK_KEY, JSON.stringify(value));
};

export const getAppLockEnabled = async () => {
  const value = await AsyncStorage.getItem(APP_LOCK_KEY);
  return value ? JSON.parse(value) : false;
};