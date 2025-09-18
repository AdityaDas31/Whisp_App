import { useRoute } from "@react-navigation/native";
import { useEffect, useRef, useState, useMemo } from "react";
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
    ScrollView,
    FlatList,
    Linking,
    Pressable,
    StatusBar,
    ActivityIndicator
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons, Entypo } from "@expo/vector-icons";
import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";
import { useAuth } from "../context/AuthContext";
import { useChats } from "../context/ChatContext";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Contacts from "expo-contacts";
import { useChatTheme } from "../context/ChatThemeContext";
import { VideoView, useVideoPlayer } from "expo-video";
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';
import ProfileModal from "../components/ProfileModal";
import AttachModal from "../components/AttachModal";
import ContactsModal from "../components/ContactsModal";
import PollModal from "../components/PollModal";




const emojis = ["😀", "😃", "😄", "😁", "😆", "🥹", "😅", "😂", "🤣", "🥲", "☺", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😶‍🌫️", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🫢", "🫡", "🤫", "🫠", "🤥", "😶", "🫥", "😐", "🫤", "😑", "🫨"];

const attachmentOptions = [
    { name: "Location", icon: "location-sharp", type: "location" },
    { name: "Contact", icon: "person-outline", type: "contact" },
    { name: "Document", icon: "document-text-outline", type: "document" },
    { name: "Photos / Videos", icon: "camera-outline", type: "photos" },
    { name: "Audio", icon: "musical-notes-outline", type: "audio" },
    { name: "Poll", icon: "bar-chart-outline", type: "poll" },
];

const VideoMessage = ({ uri }) => {
    const player = useVideoPlayer(
        { uri }, // must be wrapped in an object
        (player) => {
            player.loop = false;
            // player.play(); // autoplay for testing
            player.shouldPlay = false;
        }
    );

    return (
        <VideoView
            style={{ width: 250, height: 200, borderRadius: 10 }}
            player={player}
            nativeControls={false}
            allowsFullscreen
        />

    );
};
export default function ChatScreen() {
    const route = useRoute();
    const { chatId, name, profileImage, userId } = route.params;
    const { user } = useAuth();
    const { fetchMessages, sendMessage, messages, joinChat, userStatus } = useChats();

    const [text, setText] = useState("");
    const [profileVisible, setProfileVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
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

    const fullscreenPlayer = useVideoPlayer(
        fullscreenMedia?.type === "video" ? fullscreenMedia.uri : null,
        (player) => {
            player.loop = false;
            player.play() // autoplay) when modal opens
        }
    );


    const flatListRef = useRef(null);
    const inputRef = useRef(null);

    const { theme } = useChatTheme();

    const isColorLight = (color) => {
        if (!color) return false;
        // remove # and parse
        const c = color.substring(1);
        const rgb = parseInt(c, 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = rgb & 0xff;
        // luminance check
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        return luminance > 186; // threshold
    };

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
    }, [chatId]);


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

    const chatMessages = messages[chatId] || [];


    const renderItem = ({ item }) => {
        const senderId = typeof item.sender === "object" ? item.sender._id : item.sender;
        const isMine = senderId === user._id;

        // ✅ function to render message body based on type
        const renderMessageContent = (message, isMine) => {
            const textColor = isMine ? theme.myTextColor : theme.otherTextColor;

            switch (message.type) {
                case "text":
                    return (
                        <Text style={[styles.textMessage, { color: textColor }]}>
                            {message.content}
                        </Text>
                    );

                case "location":
                    return (
                        <TouchableOpacity
                            style={styles.locationCard}
                            onPress={() => Linking.openURL(message.location?.link)}
                        >
                            <View style={styles.cardHeader}>
                                <Ionicons name="location" size={20} color="#d9534f" />
                                <Text style={[styles.cardTitle, { color: textColor }]}>
                                    Shared Location
                                </Text>
                            </View>
                            <Text
                                style={[styles.cardSubtitle, { color: textColor }]}
                                numberOfLines={1}
                            >
                                {message.location?.link}
                            </Text>
                        </TouchableOpacity>
                    );

                case "contact":
                    return (
                        <View style={styles.contactCard}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="person-circle" size={36} color="#4CAF50" />
                                <View style={{ marginLeft: 8, alignItems: "flex-start" }}>
                                    <Text style={[styles.cardTitle, { color: textColor }]}>
                                        {message.contact?.name}
                                    </Text>
                                    <Text style={[styles.cardSubtitle, { color: textColor }]}>
                                        {message.contact?.phoneNumber}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.contactAction}>
                                <Text style={styles.contactActionText}>Add Contact</Text>
                            </TouchableOpacity>
                        </View>
                    );

                case "poll":
                    return (
                        <View style={styles.pollCard}>
                            <Text style={[styles.cardTitle, { color: textColor }]}>
                                {message.poll?.topic}
                            </Text>
                            <Text style={[styles.pollHint, { color: textColor }]}>
                                Select one or more
                            </Text>

                            {message.poll?.options?.map((opt, i) => (
                                <Pressable
                                    key={i}
                                    style={styles.pollOption}
                                    onPress={() => setSelected(i)}
                                >
                                    <View style={styles.radioOuter}>
                                        {selected === i && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={[styles.pollOptionText, { color: textColor }]}>
                                        {opt}
                                    </Text>
                                </Pressable>
                            ))}

                            <View style={styles.pollDivider} />
                            <Text style={[styles.pollFooter, { color: textColor }]}>
                                View votes
                            </Text>
                        </View>
                    );
                case "media":
                    if (message.media?.format === "image" || message.media?.format === "video") {
                        return (
                            <TouchableOpacity
                                onPress={() =>
                                    setFullscreenMedia({
                                        uri: message.media.url,
                                        type: message.media.format,
                                    })
                                }
                            >
                                {message.media.format === "image" ? (
                                    <Image
                                        source={{ uri: message.media.url }}
                                        style={{ width: 200, height: 200, borderRadius: 10 }}
                                    />
                                ) : (
                                    <VideoMessage uri={message.media.url} />
                                )}
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity onPress={() => Linking.openURL(message.media?.url)}>
                            <Text style={{ color: "blue" }}>Download File</Text>
                        </TouchableOpacity>
                    );


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
                <View
                    style={[
                        styles.messageBubble,
                        {
                            backgroundColor: isMine
                                ? theme.myMessage
                                : theme.otherMessage,
                        },
                    ]}
                >
                    {renderMessageContent(item, isMine)}
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
            await sendMessage(chatId, {
                type: "location",
                location: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    link: `https://www.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`
                }
            });
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
                console.log("Modal should open now ✅");
            } else {
                alert("No contacts found on device!");
            }
        }


        if (type === "poll") {
            setShowPollModal(true); // Open poll modal (frontend only)
        }

        if (type === "photos") {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                setPreviewMedia({
                    uri: result.assets[0].uri,
                    type: result.assets[0].type, // "image" or "video"
                });
            }
        }

    };



    const videoPlayer = useVideoPlayer(
        previewMedia?.type === "video" ? previewMedia.uri : null,
        (player) => {
            player.loop = false;
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
        // sendMessage(chatId, JSON.stringify({ pollTopic, pollOptions })) <-- optional later
        await sendMessage(chatId, {
            type: "poll",
            poll: { topic: pollTopic, options: pollOptions },
        });
    };


    // Filter contacts dynamically
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


    const downloadMedia = async (uri) => {
        try {
            // Request permission
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission denied", "Cannot save media without permission.");
                return;
            }

            // Generate local file path
            const fileUri = FileSystem.cacheDirectory + uri.split('/').pop();

            // Download file to cache
            const downloaded = await FileSystem.downloadAsync(uri, fileUri);

            // Save to media library
            const asset = await MediaLibrary.createAssetAsync(downloaded.uri);

            // Create or get album named "Whisp"
            const albumName = "Whisp";
            let album = await MediaLibrary.getAlbumAsync(albumName);
            if (!album) {
                album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
            } else {
                await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            }

            Alert.alert("Success", `Media saved to ${albumName} folder!`);
        } catch (error) {
            console.log("Download error:", error);
            Alert.alert("Error", "Failed to save media.");
        }
    };

    return (
        <SafeAreaProvider style={[styles.safeArea, { backgroundColor: theme.backgroundColor }]} edges={["top"]}>
            <StatusBar
                backgroundColor={theme.backgroundColor} // ✅ same as SafeAreaProvider
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
            <View style={[styles.header, { backgroundColor: theme.backgroundColor }]}>
                <TouchableOpacity style={styles.headerLeft} onPress={() => setProfileVisible(true)}>
                    <Image source={{ uri: profileImage }} style={styles.headerImage} />

                    {/* Name + Status stacked vertically */}
                    <View style={{ flexDirection: "column" }}>
                        <Text style={[styles.headerName, { color: theme.textColor }]}>{name}</Text>
                        <Text style={{ fontSize: 12, color: theme.textColor }}>
                            {userStatus[userId]?.online
                                ? "Online"
                                : userStatus[userId]?.lastSeen
                                    ? `Last seen ${new Date(userStatus[userId].lastSeen).toLocaleTimeString()}`
                                    : "Offline"}
                        </Text>
                    </View>
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
            <View style={{ flex: 1, }}>
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
                {/* <View style={[styles.inputContainer, { marginBottom: keyboardHeight, backgroundColor: theme.backgroundColor }]}></View> */}
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
                    <TouchableOpacity onPress={handleSend} style={[styles.sendButton, { backgroundColor: theme.buttonBg }]}>
                        <Ionicons name="send" size={20} style={{ color: theme.buttonText }} />
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

            <ProfileModal
                visible={profileVisible}
                onClose={() => setProfileVisible(false)}
                profileData={{ name: name, profileImage: profileImage }}
            />

            {/* Attachments Modal */}

            <AttachModal
                visible={showAttachModal}
                onClose={() => setShowAttachModal(false)}
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
            <Modal visible={!!previewMedia} transparent animationType="slide">
                <StatusBar backgroundColor="black" barStyle="light-content" />
                <View style={styles.fullscreenContainer}>

                    {previewMedia && previewMedia.type === "image" && (
                        <Image
                            source={{ uri: previewMedia.uri }}
                            style={styles.fullscreenMedia}
                            resizeMode="contain"
                        />
                    )}

                    {previewMedia && previewMedia.type === "video" && (
                        <VideoView
                            style={styles.fullscreenMedia}
                            player={videoPlayer}
                            allowsFullscreen
                            allowsPictureInPicture
                            nativeControls
                        />
                    )}

                    <View style={styles.previewActions}>
                        <TouchableOpacity onPress={() => setPreviewMedia(null)} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            disabled={uploading} // disable while uploading
                            onPress={async () => {
                                try {
                                    setUploading(true);
                                    setProgress(0);

                                    await sendMessage(chatId, {
                                        type: "media",
                                        file: {
                                            uri: previewMedia.uri,
                                            name: `file.${previewMedia.type === "video" ? "mp4" : "jpg"}`,
                                            type: `${previewMedia.type}/${previewMedia.type === "video" ? "mp4" : "jpeg"}`,
                                        },
                                        onUploadProgress: (e) => {
                                            const percent = Math.round((e.loaded * 100) / e.total);
                                            setProgress(percent);
                                        },
                                    });

                                    setUploading(false);
                                    setPreviewMedia(null); // clear preview after send
                                } catch (error) {
                                    console.log("Upload error:", error);
                                    setUploading(false);
                                }
                            }}
                            style={[styles.sendBtn, uploading && { opacity: 0.6 }]}
                        >
                            {uploading ? (
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <ActivityIndicator color="#fff" size="small" />
                                    <Text style={[styles.sendText, { marginLeft: 8 }]}>
                                        {progress > 0 ? ` ${progress}%` : " Sending..."}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.sendText}>Send</Text>
                            )}
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>

            {/* Full Screen Modal */}

            <Modal
                visible={!!fullscreenMedia}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setFullscreenMedia(null)}
            >
                <StatusBar backgroundColor="black" barStyle="light-content" />
                {fullscreenMedia && (
                    <View style={styles.fullscreenContainer}>
                        {fullscreenMedia.type === "image" ? (
                            <Image
                                source={{ uri: fullscreenMedia.uri }}
                                style={styles.fullscreenMedia}
                                resizeMode="contain"
                            />
                        ) : (
                            <VideoView
                                style={styles.fullscreenMedia}
                                player={fullscreenPlayer}
                                nativeControls
                                allowsFullscreen
                                allowsPictureInPicture
                            />
                        )}

                        <View style={styles.fullscreenButtons}>
                            <TouchableOpacity
                                style={styles.downloadButton}
                                onPress={() => downloadMedia(fullscreenMedia.uri)}
                            >
                                <Text style={{ color: "#fff" }}>Download</Text>
                            </TouchableOpacity>


                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setFullscreenMedia(null)}
                            >
                                <Text style={{ color: "#fff" }}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Modal>



        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#F7F8FA" },
    header: {
        flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "#FFFFFF", justifyContent: "space-between",
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
    textMessage: { fontSize: 16, color: "#222", lineHeight: 22, width: "auto" },

    // 📍 Location card
    locationCard: { padding: 10, borderRadius: 12, maxWidth: 250, },
    cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6, },
    cardTitle: { fontSize: 15, fontWeight: "600", color: "#111", },
    cardSubtitle: { fontSize: 13, color: "#555", },

    // 👤 Contact card
    contactCard: { padding: 12, borderRadius: 12, maxWidth: 250, },
    contactAction: { marginTop: 10, paddingVertical: 8, alignItems: "center", borderTopWidth: 0.5, borderColor: "#ddd", },
    contactActionText: { fontSize: 14, fontWeight: "600", color: "#0A84FF", },

    // 🗳 Poll card
    pollCard: { padding: 12, borderRadius: 12, width: 800, },
    pollHint: { fontSize: 12, color: "#777", marginBottom: 8, },
    pollOption: { flexDirection: "row", alignItems: "center", marginBottom: 6, },
    pollOptionText: { flex: 1, marginLeft: 6, fontSize: 14, color: "#333", },
    radioOuter: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: "#0A84FF", alignItems: "center", justifyContent: "center", marginRight: 8, },
    radioInner: { height: 10, width: 10, borderRadius: 5, backgroundColor: "#0A84FF", },
    pollDivider: { height: 1, backgroundColor: "#ddd", marginVertical: 8 },
    pollFooter: { fontSize: 13, color: "#0A84FF", fontWeight: "500" },

    inputContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, backgroundColor: "#F7F8FA" },
    inputWithIcons: { flex: 1, borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 25, paddingLeft: 40, paddingRight: 110, paddingVertical: Platform.OS === "ios" ? 10 : 6, fontSize: 15, backgroundColor: "#FFFFFF", color: "#1C1C1E", maxHeight: 100, minHeight: 30, marginBottom: 30 },
    iconLeft: { position: "absolute", left: 12, zIndex: 10, marginBottom: 30 },
    attachIcon: { position: "absolute", zIndex: 10, marginBottom: 30 },
    iconRight: { position: "absolute", right: 70, zIndex: 10, marginBottom: 30 },
    sendButton: { backgroundColor: "#0A84FF", padding: 12, marginLeft: 6, borderRadius: 25, justifyContent: "center", alignItems: "center", marginBottom: 30 },

    emojiContainer: { height: 250, backgroundColor: "#f2f2f2", borderTopWidth: 1, borderColor: "#ddd", position: "relative", },
    emojiGrid: { flexDirection: "row", flexWrap: "wrap", padding: 8, },
    emojiButton: { width: `${100 / 9}%`, justifyContent: "center", alignItems: "center", paddingVertical: 10, },
    deleteButton: { position: "absolute", bottom: 10, right: 10, padding: 8, },

    previewContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.8)",
        justifyContent: "center",
        alignItems: "center",
    },
    previewBox: {
        width: "90%",
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 12,
        alignItems: "center",
    },
    previewActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
        width: "100%",
    },
    cancelBtn: {
        padding: 10,
        backgroundColor: "#ccc",
        borderRadius: 8,
        flex: 1,
        marginRight: 5,
        alignItems: "center",
    },
    sendBtn: {
        padding: 10,
        backgroundColor: "#0A84FF",
        borderRadius: 8,
        flex: 1,
        marginLeft: 5,
        alignItems: "center",
    },
    cancelText: { color: "#000", fontWeight: "600" },
    sendText: { color: "#fff", fontWeight: "600" },
    progressContainer: {
        position: "absolute",
        top: "45%",
        left: 0,
        right: 0,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: 20,
        borderRadius: 10,
    },


    fullscreenContainer: {
        flex: 1,
        backgroundColor: "black",
        justifyContent: "center",
        alignItems: "center",
    },
    fullscreenMedia: {
        width: "100%",
        height: "80%",
    },
    fullscreenButtons: {
        position: "absolute",
        bottom: 50,
        flexDirection: "row",
        justifyContent: "space-around",
        width: "80%",
    },
    downloadButton: {
        backgroundColor: "#0A84FF",
        padding: 10,
        borderRadius: 8,
    },
    closeButton: {
        backgroundColor: "red",
        padding: 10,
        borderRadius: 8,
    },

});