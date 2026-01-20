// ChatContext.js
import axios from "axios";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { io } from "socket.io-client";
import { API_BASE_URL, SOCKET_URL } from "../config";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

const getChatKeyFromMessage = (msg) => {
  return (
    msg?.chatId ||
    (typeof msg?.chat === "string" ? msg.chat : msg?.chat?._id) ||
    null
  );
};

export const ChatProvider = ({ children }) => {
  const { token, user } = useAuth();

  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState({});
  const [socket, setSocket] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const [userStatus, setUserStatus] = useState({});

  const activeChatRef = useRef(null); // 🔥 UPDATED

  // ---------------- SOCKET INIT ----------------
  useEffect(() => {
    if (!token || !user?._id) return;

    const s = io(SOCKET_URL, { transports: ["websocket"] });

    s.on("connect", () => {
      console.log("✅ Socket connected:", s.id);
      s.emit("registerUser", user._id);
    });

    // ✅ RECEIVE MESSAGE
    s.on("receiveMessage", (message) => {
      const chatId = getChatKeyFromMessage(message);
      if (!chatId) return;

      // add message
      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), message],
      }));

      // 🔥 UPDATED: unreadCount logic
      setChats((prev) =>
        prev.map((chat) => {
          if (chat._id !== chatId) return chat;

          const isActive = activeChatRef.current === chatId;

          return {
            ...chat,
            latestMessage: message,
            unreadCount: isActive
              ? 0
              : (chat.unreadCount || 0) + 1,
          };
        })
      );

      // auto mark seen if chat open
      if (activeChatRef.current === chatId) {
        s.emit("markSeen", { chatId });
      }
    });

    // ✅ MESSAGE DELIVERED
    s.on("messageDelivered", ({ messageId, chatId }) => {
      setMessages((prev) => ({
        ...prev,
        [chatId]: prev[chatId]?.map((m) =>
          m._id === messageId ? { ...m, status: "delivered" } : m
        ),
      }));
    });

    // ✅ MESSAGE SEEN
    s.on("messageSeen", ({ messageId, chatId }) => {
      setMessages((prev) => ({
        ...prev,
        [chatId]: prev[chatId]?.map((m) =>
          m._id === messageId ? { ...m, status: "seen" } : m
        ),
      }));

      // 🔥 UPDATED: reset unreadCount
      setChats((prev) =>
        prev.map((chat) =>
          chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
        )
      );
    });

    // user online/offline

    s.on("onlineUsersList", ({ users }) => {
      const map = {};
      users.forEach((id) => {
        map[id] = { online: true };
      });
      setUserStatus(map);
    });

    s.on("userOnline", ({ userId }) => {
      setUserStatus((prev) => ({ ...prev, [userId]: { online: true } }));
    });

    s.on("userOffline", ({ userId, lastSeen }) => {
      setUserStatus((prev) => ({
        ...prev,
        [userId]: { online: false, lastSeen },
      }));
    });

    setSocket(s);

    return () => {
      s.removeAllListeners();
      s.disconnect();
    };
  }, [token, user?._id]);

  // ---------------- CHAT ACTIONS ----------------

  // 🔹 JOIN CHAT
  const joinChat = (chatId) => {
    if (!socket || !chatId) return;

    activeChatRef.current = chatId; // 🔥 UPDATED
    setActiveChatId(chatId);

    socket.emit("joinRoom", { chatId });

    // 🔥 UPDATED: reset unread count immediately
    setChats((prev) =>
      prev.map((c) =>
        c._id === chatId ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  // 🔹 LEAVE CHAT
  const leaveChat = () => {
    if (!socket || !activeChatRef.current) return;

    socket.emit("leaveRoom", { chatId: activeChatRef.current });
    activeChatRef.current = null;
    setActiveChatId(null);
  };

  // ---------------- API ----------------

  const fetchChats = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/chat/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(res.data.chats || []);
    } catch (err) {
      Alert.alert("Error", "Failed to load chats");
    }
  };

  const openChat = async (userId) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/chat/chat`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data.chat;
    } catch {
      Alert.alert("Error", "Could not open chat");
      return null;
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/message/messages/${chatId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => ({ ...prev, [chatId]: res.data.messages }));
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (chatId, messageData) => {
    try {
      let res;

      if (messageData.file) {
        const formData = new FormData();
        formData.append("chatId", chatId);
        formData.append("type", "media");
        formData.append("file", messageData.file);

        res = await axios.post(`${API_BASE_URL}/message/message`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        res = await axios.post(
          `${API_BASE_URL}/message/message`,
          { chatId, ...messageData },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      const msg = res.data.message;
      socket.emit("sendMessage", msg);

      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), msg],
      }));

      setChats((prev) =>
        prev.map((c) =>
          c._id === chatId ? { ...c, latestMessage: msg } : c
        )
      );

      return true;
    } catch {
      return false;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        fetchChats,
        openChat,
        fetchMessages,
        sendMessage,
        messages,
        joinChat,
        leaveChat,
        userStatus,
        socket,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChats = () => useContext(ChatContext);
