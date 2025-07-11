
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import { Model3D, Mesh3D } from '@/utils/3dModelGenerator';
import * as THREE from 'three';

interface Model3DViewerProps {
  model: Model3D | null;
  width?: number;
  height?: number;
}

// Enhanced mesh component with better geometry handling
const Mesh3DComponent = ({ mesh }: { mesh: Mesh3D }) => {
  const { geometry, position, rotation, color, material, type } = mesh;
  
  // Add null checks for geometry
  if (!geometry || typeof geometry.width === 'undefined' || typeof geometry.height === 'undefined' || typeof geometry.depth === 'undefined') {
    console.warn('Invalid geometry data:', geometry);
    return null;
  }
  
  const threeRotation: [number, number, number] = [rotation.x, rotation.y, rotation.z];
  const threePosition: [number, number, number] = [position.x, position.y, position.z];
  
  // Create different geometries based on mesh type
  const createGeometry = () => {
    switch (type) {
      case 'frame_beam':
        return <boxGeometry args={[geometry.width, geometry.height, geometry.depth]} />;
      case 'division_beam':
        return <boxGeometry args={[geometry.width, geometry.height, geometry.depth]} />;
      case 'shading_slat':
        return <boxGeometry args={[geometry.width, geometry.height, geometry.depth]} />;
      case 'column':
        return <boxGeometry args={[geometry.width, geometry.height, geometry.depth]} />;
      default:
        return <boxGeometry args={[geometry.width, geometry.height, geometry.depth]} />;
    }
  };
  
  // Enhanced material properties based on type
  const getMaterialProps = () => {
    const baseProps = {
      color: color,
      roughness: material.roughness || 0.7,
      metalness: material.metalness || 0.1
    };
    
    switch (type) {
      case 'frame_beam':
        return { ...baseProps, roughness: 0.6, metalness: 0.2 };
      case 'column':
        return { ...baseProps, roughness: 0.8, metalness: 0.1 };
      case 'shading_slat':
        return { ...baseProps, roughness: 0.9, metalness: 0.0 };
      default:
        return baseProps;
    }
  };
  
  return (
    <mesh position={threePosition} rotation={threeRotation} castShadow receiveShadow>
      {createGeometry()}
      <meshStandardMaterial {...getMaterialProps()} />
    </mesh>
  );
};

const Scene = ({ model }: { model: Model3D }) => {
  // Add null checks for model and its properties
  if (!model || !model.boundingBox || !model.metadata || !model.metadata.dimensions) {
    console.warn('Invalid model data:', model);
    return null;
  }

  // Calculate optimal camera positioning based on model dimensions
  const bounds = model.boundingBox;
  const center = {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
    z: (bounds.max.z) / 2 // Position camera to show full height
  };
  
  const dimensions = model.metadata.dimensions;
  const maxDimension = Math.max(dimensions.width, dimensions.depth, dimensions.height);
  const cameraDistance = maxDimension * 1.5;

  return (
    <>
      {/* Enhanced camera positioning for pergola viewing */}
      <PerspectiveCamera
        makeDefault
        position={[
          center.x + cameraDistance * 0.8,
          center.y + cameraDistance * 0.6,
          center.z + cameraDistance * 0.8
        ]}
        fov={45}
      />
      
      {/* Significantly improved orbit controls for complete 360° freedom */}
      <OrbitControls
        target={[center.x, center.y, center.z]}
        enableDamping
        dampingFactor={0.05}
        enableZoom
        enablePan
        enableRotate
        maxPolarAngle={Math.PI} // Allow full vertical rotation (including viewing from below)
        minPolarAngle={0} // Allow viewing from directly above
        minAzimuthAngle={-Infinity} // Remove horizontal rotation limits
        maxAzimuthAngle={Infinity} // Remove horizontal rotation limits
        minDistance={maxDimension * 0.2} // Allow much closer zoom
        maxDistance={maxDimension * 4} // Allow farther zoom out
        autoRotate={false}
        autoRotateSpeed={1}
        rotateSpeed={0.8} // Slightly faster rotation for better responsiveness
        zoomSpeed={1.2} // Improved zoom responsiveness
        panSpeed={0.8} // Improved pan responsiveness
      />
      
      {/* Enhanced lighting setup for pergola visualization */}
      <ambientLight intensity={0.6} />
      
      {/* Main directional light (sun simulation) */}
      <directionalLight
        position={[center.x + 200, center.y + 300, center.z + 200]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={1000}
        shadow-camera-left={-300}
        shadow-camera-right={300}
        shadow-camera-top={300}
        shadow-camera-bottom={-300}
      />
      
      {/* Fill light */}
      <directionalLight
        position={[center.x - 100, center.y + 100, center.z - 100]}
        intensity={0.4}
      />
      
      {/* Rim light for definition */}
      <directionalLight
        position={[center.x, center.y - 100, center.z + 200]}
        intensity={0.3}
      />
      
      {/* Ground plane for shadows */}
      <mesh
        position={[center.x, center.y, -5]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[dimensions.width * 2, dimensions.depth * 2]} />
        <shadowMaterial opacity={0.3} />
      </mesh>
      
      {/* Enhanced ground grid */}
      <Grid
        position={[center.x, center.y, 0]}
        args={[dimensions.width * 1.5, dimensions.depth * 1.5]}
        cellSize={50}
        cellThickness={0.5}
        sectionSize={100}
        sectionThickness={1}
        sectionColor="#555555"
        cellColor="#999999"
        infiniteGrid={false}
        fadeDistance={maxDimension * 2}
        fadeStrength={0.8}
      />
      
      {/* Render all pergola components with null checks */}
      {model.meshes && model.meshes.map((mesh) => (
        <Mesh3DComponent key={mesh.id} mesh={mesh} />
      ))}
      
      {/* Enhanced reference axes at origin */}
      <group position={[bounds.min.x, bounds.min.y, 0]}>
        {/* X axis - Red */}
        <mesh position={[30, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1, 1, 60]} />
          <meshBasicMaterial color="#ff4444" />
        </mesh>
        {/* Y axis - Green */}
        <mesh position={[0, 30, 0]}>
          <cylinderGeometry args={[1, 1, 60]} />
          <meshBasicMaterial color="#44ff44" />
        </mesh>
        {/* Z axis - Blue */}
        <mesh position={[0, 0, 30]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1, 1, 60]} />
          <meshBasicMaterial color="#4444ff" />
        </mesh>
      </group>
    </>
  );
};

export const Model3DViewer = ({ model, width = 800, height = 600 }: Model3DViewerProps) => {
  if (!model || !model.meshes || model.meshes.length === 0) {
    return (
      <div 
        className="h-full w-full border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-500 relative overflow-hidden"
        style={{ minHeight: height || 400 }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, currentColor 20px, currentColor 21px)`
          }}></div>
        </div>
        
        {/* Content */}
        <div className="text-center z-10 p-8">
          <div className="text-4xl mb-4 animate-pulse">🏗️</div>
          <h3 className="text-lg font-semibold mb-2 text-gray-700">הדמיה תלת־ממדית מתקדמת</h3>
          <div className="text-gray-600 mb-4">יש לצייר מסגרת ולייצר מודל תחילה</div>
          <div className="text-sm text-gray-500 bg-white/50 rounded-lg p-3 border">
            <p className="mb-1">💡 שרטטו מסגרת פרגולה על הלוח</p>
            <p>הצגת המודל תעודכן אוטומטית</p>
          </div>
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
          עכבר: סיבוב חופשי 360° | גלגל: זום | ימני+גרירה: הזזה | סיבוב מלא לכל כיוון
        </p>
      </div>
      
      <div style={{ width, height }} className="w-full">
        <Canvas
          shadows
          camera={{ position: [100, 100, 100], fov: 45 }}
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
