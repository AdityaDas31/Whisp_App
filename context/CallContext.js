import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import uuid from "react-native-uuid";
import { useChats } from "./ChatContext";
import webrtcService from "../services/webrtcService";
import { router } from "expo-router";
import { Audio, AudioPlayer } from "expo-audio";

const CallContext = createContext();

export const CallProvider = ({ children }) => {

  const { socket } = useChats();

  const ringtoneRef = useRef(null);
  const callIdRef = useRef(null);

  // ================= STATE =================

  const [callState, setCallState] = useState("idle");
  // idle | calling | incoming | connecting | connected

  const [incomingCall, setIncomingCall] = useState(null);
  const [remoteUserId, setRemoteUserId] = useState(null);

  // ================= INIT AUDIO MODE =================

  useEffect(() => {

    const initAudio = async () => {

      try {

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

      } catch (e) {
        console.log("Audio mode error:", e);
      }

    };

    initAudio();

  }, []);

  // ================= PLAY RINGTONE =================

  const playRingtone = async () => {

    try {

      if (ringtoneRef.current) return;

      const player = new AudioPlayer(
        require("../assets/sounds/ringtone.mp3")
      );

      player.loop = true;

      await player.play();

      ringtoneRef.current = player;

    } catch (error) {
      console.log("Ringtone play error:", error);
    }

  };

  // ================= STOP RINGTONE =================

  const stopRingtone = async () => {

    try {

      if (!ringtoneRef.current) return;

      await ringtoneRef.current.pause();

      ringtoneRef.current = null;

    } catch {}

  };

  // ================= START CALL =================

  const startCall = async (userId) => {

    try {

      if (!socket) return;

      const callId = uuid.v4();

      callIdRef.current = callId;

      setRemoteUserId(userId);

      setCallState("calling");

      await playRingtone();

      await webrtcService.init();

      socket.emit("call:initiate", {
        to: userId,
        callId,
        type: "voice",
      });

      const offer = await webrtcService.createOffer();

      socket.emit("webrtc:offer", {
        to: userId,
        offer,
      });

      router.push("/call");

    } catch (error) {
      console.error("startCall error:", error);
    }

  };

  // ================= ACCEPT CALL =================

  const acceptCall = async () => {

    try {

      if (!incomingCall) return;

      const { callId, from } = incomingCall;

      callIdRef.current = callId;

      setRemoteUserId(from);

      await stopRingtone();

      await webrtcService.init();

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

  const rejectCall = async () => {

    if (!incomingCall) return;

    socket.emit("call:reject", {
      callId: incomingCall.callId,
      to: incomingCall.from,
    });

    await stopRingtone();

    setIncomingCall(null);

    setCallState("idle");

  };

  // ================= END CALL =================

  const endCall = async () => {

    try {

      if (!remoteUserId) return;

      socket.emit("call:end", {
        callId: callIdRef.current,
        to: remoteUserId,
      });

      await stopRingtone();

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

    // Incoming call

    socket.on("call:incoming", async ({ callId, from }) => {

      callIdRef.current = callId;

      setIncomingCall({ callId, from });

      setRemoteUserId(from);

      setCallState("incoming");

      await playRingtone();

      router.push("/call");

    });

    // Call accepted

    socket.on("call:accepted", async () => {

      await stopRingtone();

      setCallState("connecting");

    });

    // Call rejected

    socket.on("call:rejected", async () => {

      await stopRingtone();

      webrtcService.close();

      setCallState("idle");

    });

    // Call ended

    socket.on("call:ended", async () => {

      await stopRingtone();

      webrtcService.close();

      setCallState("idle");

    });

    // Offer received

    socket.on("webrtc:offer", async ({ from, offer }) => {

      try {

        setRemoteUserId(from);

        await webrtcService.init();

        const answer = await webrtcService.createAnswer(offer);

        socket.emit("webrtc:answer", {
          to: from,
          answer,
        });

      } catch (error) {
        console.error("Offer error:", error);
      }

    });

    // Answer received

    socket.on("webrtc:answer", async ({ answer }) => {

      await stopRingtone();

      await webrtcService.setRemoteAnswer(answer);

      setCallState("connected");

    });

    // ICE candidate

    socket.on("webrtc:ice-candidate", async ({ candidate }) => {

      await webrtcService.addIceCandidate(candidate);

    });

    // Send ICE candidates

    webrtcService.onIceCandidate = (candidate) => {

      socket.emit("webrtc:ice-candidate", {
        to: remoteUserId,
        candidate,
      });

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