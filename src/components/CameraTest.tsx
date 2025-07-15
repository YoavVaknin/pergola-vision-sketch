import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

// Isolated Camera Test Component
export const CameraTest = () => {
  return (
    <div style={{ width: '100%', height: '400px', border: '2px solid red' }}>
      <h3>🧪 ISOLATED CAMERA TEST</h3>
      <p>Drag to rotate | Scroll to zoom | Should work in ALL directions</p>
      
      <Canvas
        shadows
        camera={{ 
          position: [200, 400, 200], 
          fov: 45 
        }}
        style={{ background: '#f0f0f0' }}
      >
        {/* Simple test geometry */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* Test cubes */}
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
        
        {/* CLEAN ORBIT CONTROLS - NO LIMITS */}
        <PerspectiveCamera makeDefault position={[200, 400, 200]} fov={45} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true} 
          enableRotate={true}
          maxPolarAngle={Math.PI} // Full 360° vertical rotation
          minPolarAngle={0}
          maxAzimuthAngle={Infinity} // Full 360° horizontal rotation  
          minAzimuthAngle={-Infinity}
          maxDistance={1000}
          minDistance={10}
        />
      </Canvas>
    </div>
  );
};