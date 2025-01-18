import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Avatar } from "../components/Avatar";
import { Mic, Video, Radio } from "lucide-react";
import { ExperiencePodcast } from "./ExperiencePodcast";
import { useChat } from "../hooks/useChat";
import axios from "axios";
import VirtualCam from "./VirtualCam";

export const Podcast = () => {
    const videoRef = useRef(null);
      const audioRef = useRef(null);
      const [transcript, setTranscript] = useState("");
      const [isSpeaking, setIsSpeaking] = useState(false);
      const [language, setLanguage] = useState("ar");
      const [isProcessing, setIsProcessing] = useState(false);
      const [roundSpeak, setRoundSpeak] = useState("avatar");
      const { chat, message, onMessagePlayed } = useChat();  
      let mediaRecorder;
      let audioChunks = [];
      let silenceTimer;
      let audioStream; // ✅ Persistent Audio Stream Reference
      let videoStream;
      const effectExecuted = useRef(false);
      const [isRecording, setIsRecording] = useState(false);
      const [countdown, setCountdown] = useState(0);
      let countdownInterval;
      const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

      useEffect(() => {
          if (effectExecuted.current) return;
          effectExecuted.current = true;
          initializeCameraAndMic();
          startAvatarIntroduction();
      }, []);
  

 // ✅ Initialize Camera and Microphone with Separate Streams
async function initializeCameraAndMic() {
    try {
        // Get video stream (without audio)
        //videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        //videoRef.current.srcObject = videoStream;

        // Get audio stream (without video) for better control
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioRef.current.srcObject = audioStream;

        console.log("✅ Video & Audio Streams Activated");
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
       // let response = sendTextToAnimaze("Hello, welcome to the podcast!", language) 
        if (response.length > 0) { 
            setIsSpeaking(false);
            setRoundSpeak("invitee");
            startRecording(audioStream);
            // playAudio(response[0].audio, () => {
                
            // });
        }
    } catch (error) {
        console.error("Error during avatar introduction:", error);
        setIsProcessing(false);
    }
}

async function sendTextToAnimaze(message, language) {
  const data = await fetch(`${backendUrl}/chat/animaze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, language }),
  });
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
            
        }
        console.log("✅ Recording Stopped. Sending audio for processing.");
        await sendAudioToBackend(new Blob(audioChunks, { type: "audio/wav" }));
    };

    mediaRecorder.start();
    //detectSilence(stream);
    console.log("🎙️ Recording Started");

    // ✅ Start the 10-second countdown
    setCountdown(10);
    countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        console.log('count down', prev);
        if (prev === 1) {
          clearInterval(countdownInterval);
          console.log("⏳ Time is up! Stopping recording...");
          setRoundSpeak("invitee");
          mediaRecorder.stop();
        }
        return prev - 1;
      });
    }, 1000);
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
        let response = await chat(transcribedText);
       // let response = sendTextToAnimaze(transcribedText, language) 
        if (response) {
            setIsSpeaking(false);
            setRoundSpeak("invitee");
            startRecording(audioStream);
            // startAvatarIntroduction();
            // playAudio(message.audio, () => {
               
            // });
        }
    } catch (error) {
        console.error("❌ Error sending audio:", error);
    } finally {
        setIsProcessing(false);
    }
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





// ✅ Play Audio for Avatar's Speech
function playAudio(audioUrl, onEndCallback) {
    if (audioRef && audioRef.current) {
        audioRef.current.src = `data:audio/mp3;base64,${audioUrl}`;
        audioRef.current.play();
        setIsSpeaking(true);
    
        audioRef.current.onended = () => {
            setIsSpeaking(false);
            if (onEndCallback) onEndCallback();
            onMessagePlayed();
        };
    }
    
}

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      {/* 🎙️ Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold tracking-wide">🔥 AI Podcast Studio</h1>
        <button
          className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-lg shadow-lg transition-all ${
            isRecording ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
          onClick={() => setIsRecording(!isRecording)}
        >
          <Radio className="w-6 h-6" />
          {isRecording ? "ON AIR" : "Start Recording"}
        </button>
        {/* ✅ Language Selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-4 py-2 bg-gray-800 text-white border rounded-md shadow-lg"
        >
          <option value="ar">🇸🇦 Arabic</option>
          <option value="en">🇬🇧 English</option>
          <option value="fr">🇫🇷 French</option>
          <option value="es">🇪🇸 Spanish</option>
          <option value="ja">🇯🇵 Japanese</option>
        </select>
      </div>

      {/* 🎥 Podcast Screen (Split Layout) */}
      <div className="grid grid-cols-2 gap-6 w-full max-w-6xl">
        {/* 🧑 Guest (Human) */}
        <div className="relative bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg p-8 shadow-2xl w-full max-w-3xl h-[500px] flex items-center justify-center">
    
            {/* 🔹 Background Blur Effect */}
            <div className="absolute inset-0 bg-[url('/images/studio_bg.jpg')] opacity-30 bg-cover bg-center rounded-lg" />

            {/* 🎙️ Static Microphone (Now Bigger & Positioned Properly) */}
            <img 
                src="/images/mic.png" 
                alt="Mic" 
                className="absolute bottom-6 right-6 w-28 opacity-90 drop-shadow-lg"
            />

            {/* 🎥 Webcam Video (Now Scaled for Better Fit) */}
            { <Webcam 
                ref={videoRef} 
                className="w-full h-full object-cover rounded-lg relative z-10"
            /> }
            {/* <img src="http://192.168.1.18:5000/video_feed" alt="Deepfake Stream" style={{ width: "100%" }} /> */}
            {/* <VirtualCam /> */}

            {/* 🔹 Name Tag */}
             {/* 🎙️ Mirrored Mic for Invitee (Bottom Left) */}
             <img 
                src="/images/mic.png"
                alt="Mic"
                className="absolute bottom-6 left-80 w-52 opacity-100 z-20 scale-x-[-1]"
            />
            
            <div className="absolute bottom-1 left-4 text-lg font-bold bg-black/70 px-5 py-3 rounded-lg shadow-md text-white">
                🎧 Guest
            </div>
        </div>


        {/* 🤖 AI Avatar */}
        <div className="relative bg-gradient-to-br from-cyan-900 to-blue-900 rounded-lg p-6 shadow-2xl">
          {/* Background Blur Effect */}
          <div className="absolute inset-0 bg-[url('/images/studio_bg_2.jpg')] opacity-20 bg-cover bg-center rounded-lg" />

        

          {/* AI Avatar (3D Animation) */}
          <div className="w-full h-full flex justify-center items-center bg-black">
            { <Canvas className="w-full h-72 relative z-10" shadows>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 1, 5]} castShadow intensity={1} />
                
               
                <ExperiencePodcast />
            </Canvas> }
           
            </div>

          {/* AI Name Tag */}
          <img 
                src="/images/mic.png" 
                alt="Mic"
                className="absolute bottom-6 left-6 w-52 opacity-100 z-20"
            />
           
          <div className="absolute bottom-3 left-4 text-lg font-bold bg-black/50 px-4 py-2 rounded-lg shadow-md">
            🤖 AI Host
          </div>
        </div>
      </div>

      {/* 🎙️ Status Panel */}
      <div className="mt-6 flex flex-col items-center text-center">
        <h2 className="text-lg font-medium text-gray-300">
          {isRecording ? "Live Recording in Progress..." : "Podcast Ready to Start"}
        </h2>
        <div className={`px-4 py-2 mt-2 rounded-lg text-lg font-semibold ${isRecording ? "bg-red-500" : "bg-green-500"}`}>
          {isRecording ? "🔴 LIVE" : "🟢 Standby"}
        </div>
      </div>
      {/* ⏳ Timer Display */}
      {roundSpeak === "invitee" && (
        <div className="mt-4 text-lg font-bold text-yellow-400">
          ⏳ You have {countdown} seconds to answer...
        </div>
      )}
    </div>
  );
};
const languageSelectStyle = {
    margin: "10px",
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid gray"
};
export default Podcast;
