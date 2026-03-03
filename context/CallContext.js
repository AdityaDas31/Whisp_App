import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

import { Vibration } from "react-native";
import uuid from "react-native-uuid";
import { useChats } from "./ChatContext";
import webrtcService from "../services/webrtcService";
import { router } from "expo-router";
import InCallManager from "react-native-incall-manager";
import { useAudioPlayer } from "expo-audio";

const CallContext = createContext();

export const CallProvider = ({ children }) => {

    const { socket } = useChats();

    const callIdRef = useRef(null);
    const isRingtonePlaying = useRef(false);

    // Ringback (caller side only)
    const ringbackPlayer = useAudioPlayer(
        require("../assets/sounds/ringback.mp3")
    );

    const [callState, setCallState] = useState("idle");
    const [incomingCall, setIncomingCall] = useState(null);
    const [remoteUserId, setRemoteUserId] = useState(null);

    // ================= INIT =================

    useEffect(() => {
        ringbackPlayer.loop = true;
        return () => {
            ringbackPlayer.pause();
        };
    }, []);

    // ================= RINGBACK (CALLER) =================

    const playRingback = () => {
        try {
            console.log("▶️ Ringback START");

            InCallManager.start({ media: "audio", auto: true });
            InCallManager.setForceSpeakerphoneOn(false);
            InCallManager.setSpeakerphoneOn(false);

            ringbackPlayer.seekTo(0);
            ringbackPlayer.play();

        } catch (e) {
            console.log("Ringback error:", e);
        }
    };

    const stopRingback = () => {
        console.log("⏹ Ringback STOP");
        ringbackPlayer.pause();
        ringbackPlayer.seekTo(0);
    };

    // ================= RINGTONE (RECEIVER) =================

    const playRingtone = () => {
        try {

            console.log("🔔 STARTING PURE RINGTONE MODE");

            // DO NOT CALL InCallManager.stop()
            // DO NOT CALL InCallManager.start()

            // InCallManager.startRingtone("ringtone");
            InCallManager.startRingtone("_DEFAULT_");

            Vibration.vibrate([0, 1000, 1000], true);

        } catch (e) {
            console.log("Ringtone error:", e);
        }
    };

    const stopRingtone = () => {
        console.log("🔕 STOP RINGTONE");

        InCallManager.stopRingtone();
        Vibration.cancel();
    };

    // ================= AUDIO SESSION =================

    const startAudioSession = () => {
        try {
            console.log("🎧 Call Audio START");

            InCallManager.start({ media: "audio", auto: true });
            InCallManager.setForceSpeakerphoneOn(false);
            InCallManager.setSpeakerphoneOn(false);
            InCallManager.setMicrophoneMute(false);

        } catch (e) {
            console.log("Audio session error:", e);
        }
    };

    const stopAudioSession = () => {
        console.log("🎧 Call Audio STOP");
        InCallManager.stop();
    };

    // ================= START CALL =================

    const startCall = async (userId) => {

        if (!socket) return;

        const callId = uuid.v4();
        callIdRef.current = callId;

        setRemoteUserId(userId);
        setCallState("calling");

        playRingback();

        socket.emit("call:initiate", {
            to: userId,
            callId,
            type: "voice",
        });

        router.push("/call");
    };

    // ================= ACCEPT CALL =================

    const acceptCall = async () => {

        if (!incomingCall) return;

        const { callId, from } = incomingCall;

        callIdRef.current = callId;
        setRemoteUserId(from);

        stopRingtone();
        InCallManager.start({ media: "audio" });

        await webrtcService.init();
        startAudioSession();

        socket.emit("call:accept", {
            callId,
            to: from,
        });

        setIncomingCall(null);
        setCallState("connecting");
    };

    // ================= REJECT CALL =================

    const rejectCall = () => {

        if (!incomingCall) return;

        socket.emit("call:reject", {
            callId: incomingCall.callId,
            to: incomingCall.from,
        });

        stopRingtone();
        stopRingback();

        setIncomingCall(null);
        setCallState("idle");
    };

    // ================= END CALL =================

    const endCall = () => {

        if (remoteUserId) {
            socket.emit("call:end", {
                callId: callIdRef.current,
                to: remoteUserId,
            });
        }

        stopRingtone();
        stopRingback();
        stopAudioSession();

        webrtcService.close();

        setCallState("idle");
        setRemoteUserId(null);
        setIncomingCall(null);
    };

    // ================= SOCKET EVENTS =================

    useEffect(() => {

        if (!socket) return;

        socket.on("call:incoming", ({ callId, from }) => {

            console.log("📲 Incoming call");

            callIdRef.current = callId;
            setIncomingCall({ callId, from });
            setRemoteUserId(from);
            setCallState("incoming");

            playRingtone();
            router.push("/call");
        });

        socket.on("call:accepted", async () => {

            console.log("✅ Call accepted");

            stopRingback();
            startAudioSession();

            await webrtcService.init();
            const offer = await webrtcService.createOffer();

            socket.emit("webrtc:offer", {
                to: remoteUserId,
                offer,
            });

            setCallState("connecting");
        });

        socket.on("call:rejected", () => {
            console.log("❌ Call rejected");
            endCall();
        });

        socket.on("call:ended", () => {
            console.log("🔚 Call ended");
            endCall();
        });

        socket.on("webrtc:offer", async ({ from, offer }) => {
            setRemoteUserId(from);
            const answer = await webrtcService.createAnswer(offer);
            socket.emit("webrtc:answer", { to: from, answer });
        });

        socket.on("webrtc:answer", async ({ answer }) => {
            await webrtcService.setRemoteAnswer(answer);
            setCallState("connected");
        });

        socket.on("webrtc:ice-candidate", async ({ candidate }) => {
            await webrtcService.addIceCandidate(candidate);
        });

        webrtcService.onIceCandidate = (candidate) => {
            socket.emit("webrtc:ice-candidate", {
                to: remoteUserId,
                candidate,
            });
        };

        webrtcService.onConnectionStateChange = (state) => {

            console.log("🔌 Connection:", state);

            if (state === "connected") {
                setCallState("connected");
            }

            if (state === "failed" || state === "disconnected") {
                endCall();
            }
        };

        return () => {
            socket.off("call:incoming");
            socket.off("call:accepted");
            socket.off("call:rejected");
            socket.off("call:ended");
            socket.off("webrtc:offer");
            socket.off("webrtc:answer");
            socket.off("webrtc:ice-candidate");
        };

    }, [socket, remoteUserId]);

    return (
        <CallContext.Provider
            value={{
                callState,
                incomingCall,
                remoteUserId,
                startCall,
                acceptCall,
                rejectCall,
                endCall,
            }}
        >
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);