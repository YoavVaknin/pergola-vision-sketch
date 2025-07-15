import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment, Html } from '@react-three/drei';
import { Model3D, Mesh3D } from '@/utils/3dModelGenerator';
import * as THREE from 'three';
import { Suspense, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Eye, EyeOff } from 'lucide-react';

interface Model3DViewerProps {
  model: Model3D | null;
  width?: number;
  height?: number;
}

// Simple mesh component without interaction
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

  // Simple materials for different components
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
    <mesh 
      position={threePosition} 
      rotation={threeRotation} 
      castShadow 
      receiveShadow
    >
      {createGeometry()}
      <meshStandardMaterial {...getMaterialProps()} />
    </mesh>
  );
};


const Scene = ({
  model,
  showAxes
}: {
  model: Model3D;
  showAxes: boolean;
}) => {
  if (!model || !model.boundingBox || !model.metadata || !model.metadata.dimensions) {
    console.warn('Invalid model data:', model);
    return null;
  }

  const bounds = model.boundingBox;
  const dimensions = model.metadata.dimensions;
  const maxDimension = Math.max(dimensions.width, dimensions.depth, dimensions.height);
  
  // Calculate pergola center for focusing
  const pergolaCenter = {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
    z: (bounds.min.z + bounds.max.z) / 2
  };

  return (
    <Suspense fallback={<mesh><boxGeometry /><meshBasicMaterial /></mesh>}>
      {/* Simple camera setup */}
      <PerspectiveCamera 
        makeDefault 
        position={[maxDimension, maxDimension, maxDimension]} 
        fov={45} 
        near={1} 
        far={5000}
      />
      
      {/* Basic orbit controls without restrictions */}
      <OrbitControls 
        target={[pergolaCenter.x, pergolaCenter.y, pergolaCenter.z]}
        enableDamping 
        dampingFactor={0.1}
        enableZoom 
        enablePan 
        enableRotate={true}
        minDistance={maxDimension * 0.3}
        maxDistance={maxDimension * 4}
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
      
      {/* Render all pergola components */}
      {model.meshes && model.meshes.map(mesh => (
        <Mesh3DComponent 
          key={mesh.id} 
          mesh={mesh} 
        />
      ))}
      
      {/* Dimension labels overlays */}
      {/* Width dimension (X axis) */}
      <Html
        position={[pergolaCenter.x, bounds.min.y - 30, pergolaCenter.z]}
        center
        distanceFactor={maxDimension * 0.3}
        occlude={false}
        transform={false}
        sprite
      >
        <div className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-xl border-4 shadow-2xl text-center border-blue-300">
          <div className="text-lg font-bold text-gray-800">רוחב</div>
          <div className="text-3xl font-black text-blue-600">{dimensions.width.toFixed(0)} ס"מ</div>
        </div>
      </Html>
      
      {/* Depth dimension (Y axis) */}
      <Html
        position={[bounds.min.x - 30, pergolaCenter.y, pergolaCenter.z]}
        center
        distanceFactor={maxDimension * 0.3}
        occlude={false}
        transform={false}
        sprite
      >
        <div className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-xl border-4 shadow-2xl text-center border-green-300">
          <div className="text-lg font-bold text-gray-800">עומק</div>
          <div className="text-3xl font-black text-green-600">{dimensions.depth.toFixed(0)} ס"מ</div>
        </div>
      </Html>
      
      {/* Height dimension (Z axis) */}
      <Html
        position={[bounds.max.x + 30, pergolaCenter.y, pergolaCenter.z]}
        center
        distanceFactor={maxDimension * 0.3}
        occlude={false}
        transform={false}
        sprite
      >
        <div className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-xl border-4 shadow-2xl text-center border-purple-300">
          <div className="text-lg font-bold text-gray-800">גובה</div>
          <div className="text-3xl font-black text-purple-600">{dimensions.height.toFixed(0)} ס"מ</div>
        </div>
      </Html>
      
      {/* Reference axes at origin (0,0,0) */}
      {showAxes && (
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
      )}
    </Suspense>
  );
};

export const Model3DViewer = ({
  model,
  width = 800,
  height = 600
}: Model3DViewerProps) => {
  const [showAxes, setShowAxes] = useState(true);
  

  


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
      {/* Header with controls */}
      <div className="bg-gray-50 px-3 py-2 border-b flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700">הדמיה תלת-ממדית - פרגולה</h4>
          <p className="text-xs text-gray-500">הדמיה אינטראקטיבית</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAxes(!showAxes)}
          >
            {showAxes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* 3D Canvas */}
      <div style={{ width, height }} className="w-full">
        <Canvas
          shadows
          camera={{ position: [100, 100, 100], fov: 40 }}
          style={{ background: '#ffffff' }}
          gl={{ antialias: true, alpha: false }}
          onCreated={(state) => {
            state.scene.background = new THREE.Color('#ffffff');
          }}
        >
          <Scene 
            model={model}
            showAxes={showAxes}
          />
        </Canvas>
      </div>
      
      {/* Footer */}
      <div className="bg-gray-50 px-3 py-2 border-t text-xs text-gray-600">
        רכיבי פרגולה: {model.meshes.filter(m => m.type === 'frame_beam').length} קורות מסגרת | 
        {model.meshes.filter(m => m.type === 'shading_slat').length} רצועות הצללה | 
        {model.meshes.filter(m => m.type === 'column').length} עמודים |
        מימדים: {model.metadata?.dimensions ? `${model.metadata.dimensions.width.toFixed(0)}×${model.metadata.dimensions.depth.toFixed(0)}×${model.metadata.dimensions.height.toFixed(0)} ס"מ` : 'לא זמין'}
      </div>
    </div>
  );
};