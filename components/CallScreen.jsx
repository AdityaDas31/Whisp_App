import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useCall } from "../context/CallContext";
import webrtcService from "../services/webrtcService";
import InCallManager from "react-native-incall-manager";

const AudioWave = ({ level }) => {

  const bars = 5;

  return (
    <View style={{
      flexDirection: "row",
      alignItems: "flex-end",
      height: 60,
      marginBottom: 40
    }}>

      {[...Array(bars)].map((_, i) => {

        const height = Math.max(6, level * 120 * Math.random());

        return (
          <View
            key={i}
            style={{
              width: 6,
              height,
              backgroundColor: "#2ecc71",
              marginHorizontal: 3,
              borderRadius: 3,
            }}
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
  } = useCall();

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  // ================= MUTE =================
  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    webrtcService.toggleMute(newState);
  };

  // ================= SPEAKER =================
  const toggleSpeaker = () => {
    const newState = !isSpeakerOn;
    setIsSpeakerOn(newState);
    webrtcService.setSpeaker(newState);
  };

  // ================= AUTO CLEANUP =================
  useEffect(() => {
    return () => {
      InCallManager.stop();
    };
  }, []);

  useEffect(() => {

    if (callState === "connected") {

      webrtcService.startAudioLevelMonitor((level) => {

        setMicLevel(level);

        console.log("Mic level:", level);

      });

    }

    return () => {

      webrtcService.stopAudioLevelMonitor();

    };

  }, [callState]);

  // ================= UI =================

  const renderContent = () => {

    // INCOMING CALL
    if (callState === "incoming") {
      return (
        <>
          <Text style={styles.title}>Incoming Call</Text>
          <Text style={styles.subtitle}>{incomingCall?.from}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.accept]}
              onPress={acceptCall}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.reject]}
              onPress={rejectCall}
            >
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    // CALLING
    if (callState === "calling") {
      return (
        <>
          <Text style={styles.title}>Calling...</Text>
          <Text style={styles.subtitle}>{remoteUserId}</Text>

          <TouchableOpacity
            style={[styles.button, styles.reject]}
            onPress={endCall}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </>
      );
    }

    // CONNECTING
    if (callState === "connecting") {
      return (
        <>
          <Text style={styles.title}>Connecting...</Text>
          <Text style={styles.subtitle}>{remoteUserId}</Text>

          <TouchableOpacity
            style={[styles.button, styles.reject]}
            onPress={endCall}
          >
            <Text style={styles.buttonText}>End</Text>
          </TouchableOpacity>
        </>
      );
    }

    // CONNECTED
    if (callState === "connected") {
      return (
        <>
          <Text style={styles.title}>Connected</Text>
          <Text style={styles.subtitle}>{remoteUserId}</Text>

          <AudioWave level={micLevel} />

          <View style={styles.buttonRow}>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleMute}
            >
              <Text style={styles.buttonText}>
                {isMuted ? "Unmute" : "Mute"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleSpeaker}
            >
              <Text style={styles.buttonText}>
                {isSpeakerOn ? "Speaker Off" : "Speaker On"}
              </Text>
            </TouchableOpacity>

          </View>

          <TouchableOpacity
            style={[styles.button, styles.reject]}
            onPress={endCall}
          >
            <Text style={styles.buttonText}>End Call</Text>
          </TouchableOpacity>

        </>
      );
    }

    return (
      <Text style={styles.title}>Idle</Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 18,
    color: "#ccc",
    marginBottom: 40,
  },

  buttonRow: {
    flexDirection: "row",
    marginBottom: 30,
  },

  button: {
    padding: 15,
    borderRadius: 50,
    marginHorizontal: 10,
    minWidth: 120,
    alignItems: "center",
  },

  accept: {
    backgroundColor: "#2ecc71",
  },

  reject: {
    backgroundColor: "#e74c3c",
  },

  controlButton: {
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 50,
    marginHorizontal: 10,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
  },

});