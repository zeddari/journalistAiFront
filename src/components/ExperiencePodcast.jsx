import {
  CameraControls,
  ContactShadows,
  Environment,
  Text,
} from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import { Avatar } from "./Avatar";

const Dots = (props) => {
  const { loading } = useChat();
  const [loadingText, setLoadingText] = useState("");

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingText((loadingText) => {
          if (loadingText.length > 2) {
            return ".";
          }
          return loadingText + ".";
        });
      }, 800);
      return () => clearInterval(interval);
    } else {
      setLoadingText("");
    }
  }, [loading]);

  if (!loading) return null;
  return (
    <group {...props}>
      <Text fontSize={0.14} anchorX={"left"} anchorY={"bottom"}>
        {loadingText}
        <meshBasicMaterial attach="material" color="black" />
      </Text>
    </group>
  );
};

export const ExperiencePodcast = () => {
  const cameraControls = useRef();
  const { cameraZoomed } = useChat();

  useEffect(() => {
    // ✅ Move camera closer and slightly above for a head & shoulders close-up
    cameraControls.current?.setLookAt(0, 1.7, 1, 0, 1.6, 0, true);
  }, []);

  useEffect(() => {
    if (cameraZoomed) {
      // ✅ Further zoomed-in mode for extra focus on the face
      cameraControls.current?.setLookAt(0, 1.7, 0.8, 0, 1.6, 0, true);
    } else {
      // ✅ Default Close-Up (Head & Shoulders)
      cameraControls.current?.setLookAt(0, 1.7, 1, 0, 1.6, 0, true);
    }
  }, [cameraZoomed]);

  return (
    <>
      {/* ✅ Camera Controls (No OrbitControls needed) */}
      <CameraControls ref={cameraControls} />

      <Environment preset="sunset" />
      
      {/* ✅ Smooth Dots Animation (Loading effect) */}
      <Suspense>
        <Dots position-y={2.2} position-x={-0.02} />
      </Suspense>

      {/* ✅ Display Only Head & Shoulders */}
      <Avatar scale={[3.2, 3.2, 3.2]} position={[0, -3.7, -0.2]} />

      {/* ✅ Soft Contact Shadows */}
      <ContactShadows opacity={0.7} />
    </>
  );
};
