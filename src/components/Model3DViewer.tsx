
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import { Model3D, Mesh3D } from '@/utils/3dModelGenerator';
import * as THREE from 'three';

interface Model3DViewerProps {
  model: Model3D | null;
  width?: number;
  height?: number;
}

// Convert our mesh data to Three.js components
const Mesh3DComponent = ({ mesh }: { mesh: Mesh3D }) => {
  const { geometry, position, rotation, color, material } = mesh;
  
  // Convert rotation from our format to Three.js format
  const threeRotation: [number, number, number] = [rotation.x, rotation.y, rotation.z];
  const threePosition: [number, number, number] = [position.x, position.y, position.z];
  
  return (
    <mesh position={threePosition} rotation={threeRotation}>
      <boxGeometry args={[geometry.width, geometry.height, geometry.depth]} />
      <meshStandardMaterial 
        color={color} 
        roughness={material.roughness || 0.7}
        metalness={material.metalness || 0.1}
      />
    </mesh>
  );
};

const Scene = ({ model }: { model: Model3D }) => {
  // Calculate scene center and bounds for better camera positioning
  const bounds = model.boundingBox;
  const center = {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
    z: (bounds.min.z + bounds.max.z) / 2
  };
  
  const size = {
    x: bounds.max.x - bounds.min.x,
    y: bounds.max.y - bounds.min.y,
    z: bounds.max.z - bounds.min.z
  };
  
  // Calculate optimal camera distance
  const maxDimension = Math.max(size.x, size.y, size.z);
  const cameraDistance = maxDimension * 2;

  return (
    <>
      {/* Camera positioned to show the model nicely */}
      <PerspectiveCamera
        makeDefault
        position={[center.x + cameraDistance, center.y + cameraDistance, center.z + cameraDistance]}
        fov={50}
      />
      
      {/* Orbit controls for interaction */}
      <OrbitControls
        target={[center.x, center.y, center.z]}
        enableDamping
        dampingFactor={0.05}
        enableZoom
        enablePan
        enableRotate
        maxPolarAngle={Math.PI}
        minDistance={maxDimension * 0.5}
        maxDistance={maxDimension * 5}
      />
      
      {/* Lighting setup */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[center.x + 100, center.y + 100, center.z + 100]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[center.x - 100, center.y + 50, center.z - 100]}
        intensity={0.3}
      />
      
      {/* Ground grid for reference */}
      <Grid
        position={[center.x, bounds.min.y - 5, center.z]}
        args={[maxDimension * 2, maxDimension * 2]}
        cellSize={50}
        cellThickness={0.5}
        sectionSize={100}
        sectionThickness={1}
        sectionColor="#444444"
        cellColor="#888888"
        infiniteGrid={false}
        fadeDistance={maxDimension * 3}
        fadeStrength={1}
      />
      
      {/* Render all meshes */}
      {model.meshes.map((mesh) => (
        <Mesh3DComponent key={mesh.id} mesh={mesh} />
      ))}
      
      {/* Reference axes at origin */}
      <group position={[bounds.min.x, bounds.min.y, bounds.min.z]}>
        {/* X axis - Red */}
        <mesh position={[25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1, 1, 50]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        {/* Y axis - Green */}
        <mesh position={[0, 25, 0]}>
          <cylinderGeometry args={[1, 1, 50]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
        {/* Z axis - Blue */}
        <mesh position={[0, 0, 25]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1, 1, 50]} />
          <meshBasicMaterial color="#0000ff" />
        </mesh>
      </group>
    </>
  );
};

export const Model3DViewer = ({ model, width = 600, height = 400 }: Model3DViewerProps) => {
  if (!model || model.meshes.length === 0) {
    return (
      <div 
        className="border rounded-lg bg-gray-50 flex items-center justify-center text-gray-500"
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="text-lg mb-2">🏗️</div>
          <div>אין מודל תלת-ממדי להצגה</div>
          <div className="text-sm">יש לצייר מסגרת ולייצר מודל תחילה</div>
        </div>
      </div>
    );
  }

  console.log('🎬 Rendering 3D model with', model.meshes.length, 'meshes');

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="bg-gray-50 px-3 py-2 border-b">
        <h4 className="text-sm font-medium text-gray-700">תצוגה תלת-ממדית</h4>
        <p className="text-xs text-gray-500">
          עכבר: סיבוב | גלגל: זום | ימני+גרירה: הזזה
        </p>
      </div>
      
      <div style={{ width, height }}>
        <Canvas
          shadows
          camera={{ position: [100, 100, 100], fov: 50 }}
          style={{ background: 'linear-gradient(to bottom, #e0f2fe, #f8fafc)' }}
        >
          <Scene model={model} />
        </Canvas>
      </div>
      
      <div className="bg-gray-50 px-3 py-2 border-t text-xs text-gray-600">
        {model.meshes.length} רכיבים | 
        גובה: {model.metadata.frameHeight}ס"מ | 
        נוצר: {new Date(model.metadata.generatedAt).toLocaleTimeString('he-IL')}
      </div>
    </div>
  );
};
