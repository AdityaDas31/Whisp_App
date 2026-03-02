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

    // ✅ CORRECT: useAudioPlayer at TOP LEVEL
    // const ringtonePlayer = useAudioPlayer(
    //     require("../assets/sounds/ringtone.mp3")
    // );

    const ringbackPlayer = useAudioPlayer(
        require("../assets/sounds/ringback.mp3")
    );

    const ringtoneVibrationPattern = [0, 1000, 1000];

    // ================= STATE =================

    const [callState, setCallState] = useState("idle");
    const [incomingCall, setIncomingCall] = useState(null);
    const [remoteUserId, setRemoteUserId] = useState(null);

    // ================= INIT AUDIO PLAYERS =================

    useEffect(() => {

        // ringtonePlayer.loop = true;
        ringbackPlayer.loop = true;

        return () => {

            // ringtonePlayer.pause();
            ringbackPlayer.pause();

        };

    }, []);

    // ================= CALLER RINGBACK =================

    const playRingback = () => {

        try {

            // START call audio mode FIRST
            InCallManager.start({
                media: "audio",
                auto: true,
            });

            // FORCE EARPIECE
            InCallManager.setForceSpeakerphoneOn(false);
            InCallManager.setSpeakerphoneOn(false);

            ringbackPlayer.seekTo(0);
            ringbackPlayer.play();

            console.log("Ringback playing via earpiece");

        } catch (e) {

            console.log("Ringback error:", e);

        }

    };

    const stopRingback = () => {

        try {

            ringbackPlayer.pause();
            ringbackPlayer.seekTo(0);

        } catch { }

    };

    // ================= RECEIVER RINGTONE =================


    const playRingtone = () => {

        try {

            console.log("DEBUG: starting TRUE ringtone channel");

            // stop all audio modes first
            InCallManager.stop();

            // start ringtone channel
            InCallManager.startRingtone("ringtone");

            // vibration loop
            Vibration.vibrate([0, 1000, 1000], true);

        } catch (e) {

            console.log("Ringtone error:", e);

        }

    };
    const stopRingtone = () => {

        try {

            console.log("DEBUG: stopping TRUE ringtone");

            InCallManager.stopRingtone();

            Vibration.cancel();

        } catch { }

    };

    // ================= START AUDIO SESSION =================

    const startAudioSession = () => {

        try {

            console.log("Starting audio session");

            InCallManager.start({
                media: "audio",
                auto: true,
            });

            // ✅ EARPIECE MODE (NOT SPEAKER)
            InCallManager.setForceSpeakerphoneOn(false);

            InCallManager.setSpeakerphoneOn(false);

            InCallManager.setMicrophoneMute(false);

        } catch (e) {

            console.log("Audio session error:", e);

        }

    };

    // ================= STOP AUDIO SESSION =================

    const stopAudioSession = () => {

        try {

            InCallManager.stop();

        } catch { }

    };

    // ================= START CALL =================

    const startCall = async (userId) => {

        try {

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

        } catch (error) {

            console.error(error);

        }

    };

    // ================= ACCEPT CALL =================

    const acceptCall = async () => {

        try {

            if (!incomingCall) return;

            const { callId, from } = incomingCall;

            callIdRef.current = callId;

            setRemoteUserId(from);

            stopRingtone();

            await webrtcService.init();

            startAudioSession();

            socket.emit("call:accept", {

                callId,
                to: from,

            });

            setIncomingCall(null);

            setCallState("connecting");

        } catch (error) {

            console.error("acceptCall error:", error);

        }

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
        Vibration.cancel();

        setIncomingCall(null);

        setCallState("idle");

    };

    // ================= END CALL =================

    const endCall = () => {

        try {

            if (remoteUserId) {

                socket.emit("call:end", {

                    callId: callIdRef.current,
                    to: remoteUserId,

                });

            }

            stopRingback();
            stopRingtone();
            Vibration.cancel();

            stopAudioSession();

            webrtcService.close();

            setCallState("idle");

            setRemoteUserId(null);

            setIncomingCall(null);

        } catch (error) {

            console.error("endCall error:", error);

        }

    };

    // ================= SOCKET EVENTS =================

    useEffect(() => {

        if (!socket) return;

        // INCOMING CALL
        socket.on("call:incoming", ({ callId, from }) => {

            callIdRef.current = callId;

            setIncomingCall({ callId, from });

            setRemoteUserId(from);

            setCallState("incoming");

            playRingtone();

            router.push("/call");

        });

        // CALL ACCEPTED (CALLER SIDE)
        socket.on("call:accepted", async () => {

            try {

                stopRingback();

                startAudioSession();

                await webrtcService.init();

                const offer = await webrtcService.createOffer();

                socket.emit("webrtc:offer", {

                    to: remoteUserId,
                    offer,

                });

                setCallState("connecting");

            } catch (e) {

                console.log(e);

            }

        });

        // CALL REJECTED
        socket.on("call:rejected", () => {

            stopRingback();
            stopRingtone();

            stopAudioSession();

            webrtcService.close();

            setCallState("idle");

        });

        // CALL ENDED
        socket.on("call:ended", () => {

            stopRingback();
            stopRingtone();

            stopAudioSession();

            webrtcService.close();

            setCallState("idle");

        });

        // OFFER RECEIVED
        socket.on("webrtc:offer", async ({ from, offer }) => {

            try {

                setRemoteUserId(from);

                const answer = await webrtcService.createAnswer(offer);

                socket.emit("webrtc:answer", {

                    to: from,
                    answer,

                });

            } catch (error) {

                console.error("Offer error:", error);

            }

        });

        // ANSWER RECEIVED
        socket.on("webrtc:answer", async ({ answer }) => {

            await webrtcService.setRemoteAnswer(answer);

            setCallState("connected");

        });

        // ICE
        socket.on("webrtc:ice-candidate", async ({ candidate }) => {

            await webrtcService.addIceCandidate(candidate);

        });

        // SEND ICE
        webrtcService.onIceCandidate = (candidate) => {

            socket.emit("webrtc:ice-candidate", {

                to: remoteUserId,
                candidate,

            });

        };

        // CONNECTION STATE
        webrtcService.onConnectionStateChange = (state) => {

            console.log("Connection:", state);

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

    // ================= PROVIDER =================

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