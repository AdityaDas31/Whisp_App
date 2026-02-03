import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

function ChatMediaBubble({
    uri,
    type,
    time,
    isMine,
    status,
    progress = 0,
}) {
    const [aspectRatio, setAspectRatio] = useState(1);
    const isVideo = type === "video";

    useEffect(() => {
        if (type === "image" && uri) {
            Image.getSize(
                uri,
                (w, h) => h && setAspectRatio(w / h),
                () => setAspectRatio(1)
            );
        }
    }, [uri, type]);

    return (
        <View style={styles.mediaBubble}>
            <View style={[styles.mediaWrapper, { aspectRatio }]}>
                {/* MEDIA */}
                <Image source={{ uri }} style={styles.image} resizeMode="contain" />

                {/* UPLOADING */}
                {status === "uploading" && (
                    <View style={styles.centerOverlay}>
                        <Svg width={54} height={54}>
                            <Circle
                                stroke="rgba(255,255,255,0.25)"
                                cx={27}
                                cy={27}
                                r={25}
                                strokeWidth={4}
                            />
                            <Circle
                                stroke="#fff"
                                cx={27}
                                cy={27}
                                r={25}
                                strokeWidth={4}
                                strokeDasharray={157}
                                strokeDashoffset={157 - (progress / 100) * 157}
                                strokeLinecap="round"
                            />
                        </Svg>
                        <Text style={styles.progressText}>{progress}%</Text>
                    </View>
                )}

                {/* PROCESSING */}
                {status === "processing" && (
                    <View style={styles.centerOverlay}>
                        <ActivityIndicator color="#fff" size="large" />
                        <Text style={styles.sendingText}>Sending</Text>
                    </View>
                )}

                {/* PLAY ICON */}
                {status !== "uploading" &&
                    status !== "processing" &&
                    isVideo && (
                        <View style={styles.centerOverlay}>
                            <View style={styles.playButton}>
                                <Ionicons name="play" size={28} color="#fff" />
                            </View>
                        </View>
                    )}

                {/* FOOTER */}
                {status !== "uploading" && status !== "processing" && (
                    <View style={styles.overlayFooter}>
                        <Text style={styles.overlayTime}>{time}</Text>
                        {isMine && (
                            <Ionicons
                                name={status === "seen" ? "checkmark-done" : "checkmark"}
                                size={16}
                                color={status === "seen" ? "#0A84FF" : "#999"}
                            />
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

export default ChatMediaBubble;


const styles = StyleSheet.create({
    mediaBubble: {
        maxWidth: 280,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#000",
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

    /* CENTER OVERLAY */
    centerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.35)",
    },

    progressText: {
        position: "absolute",
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },

    sendingText: {
        marginTop: 6,
        color: "#fff",
        fontSize: 13,
        opacity: 0.85,
    },

    playButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "center",
        alignItems: "center",
    },

    /* FOOTER */
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
        marginRight: 4,
    },
});
