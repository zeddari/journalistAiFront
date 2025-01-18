import React, { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import axios from "axios";

export function Podcast() {
    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const [transcript, setTranscript] = useState("");
    const [language, setLanguage] = useState("ar");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [roundSpeak, setRoundSpeak] = useState("avatar");
    const { chat, message, onMessagePlayed } = useChat();  
    let mediaRecorder;
    let audioChunks = [];
    let silenceTimer;
    let audioStream; // ✅ Persistent Audio Stream Reference
    const effectExecuted = useRef(false);

    useEffect(() => {
        if (effectExecuted.current) return;
        effectExecuted.current = true;
        initializeCameraAndMic();
        startAvatarIntroduction();
    }, []);

    // ✅ Initialize Camera and Microphone Automatically
    async function initializeCameraAndMic() {
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            videoRef.current.srcObject = audioStream;
            console.log("✅ Mic and Camera Activated");
        } catch (error) {
            console.error("❌ Error initializing camera and mic:", error);
        }
    }

    // ✅ Start Avatar Introduction
    async function startAvatarIntroduction() {
        if (isProcessing || roundSpeak !== "avatar") return;
        setIsProcessing(true);
        try {
            const response = await chat("Hello, welcome to the podcast!");
            
            if (response.length > 0) { 
                playAudio(response[0].audio, () => {
                    setIsSpeaking(false);
                    setRoundSpeak("invitee");
                    startRecording(audioStream);
                });
            }
        } catch (error) {
            console.error("Error during avatar introduction:", error);
            setIsProcessing(false);
        }
    }

    // ✅ Start Recording with Improved Error Handling
    function startRecording(stream) {
        if (!stream) {
            console.error("❌ No audio stream available.");
            return;
        }

        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            if (roundSpeak === "invitee") {
                console.log("✅ Recording Stopped. Sending audio for processing.");
                await sendAudioToBackend(new Blob(audioChunks, { type: "audio/wav" }));
            }
        };

        mediaRecorder.start();
        detectSilence(stream);
        console.log("🎙️ Recording Started");
    }

    // ✅ Improved Silence Detection with Console Feedback
        function detectSilence(stream) {
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            analyser.fftSize = 256;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            let silenceThreshold = 1; // Amplitude threshold for silence (more accurate)
            let silenceDuration = 0; // Duration of silence in milliseconds
            const minSilenceTime = 200; // Stop recording if silence lasts this long
        
            async function checkSilence() {
                analyser.getByteTimeDomainData(dataArray); // Using amplitude values
                const amplitude = dataArray.reduce((sum, value) => sum + Math.abs(value - 128), 0) / dataArray.length;
        
                console.log("Amplitude:", amplitude); // Useful for debugging
        
                if (amplitude < silenceThreshold) {
                    silenceDuration += 100; // Increase silence time if low amplitude detected
                    if (silenceDuration >= minSilenceTime && !isProcessing) {
                        console.log("🔇 Long silence detected, stopping recording.");
                        mediaRecorder.stop();
                        clearTimeout(silenceTimer);
                        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        
                        // ✅ Check for audio content before sending
                        if (audioBlob.size > 0) {
                            console.log("🎙️ Sending valid audio to backend...");
                            await sendAudioToBackend(audioBlob);
                        } else {
                            console.warn("⚠️ No valid audio data detected.");
                        }
                    }
                } else {
                    // If sound is detected, reset silence duration
                    silenceDuration = 0;
                }
        
                // ✅ Continue monitoring in a loop
                silenceTimer = setTimeout(checkSilence, 100);
            }
        
            // ✅ Start the loop immediately
            checkSilence();
        }
    
    

    // ✅ Send Audio to Backend with Google STT Integration
    async function sendAudioToBackend(audioBlob) {
        if (isProcessing) return;
        setIsProcessing(true);
        
        const formData = new FormData();
        formData.append("audio", audioBlob);
        formData.append("language", language);

        try {
            console.log("🚀 Sending audio to backend for STT...");
            const sttResponse = await axios.post("http://localhost:3000/stt", formData);
            const transcribedText = sttResponse.data.transcript;
            setTranscript(transcribedText);
            console.log("✅ Transcription Received:", transcribedText);

            // ✅ Send the transcribed text to OpenAI
            await chat(transcribedText);

            if (message) {
                playAudio(message.audio, () => {
                    setIsSpeaking(false);
                    setRoundSpeak("avatar");
                    startAvatarIntroduction();
                });
            }
        } catch (error) {
            console.error("❌ Error sending audio:", error);
        } finally {
            setIsProcessing(false);
        }
    }

    // ✅ Play Audio for Avatar's Speech
    function playAudio(audioUrl, onEndCallback) {
        audioRef.current.src = `data:audio/mp3;base64,${audioUrl}`;
        audioRef.current.play();
        setIsSpeaking(true);

        audioRef.current.onended = () => {
            setIsSpeaking(false);
            if (onEndCallback) onEndCallback();
            onMessagePlayed();
        };
    }

    return (
        <div style={containerStyle}>
            <h1>🎙️ Podcast Interview</h1>

            {/* ✅ Language Selector */}
            <label>
                Select Language:
                <select value={language} onChange={(e) => setLanguage(e.target.value)} style={languageSelectStyle}>
                    <option value="ar">Arabic</option>
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                    <option value="ja">Japanese</option>
                </select>
            </label>

            {/* ✅ Split Screen Layout */}
            <div style={splitScreenStyle}>
                {/* ✅ Left Side: Camera Feed */}
                <video ref={videoRef} autoPlay playsInline muted style={videoStyle} />

                {/* ✅ Right Side: Avatar Audio */}
                <audio ref={audioRef} controls style={{ marginTop: "20px", width: "100%" }} />
            </div>

            {/* ✅ Transcript Display */}
            <p><strong>Guest Response Transcript:</strong> {transcript}</p>
        </div>
    );
}

// ✅ Styling Section
const containerStyle = {
    textAlign: "center",
    padding: "20px"
};

const splitScreenStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    marginTop: "20px"
};

const videoStyle = {
    flex: "1",
    width: "100%",
    height: "500px",
    borderRadius: "20px",
    border: "5px solid white",
    boxShadow: "0 0 20px rgba(255,255,255,0.5)"
};

const languageSelectStyle = {
    margin: "10px",
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid gray"
};

export default Podcast;
