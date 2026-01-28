import React from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Platform,
    Pressable,
    StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VideoView } from "expo-video";

export default function MediaViewerModal({
    visible,
    media,                 // { uri, type, message }
    videoPlayer,
    showControls,
    onToggleControls,
    onClose,
    onDownload,
    senderLabel,
    timeLabel,
}) {
    if (!media) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <StatusBar backgroundColor="black" barStyle="light-content" />

            <Pressable
                style={styles.container}
                onPress={onToggleControls}
            >
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
                {showControls && (
                    <View style={styles.topBar}>
                        {/* Back */}
                        <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={onClose}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>

                        {/* Meta */}
                        <View style={styles.meta}>
                            <Text style={styles.sender}>
                                {senderLabel}
                            </Text>
                            <Text style={styles.time}>
                                {timeLabel}
                            </Text>
                        </View>

                        {/* Download */}
                        <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={onDownload}
                        >
                            <Ionicons
                                name="download-outline"
                                size={22}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    </View>
                )}
            </Pressable>
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

    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },

    meta: {
        flex: 1,
        marginHorizontal: 12,
    },

    sender: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },

    time: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 12,
        marginTop: 2,
    },
});
