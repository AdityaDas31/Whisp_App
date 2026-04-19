
import { useEffect, useRef, useState } from "react";

import * as Contacts from "expo-contacts";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer } from "expo-video";
import Avatar from "../components/Avatar";
import { Entypo, Ionicons } from "@expo/vector-icons";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
    Dimensions,
} from "react-native";
import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { useChats } from "../context/ChatContext";
import { useChatTheme } from "../context/ChatThemeContext";
import { useCall } from "../context/CallContext";

import AttachModal from "../components/AttachModal";
import ChatMediaBubble from "../components/ChatMediaBubble";
import ContactsModal from "../components/ContactsModal";
import MediaPreviewModal from "../components/MediaPreviewModal";
import MediaViewerModal from "../components/MediaViewerModal";
import PollModal from "../components/PollModal";
import ProfileModal from "../components/ProfileModal";

import { evaluate } from "mathjs";
import { updateMessageLocalUri } from "../db/chatDB";

// Small helper data and constants
const emojis = [
    "😀", "😃", "😄", "😁", "😆", "🥹", "😅", "😂", "🤣", "🥲", "☺", "😊", "😇", "🙂", "🙃",
    "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐",
    "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹", "😣", "😖",
    "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😶‍🌫️",
    "😱", "😨", "😰", "😥", "😓", "🤗", "🤔",
];

const attachmentOptions = [
    { name: "Location", icon: "location-sharp", type: "location" },
    { name: "Contact", icon: "person-outline", type: "contact" },
    { name: "Document", icon: "document-text-outline", type: "document" },
    { name: "Photos / Videos", icon: "camera-outline", type: "photos" },
    { name: "Audio", icon: "musical-notes-outline", type: "audio" },
    { name: "Poll", icon: "bar-chart-outline", type: "poll" },
];




export default function ChatScreen() {
    const { chatId, name, profileImage, userId, myId, isGroup, users, groupAdmins, leftUsers, description } = useLocalSearchParams();
    const groupUsers =
        users
            ? JSON.parse(users)
            : [];

    const parsedGroupAdmins =
        groupAdmins
            ? JSON.parse(groupAdmins)
            : [];

    const parsedLeftUsers =
        leftUsers
            ? JSON.parse(leftUsers)
            : [];

    const { user } = useAuth();
    const { sendMessage, messages, joinChat, userStatus, socket, leaveChat, fetchChats, loadLocalMessages, deleteMessage } = useChats();
    const { startCall } = useCall();

    const [text, setText] = useState("");
    const [profileVisible, setProfileVisible] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [showAttachModal, setShowAttachModal] = useState(false);

    const [showPollModal, setShowPollModal] = useState(false);
    const [pollTopic, setPollTopic] = useState("");
    const [pollOptions, setPollOptions] = useState(["", ""]);
    const [contactsList, setContactsList] = useState([]);
    const [showContactsModal, setShowContactsModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selected, setSelected] = useState(null);
    const [previewMedia, setPreviewMedia] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [fullscreenMedia, setFullscreenMedia] = useState(null); // { uri, type }
    const [showPopup, setShowPopup] = useState(false);
    const [currentExpr, setCurrentExpr] = useState("");
    const [mode, setMode] = useState(null);
    const popupAnim = useRef(new Animated.Value(0)).current;

    const [selectedMessages, setSelectedMessages] = useState([]);
    const isSelectionMode = selectedMessages.length > 0;

    const [downloadProgress, setDownloadProgress] = useState({});

    const [showViewerControls, setShowViewerControls] = useState(true);
    const controlsTimeoutRef = useRef(null);


    // Responsive measurements
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const isTablet = windowWidth >= 768;
    const avatarSize = isTablet ? 56 : 42;
    const headerFontSize = isTablet ? 20 : 18;
    const emojiHeight = Math.min(360, windowHeight * 0.45);
    const blurredPreviewSize = Math.min(420, windowWidth * 0.6);

    const guidelineBaseWidth = 375;
    const scale = (size) => (windowWidth / guidelineBaseWidth) * size;
    const verticalScale = (size) => (windowHeight / 812) * size;

    const styles = createStyles(windowWidth, windowHeight);

    const fullscreenPlayer = useVideoPlayer(
        fullscreenMedia?.uri ?? null,
        (player) => {
            if (fullscreenMedia?.type === "video") {
                player.loop = false;
                player.play();
            }
        }
    );




    const flatListRef = useRef(null);
    const inputRef = useRef(null);

    const { theme } = useChatTheme();

    // Return true when a hex color is visually light
    const isColorLight = (color) => {
        if (!color) return false;
        const c = color.substring(1);
        const rgb = parseInt(c, 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = rgb & 0xff;
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        return luminance > 186;
    };


    useEffect(() => {
        joinChat(chatId);
        loadLocalMessages(chatId);
        if (!name && chatId) {
            loadLocalMessages(chatId);
        }
        return () => {
            leaveChat();
            fetchChats(); // refresh unread count
        };
    }, [chatId]);

    useEffect(() => {
        if (!socket || !chatId || !user?._id) return;

        socket.emit("markSeen", {
            chatId,
            userId: user._id,
        });
    }, [chatId, socket]);

    const chatMessages = messages[chatId] || [];
    const prevMessageCount = useRef(chatMessages.length);



    const handleSend = async () => {
        if (!text.trim()) return;
        const ok = await sendMessage(chatId, { type: "text", content: text.trim() });
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

    const formatMessageTime = (date) => {
        if (!date) return "";

        return new Date(date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Preview shown for remote media that hasn't been downloaded locally
    const BlurredMediaPreview = ({ thumbnailUri, progress, onDownload }) => (
        <Pressable onPress={onDownload} style={styles.blurredPreview}>
            <Image source={{ uri: thumbnailUri }} style={styles.blurredImage} blurRadius={20} />
            <View style={styles.blurredOverlay} />

            {progress > 0 ? (
                <>
                    <ActivityIndicator color="#fff" />
                    <Text style={styles.progressText}>{progress}%</Text>
                </>
            ) : (
                <>
                    <Ionicons name="download-outline" size={42} color="#fff" />
                    <Text style={styles.downloadText}>Download</Text>
                </>
            )}
        </Pressable>
    );


    const renderItem = ({ item }) => {
        // console.log("media", item.media);
        const senderId = typeof item.sender === "object" ? item.sender._id : item.sender;
        const isMine = senderId === user._id;
        let senderName = null;

        if (isGroup) {

            const senderId =
                typeof item.sender === "object"
                    ? item.sender._id
                    : item.sender;

            const senderUser = groupUsers.find(
                u => u._id === senderId
            );

            senderName = senderUser?.name;

        }
        const isMedia = item.type === "media" && (item.media?.format === "image" || item.media?.format === "video");
        const isRichContent =
            item.type === "media" ||
            item.type === "location" ||
            item.type === "contact" ||
            item.type === "poll";


        // Render message body based on message.type
        const renderMessageContent = (message, isMine) => {
            const textColor = isMine ? theme.myTextColor : theme.otherTextColor;
            const cardsBackground = isMine ? theme.myCardBg : theme.otherCardBg;
            const cardTextColor = isMine ? theme.myCardText : theme.otherCardText;
            const cardLinkColor = isMine ? theme.myCardLink : theme.otherCardLink;
            const cardIconColor = isMine ? theme.myCardIconColor : theme.otherCardIcon;
            const cardIconBg = isMine ? theme.myCardIconBg : theme.otherCardIconBg;

            switch (message.type) {
                case "text":

                    if (
                        message.content === "This message was deleted" ||
                        message.content === "You deleted this message" ||
                        message.content === "This message was deleted by admin"
                    ) {

                        return (
                            <Text
                                style={{
                                    fontStyle: "italic",
                                    opacity: 0.7,
                                    color: textColor
                                }}
                            >
                                {message.content}
                            </Text>
                        );

                    }

                    return (
                        <Text
                            style={[
                                styles.textMessage,
                                { color: textColor }
                            ]}
                        >
                            {message.content}
                        </Text>
                    );

                case "location":
                    return (
                        <View style={[styles.locationCard, { backgroundColor: cardsBackground }]} pointerEvents={isSelectionMode ? "none" : "auto"}>
                            <View style={styles.locationHeader}>
                                <View style={[styles.locationIconWrap, { backgroundColor: cardIconBg }]}>
                                    <Ionicons name="location" size={18} style={{ color: cardIconColor }} />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.locationTitle, { color: cardTextColor }]}>
                                        Shared location
                                    </Text>
                                    <Text
                                        style={[styles.locationSubtitle, { color: cardTextColor }]}
                                        numberOfLines={1}
                                    >
                                        Tap to view on map
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.locationFooter}>
                                <Ionicons name="map-outline" size={14} style={{ color: cardIconColor }} />
                                <Text style={[styles.locationLink, { color: cardLinkColor }]} numberOfLines={1}>
                                    {message.location?.link}
                                </Text>
                            </View>
                        </View>
                    );


                case "contact":
                    return (
                        <View style={styles.contactCard} pointerEvents={isSelectionMode ? "none" : "auto"}>
                            {/* Header */}
                            <View style={styles.contactHeader}>
                                <View style={styles.contactAvatar}>
                                    <Ionicons name="person" size={20} color="#fff" />
                                </View>

                                <View style={styles.contactInfo}>
                                    <Text
                                        style={[styles.contactName, { color: textColor }]}
                                        numberOfLines={1}
                                    >
                                        {message.contact?.name}
                                    </Text>
                                    <Text
                                        style={[styles.contactNumber, { color: textColor }]}
                                        numberOfLines={1}
                                    >
                                        {message.contact?.phoneNumber}
                                    </Text>
                                </View>
                            </View>

                            {/* Action */}
                            <TouchableOpacity
                                style={styles.contactAction}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="person-add-outline" size={16} color="#0A84FF" />
                                <Text style={styles.contactActionText}>Add to contacts</Text>
                            </TouchableOpacity>
                        </View>
                    );

                case "poll":
                    return (
                        <View style={styles.pollCard} pointerEvents={isSelectionMode ? "none" : "auto"}>
                            {/* Header */}
                            <Text style={[styles.pollTitle, { color: textColor }]}>
                                {message.poll?.topic}
                            </Text>

                            <Text style={styles.pollHint}>
                                Select one option
                            </Text>

                            {/* Options */}
                            {message.poll?.options?.map((opt, i) => {
                                // 🔹 STATIC vote percentage for now
                                const progress = [65, 25, 10][i] || 0;
                                const isSelected = selected === i;

                                return (
                                    <Pressable
                                        key={i}
                                        onPress={() => setSelected(i)}
                                        style={[
                                            styles.pollOption,
                                            isSelected && styles.pollOptionSelected,
                                        ]}
                                    >
                                        {/* Progress Bar */}
                                        <View style={styles.pollProgressBackground}>
                                            <View
                                                style={[
                                                    styles.pollProgressFill,
                                                    { width: `${progress}%` },
                                                ]}
                                            />
                                        </View>

                                        {/* Content */}
                                        <View style={styles.pollOptionContent}>
                                            <View style={styles.radioOuter}>
                                                {isSelected && <View style={styles.radioInner} />}
                                            </View>

                                            <Text
                                                style={[
                                                    styles.pollOptionText,
                                                    { color: textColor },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {opt}
                                            </Text>

                                            <Text style={styles.pollPercent}>
                                                {progress}%
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            })}

                            <View style={styles.pollDivider} />

                            <Text style={styles.pollFooter}>
                                View votes
                            </Text>
                        </View>
                    );

                case "media": {
                    const format = message.media?.format;
                    const isVideo = format === "video";
                    const localUri = message.media?.localUri;
                    const remoteUri = message.media?.url;

                    if (!localUri) {
                        return (
                            <BlurredMediaPreview
                                thumbnailUri={message.media?.thumbnail || remoteUri}
                                progress={downloadProgress[message._id] || 0}
                                onDownload={() =>
                                    downloadMediaToWhisp({
                                        uri: remoteUri,
                                        type: format,
                                        messageId: message._id,
                                    })
                                }
                            />
                        );
                    }


                    return (
                        <ChatMediaBubble
                            uri={localUri}
                            type={format}
                            isMine={isMine}
                            time={formatMessageTime(item.createdAt)}
                            status={item.status}
                            progress={item.progress}
                            onPress={() =>
                                setFullscreenMedia({
                                    message: item,
                                    uri: localUri,
                                    type: format,
                                })
                            }
                        />
                    );
                }


                default:
                    return (
                        <Text style={[styles.textMessage, { color: textColor }]}>
                            Unsupported message
                        </Text>
                    );
            }
        };
        return (
            <View
                style={[
                    styles.messageWrapper,
                    isMine ? styles.myWrapper : styles.otherWrapper,
                ]}
            >

                <Pressable
                    onLongPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setSelectedMessages(prev =>
                            prev.includes(item._id) ? prev : [...prev, item._id]
                        );
                    }}

                    onPress={() => {
                        if (isSelectionMode) {
                            setSelectedMessages(prev =>
                                prev.includes(item._id)
                                    ? prev.filter(id => id !== item._id)
                                    : [...prev, item._id]
                            );
                            return;
                        }

                        if (item.type === "media") {
                            setFullscreenMedia({
                                message: item,
                                uri: item.media?.localUri,
                                type: item.media?.format,
                            });
                        }


                        // ✅ NORMAL TAP ACTION HERE
                        if (item.type === "location") {
                            Linking.openURL(item.location?.link);
                        }
                    }}
                    style={[
                        styles.messageBubble,
                        {
                            backgroundColor: selectedMessages.includes(item._id)
                                ? "rgba(10,132,255,0.15)"
                                : isMine
                                    ? theme.myMessage
                                    : theme.otherMessage,
                            paddingVertical: isRichContent ? 5 : 10,
                            paddingHorizontal: isRichContent ? 5 : 14,

                        },
                    ]}
                >
                    {/* show sender name for group */}
                    {isGroup && !isMine && senderName && (
                        <Text style={styles.senderName}>
                            {senderName}
                        </Text>
                    )}

                    {renderMessageContent(item, isMine)}
                    {!isMedia && (

                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "flex-end",
                                marginTop: 4,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 11,
                                    color: isMine ? "#000" : "#777",
                                    marginRight: isMine ? 4 : 0,
                                }}
                            >
                                {formatMessageTime(item.createdAt)}
                            </Text>

                            {isMine && (
                                <View style={{ alignSelf: "flex-end", marginTop: 4 }}>
                                    <Ionicons
                                        name={
                                            item.status === "seen"
                                                ? "checkmark-done"
                                                : item.status === "delivered"
                                                    ? "checkmark-done"
                                                    : "checkmark"
                                        }
                                        size={16}
                                        color={item.status === "seen" ? "#0A84FF" : "#999"}
                                    />
                                </View>
                            )}
                        </View>
                    )}
                </Pressable>

            </View >
        );


    };

    const openCamera = async () => {
        // Request camera permission
        Keyboard.dismiss();
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== "granted") {
            alert("Camera permission is required to use this feature.");
            return;
        }
        // Launch camera
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            console.log("Captured Image URI:", result.assets[0].uri);
        }
        focusInputSafely();
    };

    const requestGalleryPermission = async () => {
        const { status, canAskAgain } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== "granted") {
            Alert.alert(
                "Permission required",
                "Gallery permission is required to select photos or videos.",
                canAskAgain
                    ? [{ text: "OK" }]
                    : [{ text: "Open Settings", onPress: () => Linking.openSettings() }]
            );
            return false;
        }
        return true;
    };


    const handleAttachmentPress = async (type) => {
        console.log("Selected attachment type:", type);
        Keyboard.dismiss();
        setShowAttachModal(false);
        if (type === "location") {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return alert("Location permission denied!");

            const location = await Location.getCurrentPositionAsync({});
            console.log("My Location:", location.coords);
            await sendMessage(chatId, {
                type: "location",
                location: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    link: `https://www.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`
                }
            });
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            focusInputSafely();
        }

        if (type === "contact") {
            console.log("Contact option tapped ✅");

            const { status } = await Contacts.requestPermissionsAsync();
            console.log("Contacts permission:", status);

            if (status !== "granted") {
                alert("Contacts permission denied!");
                return;
            }

            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.PhoneNumbers],
            });

            console.log("Contacts found:", data.length);

            if (data.length > 0) {
                setContactsList(data);
                setShowContactsModal(true);
                console.log("Modal should open now");
            } else {
                alert("No contacts found on device!");
            }
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            focusInputSafely();

        }


        if (type === "poll") {
            // Open poll modal
            setShowPollModal(true);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            focusInputSafely();
        }

        if (type === "photos") {
            const hasPermission = await requestGalleryPermission();
            if (!hasPermission) return;

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images', 'videos'],
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled) {
                setPreviewMedia({ uri: result.assets[0].uri, type: result.assets[0].type });
            }
            focusInputSafely();
        }
    };



    const videoPlayer = useVideoPlayer(
        previewMedia?.type === "video" ? previewMedia.uri : null,
        (player) => {
            if (previewMedia?.type === "video") {
                player.loop = false;
            }
        }
    );



    const addPollOption = () => setPollOptions([...pollOptions, ""]);
    const updatePollOption = (index, value) => {
        const newOptions = [...pollOptions];
        newOptions[index] = value;
        setPollOptions(newOptions);
    };
    const submitPoll = async () => {
        console.log("Poll:", { pollTopic, pollOptions });
        setShowPollModal(false);
        await sendMessage(chatId, {
            type: "poll",
            poll: { topic: pollTopic, options: pollOptions },
        });
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };


    // Filter contacts by search query
    const filteredContacts = contactsList.filter(
        (c) =>
            c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phoneNumbers?.[0]?.number?.includes(searchQuery)
    );

    const handleSelectContact = (item) => {
        sendMessage(chatId, {
            type: "contact",
            contact: {
                name: item.name,
                phoneNumber: item.phoneNumbers?.[0]?.number,
            },
        });

        setShowContactsModal(false);
    };





    const checkExpression = (value) => {
        // Check whether the input is a math expression or contains multiple numbers
        try {
            if (/^[\d\s()+\-*/.]+$/.test(value.trim())) {
                evaluate(value); // validate expression
                setCurrentExpr(value.trim());
                setMode("arithmetic");
                return true;
            }
        } catch { }
        // Check whether text contains multiple separate numbers
        const numbers = value.match(/\b\d+\b/g);
        if (numbers && numbers.length >= 2) {
            setCurrentExpr(value.trim());
            setMode("sum");
            return true;
        }

        return false;
    };

    const handleChange = (value) => {
        setText(value);

        if (checkExpression(value)) {
            setShowPopup(true);
            Animated.timing(popupAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(popupAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => setShowPopup(false));
        }
    };

    const handleCalculate = () => {
        let resultText = text;

        if (mode === "arithmetic") {
            try {
                const result = evaluate(currentExpr);
                resultText = `(${currentExpr}) = ${result}`;
            } catch {
                resultText = text;
            }
        } else if (mode === "sum") {
            const numbers = text.match(/\b\d+\b/g)?.map(Number) || [];
            const sum = numbers.reduce((a, b) => a + b, 0);
            resultText = `${text} = ${sum}`;
        }

        setText(resultText);
        setShowPopup(false);
    };


    const downloadMediaToWhisp = async ({ uri, type, messageId }) => {
        try {
            const ext = type === "video" ? "mp4" : "jpg";
            const tempUri =
                FileSystem.cacheDirectory + `whisp_${Date.now()}.${ext}`;

            setDownloadProgress((p) => ({ ...p, [messageId]: 1 }));

            const downloadResumable = FileSystem.createDownloadResumable(
                uri,
                tempUri,
                {},
                (progress) => {
                    const percent = Math.round(
                        (progress.totalBytesWritten /
                            progress.totalBytesExpectedToWrite) *
                        100
                    );

                    setDownloadProgress((p) => ({
                        ...p,
                        [messageId]: percent,
                    }));
                }
            );

            const { uri: downloadedUri } =
                await downloadResumable.downloadAsync();

            const asset = await MediaLibrary.createAssetAsync(downloadedUri);

            await updateMessageLocalUri(messageId, asset.uri);
            loadLocalMessages(chatId);

            setDownloadProgress((p) => {
                const copy = { ...p };
                delete copy[messageId];
                return copy;
            });

            Alert.alert("Downloaded ✅", "Saved to gallery");
        } catch (e) {
            console.log("Download error:", e);
            setDownloadProgress((p) => {
                const copy = { ...p };
                delete copy[messageId];
                return copy;
            });
            Alert.alert("Error", "Failed to download media");
        }
    };



    const showControlsTemporarily = () => {
        setShowViewerControls(true);

        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }

        controlsTimeoutRef.current = setTimeout(() => {
            setShowViewerControls(false);
        }, 2000);
    };

    useEffect(() => {
        if (fullscreenMedia) {
            showControlsTemporarily();
        }
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, [fullscreenMedia]);



    // Fullscreen viewer derived data
    const fullscreenMsg = fullscreenMedia?.message;

    const fullscreenSenderLabel = fullscreenMsg
        ? fullscreenMsg.sender === myId
            ? "You"
            : name
        : "";

    const fullscreenTimeLabel = fullscreenMsg?.createdAt
        ? new Date(fullscreenMsg.createdAt).toLocaleString([], {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "";

    const focusInputSafely = () => {
        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    };





    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.backgroundColor }]} edges={["top", "bottom"]}>
            <StatusBar
                backgroundColor={theme.backgroundColor}
                barStyle={isColorLight(theme.textColor) ? "light-content" : "dark-content"}
            />
            {theme.wallpaper && (
                <Image
                    source={{ uri: theme.wallpaper }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
            )}
            {/* Header */}

            {isSelectionMode ? (
                /* 🔥 Selection Header */
                <View style={styles.header}>
                    {/* LEFT */}
                    <TouchableOpacity
                        onPress={() => setSelectedMessages([])}
                        style={{ padding: 8 }}
                    >
                        <Ionicons name="arrow-back" size={24} color="#0A84FF" />
                    </TouchableOpacity>

                    {/* CENTER (optional count) */}
                    <Text style={{ fontSize: 18, fontWeight: "600" }}>
                        {selectedMessages.length}
                    </Text>

                    {/* RIGHT */}
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="arrow-undo-outline" size={22} style={styles.headerIcon} />
                        <Ionicons name="arrow-redo-outline" size={22} style={styles.headerIcon} />
                        <Ionicons name="star-outline" size={22} style={styles.headerIcon} />
                        <Ionicons name="information-circle-outline" size={22} style={styles.headerIcon} />
                        {/* <Ionicons name="trash-outline" size={22} style={styles.headerIcon} /> */}
                        <Ionicons
                            name="trash-outline"
                            size={22}
                            style={styles.headerIcon}
                            onPress={() => {

                                Alert.alert(

                                    "Delete message",

                                    "Are you sure you want to delete this message?",

                                    [

                                        {
                                            text: "Cancel",
                                            style: "cancel"
                                        },

                                        {

                                            text: "Delete",

                                            style: "destructive",

                                            onPress: async () => {

                                                for (let id of selectedMessages) {

                                                    await deleteMessage(id, chatId);

                                                }

                                                setSelectedMessages([]);

                                            }

                                        }

                                    ]

                                );

                            }}
                        />
                        <Ionicons name="ellipsis-vertical" size={22} style={styles.headerIcon} />
                    </View>
                </View>
            ) : (
                /* ✅ Normal Chat Header */
                <View style={[styles.header, { backgroundColor: theme.backgroundColor }]}>
                    <TouchableOpacity style={styles.headerLeft} onPress={() => setProfileVisible(true)}>

                        <Avatar
                            uri={profileImage}
                            name={name}
                            size={avatarSize}
                            style={[
                                styles.headerImage,
                                {
                                    width: avatarSize,
                                    height: avatarSize,
                                    borderRadius: avatarSize / 2,
                                    marginRight: isTablet ? 16 : 12,
                                },
                            ]}
                        />

                        {/* Name + Status stacked vertically */}
                        <View style={{ flexDirection: "column" }}>
                            <Text style={[styles.headerName, { color: theme.textColor, fontSize: headerFontSize }]}>{name}</Text>

                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                                {userStatus[userId]?.online ? (
                                    <>
                                        {/* 🟢 Green dot with glow */}
                                        <View style={styles.onlineDot} />

                                        {/* Online text */}
                                        <Text style={styles.onlineText}>Online</Text>
                                    </>
                                ) : userStatus[userId]?.lastSeen ? (
                                    <Text style={styles.lastSeenText}>
                                        {`Last seen ${new Date(userStatus[userId].lastSeen).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}`}
                                    </Text>
                                ) : null}
                            </View>


                        </View>
                    </TouchableOpacity>

                    <View style={styles.headerIcons}>

                        <TouchableOpacity style={styles.iconButton} onPress={() => startCall(userId, name, profileImage, user._id, user.name, user.profileImage)}>
                            <Ionicons name="call-outline" size={22} color="#0A84FF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() =>
                                startCall(
                                    userId,
                                    name,
                                    profileImage,
                                    user._id,
                                    user.name,
                                    user.profileImage,
                                    "video"
                                )
                            }
                        >
                            <Ionicons name="videocam-outline" size={24} color="#0A84FF" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Messages + Input */}

            <View style={{ flex: 1, }}>
                <KeyboardAwareFlatList
                    inverted
                    ref={flatListRef}
                    data={[...chatMessages].reverse()}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={{
                        paddingTop: scale(8),
                        paddingBottom: scale(8),
                    }}
                    enableOnAndroid
                    enableAutomaticScroll
                    keyboardShouldPersistTaps="handled"
                    keyboardOpeningTime={0}
                    extraScrollHeight={Platform.OS === "ios" ? 20 : 80}
                    extraHeight={0}
                />


                {/* Input */}
                <View style={[styles.inputContainer, { backgroundColor: theme.backgroundColor }]}>
                    {/* Emoji / Keyboard Toggle */}

                    <TouchableOpacity style={styles.iconLeft} onPress={toggleEmojiKeyboard}>
                        {showEmoji ? <Entypo name="keyboard" size={24} color="#555" /> : <Ionicons name="happy-outline" size={24} color="#555" />}
                    </TouchableOpacity>

                    {/* TextInput */}
                    <TextInput
                        ref={inputRef}
                        style={styles.inputWithIcons}
                        value={text}
                        onChangeText={handleChange}
                        placeholder="Type a message..."
                        placeholderTextColor="#A1A1A1"
                        multiline
                    />

                    {showPopup && (
                        <Animated.View style={[styles.popup, { opacity: popupAnim }]}>
                            <Text>Calculate this expression?</Text>
                            <TouchableOpacity onPress={handleCalculate} style={styles.button}>
                                <Text style={{ color: "white" }}>Yes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowPopup(false)} style={[styles.button, { backgroundColor: "gray" }]}>
                                <Text style={{ color: "white" }}>No</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

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
                    <TouchableOpacity onPress={handleSend} style={[styles.sendButton, { backgroundColor: theme.buttonBg }]}>
                        <Ionicons name="send" size={20} style={{ color: theme.buttonText }} />
                    </TouchableOpacity>
                </View>


                {/* Custom Emoji Keyboard */}
                {showEmoji && (
                    <View style={[styles.emojiContainer, { height: emojiHeight }]}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.emojiGrid}
                        >
                            {emojis.map((emoji, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                removeEmoji();
                            }}
                        >
                            <Ionicons name="backspace-outline" size={28} color="#555" />
                        </TouchableOpacity>
                    </View>
                )}

            </View>


            {/* Profile Modal */}

            <ProfileModal
                visible={profileVisible}
                onClose={() => setProfileVisible(false)}

                profileData={{
                    chatId,
                    name,
                    profileImage,
                    isGroup,
                    users: groupUsers,
                    groupAdmins: parsedGroupAdmins,
                    leftUsers: parsedLeftUsers,
                    description,
                    media: chatMessages.filter(
                        m => m.type === "media" &&
                            (m.media?.format === "image" || m.media?.format === "video")
                    )
                }}
            />

            {/* Attachments Modal */}

            <AttachModal
                visible={showAttachModal}
                onClose={() => {
                    setShowAttachModal(false);
                    focusInputSafely(); // ✅ IMPORTANT
                }}
                options={attachmentOptions}
                onSelect={handleAttachmentPress}
            />

            {/* Contact Modal */}

            <ContactsModal
                visible={showContactsModal}
                onClose={() => setShowContactsModal(false)}
                contactsList={contactsList}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filteredContacts={filteredContacts}
                onSelectContact={handleSelectContact}
            />

            {/* Poll Modal */}

            <PollModal
                visible={showPollModal}
                onClose={() => setShowPollModal(false)}
                pollTopic={pollTopic}
                setPollTopic={setPollTopic}
                pollOptions={pollOptions}
                updatePollOption={updatePollOption}
                addPollOption={addPollOption}
                submitPoll={submitPoll}
            />

            {/* Preview Media Modal */}
            <MediaPreviewModal
                visible={!!previewMedia}
                media={previewMedia}
                videoPlayer={videoPlayer}
                uploading={uploading}
                onClose={() => setPreviewMedia(null)}
                onSend={async () => {
                    setPreviewMedia(null);   // 🔥 close modal immediately

                    await sendMessage(chatId, {
                        type: "media",
                        localUri: previewMedia.uri,
                        file: {
                            uri: previewMedia.uri,
                            name: `file.${previewMedia.type === "video" ? "mp4" : "jpg"}`,
                            type: `${previewMedia.type}/${previewMedia.type === "video" ? "mp4" : "jpeg"}`,
                        },
                    });
                    setTimeout(() => {
                        inputRef.current?.focus();
                    }, 100);
                }}


            />



            {/* Full Screen Modal */}

            <MediaViewerModal
                visible={!!fullscreenMedia}
                media={fullscreenMedia}
                videoPlayer={fullscreenMedia?.type === "video" ? fullscreenPlayer : null}
                showControls={showViewerControls}
                onToggleControls={showControlsTemporarily}
                onClose={() => setFullscreenMedia(null)}
                onDownload={() =>
                    downloadMediaToWhisp({
                        uri: fullscreenMedia.uri,
                        type: fullscreenMedia.type,
                    })
                }
                senderLabel={fullscreenSenderLabel}
                timeLabel={fullscreenTimeLabel}
            />



        </SafeAreaView>
    );
}


const createStyles = (width, height) => {
    const guidelineBaseWidth = 375;
    const scale = (size) => (width / guidelineBaseWidth) * size;
    return StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: "#F7F8FA" },
        header: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: scale(14),
            paddingVertical: scale(10),
            justifyContent: "space-between",
        },
        headerLeft: { flexDirection: "row", alignItems: "center" },
        headerImage: {
            width: scale(42),
            height: scale(42),
            borderRadius: scale(21),
            marginRight: scale(12),
        },
        headerName: {
            fontSize: scale(18),
            fontWeight: "600",
        },
        headerIcons: { flexDirection: "row" },
        iconButton: { padding: 10, },
        headerIcon: {
            marginHorizontal: 8,
            color: "#0A84FF",
        },


        messageWrapper: {
            flexDirection: "row",
            alignItems: "flex-end",
            marginVertical: scale(4),
            paddingHorizontal: scale(8),
        },
        myWrapper: { justifyContent: "flex-end", },
        otherWrapper: { justifyContent: "flex-start" },
        messageBubble: {
            maxWidth: width * 0.75,
            minWidth: scale(40),
            borderRadius: scale(16),
        },
        myMessage: { borderTopRightRadius: 4 },
        otherMessage: { borderTopLeftRadius: 4 },
        textMessage: { fontSize: scale(15), color: "#222", lineHeight: scale(21), width: "auto" },

        // Location card
        locationCard: {
            padding: 12,
            borderRadius: 16,
            maxWidth: "100%",
            backgroundColor: "#FFFFFF",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
        },

        locationHeader: {
            flexDirection: "row",
            alignItems: "center",
        },

        locationIconWrap: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#0A84FF",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
        },

        locationTitle: {
            fontSize: 15,
            fontWeight: "600",
        },

        locationSubtitle: {
            fontSize: 12,
            color: "#8E8E93",
            marginTop: 2,
        },

        locationFooter: {
            alignItems: "center",
            marginTop: 10,
            paddingTop: 8,
            borderTopWidth: 0.5,
            borderColor: "#E5E5EA",
        },

        locationLink: {
            fontSize: 12,
            color: "#0A84FF",
            marginLeft: 6,
            flex: 1,
        },

        // Contact card
        contactCard: {
            padding: 14,
            borderRadius: 16,
            minWidth: "80%",
            backgroundColor: "#FFFFFF",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
        },

        contactHeader: {
            flexDirection: "row",
            alignItems: "center",
        },

        contactAvatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#4CAF50",
            alignItems: "center",
            justifyContent: "center",
        },

        contactInfo: {
            marginLeft: 10,
            flex: 1,
        },

        contactName: {
            fontSize: 15,
            fontWeight: "600",
        },

        contactNumber: {
            fontSize: 13,
            color: "#8E8E93",
            marginTop: 2,
        },

        contactAction: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 12,
            paddingVertical: 10,
            borderTopWidth: 0.5,
            borderColor: "#E5E5EA",
        },

        contactActionText: {
            fontSize: 14,
            fontWeight: "600",
            color: "#0A84FF",
            marginLeft: 6,
        },


        // Poll card
        pollCard: {
            padding: 14,
            borderRadius: 16,
            width: "100%",
            backgroundColor: "#FFFFFF",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
        },

        pollTitle: {
            fontSize: 16,
            fontWeight: "600",
            marginBottom: 4,
        },

        pollHint: {
            fontSize: 12,
            color: "#8E8E93",
            marginBottom: 12,
        },

        pollOption: {
            marginBottom: 10,
            borderRadius: 12,
            overflow: "hidden",

        },

        pollOptionSelected: {
            borderWidth: 1,
            borderColor: "#0A84FF",
        },

        pollProgressBackground: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "#F2F2F7",
        },

        pollProgressFill: {
            height: "100%",
            backgroundColor: "rgba(10,132,255,0.15)",
        },

        pollOptionContent: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 10,
            paddingHorizontal: 12,
        },

        pollOptionText: {
            flex: 1,
            fontSize: 14,
            marginLeft: 8,
        },

        pollPercent: {
            fontSize: 12,
            fontWeight: "600",
            color: "#0A84FF",
        },

        radioOuter: {
            height: 20,
            width: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: "#0A84FF",
            alignItems: "center",
            justifyContent: "center",
        },

        radioInner: {
            height: 10,
            width: 10,
            borderRadius: 5,
            backgroundColor: "#0A84FF",
        },

        pollDivider: {
            height: 1,
            backgroundColor: "#E5E5EA",
            marginVertical: 10,
        },

        pollFooter: {
            fontSize: 13,
            color: "#0A84FF",
            fontWeight: "500",
            textAlign: "center",
        },

        inputContainer: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: scale(10),
            paddingVertical: scale(6),
            backgroundColor: "#F7F8FA",
        },
        inputWithIcons: { flex: 1, borderWidth: 1, borderColor: "#E0E0E0", borderRadius: scale(25), paddingLeft: scale(40), paddingRight: scale(110), paddingVertical: Platform.OS === "ios" ? scale(10) : scale(6), fontSize: scale(15), backgroundColor: "#FFFFFF", color: "#1C1C1E", maxHeight: scale(110), minHeight: scale(36), },
        iconLeft: {
            position: "absolute",
            left: scale(14),
            zIndex: 10,
        },

        attachIcon: {
            position: "absolute",
            right: scale(90),
            zIndex: 10,
        },
        iconRight: {
            position: "absolute",
            right: scale(65),
            zIndex: 10,
        },
        sendButton: {
            padding: scale(12),
            marginLeft: scale(6),
            borderRadius: scale(25),
            justifyContent: "center",
            alignItems: "center",
        },

        emojiContainer: { height: Math.min(scale(320), height * 0.45), backgroundColor: "#f2f2f2", borderTopWidth: 1, borderColor: "#ddd", elevation: 10, },
        emojiGrid: { flexDirection: "row", flexWrap: "wrap", padding: 8, },
        emojiButton: { width: `${100 / (width > 500 ? 12 : 9)}%`, justifyContent: "center", alignItems: "center", paddingVertical: scale(10), },
        deleteButton: { position: "absolute", bottom: 10, right: 10, padding: 8, },

        popup: {
            position: "absolute",
            bottom: height * 0.12,
            left: scale(16),
            right: scale(16),
            backgroundColor: "#fff",
            padding: scale(12),
            borderRadius: scale(10),
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 5,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        button: {
            backgroundColor: "#007bff",
            padding: 6,
            borderRadius: 6,
            marginLeft: 8,
        },

        onlineDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#25D366",
            marginRight: 6,
            shadowColor: "#25D366",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 6,
            elevation: 6,
        },

        onlineText: {
            fontSize: 12,
            color: "#25D366",
            fontWeight: "500",
        },

        lastSeenText: {
            fontSize: 12,
            color: "#8E8E93",
        },

        blurredOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(0,0,0,0.45)",
        },

        blurredPreview: {
            width: width * 0.55,
            aspectRatio: 1,
            borderRadius: scale(12),
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
        },
        blurredImage: {
            ...StyleSheet.absoluteFillObject,
            resizeMode: "cover",
        },
        senderName: {

            fontSize: 12,

            color: "#666",

            marginBottom: 2,

            marginLeft: 4

        },


    });
};