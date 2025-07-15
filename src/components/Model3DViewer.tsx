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
  const center = {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
    z: bounds.max.z / 2
  };
  const dimensions = model.metadata.dimensions;
  const maxDimension = Math.max(dimensions.width, dimensions.depth, dimensions.height);
  const cameraDistance = maxDimension * 1.5;

  return (
    <Suspense fallback={<mesh><boxGeometry /><meshBasicMaterial /></mesh>}>
      {/* Camera positioning */}
      <PerspectiveCamera 
        makeDefault 
        position={[center.x + cameraDistance * 0.8, center.y + cameraDistance * 0.6, center.z + cameraDistance * 0.8]} 
        fov={40} 
        near={0.1} 
        far={5000}
      />
      
      {/* Orbit controls */}
      <OrbitControls 
        target={[center.x, center.y, center.z]} 
        enableDamping 
        dampingFactor={0.05}
        enableZoom 
        enablePan 
        enableRotate 
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
        minDistance={maxDimension * 0.5}
        maxDistance={maxDimension * 3}
        autoRotate={false}
        rotateSpeed={0.6}
        zoomSpeed={1.0}
        panSpeed={0.6}
      />
      
      {/* Environment lighting */}
      <Environment preset="city" environmentIntensity={0.6} />
      
      {/* Additional lighting */}
      <ambientLight intensity={0.4} />
      
      {/* Main directional light */}
      <directionalLight 
        position={[center.x + 300, center.y + 400, center.z + 200]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={1000} 
        shadow-camera-left={-300} 
        shadow-camera-right={300} 
        shadow-camera-top={300} 
        shadow-camera-bottom={-300}
      />
      
      {/* Ground plane for shadows */}
      <mesh 
        position={[center.x, center.y, -2]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[dimensions.width * 3, dimensions.depth * 3]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.8} metalness={0.1} />
      </mesh>
      
      {/* Grid */}
      <Grid 
        position={[center.x, center.y, 0]} 
        args={[dimensions.width * 2, dimensions.depth * 2]} 
        cellSize={50} 
        cellThickness={0.5} 
        sectionSize={200} 
        sectionThickness={1} 
        sectionColor="#666666" 
        cellColor="#aaaaaa" 
        infiniteGrid={false} 
        fadeDistance={maxDimension * 2} 
        fadeStrength={0.5} 
      />
      
      {/* Render all pergola components */}
      {model.meshes && model.meshes.map(mesh => (
        <Mesh3DComponent key={mesh.id} mesh={mesh} />
      ))}
      
      {/* Reference axes */}
      <group position={[bounds.min.x, bounds.min.y, 0]}>
        <mesh position={[25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.8, 0.8, 50]} />
          <meshStandardMaterial color="#ff4444" />
        </mesh>
        <mesh position={[0, 25, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 50]} />
          <meshStandardMaterial color="#44ff44" />
        </mesh>
        <mesh position={[0, 0, 25]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 50]} />
          <meshStandardMaterial color="#4444ff" />
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
    return;
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