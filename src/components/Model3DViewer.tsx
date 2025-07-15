import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment } from '@react-three/drei';
import { Model3D, Mesh3D } from '@/utils/3dModelGenerator';
import * as THREE from 'three';
import { Suspense } from 'react';

interface Model3DViewerProps {
  model: Model3D | null;
  width?: number;
  height?: number;
}

// Enhanced mesh component with improved materials
const Mesh3DComponent = ({
  mesh
}: {
  mesh: Mesh3D;
}) => {
  const {
    geometry,
    position,
    rotation,
    color,
    type
  } = mesh;

  if (!geometry || typeof geometry.width === 'undefined' || typeof geometry.height === 'undefined' || typeof geometry.depth === 'undefined') {
    console.warn('Invalid geometry data:', geometry);
    return null;
  }

  const threeRotation: [number, number, number] = [rotation.x, rotation.y, rotation.z];
  const threePosition: [number, number, number] = [position.x, position.y, position.z];

  // Create different geometries based on mesh type
  const createGeometry = () => {
    return <boxGeometry args={[geometry.width, geometry.height, geometry.depth]} />;
  };

  // Improved materials for different components
  const getMaterialProps = () => {
    const baseColor = new THREE.Color(color);
    
    switch (type) {
      case 'frame_beam':
        return {
          color: baseColor,
          roughness: 0.2,
          metalness: 0.8,
          envMapIntensity: 1.0
        };
      case 'column':
        return {
          color: baseColor,
          roughness: 0.3,
          metalness: 0.7,
          envMapIntensity: 0.8
        };
      case 'shading_slat':
        return {
          color: baseColor.multiplyScalar(0.9),
          roughness: 0.7,
          metalness: 0.1,
          envMapIntensity: 0.4
        };
      default:
        return {
          color: baseColor,
          roughness: 0.5,
          metalness: 0.3,
          envMapIntensity: 0.6
        };
    }
  };
  
  return (
    <mesh position={threePosition} rotation={threeRotation} castShadow receiveShadow>
      {createGeometry()}
      <meshStandardMaterial {...getMaterialProps()} />
    </mesh>
  );
};

const Scene = ({
  model
}: {
  model: Model3D;
}) => {
  if (!model || !model.boundingBox || !model.metadata || !model.metadata.dimensions) {
    console.warn('Invalid model data:', model);
    return null;
  }

  const bounds = model.boundingBox;
  const dimensions = model.metadata.dimensions;
  const maxDimension = Math.max(dimensions.width, dimensions.depth, dimensions.height);
  const cameraDistance = maxDimension * 1.2;

  // Origin point - intersection of the three axes
  const origin = { x: 0, y: 0, z: 0 };

  return (
    <Suspense fallback={<mesh><boxGeometry /><meshBasicMaterial /></mesh>}>
      {/* Camera positioning - SketchUp-like perspective */}
      <PerspectiveCamera 
        makeDefault 
        position={[cameraDistance * 0.7, -cameraDistance * 0.7, cameraDistance * 0.5]} 
        fov={50} 
        near={1} 
        far={5000}
      />
      
      {/* Orbit controls - targeting origin */}
      <OrbitControls 
        target={[origin.x, origin.y, origin.z]} 
        enableDamping 
        dampingFactor={0.1}
        enableZoom 
        enablePan 
        enableRotate 
        maxPolarAngle={Math.PI * 0.95}
        minPolarAngle={0.05}
        minDistance={maxDimension * 0.3}
        maxDistance={maxDimension * 4}
        autoRotate={false}
        rotateSpeed={1.0}
        zoomSpeed={1.2}
        panSpeed={0.8}
        mouseButtons={{
          LEFT: 0, // rotate
          MIDDLE: 1, // zoom
          RIGHT: 2 // pan
        }}
      />
      
      {/* Environment lighting */}
      <Environment preset="city" environmentIntensity={0.6} />
      
      {/* Additional lighting */}
      <ambientLight intensity={0.4} />
      
      {/* Main directional light */}
      <directionalLight 
        position={[300, 400, 200]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={1000} 
        shadow-camera-left={-300} 
        shadow-camera-right={300} 
        shadow-camera-top={300} 
        shadow-camera-bottom={-300}
      />
      
      {/* Simple Floor - always at Z=0 */}
      <mesh 
        position={[0, 0, -1]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[dimensions.width * 3, dimensions.depth * 3]} />
        <meshStandardMaterial 
          color="#d4a574" 
          roughness={0.8} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Grid Reference - slightly above floor at origin */}
      <Grid 
        position={[0, 0, 0]} 
        args={[dimensions.width * 2, dimensions.depth * 2]} 
        cellSize={50} 
        cellThickness={0.3} 
        sectionSize={200} 
        sectionThickness={0.8} 
        sectionColor="#888888" 
        cellColor="#bbbbbb" 
        infiniteGrid={false} 
        fadeDistance={maxDimension * 2} 
        fadeStrength={0.3} 
      />
      
      {/* Render all pergola components */}
      {model.meshes && model.meshes.map(mesh => (
        <Mesh3DComponent key={mesh.id} mesh={mesh} />
      ))}
      
      {/* Reference axes at origin (0,0,0) */}
      <group position={[0, 0, 0]}>
        {/* X axis - Red */}
        <mesh position={[25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1, 1, 50]} />
          <meshStandardMaterial color="#ff0000" />
        </mesh>
        {/* Y axis - Green */}
        <mesh position={[0, 25, 0]}>
          <cylinderGeometry args={[1, 1, 50]} />
          <meshStandardMaterial color="#00ff00" />
        </mesh>
        {/* Z axis - Blue */}
        <mesh position={[0, 0, 25]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1, 1, 50]} />
          <meshStandardMaterial color="#0000ff" />
        </mesh>
      </group>
    </Suspense>
  );
};

export const Model3DViewer = ({
  model,
  width = 800,
  height = 600
}: Model3DViewerProps) => {
  if (!model || !model.meshes || model.meshes.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm w-full">
        <div className="bg-gray-50 px-3 py-2 border-b">
          <h4 className="text-sm font-medium text-gray-700">הדמיה תלת-ממדית - פרגולה</h4>
          <p className="text-xs text-gray-500">אין מודל זמין להצגה</p>
        </div>
        <div style={{ width, height }} className="w-full flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">יש ליצור מודל תלת-ממדי תחילה</p>
        </div>
      </div>
    );
  }

  console.log('🎬 Rendering enhanced 3D pergola model with', model.meshes.length, 'components');
  
  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm w-full">
      <div className="bg-gray-50 px-3 py-2 border-b">
        <h4 className="text-sm font-medium text-gray-700">הדמיה תלת-ממדית - פרגולה</h4>
        <p className="text-xs text-gray-500">
          הדמיה משופרת עם תאורה מתקדמת וחומרים מציאותיים
        </p>
      </div>
      
      <div style={{ width, height }} className="w-full">
        <Canvas
          shadows
          camera={{ position: [100, 100, 100], fov: 40 }}
          style={{ background: 'linear-gradient(to bottom, #87ceeb, #f0f8ff)' }}
        >
          <Scene model={model} />
        </Canvas>
      </div>
      
      <div className="bg-gray-50 px-3 py-2 border-t text-xs text-gray-600">
        רכיבי פרגולה: {model.meshes.filter(m => m.type === 'frame_beam').length} קורות מסגרת | 
        {model.meshes.filter(m => m.type === 'shading_slat').length} רצועות הצללה | 
        {model.meshes.filter(m => m.type === 'column').length} עמודים |
        מימדים: {model.metadata?.dimensions ? `${model.metadata.dimensions.width.toFixed(0)}×${model.metadata.dimensions.depth.toFixed(0)}×${model.metadata.dimensions.height.toFixed(0)} ס"מ` : 'לא זמין'}
      </div>
    </div>
  );
};