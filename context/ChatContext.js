// ChatContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { Alert } from "react-native";
import { io } from "socket.io-client";
import { API_BASE_URL, SOCKET_URL } from "../config";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

const getChatKeyFromMessage = (msg) => {
  return (
    msg.chatId ||
    (typeof msg.chat === "string" ? msg.chat : msg.chat?._id) ||
    null
  );
};

export const ChatProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState({});
  const [socket, setSocket] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);

  // ✅ Init socket once
  useEffect(() => {
    if (!token) return;

    const s = io(SOCKET_URL, { transports: ["websocket"] });

    s.on("connect", () => {
      s.emit("registerUser", user._id);
      if (activeChatId) s.emit("joinRoom", activeChatId);
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

      setChats((prev) =>
        prev.map((c) =>
          c._id === chatKey
            ? {
              ...c,
              latestMessage: message,
              unread: activeChatId === chatKey ? false : true,
            }
            : c
        )
      );
    });

    // ✅ Delivered update
    s.on("messageDelivered", ({ messageId, chatId }) => {
      setMessages((prev) => {
        const chatMsgs = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: chatMsgs.map((msg) =>
            msg._id === messageId ? { ...msg, status: "delivered" } : msg
          ),
        };
      });
    });

    // ✅ Seen update
    s.on("messagesReadUpdate", ({ chatId, userId }) => {
      setMessages((prev) => {
        const chatMsgs = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: chatMsgs.map((msg) =>
            msg.readBy?.includes(userId)
              ? msg
              : {
                ...msg,
                readBy: [...(msg.readBy || []), userId],
                status: "read",
              }
          ),
        };
      });
    });

    setSocket(s);
    return () => {
      s.removeAllListeners();
      s.disconnect();
    };
  }, [token]);

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
      setChats((prev) =>
        prev.map((c) => (c._id === chat._id ? { ...c, unread: false } : c))
      );
      return chat;
    } catch (err) {
      Alert.alert("Error", "Could not open chat");
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/message/messages/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      // messageData should include type and related fields
      const res = await axios.post(
        `${API_BASE_URL}/message/message`,
        { chatId, ...messageData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newMsg = { ...res.data.message, chatId, status: "sent" };

      // Emit socket event
      socket?.emit("sendMessage", newMsg);

      // Update local messages
      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), newMsg],
      }));

      // Update latestMessage in chat list
      setChats((prev) =>
        prev.map((c) => (c._id === chatId ? { ...c, latestMessage: newMsg } : c))
      );

      return true;
    } catch (err) {
      console.error("❌ Send message error:", err?.message || err);
      return false;
    }
  };



  const markAsRead = async (chatId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/message/message/markAsRead`,
        { chatId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => {
        const chatMsgs = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: chatMsgs.map((m) =>
            m.readBy?.includes(user._id)
              ? m
              : { ...m, readBy: [...(m.readBy || []), user._id], status: "read" }
          ),
        };
      });

      socket?.emit("messagesRead", { chatId, userId: user._id });
    } catch (err) {
      console.error("❌ Mark read error:", err?.message || err);
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
        markAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChats = () => useContext(ChatContext);
