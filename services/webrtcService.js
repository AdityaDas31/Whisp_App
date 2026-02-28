import {
    RTCPeerConnection,
    RTCSessionDescription,
    RTCIceCandidate,
    mediaDevices,
} from "react-native-webrtc";

import InCallManager from "react-native-incall-manager";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
    ],
};

class WebRTCService {
    pc = null;
    localStream = null;
    remoteStream = null;

    onIceCandidate = null;
    onRemoteStream = null;
    onConnectionStateChange = null;

    // ================= INIT =================
    async init() {
        try {
            if (this.pc) {
                this.pc.close();
                this.pc = null;
            }
            // Start audio session
            InCallManager.start({ media: "audio" });
            InCallManager.setSpeakerphoneOn(false);

            // Create peer connection
            this.pc = new RTCPeerConnection(ICE_SERVERS);

            // Handle ICE candidates
            this.pc.onicecandidate = (event) => {
                if (event.candidate && this.onIceCandidate) {
                    this.onIceCandidate(event.candidate);
                }
            };

            // Handle remote stream
            this.pc.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    this.remoteStream = event.streams[0];

                    if (this.onRemoteStream) {
                        this.onRemoteStream(this.remoteStream);
                    }
                }
            };

            // Connection state
            this.pc.onconnectionstatechange = () => {
                if (this.onConnectionStateChange) {
                    this.onConnectionStateChange(this.pc.connectionState);
                }
            };

            // Get microphone stream
            this.localStream = await mediaDevices.getUserMedia({
                audio: true,
                video: false,
            });

            // Add tracks
            this.localStream.getTracks().forEach((track) => {
                this.pc.addTrack(track, this.localStream);
            });

            return this.localStream;

        } catch (error) {
            console.error("WebRTC init error:", error);
            throw error;
        }
    }

    // ================= CREATE OFFER =================
    async createOffer() {
        try {
            const offer = await this.pc.createOffer({
                offerToReceiveAudio: true,
            });

            await this.pc.setLocalDescription(offer);

            return offer;
        } catch (error) {
            console.error("createOffer error:", error);
            throw error;
        }
    }

    // ================= CREATE ANSWER =================
    async createAnswer(offer) {
        try {
            await this.pc.setRemoteDescription(
                new RTCSessionDescription(offer)
            );

            const answer = await this.pc.createAnswer();

            await this.pc.setLocalDescription(answer);

            return answer;
        } catch (error) {
            console.error("createAnswer error:", error);
            throw error;
        }
    }

    // ================= SET REMOTE ANSWER =================
    async setRemoteAnswer(answer) {
        try {
            await this.pc.setRemoteDescription(
                new RTCSessionDescription(answer)
            );
        } catch (error) {
            console.error("setRemoteAnswer error:", error);
        }
    }

    // ================= ADD ICE CANDIDATE =================
    async addIceCandidate(candidate) {
        try {
            if (!candidate) return;

            await this.pc.addIceCandidate(
                new RTCIceCandidate(candidate)
            );
        } catch (error) {
            console.error("addIceCandidate error:", error);
        }
    }

    // ================= GET STREAMS =================
    getLocalStream() {
        return this.localStream;
    }

    getRemoteStream() {
        return this.remoteStream;
    }

    // ================= TOGGLE MUTE =================
    toggleMute(isMuted) {
        if (!this.localStream) return;

        this.localStream.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
        });
    }

    // ================= SPEAKER CONTROL =================
    setSpeaker(on) {
        InCallManager.setSpeakerphoneOn(on);
    }

    // ================= END CALL =================
    close() {
        try {
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = null;
            }

            if (this.remoteStream) {
                this.remoteStream.getTracks().forEach(track => track.stop());
                this.remoteStream = null;
            }

            if (this.pc) {
                this.pc.close();
                this.pc = null;
            }

            InCallManager.stop();

        } catch (error) {
            console.error("WebRTC close error:", error);
        }
    }
}

export default new WebRTCService();