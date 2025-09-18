// ChatContext.js
import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";
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


  useEffect(() => {
    const fetchInitialStatus = async () => {
      try {
        const res = await axios.get(`http://192.168.0.101:5000/online-users`);
        const onlineMap = {};
        res.data.onlineUsers.forEach(uid => {
          onlineMap[uid] = { online: true };
        });
        setUserStatus(onlineMap);
      } catch (err) {
        console.error("❌ Failed to fetch initial online users");
      }
    };

    if (token) fetchInitialStatus();
  }, [token]);


  // ✅ Init socket once
  useEffect(() => {
    if (!token || !user?._id) return; // ✅ wait for user

    const s = io(SOCKET_URL, { transports: ["websocket"] });

    s.on("connect", () => {
      console.log("✅ Socket connected:", s.id);

      // ✅ only emit if user exists
      if (user?._id) {
        s.emit("registerUser", user._id);
      }

      if (activeChatId) {
        s.emit("joinRoom", activeChatId);
      }
    });

    s.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    // ✅ New message
    s.on("receiveMessage", (message) => {
      const chatKey = getChatKeyFromMessage(message);
      if (!chatKey) return;

      setMessages((prev) => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), message],
      }));

      // setChats((prev) =>
      //   prev.map((c) =>
      //     c._id === chatKey
      //       ? {
      //           ...c,
      //           latestMessage: message,
      //           unread: activeChatId === chatKey ? false : true,
      //         }
      //       : c
      //   )
      // );

      setChats((prev) => {
        const exists = prev.find((c) => c._id === chatKey);
        if (exists) {
          return prev.map((c) =>
            c._id === chatKey
              ? {
                ...c,
                latestMessage: message,
                unreadCount:
                  activeChatId === chatKey
                    ? 0
                    : (c.unreadCount || 0) + 1,
              }
              : c
          );
        } else {
          // New chat created by first message
          return [
            {
              _id: chatKey,
              users: [user, message.sender], // fallback, update later from backend
              latestMessage: message,
              unread: true,
            },
            ...prev,
          ];
        }
      });

    });

    // ✅ User status
    s.on("userOnline", ({ userId }) => {
      console.log("✅ userOnline event:", userId);
      setUserStatus((prev) => ({ ...prev, [userId]: { online: true } }));
    });

    s.on("userOffline", ({ userId, lastSeen }) => {
      console.log("❌ userOffline event:", userId, lastSeen);
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
  }, [token, user?._id]); // ✅ only rerun when user is ready

  // ✅ Join chat room when activeChatId changes
  useEffect(() => {
    if (!socket || !activeChatId) return;
    socket.emit("joinRoom", activeChatId);
  }, [socket, activeChatId]);

  const joinChat = (chatId) => {
    if (!chatId) return;
    setActiveChatId(chatId);
    socket?.emit("joinRoom", chatId);
  };

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
      const chat = res.data.chat;

      if (!chat?._id) return null;

      setChats((prev) =>
        prev.map((c) => (c._id === chat._id ? { ...c, unreadCount: 0 } : c))
      );

      return chat;
    } catch (err) {
      Alert.alert("Error", "Could not open chat");
      return null;
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/message/messages/${chatId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages((prev) => ({
        ...prev,
        [chatId]: res.data.messages || [],
      }));
    } catch (err) {
      console.error("❌ Fetch messages error:", err?.message || err);
    }
  };

  const sendMessage = async (chatId, messageData) => {
    try {
      let res;

      if (messageData.file) {
        // Handle media upload with FormData
        const formData = new FormData();
        formData.append("chatId", chatId);
        formData.append("type", "media");
        formData.append("file", {
          uri: messageData.file.uri,
          name: messageData.file.name,
          type: messageData.file.type,
        });

        res = await axios.post(`${API_BASE_URL}/message/message`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Normal JSON-based message
        res = await axios.post(
          `${API_BASE_URL}/message/message`,
          { chatId, ...messageData },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      const newMsg = { ...res.data.message, chatId };

      // Emit socket event
      socket?.emit("sendMessage", newMsg);

      // Update local messages
      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), newMsg],
      }));

      // Update latestMessage in chat list
      setChats((prev) =>
        prev.map((c) =>
          c._id === chatId ? { ...c, latestMessage: newMsg } : c
        )
      );

      return true;
    } catch (err) {
      console.error("❌ Send message error:", err?.message || err);
      return false;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        setChats,
        fetchChats,
        openChat,
        fetchMessages,
        sendMessage,
        messages,
        joinChat,
        userStatus,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChats = () => useContext(ChatContext);
