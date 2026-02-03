import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";
import { registerForPushNotificationsAsync } from '../utils/notifications';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // 🌍 API Base URL
  // const API = "http://192.168.0.100:5000/api/v1/user";
  const API = "https://whisp-backend-api.onrender.com/api/v1/user";

  // 📌 Load token on app start
  useEffect(() => {
    const loadToken = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("authToken");
        if (savedToken) {
          setToken(savedToken);
          await fetchProfile(savedToken);
        }
      } catch (err) {
        console.error("Error loading token:", err);
      } finally {
        setLoading(false);
      }
    };
    loadToken();
  }, []);


  // 📌 Fetch user profile
  const fetchProfile = async (authToken = token) => {
    if (!authToken) return;
    try {
      const res = await axios.get(`${API}/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
        withCredentials: true,
      });

      // 👇 Fix: make sure we set the actual user object
      const userData = res.data.user || res.data;
      setUser(userData);

    } catch (err) {
      console.log("Profile fetch failed:", err.response?.data || err.message);
      setUser(null);
    }
  };


  // 📌 Register via Email (send OTP)
  const registerWithEmail = async (payload) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API}/register`, payload, {
        withCredentials: true,
      });
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: "Something went wrong" };
    } finally {
      setLoading(false);
    }
  };

  // 📌 Register via Phone (send OTP)
  const registerWithPhone = async (payload) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API}/register/phone`, payload, {
        withCredentials: true,
      });
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: "Something went wrong" };
    } finally {
      setLoading(false);
    }
  };

  // 📌 Verify OTP + Save Token
  const verifyOtp = async (data) => {
    try {
      const formData = new FormData();
      formData.append("otp", data.otp);
      formData.append("name", data.name);
      formData.append("password", data.password);

      if (data.email) formData.append("email", data.email);
      if (data.phoneNumber) formData.append("phoneNumber", data.phoneNumber);
      if (data.countryCode) formData.append("countryCode", data.countryCode);

      if (data.profileImage) {
        formData.append("profileImage", {
          uri: data.profileImage,
          type: "image/jpeg",
          name: "profile.jpg",
        });
      }

      const res = await axios.post(`${API}/register/verify`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      console.log("Verify OTP response:", res.status, res.data);
      // 🟢 Save user + token
      setUser(res.data.user);
      if (res.data.token) {
        setToken(res.data.token);
        await AsyncStorage.setItem("authToken", res.data.token);
        // 👇 Register for notifications
        const expoPushToken = await registerForPushNotificationsAsync();
        if (expoPushToken) {
          try {
            await axios.post(
              `${API}/save-push-token`,
              { token: expoPushToken },
              { headers: { Authorization: `Bearer ${res.data.token}` } }
            );
          } catch (e) {
            console.log("❌ Failed to save push token:", e.message);
          }
        }
      }

      return res.data;
    } catch (err) {
      throw err.response?.data || { message: "OTP verification failed" };
    }
  };

  // Login 

  const login = async (data) => {
    try {
      const formData = new FormData();
      formData.append("phoneNumber", data.phoneNumber);
      formData.append("password", data.password);

      const res = await axios.post(`${API}/login`, data, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      console.log("Login response:", res.status, res.data);
      setUser(res.data.user);
      if (res.data.token) {
        setToken(res.data.token);
        await AsyncStorage.setItem("authToken", res.data.token);
        // 👇 Register for notifications
        const expoPushToken = await registerForPushNotificationsAsync();
        if (expoPushToken) {
          try {
            await axios.post(
              `${API}/save-push-token`,
              { token: expoPushToken },
              { headers: { Authorization: `Bearer ${res.data.token}` } }
            );
          } catch (e) {
            console.log("❌ Failed to save push token:", e.message);
          }
        }
      }

      return res.data;
    } catch (err) {
      console.log("Login error:", err.response?.data, err.message);
      throw err.response?.data || { message: "Something went worng" };
    }
  }

  // 📌 Logout
  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem("authToken");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        registerWithEmail,
        registerWithPhone,
        verifyOtp,
        fetchProfile,
        logout,
        login
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
