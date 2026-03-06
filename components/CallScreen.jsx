import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useCall } from "../context/CallContext";
import webrtcService from "../services/webrtcService";
import InCallManager from "react-native-incall-manager";

const AudioWave = ({ level }) => {

  const bars = 5;

  return (
    <View style={styles.waveContainer}>
      {[...Array(bars)].map((_, i) => {

        const height = Math.max(10, level * 120 * Math.random());

        return (
          <View
            key={i}
            style={[styles.waveBar, { height }]}
          />
        );

      })}
    </View>
  );
};

export default function CallScreen() {

  const {
    callState,
    incomingCall,
    remoteUserId,
    acceptCall,
    rejectCall,
    endCall,
    remoteUser,
  } = useCall();

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [callTime, setCallTime] = useState(0);

  // DEMO USER DATA
  const user = {
    name: remoteUser?.name || "Unknown",
    avatar: remoteUser?.profileImage?.url || remoteUser?.profileImage
  };


  if (remoteUser) {
    console.log("User in call:", user);
  }

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    webrtcService.toggleMute(newState);
  };

  const toggleSpeaker = () => {
    const newState = !isSpeakerOn;
    setIsSpeakerOn(newState);
    webrtcService.setSpeaker(newState);
  };

  useEffect(() => {
    return () => {
      InCallManager.stop();
    };
  }, []);

  useEffect(() => {

    if (callState === "connected") {

      webrtcService.startAudioLevelMonitor((level) => {
        setMicLevel(level);
      });

    }

    return () => {
      webrtcService.stopAudioLevelMonitor();
    };

  }, [callState]);

  useEffect(() => {

    let interval;

    if (callState === "connected") {

      interval = setInterval(() => {
        setCallTime((prev) => prev + 1);
      }, 1000);

    }

    return () => {
      if (interval) clearInterval(interval);
    };

  }, [callState]);

  useEffect(() => {
    if (callState === "idle") {
      setCallTime(0);
    }
  }, [callState]);

  const formatTime = (seconds) => {

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {

    if (callState === "idle" && !incomingCall) {

      const timer = setTimeout(() => {
        router.back();
      }, 500);

      return () => clearTimeout(timer);

    }

  }, [callState]);

  const renderContent = () => {

    if (callState === "incoming") {
      return (
        <>
          <Text style={styles.status}>Incoming Call</Text>

          <View style={styles.buttonRow}>

            <TouchableOpacity
              style={[styles.roundButton, styles.accept]}
              onPress={acceptCall}
            >
              <Feather name="phone" size={26} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roundButton, styles.reject]}
              onPress={rejectCall}
            >
              <MaterialIcons name="call-end" size={26} color="#fff" />
            </TouchableOpacity>

          </View>
        </>
      );
    }

    if (callState === "calling") {
      return (
        <>
          <Text style={styles.status}>Calling...</Text>

          <TouchableOpacity
            style={[styles.roundButton, styles.reject]}
            onPress={endCall}
          >
            <MaterialIcons name="call-end" size={26} color="#fff" />
          </TouchableOpacity>
        </>
      );
    }

    if (callState === "connecting") {
      return (
        <>
          <Text style={styles.status}>Connecting...</Text>

          <TouchableOpacity
            style={[styles.roundButton, styles.reject]}
            onPress={endCall}
          >
            <MaterialIcons name="call-end" size={26} color="#fff" />
          </TouchableOpacity>
        </>
      );
    }

    if (callState === "connected") {
      return (
        <>
          <Text style={styles.status}>{formatTime(callTime)}</Text>

          <AudioWave level={micLevel} />

          <View style={styles.controlRow}>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleMute}
            >
              <Feather
                name={isMuted ? "mic-off" : "mic"}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleSpeaker}
            >
              <Feather
                name="volume-2"
                size={24}
                color={isSpeakerOn ? "#2ecc71" : "#fff"}
              />
            </TouchableOpacity>

          </View>

          <TouchableOpacity
            style={[styles.roundButton, styles.reject]}
            onPress={endCall}
          >
            <MaterialIcons name="call-end" size={26} color="#fff" />
          </TouchableOpacity>

        </>
      );
    }


    if (callState === "idle") {
      return <Text style={styles.status}>Call Ended</Text>;
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* <Image
        source={{ uri: user.avatar }}
        style={styles.avatar}
      />

      <Text style={styles.name}>{user.name}</Text> */}

      {callState !== "idle" && (
        <>
          <Image
            source={{ uri: user.avatar }}
            style={styles.avatar}
          />

          <Text style={styles.name}>{user.name}</Text>
        </>
      )}

      {renderContent()}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#0b0b0b",
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 20,
  },

  name: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 10,
  },

  status: {
    fontSize: 18,
    color: "#aaa",
    marginBottom: 40,
  },

  waveContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 60,
    marginBottom: 50,
  },

  waveBar: {
    width: 6,
    backgroundColor: "#2ecc71",
    marginHorizontal: 3,
    borderRadius: 3,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 40,
  },

  controlRow: {
    flexDirection: "row",
    marginBottom: 30,
    gap: 40,
  },

  roundButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },

  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },

  accept: {
    backgroundColor: "#2ecc71",
  },

  reject: {
    backgroundColor: "#e74c3c",
  },

});