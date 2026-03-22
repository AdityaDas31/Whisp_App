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

    const [remoteUser, setRemoteUser] = useState(null);
    const [callType, setCallType] = useState("voice");

    const callIdRef = useRef(null);
    const isRingtonePlaying = useRef(false);
    const callEndedRef = useRef(false);

    const ringtonePlayer = useAudioPlayer(
        require("../assets/sounds/ringtone.mp3")
    );

    // Ringback (caller side only)
    const ringbackPlayer = useAudioPlayer(
        require("../assets/sounds/ringback.mp3")
    );

    const [callState, setCallState] = useState("idle");
    const [incomingCall, setIncomingCall] = useState(null);
    const [remoteUserId, setRemoteUserId] = useState(null);

    // ================= INIT =================

    useEffect(() => {

        ringtonePlayer.loop = true;
        ringbackPlayer.loop = true;

        return () => {
            try {
                ringbackPlayer?.pause();
                ringbackPlayer?.seekTo?.(0);
            } catch { }

            try {
                ringtonePlayer?.pause();
                ringtonePlayer?.seekTo?.(0);
            } catch { }
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

        if (isRingtonePlaying.current) return;
        isRingtonePlaying.current = true;

        try {
            console.log("🔔 START RINGTONE");

            // do NOT start audio session here
            InCallManager.startRingtone();

            Vibration.vibrate([0, 1000, 1000], true);

        } catch (error) {
            console.log("Ringtone error:", error);
        }
    };


    // ================= AUDIO SESSION =================

    const stopRingtone = () => {

        console.log("🔕 STOP RINGTONE");

        isRingtonePlaying.current = false;

        InCallManager.stopRingtone();

        Vibration.cancel();
    };




    const startAudioSession = () => {
        try {
            console.log("🎧 Call Audio START");

            InCallManager.start({ media: "audio", auto: true });

            // BACK TO EARPIECE
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

    const startCall = async (
        receiverId,
        receiverName,
        receiverImage,
        callerId,
        callerName,
        callerImage,
        type = "voice"
    ) => {

        if (!socket) return;

        const callId = uuid.v4();
        callIdRef.current = callId;

        console.log("📞 CALL STARTED");

        console.log("Caller ID:", callerId);
        console.log("Caller Name:", callerName);
        console.log("Caller Image:", callerImage);

        console.log("Receiver ID:", receiverId);
        console.log("Receiver Name:", receiverName);
        console.log("Receiver Image:", receiverImage);

        setRemoteUserId(receiverId);

        setCallType(type);

        // Caller screen should show RECEIVER
        setRemoteUser({
            name: receiverName,
            profileImage: receiverImage
        });

        setCallState("calling");

        playRingback();

        socket.emit("call:initiate", {
            to: receiverId,
            callId,
            type,
            callerId,
            callerName,
            callerImage
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

        await webrtcService.init(callType === "video");
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

        if (callEndedRef.current) return;
        callEndedRef.current = true;

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
        setRemoteUser(null);

        setTimeout(() => {
            callEndedRef.current = false;
        }, 1000);
    };

    // ================= SOCKET EVENTS =================

    useEffect(() => {

        if (!socket) return;

        socket.on("call:incoming", ({ callId, from, name, profileImage, type }) => {

            console.log("📲 RECEIVER GOT CALL");

            console.log("Caller ID:", from);
            console.log("Caller Name:", name);
            console.log("Caller Image:", profileImage);

            callIdRef.current = callId;
            setCallType(type);

            setIncomingCall({
                callId,
                from,
                name,
                profileImage,
                type
            });

            setRemoteUserId(from);

            // Receiver screen shows CALLER
            setRemoteUser({
                name,
                profileImage
            });

            setCallState("incoming");

            playRingtone();
            router.push("/call");
        });

        socket.on("call:accepted", async () => {

            console.log("✅ Call accepted");

            stopRingback();
            startAudioSession();

            await webrtcService.init(callType === "video");
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
                remoteUser,
                callType,
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