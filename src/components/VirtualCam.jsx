import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://192.168.1.18:5000"); // Connect to Flask WebRTC server

const VirtualCam = () => {
  const [image, setImage] = useState("");

  useEffect(() => {
    // Listen for video frames from the WebRTC server
    socket.on("video_frame", (data) => {
      setImage(`data:image/jpeg;base64,${data.image}`);
    });

    // Cleanup the event listener when component unmounts
    return () => {
      socket.off("video_frame");
    };
  }, []);

  return (
    <div>
      <h2>⚡ Real-Time DeepFake Stream (WebRTC)</h2>
      {image && <img src={image} alt="Live Stream" style={{ width: "100%" }} />}
    </div>
  );
};

export default VirtualCam;
