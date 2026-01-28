import React from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Platform,
    ActivityIndicator,
    StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VideoView } from "expo-video";

export default function MediaPreviewModal({
    visible,
    media,            // { uri, type }
    videoPlayer,
    uploading,
    onClose,
    onSend,
}) {
    if (!media) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <StatusBar backgroundColor="black" barStyle="light-content" />

            <View style={styles.container}>
                {/* MEDIA */}
                {media.type === "image" ? (
                    <Image
                        source={{ uri: media.uri }}
                        style={styles.media}
                        resizeMode="contain"
                    />
                ) : (
                    <VideoView
                        style={styles.media}
                        player={videoPlayer}
                        nativeControls
                        fullscreenOptions={{
                            enabled: true,
                            allowsPictureInPicture: true,
                        }}
                    />
                )}

                {/* TOP BAR */}
                <View style={styles.topBar}>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={onClose}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.title}>Preview</Text>

                    <View style={{ width: 44 }} />
                </View>

                {/* SEND BUTTON */}
                <TouchableOpacity
                    disabled={uploading}
                    style={[
                        styles.sendBtn,
                        uploading && { opacity: 0.7 },
                    ]}
                    onPress={onSend}
                >
                    {uploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Ionicons name="send" size={22} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
    },

    media: {
        width: "100%",
        height: "100%",
    },

    topBar: {
        position: "absolute",
        top: Platform.OS === "ios" ? 50 : 20,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    title: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },

    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },

    sendBtn: {
        position: "absolute",
        bottom: 40,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#0A84FF",
        justifyContent: "center",
        alignItems: "center",
        elevation: 6,
    },
});
