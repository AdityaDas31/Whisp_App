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

        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
        },
    ],
};

class WebRTCService {
    pc = null;
    localStream = null;
    remoteStream = null;

    pendingCandidates = [];

    onIceCandidate = null;
    onRemoteStream = null;
    onConnectionStateChange = null;

    // ================= INIT =================
    async init(isVideo = false) {
        try {
            this.pendingCandidates = [];
            if (this.pc) {
                this.pc.close();
                this.pc = null;
            }
            // Start audio session

            // Create peer connection
            this.pc = new RTCPeerConnection(ICE_SERVERS);

            // Handle ICE candidates
            this.pc.onicecandidate = (event) => {
                if (event.candidate && this.onIceCandidate) {
                    this.onIceCandidate(event.candidate);
                }
            };

            this.pc.oniceconnectionstatechange = (event) => {

                const pc = event.currentTarget;

                if (!pc) return;

                console.log("ICE state:", pc.iceConnectionState);

            };

            this.pc.onsignalingstatechange = (event) => {

                const pc = event.currentTarget;

                if (!pc) return;

                console.log("Signaling state:", pc.signalingState);

            };

            // Handle remote stream
            // this.pc.ontrack = (event) => {
            //     if (event.streams && event.streams[0]) {
            //         console.log("REMOTE TRACK RECEIVED");
            //         this.remoteStream = event.streams[0];

            //         if (this.onRemoteStream) {
            //             this.onRemoteStream(this.remoteStream);
            //         }
            //     }
            // };

            this.pc.ontrack = (event) => {

                if (!event.streams || !event.streams[0]) return;

                console.log("REMOTE TRACK RECEIVED");

                this.remoteStream = event.streams[0];

                const audioTracks = this.remoteStream.getAudioTracks();

                if (this.onRemoteStream) {
                    this.onRemoteStream(this.remoteStream);
                }

                audioTracks.forEach(track => {

                    track.enabled = true;

                    console.log("Track readyState:", track.readyState);

                });

                // THIS IS THE REAL FIX — trigger Android audio renderer
                setTimeout(() => {

                    if (this.remoteStream) {

                        const tracks = this.remoteStream.getAudioTracks();

                        tracks.forEach(track => {
                            track.enabled = false;
                            track.enabled = true;
                        });

                        console.log("Audio sink attached");

                    }

                }, 500);

            };

            // Connection state
            this.pc.onconnectionstatechange = (event) => {

                try {

                    const pc = event.currentTarget;

                    if (!pc) return;

                    const state = pc.connectionState;

                    console.log("WebRTC state:", state);

                    if (this.onConnectionStateChange) {
                        this.onConnectionStateChange(state);
                    }

                } catch (e) {
                    console.log("connectionState error:", e);
                }

            };

            // Get microphone stream
            this.localStream = await mediaDevices.getUserMedia({
                audio: true,
                video: isVideo
                    ? {
                        facingMode: "user", // front camera
                        width: 640,
                        height: 480,
                        frameRate: 30,
                    }
                    : false,
            });

            // Add tracks
            this.localStream.getTracks().forEach((track) => {

                track.enabled = true;

                this.pc.addTrack(track, this.localStream);

            });

            // CRITICAL: force audio output activation
            this.pc.getReceivers().forEach(receiver => {

                if (receiver.track && receiver.track.kind === "audio") {

                    console.log("Receiver audio track found");

                    receiver.track.enabled = true;

                }

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
                offerToReceiveVideo: true, // ✅ ADD
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

            // apply queued ICE candidates
            for (const candidate of this.pendingCandidates) {

                await this.pc.addIceCandidate(
                    new RTCIceCandidate(candidate)
                );

            }

            this.pendingCandidates = [];

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

            // apply queued ICE candidates
            for (const candidate of this.pendingCandidates) {

                await this.pc.addIceCandidate(
                    new RTCIceCandidate(candidate)
                );

            }

            this.pendingCandidates = [];

        } catch (error) {

            console.error("setRemoteAnswer error:", error);

        }

    }

    // ================= ADD ICE CANDIDATE =================
    async addIceCandidate(candidate) {

        try {

            if (!candidate) return;

            if (!this.pc) return;

            if (!this.pc.remoteDescription) {

                // queue candidates
                this.pendingCandidates.push(candidate);

                return;

            }

            await this.pc.addIceCandidate(
                new RTCIceCandidate(candidate)
            );

        } catch (error) {

            console.log("ICE add error:", error);

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

    // ================= AUDIO LEVEL MONITOR =================

    audioLevelInterval = null;

    startAudioLevelMonitor(callback) {

        if (!this.pc) return;

        this.audioLevelInterval = setInterval(async () => {

            try {

                const stats = await this.pc.getStats();

                stats.forEach(report => {

                    // ✅ THIS IS THE CORRECT REPORT TYPE
                    if (
                        report.type === "media-source" &&
                        report.kind === "audio"
                    ) {

                        const level = report.audioLevel || 0;

                        callback(level);

                    }

                    // fallback for some devices
                    if (
                        report.type === "track" &&
                        report.kind === "audio"
                    ) {

                        const level = report.audioLevel || 0;

                        callback(level);

                    }

                });

            } catch (e) { }

        }, 100);

    }

    stopAudioLevelMonitor() {

        if (this.audioLevelInterval) {

            clearInterval(this.audioLevelInterval);

            this.audioLevelInterval = null;

        }

    }

    // ================= END CALL =================
    close() {
        this.stopAudioLevelMonitor();
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

                this.pc.onicecandidate = null;
                this.pc.ontrack = null;
                this.pc.onconnectionstatechange = null;
                this.pc.oniceconnectionstatechange = null;
                this.pc.onsignalingstatechange = null;

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