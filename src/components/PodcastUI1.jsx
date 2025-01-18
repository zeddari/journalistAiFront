// src/components/PodcastUI.js
import React, { useContext } from 'react';


const PodcastUI = () => {
    const { stream, remoteStream, startCall } = useContext(WebRTCContext);

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px', 
            padding: '20px', 
            background: '#121212', 
            color: 'white' 
        }}>
            {/* Human Guest Video Feed */}
            <div style={{ backgroundColor: '#1E1E1E', padding: '15px', borderRadius: '15px' }}>
                <h3>Carmen (Guest)</h3>
                <video ref={video => video && (video.srcObject = stream)} autoPlay muted style={{
                    borderRadius: '10px', width: '400px', height: '400px'
                }} />
            </div>

            {/* Ready Player Me Avatar (Animated Avatar) */}
            <div style={{ backgroundColor: '#1E1E1E', padding: '15px', borderRadius: '15px' }}>
                <h3>Fluffo (Avatar)</h3>
                <iframe
                    src="https://readyplayer.me/avatar?frameApi"
                    width="400"
                    height="400"
                    allow="camera; microphone"
                    title="Ready Player Me Avatar"
                />
                <button onClick={startCall} style={{ marginTop: '15px', padding: '10px' }}>
                    Start Call
                </button>
                <video ref={video => video && (video.srcObject = remoteStream)} autoPlay style={{
                    borderRadius: '10px', width: '400px', height: '400px'
                }} />
            </div>
        </div>
    );
};

export default PodcastUI;
