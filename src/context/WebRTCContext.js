// src/context/WebRTCContext.js
import React, { createContext, useRef, useState, useEffect } from 'react';

export const WebRTCContext = createContext();

export const WebRTCProvider = ({ children }) => {
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const peerConnection = useRef(null);

    useEffect(() => {
        const startStream = async () => {
            try {
                const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(userStream);
            } catch (error) {
                console.error('Error accessing webcam or microphone:', error);
            }
        };
        startStream();
    }, []);

    const startCall = async () => {
        const servers = {
            iceServers: [
                {
                    urls: 'stun:stun.l.google.com:19302',
                },
            ],
        };

        peerConnection.current = new RTCPeerConnection(servers);

        // Add local stream to the connection
        stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));

        // Handle incoming remote streams
        peerConnection.current.ontrack = event => {
            setRemoteStream(event.streams[0]);
        };

        // Generate an offer (for testing only, signaling server is needed for real calls)
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        console.log('Offer created:', offer);
    };

    return (
        <WebRTCContext.Provider value={{ stream, remoteStream, startCall }}>
            {children}
        </WebRTCContext.Provider>
    );
};
