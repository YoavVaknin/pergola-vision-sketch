import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

// Completely Fresh Camera Test - No Custom Logic
export const CameraTest = () => {
  return (
    <div style={{ width: '100%', height: '400px', border: '2px solid red' }}>
      <h3>🔥 FRESH START TEST</h3>
      <p>Drag to rotate | Scroll to zoom | NO LIMITS, NO CUSTOM CODE</p>
      
      <Canvas>
        {/* Minimal setup - just the basics */}
        <PerspectiveCamera makeDefault position={[200, 400, 200]} fov={45} />
        
        {/* OrbitControls with ZERO restrictions */}
        <OrbitControls />
        
        {/* Simple lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* Test cubes for reference */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[20, 20, 20]} />
          <meshStandardMaterial color="red" />
        </mesh>
        
        <mesh position={[50, 0, 0]}>
          <boxGeometry args={[10, 10, 10]} />
          <meshStandardMaterial color="green" />
        </mesh>
        
        <mesh position={[0, 50, 0]}>
          <boxGeometry args={[10, 10, 10]} />
          <meshStandardMaterial color="blue" />
        </mesh>
        
        <mesh position={[0, 0, 50]}>
          <boxGeometry args={[10, 10, 10]} />
          <meshStandardMaterial color="yellow" />
        </mesh>
      </Canvas>
    </div>
  );
};