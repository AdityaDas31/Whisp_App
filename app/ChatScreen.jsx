import { useRoute } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
    Image,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Keyboard,
    ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Entypo } from "@expo/vector-icons";
import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";
import { useAuth } from "../context/AuthContext";
import { useChats } from "../context/ChatContext";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Contacts from "expo-contacts";


const emojis = ["😀", "😃", "😄", "😁", "😆", "🥹", "😅", "😂", "🤣", "🥲", "☺", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😶‍🌫️", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🫢", "🫡", "🤫", "🫠", "🤥", "😶", "🫥", "😐", "🫤", "😑", "🫨"];

const attachmentOptions = [
    { name: "Location", icon: "location-sharp", type: "location" },
    { name: "Contact", icon: "person-outline", type: "contact" },
    { name: "Document", icon: "document-text-outline", type: "document" },
    { name: "Audio", icon: "musical-notes-outline", type: "audio" },
    { name: "Poll", icon: "bar-chart-outline", type: "poll" },
];
export default function ChatScreen() {
    const route = useRoute();
    const { chatId, name, profileImage } = route.params;
    const { user } = useAuth();
    const { fetchMessages, sendMessage, messages, joinChat, markAsRead } = useChats();

    const [text, setText] = useState("");
    const [profileVisible, setProfileVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [showEmoji, setShowEmoji] = useState(false);
    const [showAttachModal, setShowAttachModal] = useState(false);

    const [showPollModal, setShowPollModal] = useState(false);
    const [pollTopic, setPollTopic] = useState("");
    const [pollOptions, setPollOptions] = useState(["", ""]);

    const flatListRef = useRef(null);
    const inputRef = useRef(null);

    // Keyboard listeners
    useEffect(() => {
        const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
            setKeyboardHeight(e.endCoordinates.height);
            setShowEmoji(false);
        });
        const hideSub = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        joinChat(chatId);
        fetchMessages(chatId);
        markAsRead(chatId);
    }, [chatId]);

    useEffect(() => {
        if (messages[chatId]?.length) markAsRead(chatId);
    }, [messages[chatId]]);

    const handleSend = async () => {
        if (!text.trim()) return;
        const ok = await sendMessage(chatId, text.trim());
        if (ok) setText("");
    };

    const toggleEmojiKeyboard = () => {
        if (showEmoji) {
            setShowEmoji(false);
            inputRef.current.focus();
        } else {
            Keyboard.dismiss();
            setShowEmoji(true);
        }
    };

    const addEmoji = (emoji) => setText((prev) => prev + emoji);
    const removeEmoji = () => setText((prev) => prev.slice(0, -2));

    const chatMessages = messages[chatId] || [];

    const renderItem = ({ item }) => {
        const senderId = typeof item.sender === "object" ? item.sender._id : item.sender;
        const isMine = senderId === user._id;

        let tickIcon = "✓"; // sent
        let tickColor = "#555";

        if (item.status === "delivered") tickIcon = "✓✓";
        if (item.status === "read") tickColor = "#0A84FF";

        return (
            <View style={[styles.messageWrapper, isMine ? styles.myWrapper : styles.otherWrapper]}>
                <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.otherMessage]}>
                    <Text style={styles.messageText}>{item.content}</Text>
                    {isMine && <Text style={[styles.tickText, { color: tickColor }]}>{tickIcon}</Text>}
                </View>
            </View>
        );
    };

    const openCamera = async () => {
        // Ask permission
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            alert("Camera permission is required to use this feature.");
            return;
        }

        // Launch camera
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            // result.assets[0].uri -> the image URI
            console.log("Captured Image URI:", result.assets[0].uri);

            // 🔥 send image message here
            // await sendMessage(chatId, { type: "image", uri: result.assets[0].uri });
        }
    };

    const handleAttachmentPress = async (type) => {
        console.log("Selected attachment type:", type);
        setShowAttachModal(false);
        if (type === "location") {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return alert("Location permission denied!");

            const location = await Location.getCurrentPositionAsync({});
            console.log("My Location:", location.coords);
            // sendMessage(chatId, `Location: ${location.coords.latitude}, ${location.coords.longitude}`);
        }

        if (type === "contact") {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status !== "granted") return alert("Contacts permission denied!");

            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.EmailAddresses],
            });

            if (data.length > 0) {
                // Pick the first contact for example
                const contact = data[0];
                console.log("Selected Contact:", contact);
                // sendMessage(chatId, `Contact: ${contact.name}, ${contact.phoneNumbers?.[0]?.number}`);
            }
        }

        if (type === "poll") {
            setShowPollModal(true); // Open poll modal (frontend only)
        }
    };

    const addPollOption = () => setPollOptions([...pollOptions, ""]);
    const updatePollOption = (index, value) => {
        const newOptions = [...pollOptions];
        newOptions[index] = value;
        setPollOptions(newOptions);
    };
    const submitPoll = () => {
        console.log("Poll:", { pollTopic, pollOptions });
        setShowPollModal(false);
        // sendMessage(chatId, JSON.stringify({ pollTopic, pollOptions })) <-- optional later
    };
    


    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerLeft} onPress={() => setProfileVisible(true)}>
                    <Image source={{ uri: profileImage }} style={styles.headerImage} />
                    <Text style={styles.headerName}>{name}</Text>
                </TouchableOpacity>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="call-outline" size={22} color="#0A84FF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="videocam-outline" size={24} color="#0A84FF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Messages + Input */}
            <View style={{ flex: 1 }}>
                <KeyboardAwareFlatList
                    ref={flatListRef}
                    data={chatMessages}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
                    extraScrollHeight={10}
                    enableOnAndroid
                    keyboardShouldPersistTaps="handled"
                />

                {/* Input */}
                <View style={[styles.inputContainer, { marginBottom: keyboardHeight }]}>
                    {/* Emoji / Keyboard Toggle */}
                    <TouchableOpacity style={styles.iconLeft} onPress={toggleEmojiKeyboard}>
                        {/* <Ionicons name={showEmoji ? "keyboard-outline" : "happy-outline"} size={24} color="#555" /> */}
                        {showEmoji ? <Entypo name="keyboard" size={24} color="#555" /> : <Ionicons name="happy-outline" size={24} color="#555" />}

                    </TouchableOpacity>

                    {/* TextInput */}
                    <TextInput
                        ref={inputRef}
                        style={styles.inputWithIcons}
                        value={text}
                        onChangeText={setText}
                        placeholder="Type a message..."
                        placeholderTextColor="#A1A1A1"
                        multiline
                    />

                    {/* Paperclip */}
                    <TouchableOpacity
                        style={[styles.attachIcon, { right: text.length > 0 || showEmoji ? 70 : 100 }]}
                        onPress={() => setShowAttachModal(true)}
                    >
                        <Ionicons name="attach-outline" size={24} color="#555" />
                    </TouchableOpacity>

                    {/* Camera */}
                    {!text.length && !showEmoji && (
                        <TouchableOpacity style={styles.iconRight} onPress={openCamera}>
                            <Ionicons name="camera-outline" size={24} color="#555" />
                        </TouchableOpacity>
                    )}

                    {/* Send */}
                    <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Custom Emoji Keyboard */}
                {showEmoji && (
                    <View style={styles.emojiContainer}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.emojiGrid}
                        >
                            {emojis.map((emoji, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); // ✅ Haptic feedback
                                        addEmoji(emoji);
                                    }}
                                    style={styles.emojiButton}
                                >
                                    <Text style={{ fontSize: 28 }}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Delete button fixed at bottom right */}
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // ✅ different feedback
                                removeEmoji();
                            }}
                        >
                            <Ionicons name="backspace-outline" size={28} color="#555" />
                        </TouchableOpacity>
                    </View>
                )}

            </View>

            {/* Profile Modal */}
            <Modal visible={profileVisible} animationType="slide" transparent onRequestClose={() => setProfileVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Image source={{ uri: profileImage }} style={styles.modalImage} />
                        <Text style={styles.modalName}>{name}</Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalButton}>
                                <Ionicons name="notifications-off-outline" size={22} color="#FF3B30" />
                                <Text style={styles.modalButtonText}>Mute</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton}>
                                <Ionicons name="close-circle-outline" size={22} color="#FF3B30" />
                                <Text style={styles.modalButtonText}>Block</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.closeModal} onPress={() => setProfileVisible(false)}>
                            <Text style={styles.closeModalText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Attachments Modal */}

            <Modal
                visible={showAttachModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowAttachModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    onPress={() => setShowAttachModal(false)}
                />
                <View style={styles.attachModal}>
                    {attachmentOptions.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.attachOption}
                            onPress={() => handleAttachmentPress(item.type)}
                        >
                            <Ionicons name={item.icon} size={28} color="#0A84FF" />
                            <Text style={styles.attachText}>{item.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Modal>

            {/* Poll Modal */}

            <Modal visible={showPollModal} animationType="slide" transparent>
                <TouchableOpacity
                    style={styles.modalOverlay}
                    onPress={() => setShowPollModal(false)}
                />
                <View style={styles.pollModal}>
                    <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 12 }}>Create Poll</Text>
                    <TextInput
                        placeholder="Poll Topic"
                        value={pollTopic}
                        onChangeText={setPollTopic}
                        style={styles.pollInput}
                    />
                    {pollOptions.map((opt, idx) => (
                        <TextInput
                            key={idx}
                            placeholder={`Option ${idx + 1}`}
                            value={opt}
                            onChangeText={(text) => updatePollOption(idx, text)}
                            style={styles.pollInput}
                        />
                    ))}
                    <TouchableOpacity onPress={addPollOption} style={styles.addOptionBtn}>
                        <Text style={{ color: "#0A84FF" }}>+ Add Option</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={submitPoll} style={styles.submitPollBtn}>
                        <Text style={{ color: "#fff" }}>Send Poll</Text>
                    </TouchableOpacity>
                </View>
            </Modal>



        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#F7F8FA" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#EAEAEA",
        justifyContent: "space-between",
        ...Platform.select({
            android: { elevation: 4 },
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 2,
                shadowOffset: { width: 0, height: 1 },
            },
        }),
    },
    headerLeft: { flexDirection: "row", alignItems: "center" },
    headerImage: { width: 42, height: 42, borderRadius: 21, marginRight: 12 },
    headerName: { fontSize: 18, fontWeight: "600", color: "#1C1C1E" },
    headerIcons: { flexDirection: "row" },
    iconButton: { marginHorizontal: 8 },

    messageWrapper: { flexDirection: "row", marginVertical: 4, marginHorizontal: 8 },
    myWrapper: { justifyContent: "flex-end" },
    otherWrapper: { justifyContent: "flex-start" },
    messageBubble: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, maxWidth: "75%" },
    myMessage: { backgroundColor: "#DCF8C6", borderTopRightRadius: 4, alignSelf: "flex-end" },
    otherMessage: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 4, alignSelf: "flex-start" },
    messageText: { fontSize: 15, color: "#1C1C1E" },
    tickText: { fontSize: 11, marginTop: 4, alignSelf: "flex-end" },

    inputContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, backgroundColor: "#F7F8FA", marginBottom: 30 },
    inputWithIcons: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 25,
        paddingLeft: 40,
        paddingRight: 110,
        paddingVertical: Platform.OS === "ios" ? 10 : 6,
        fontSize: 15,
        backgroundColor: "#FFFFFF",
        color: "#1C1C1E",
        maxHeight: 100,
        marginBottom: 30

    },
    iconLeft: { position: "absolute", left: 12, zIndex: 10, marginBottom: 30 },
    attachIcon: { position: "absolute", zIndex: 10, marginBottom: 30 },
    iconRight: { position: "absolute", right: 70, zIndex: 10, marginBottom: 30 },
    sendButton: { backgroundColor: "#0A84FF", padding: 12, marginLeft: 6, borderRadius: 25, justifyContent: "center", alignItems: "center", marginBottom: 30 },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
    modalContent: { backgroundColor: "#FFFFFF", padding: 20, borderRadius: 16, width: "80%", alignItems: "center", ...Platform.select({ android: { elevation: 6 }, ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } } }) },
    modalImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
    modalName: { fontSize: 20, fontWeight: "600", color: "#1C1C1E", marginBottom: 20 },
    modalActions: { flexDirection: "row", marginBottom: 20 },
    modalButton: { alignItems: "center", marginHorizontal: 16 },
    modalButtonText: { fontSize: 14, marginTop: 4, color: "#333" },
    closeModal: { backgroundColor: "#0A84FF", paddingVertical: 8, paddingHorizontal: 24, borderRadius: 20 },
    closeModalText: { color: "#FFF", fontWeight: "600" },

    emojiContainer: {
        height: 250,
        backgroundColor: "#f2f2f2",
        borderTopWidth: 1,
        borderColor: "#ddd",
        position: "relative",
    },
    emojiGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        padding: 8,
    },
    emojiButton: {
        width: `${100 / 9}%`, // 9 columns
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 10,
    },
    deleteButton: {
        position: "absolute",
        bottom: 10,
        right: 10,
        padding: 8,
    },

    attachModal: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        backgroundColor: "#fff",
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        flexDirection: "row",
        justifyContent: "space-around",
        flexWrap: "wrap",
        bottom: 50
    },
    attachOption: {
        width: "30%",
        alignItems: "center",
        marginVertical: 12,
    },
    attachText: {
        marginTop: 6,
        fontSize: 14,
        color: "#1C1C1E",
        textAlign: "center",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
    },

    pollModal: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        backgroundColor: "#fff",
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    pollInput: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginVertical: 6,
    },
    addOptionBtn: {
        marginVertical: 6,
    },
    submitPollBtn: {
        backgroundColor: "#0A84FF",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
    },


});
