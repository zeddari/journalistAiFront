import React, { useState } from "react";
import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";
import { Podcast } from "./components/Podcast"; // Import Podcast component
import { FaMicrophoneAlt, FaUserAlt } from "react-icons/fa"; // Icons for menu

function App() {
    const [selectedComponent, setSelectedComponent] = useState("avatar"); // State for navigation

    return (
        <>
            {/* ✅ Loader and UI */}
            <Loader />
            <Leva hidden />
            <UI />

            {/* ✅ Virtual Background Effect */}
            <div style={virtualBackgroundStyle}></div>

            {/* ✅ Sidebar Menu */}
            <div style={sidebarStyle}>
                <div style={logoStyle}>🎙️ Podcast AI</div>
                <div
                    style={menuItemStyle(selectedComponent === "avatar")}
                    onClick={() => setSelectedComponent("avatar")}
                >
                    <FaUserAlt size={18} /> Journalist Avatar
                </div>
                <div
                    style={menuItemStyle(selectedComponent === "podcast")}
                    onClick={() => setSelectedComponent("podcast")}
                >
                    <FaMicrophoneAlt size={18} /> Podcast Arena
                </div>
            </div>

            {/* ✅ Content Area */}
            <div style={contentStyle}>
                {selectedComponent === "avatar" ? (
                    <Canvas shadows camera={{ position: [0, 0, 1], fov: 30 }}>
                        <Experience />
                    </Canvas>
                ) : (
                    <div style={fullScreenStyle}>
                        <Podcast />
                    </div>
                )}
            </div>
        </>
    );
}

// ✅ Sidebar Menu Style
const sidebarStyle = {
    position: "fixed",
    left: 0,
    top: 0,
    width: "250px",
    height: "100vh",
    background: "rgba(20, 20, 20, 0.9)",
    backdropFilter: "blur(10px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    boxShadow: "2px 0 15px rgba(0,0,0,0.2)",
};

// ✅ Logo Style
const logoStyle = {
    color: "#fff",
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "40px",
};

// ✅ Menu Item Style
const menuItemStyle = (isActive) => ({
    width: "100%",
    padding: "15px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: isActive ? "#ff3e00" : "#ccc",
    fontSize: "1.1rem",
    cursor: "pointer",
    borderRadius: "10px",
    transition: "all 0.3s ease",
    background: isActive ? "rgba(255, 62, 0, 0.2)" : "transparent",
});

// ✅ Content Area Style
const contentStyle = {
    marginLeft: "250px",
    width: "calc(100vw - 250px)",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
};

// ✅ Full Screen Style (Podcast)
const fullScreenStyle = {
    width: "100%",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
};

// ✅ Virtual Background Effect
const virtualBackgroundStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: -1,
    background: "linear-gradient(135deg, #0f0f0f 30%, #1a1a1a 70%)",
    filter: "blur(50px)",
    opacity: 0.8,
};

export default App;
