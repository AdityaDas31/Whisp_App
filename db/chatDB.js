import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system/legacy";

let db = null;

// 📄 Log file path
const LOG_FILE = FileSystem.documentDirectory + "whisp_sqlite.log";

/* ---------------- LOG HELPERS ---------------- */

const appendLog = async (data) => {
    try {
        const logEntry =
            `[${new Date().toISOString()}]\n` +
            JSON.stringify(data, null, 2) +
            "\n\n";

        await FileSystem.writeAsStringAsync(LOG_FILE, logEntry, {
            append: true, // ✅ Expo SDK 54
        });
    } catch (err) {
        console.warn("❌ Failed to write log file", err);
    }
};


export const readLogFile = async () => {
    try {
        return await FileSystem.readAsStringAsync(LOG_FILE);
    } catch {
        return "No logs found";
    }
};

export const resetLogFile = async () => {
    await FileSystem.writeAsStringAsync(LOG_FILE, "");
};

/* ---------------- INIT ---------------- */

export const initDB = async () => {
    if (db) return db;

    db = await SQLite.openDatabaseAsync("whisp_chat.db");

    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      chatId TEXT NOT NULL,
      senderId TEXT NOT NULL,
      type TEXT,
      content TEXT,
      media TEXT,
      extra TEXT,
      status TEXT,
      createdAt INTEGER,
      isMine INTEGER
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      lastMessage TEXT,
      lastMessageAt INTEGER,
      unreadCount INTEGER,
      isGroup INTEGER
    );
  `);

    await appendLog({ event: "DB_INIT_SUCCESS" });

    return db;
};

const getDB = async () => {
    if (!db) await initDB();
    return db;
};

/* ---------------- MESSAGE HELPERS ---------------- */

export const saveMessage = async (msg, myUserId) => {
    const db = await getDB();

    const row = {
        id: msg._id,
        chatId: msg.chatId || msg.chat?._id,
        senderId: typeof msg.sender === "object" ? msg.sender._id : msg.sender,
        type: msg.type,
        content: msg.content || null,
        media: msg.media ? JSON.stringify(msg.media) : null,
        extra: JSON.stringify({
            location: msg.location,
            poll: msg.poll,
            contact: msg.contact,
        }),
        status: msg.status || "sent",
        createdAt: new Date(msg.createdAt).getTime(),
        isMine:
            (typeof msg.sender === "object"
                ? msg.sender._id
                : msg.sender) === myUserId
                ? 1
                : 0,
    };

    await db.runAsync(
        `
    INSERT OR REPLACE INTO messages
    (id, chatId, senderId, type, content, media, extra, status, createdAt, isMine)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
            row.id,
            row.chatId,
            row.senderId,
            row.type,
            row.content,
            row.media,
            row.extra,
            row.status,
            row.createdAt,
            row.isMine,
        ]
    );

    // 📝 WRITE TO FILE (NO CONSOLE)
    await appendLog({
        event: "MESSAGE_INSERTED",
        message: {
            ...row,
            media: row.media ? JSON.parse(row.media) : null,
            extra: JSON.parse(row.extra),
        },
    });
};

export const getMessagesByChat = async (chatId) => {
    const db = await getDB();
    return await db.getAllAsync(
        `SELECT * FROM messages WHERE chatId = ? ORDER BY createdAt ASC`,
        [chatId]
    );
};

export const updateMessageStatus = async (id, status) => {
    const db = await getDB();

    await db.runAsync(
        `UPDATE messages SET status = ? WHERE id = ?`,
        [status, id]
    );

    await appendLog({
        event: "MESSAGE_STATUS_UPDATED",
        messageId: id,
        status,
    });
};

export const getUnackedMessages = async () => {
    const db = await getDB();
    return await db.getAllAsync(
        `SELECT id FROM messages WHERE status = 'sent' AND isMine = 0`
    );
};

export const getChatsFromLocalDB = async () => {
    const db = await getDB();

    const rows = await db.getAllAsync(`
    SELECT
      chatId,
      MAX(createdAt) as lastMessageAt,
      SUM(
        CASE
          WHEN isMine = 0 AND status != 'seen' THEN 1
          ELSE 0
        END
      ) as unreadCount
    FROM messages
    GROUP BY chatId
    ORDER BY lastMessageAt DESC
  `);

    return rows;
};

export const getLatestMessageForChat = async (chatId) => {
    const db = await getDB();

    const rows = await db.getAllAsync(
        `SELECT * FROM messages WHERE chatId = ? ORDER BY createdAt DESC LIMIT 1`,
        [chatId]
    );

    return rows[0] || null;
};


export const markChatMessagesAsSeen = async (chatId) => {
    const db = await getDB();

    await db.runAsync(
        `
    UPDATE messages
    SET status = 'seen'
    WHERE chatId = ?
      AND isMine = 0
      AND status != 'seen'
    `,
        [chatId]
    );
};



/* ---------------- DEBUG & RESET (FIXED) ---------------- */

export const debugPrintMessages = async () => {
    const db = await getDB();
    const rows = await db.getAllAsync(
        `SELECT * FROM messages ORDER BY createdAt DESC`
    );
    console.log("📦 SQLITE MESSAGES:", rows);
    return rows;
};

export const resetDB = async () => {
    const db = await getDB();
    await db.execAsync(`
    DELETE FROM messages;
    DELETE FROM chats;
  `);
    console.log("🧹 SQLite DB reset");
};