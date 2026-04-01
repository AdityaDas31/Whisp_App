// ChatContext.js
import axios from "axios";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { io } from "socket.io-client";
import { API_BASE_URL, SOCKET_URL } from "../config";
import { useAuth } from "./AuthContext";
import {
  initDB,
  saveMessage,
  getMessagesByChat,
  updateMessageStatus,
  getUnackedMessages,
  getChatsFromLocalDB,
  getLatestMessageForChat,
  markChatMessagesAsSeen
} from "../db/chatDB";

const ChatContext = createContext();



export const ChatProvider = ({ children }) => {
  const { token, user } = useAuth();

  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState({});
  const [socket, setSocket] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const [userStatus, setUserStatus] = useState({});
  const [dbReady, setDbReady] = useState(false);


  const activeChatRef = useRef(null); // 🔥 UPDATED

  const messageWriteInProgress = useRef(false);

  let loadChatsTimer = null;


  const updateMessageInState = (messageId, status) => {
    setMessages((prev) => {
      const updated = { ...prev };

      for (const chatId in updated) {
        updated[chatId] = updated[chatId].map((m) =>
          m._id === messageId ? { ...m, status } : m
        );
      }

      return updated;
    });
  };


  useEffect(() => {
    initDB()
      .then(() => {
        console.log("✅ SQLite ready");
        setDbReady(true); // 🔥 IMPORTANT
      })
      .catch(err => console.log("❌ SQLite init error", err));
  }, []);

  const addLocalMessage = (chatId, message) => {
    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message],
    }));
  };



  // ---------------- SOCKET INIT ----------------
  useEffect(() => {
    if (!token || !user?._id) return;

    const s = io(SOCKET_URL, { transports: ["websocket"] });

    s.on("connect", async () => {
      console.log("✅ Socket connected:", s.id);
      s.emit("registerUser", user._id);

      // 🔁 Retry ACKs
      const pending = await getUnackedMessages();
      pending.forEach((m) => {
        s.emit("message:ack", { messageId: m.id });
      });
    });

    // ✅ RECEIVE MESSAGE
    s.on("message:new", async (message) => {
      try {
        const chatId = message.chatId || message.chat?._id;
        if (!chatId) return;

        messageWriteInProgress.current = true;

        // 1️⃣ Save locally FIRST
        await saveMessage(message, user._id);

        // 🔥 If user is currently inside this chat, mark seen locally
        if (activeChatRef.current === chatId) {
          await updateMessageStatus(message._id, "seen");
        }

        messageWriteInProgress.current = false;

        // 2️⃣ ACK to server ONLY after save
        s.emit("message:ack", { messageId: message._id });


        // ✅ persistence ACK (NEW)
        s.emit("message:persisted", {
          messageId: message._id,
        });

        await loadLocalMessages(chatId);

        // 🔥 ADD THIS
        safeLoadChatsFromLocalDB();


        // 3️⃣ Reload from DB
        const rows = await getMessagesByChat(chatId);
        setMessages((prev) => ({
          ...prev,
          [chatId]: rows.map((r) => ({
            _id: r.id,
            chatId: r.chatId,
            sender: r.senderId,
            type: r.type,
            content: r.content,
            media: r.media ? JSON.parse(r.media) : null,
            ...JSON.parse(r.extra || "{}"),
            status: r.status,
            createdAt: new Date(r.createdAt).toISOString(),
          })),
        }));
      } catch (err) {
        console.log("❌ message:new handler error", err);
      }

    });


    // ✅ MESSAGE DELIVERED
    s.on("message:delivered", async ({ messageId }) => {
      await updateMessageStatus(messageId, "delivered");
      updateMessageInState(messageId, "delivered");
    });

    // ✅ MESSAGE SEEN
    s.on("message:seen", async ({ messageId }) => {
      // 1️⃣ Update SQLite
      await updateMessageStatus(messageId, "seen");

      // 2️⃣ Update in-memory messages
      updateMessageInState(messageId, "seen");

      // 3️⃣ 🔥 Refresh HomeScreen data from SQLite
      safeLoadChatsFromLocalDB();

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
  const joinChat = async (chatId) => {
    if (!socket || !chatId) return;

    activeChatRef.current = chatId;
    setActiveChatId(chatId);

    // 1️⃣ Update LOCAL DB first (THIS IS KEY)
    await markChatMessagesAsSeen(chatId);

    // 2️⃣ Refresh chat list from SQLite
    safeLoadChatsFromLocalDB();


    // 3️⃣ Inform server
    socket.emit("joinRoom", { chatId });
    socket.emit("chat:seen", { chatId });
  };


  // 🔹 LEAVE CHAT
  const leaveChat = async () => {
    if (!socket || !activeChatRef.current) return;

    socket.emit("leaveRoom", { chatId: activeChatRef.current });

    activeChatRef.current = null;
    setActiveChatId(null);

    // 🔥 Wait until DB is stable
    const waitForDB = async () => {
      while (messageWriteInProgress.current) {
        await new Promise(res => setTimeout(res, 50));
      }
      safeLoadChatsFromLocalDB();

    };

    waitForDB();
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

  const loadLocalMessages = async (chatId) => {
    const rows = await getMessagesByChat(chatId);

    // Convert DB rows → UI messages
    const parsed = rows.map((r) => ({
      _id: r.id,
      chatId: r.chatId,
      sender: r.senderId,
      type: r.type,
      content: r.content,
      media: r.media ? JSON.parse(r.media) : null,
      ...JSON.parse(r.extra || "{}"),
      status: r.status,
      createdAt: new Date(r.createdAt).toISOString(),
    }));

    setMessages((prev) => ({
      ...prev,
      [chatId]: parsed,
    }));
  };


  const sendMessage = async (chatId, messageData) => {
    try {
      let res;

      if (messageData.file) {
        messageWriteInProgress.current = true;
        const tempId = `temp-${Date.now()}`;

        addLocalMessage(chatId, {
          _id: tempId,
          chatId,
          sender: user._id,
          type: "media",
          media: {
            localUri: messageData.localUri,
            format: messageData.file.type.startsWith("video")
              ? "video"
              : "image",
          },
          status: "uploading",
          progress: 0,
          createdAt: new Date().toISOString(),
        });

        // 👇 upload continues below
        const formData = new FormData();
        formData.append("chatId", chatId);
        formData.append("type", "media");
        formData.append("file", messageData.file);

        const res = await axios.post(
          `${API_BASE_URL}/message/message`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (e) => {
              const percent = Math.round((e.loaded * 100) / e.total);

              setMessages(prev => ({
                ...prev,
                [chatId]: prev[chatId].map(m =>
                  m._id === tempId
                    ? {
                      ...m,
                      progress: Math.max(m.progress || 0, Math.min(percent, 99)),
                      status: "uploading",
                    }
                    : m
                ),
              }));
            },

          }
        );

        setMessages(prev => ({
          ...prev,
          [chatId]: prev[chatId].map(m =>
            m._id === tempId
              ? {
                ...m,
                status: "processing",
                progress: 99,
              }
              : m
          ),
        }));

        await new Promise(res => setTimeout(res, 150));

        const realMsg = res.data.message;

        // 🔥 REPLACE TEMP WITH REAL MESSAGE
        setMessages(prev => ({
          ...prev,
          [chatId]: prev[chatId].map(m =>
            m._id === tempId
              ? {
                ...realMsg,
                media: {
                  ...realMsg.media,
                  localUri: messageData.localUri,
                },
                status: "sent",
                progress: 100, // ✅ ONLY HERE
              }
              : m
          ),
        }));

        // await saveMessage(realMsg, user._id);
        await saveMessage(
          {
            ...realMsg,
            media: {
              ...realMsg.media,
              localUri: messageData.localUri, // 🔥 persist sender's local file
            },
          },
          user._id
        );

        socket.emit("sendMessage", { messageId: realMsg._id });
        messageWriteInProgress.current = false;
        return true;
      } else {
        res = await axios.post(
          `${API_BASE_URL}/message/message`,
          { chatId, ...messageData },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      const msg = res.data.message;

      if (messageData.localUri && msg.type === "media") {
        msg.localUri = messageData.localUri;
      }

      // save locally first
      await saveMessage(msg, user._id);

      // then emit to socket
      socket.emit("sendMessage", { messageId: msg._id });

      // reload from db
      const rows = await getMessagesByChat(chatId);

      setMessages((prev) => ({
        ...prev,
        [chatId]: rows.map(r => ({
          _id: r.id,
          chatId: r.chatId,
          sender: r.senderId,
          type: r.type,
          content: r.content,
          media: r.media ? JSON.parse(r.media) : null,
          ...JSON.parse(r.extra || "{}"),
          status: r.status,
          createdAt: new Date(r.createdAt).toISOString(),
        })),
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

  const loadChatsFromLocalDB = async () => {
    if (!dbReady || !token) return;
    // 1️⃣ get chat metadata from server
    const res = await axios.get(`${API_BASE_URL}/chat/chats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const serverChats = res.data.chats || [];

    // 2️⃣ get local unread + last message
    const localStats = await getChatsFromLocalDB(); // SQLite

    const localMap = {};
    localStats.forEach((row) => {
      localMap[row.chatId] = row;
    });

    // 3️⃣ merge
    const merged = [];

    for (const chat of serverChats) {
      const local = localMap[chat._id];
      let latestMessage = null;

      if (local) {
        const lastMsg = await getLatestMessageForChat(chat._id);
        if (lastMsg) {
          latestMessage = {
            _id: lastMsg.id,
            chatId: lastMsg.chatId,
            sender: lastMsg.senderId,
            status: lastMsg.status,
            type: lastMsg.type,
            content: lastMsg.content,
            media: lastMsg.media ? JSON.parse(lastMsg.media) : null,
            ...JSON.parse(lastMsg.extra || "{}"),
            createdAt: new Date(lastMsg.createdAt).toISOString(),
          };
        }
      }

      merged.push({
        ...chat, // ✅ users, group info still here
        latestMessage,
        unreadCount: local?.unreadCount || 0,
      });
    }

    setChats(merged);
  };

  const safeLoadChatsFromLocalDB = async () => {
    clearTimeout(loadChatsTimer);

    loadChatsTimer = setTimeout(() => {
      loadChatsFromLocalDB();
    }, 100); // ⏱️ 100ms is enough
  };

  // ---------------- GROUP CHAT ----------------

  // create group
  const createGroup = async ({ name, users, image }) => {

    try {

      const formData = new FormData();

      formData.append("name", name);

      formData.append(
        "users",
        JSON.stringify(users)
      );

      if (image) {

        formData.append("groupImage", {

          uri: image.uri,

          name: "group.jpg",

          type: "image/jpeg"

        });

      }

      const res = await axios.post(

        `${API_BASE_URL}/chat/group`,

        formData,

        {

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }

        }

      );

      // refresh chat list
      safeLoadChatsFromLocalDB();

      return res.data.chat;

    } catch (err) {

      console.log("createGroup error", err);

      return null;

    }

  };



  // make admin
  const makeGroupAdmin = async (chatId, userId) => {

    try {

      const res = await axios.put(

        `${API_BASE_URL}/chat/group/admin`,

        { chatId, userId },

        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }

      );

      safeLoadChatsFromLocalDB();

      return res.data.chat;

    } catch (err) {

      console.log("make admin error", err);

      return null;

    }

  };



  // delete group
  const deleteGroup = async (chatId) => {

    try {

      console.log("DELETE CHAT ID:", chatId);

      await axios.delete(

        `${API_BASE_URL}/chat/group/${chatId}`,

        {

          headers: {
            Authorization: `Bearer ${token}`
          }

        }

      );

      safeLoadChatsFromLocalDB();

      return true;

    } catch (err) {

      console.log(
        "delete group error",
        err.response?.data
      );

      return false;

    }

  };



  return (
    <ChatContext.Provider
      value={{
        chats,
        fetchChats,
        openChat,
        sendMessage,
        messages,
        joinChat,
        leaveChat,
        userStatus,
        socket,
        loadLocalMessages,
        loadChatsFromLocalDB,
        dbReady,
        safeLoadChatsFromLocalDB,
        createGroup,
        makeGroupAdmin,
        deleteGroup
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChats = () => useContext(ChatContext);
