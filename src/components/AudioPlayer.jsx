import React, { useRef } from "react";

const AudioPlayer = () => {
  const audioRef = useRef(null);

  // Play audio
  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  // Pause audio
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  return (
    <div>
      <h2>🎙️ AI Voice Player for Animaze</h2>
      <audio ref={audioRef} src="output.mp3" controls />
      <button onClick={playAudio}>▶️ Play</button>
      <button onClick={pauseAudio}>⏸ Pause</button>
    </div>
  );
};

export default AudioPlayer;
