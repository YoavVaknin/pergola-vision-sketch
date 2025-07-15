import { Canvas, useThree } from '@react-three/fiber';
import { useState, useEffect } from 'react';
import * as THREE from 'three';

// Debug Camera Controller - Isolated Test
const DebugCameraController = () => {
  const { camera, gl } = useThree();
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [lastPointer, setLastPointer] = useState({ x: 0, y: 0 });
  
  // Debug logging
  useEffect(() => {
    console.log('🎥 Camera initialized:', camera.position, camera.rotation);
  }, [camera]);
  
  useEffect(() => {
    const canvas = gl.domElement;
    
    const onPointerDown = (e: PointerEvent) => {
      console.log('🖱️ Pointer down:', e.clientX, e.clientY);
      setIsPointerDown(true);
      setLastPointer({ x: e.clientX, y: e.clientY });
      canvas.setPointerCapture(e.pointerId);
    };
    
    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      
      const deltaX = e.clientX - lastPointer.x;
      const deltaY = e.clientY - lastPointer.y;
      
      console.log('🔄 Rotating:', { deltaX, deltaY });
      
      // Rotate camera around origin
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      
      spherical.theta -= deltaX * 0.01; // Horizontal rotation
      spherical.phi += deltaY * 0.01;   // Vertical rotation - NO LIMITS
      
      console.log('📐 Spherical coords:', { 
        theta: spherical.theta, 
        phi: spherical.phi, 
        radius: spherical.radius 
      });
      
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);
      
      console.log('📷 New camera position:', camera.position);
      
      setLastPointer({ x: e.clientX, y: e.clientY });
    };
    
    const onPointerUp = (e: PointerEvent) => {
      console.log('🖱️ Pointer up');
      setIsPointerDown(false);
      canvas.releasePointerCapture(e.pointerId);
    };
    
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const direction = camera.position.clone().normalize();
      const distance = camera.position.length();
      const newDistance = Math.max(10, Math.min(1000, distance + e.deltaY * 0.1));
      
      camera.position.copy(direction.multiplyScalar(newDistance));
      console.log('🔍 Zoom:', { oldDistance: distance, newDistance });
    };
    
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel);
    
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [camera, gl, isPointerDown, lastPointer]);
  
  return null;
};

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
        
        {/* DEBUG CAMERA CONTROLLER */}
        <DebugCameraController />
      </Canvas>
    </div>
  );
};