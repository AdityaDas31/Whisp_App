import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { Ionicons } from "@expo/vector-icons";

function ChatMediaBubble({ uri, type, onPress, time, isMine, status }) {
    const [aspectRatio, setAspectRatio] = useState(1);
    const isVideo = type === "video";

    // IMAGE ratio
    useEffect(() => {
        if (type === "image" && uri) {
            Image.getSize(
                uri,
                (w, h) => h && setAspectRatio(w / h),
                () => setAspectRatio(1)
            );
        }
    }, [uri, type]);

    // VIDEO player
    const videoPlayer = useVideoPlayer(
        isVideo ? uri : null,
        (player) => {
            player.loop = false;
            player.pause();
        }
    );

    // 🔥 VIDEO ratio (THIS IS THE FIX)
    useEffect(() => {
        if (!isVideo || !videoPlayer) return;

        const sub = videoPlayer.addListener("readyForDisplay", () => {
            const { width, height } = videoPlayer.videoSize || {};
            if (width && height) {
                setAspectRatio(width / height);
            }
        });

        return () => sub?.remove();
    }, [isVideo, videoPlayer]);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={styles.mediaBubble}
        >
            <View style={[styles.mediaWrapper, { aspectRatio }]}>
                {isVideo ? (
                    <VideoView
                        player={videoPlayer}
                        style={styles.video}
                        contentFit="contain"
                        nativeControls={false}
                    />
                ) : (
                    <Image
                        source={{ uri }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                )}
                {/* 🔥 Overlay footer (WhatsApp style) */}
                <View style={styles.overlayFooter}>
                    <Text style={styles.overlayTime}>{time}</Text>

                    {isMine && (
                        <Ionicons
                            name={
                                status === "seen"
                                    ? "checkmark-done"
                                    : "checkmark"
                            }
                            size={16}
                            color={status === "seen" ? "#4FC3F7" : "#E0E0E0"}
                            style={{ marginLeft: 4 }}
                        />
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default ChatMediaBubble;

const styles = StyleSheet.create({
    mediaBubble: {
        maxWidth: 280,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#000",
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },

    mediaWrapper: {
        width: "100%",
        backgroundColor: "#000",
    },

    video: {
        ...StyleSheet.absoluteFillObject,
    },

    image: {
        width: "100%",
        height: "100%",
    },
    overlayFooter: {
        position: "absolute",
        right: 8,
        bottom: 6,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.45)",
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },

    overlayTime: {
        fontSize: 11,
        color: "#fff",
    },
});
