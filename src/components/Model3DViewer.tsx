import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Model3D, Mesh3D } from '@/utils/3dModelGenerator';
import * as THREE from 'three';
import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Eye, EyeOff } from 'lucide-react';

interface Model3DViewerProps {
  model: Model3D | null;
  width?: number;
  height?: number;
}

// Simple mesh component for pergola parts
const Mesh3DComponent = ({ mesh }: { mesh: Mesh3D }) => {
  const { geometry, position, rotation, color, type } = mesh;

  if (!geometry || typeof geometry.width === 'undefined' || typeof geometry.height === 'undefined' || typeof geometry.depth === 'undefined') {
    console.warn('Invalid geometry data:', geometry);
    return null;
  }

  const threeRotation: [number, number, number] = [rotation.x, rotation.y, rotation.z];
  const threePosition: [number, number, number] = [position.x, position.y, position.z];

  // Create geometry
  const createGeometry = () => {
    return <boxGeometry args={[geometry.width, geometry.height, geometry.depth]} />;
  };

  // Material properties based on component type
  const getMaterialProps = () => {
    const baseColor = new THREE.Color(color);
    
    switch (type) {
      case 'frame_beam':
        return { color: baseColor, roughness: 0.2, metalness: 0.8 };
      case 'column':
        return { color: baseColor, roughness: 0.3, metalness: 0.7 };
      case 'shading_slat':
        return { color: baseColor.multiplyScalar(0.9), roughness: 0.7, metalness: 0.1 };
      default:
        return { color: baseColor, roughness: 0.5, metalness: 0.3 };
    }
  };

  return (
    <mesh position={threePosition} rotation={threeRotation} castShadow receiveShadow>
      {createGeometry()}
      <meshStandardMaterial {...getMaterialProps()} />
    </mesh>
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

  console.log('🎬 Rendering 3D pergola model with', model.meshes.length, 'components');
  
  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm w-full">
      {/* Header with controls */}
      <div className="bg-gray-50 px-3 py-2 border-b flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700">הדמיה תלת-ממדית - פרגולה</h4>
          <p className="text-xs text-gray-500">הדמיה אינטראקטיבית עם שליטה מלאה 360°</p>
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
      
      {/* 3D Canvas with clean implementation */}
      <div style={{ width, height }} className="w-full">
        <Canvas>
          {/* מצלמה עם מיקום ראשוני */}
          <PerspectiveCamera makeDefault position={[5, 5, 5]} />

          {/* תאורה */}
          <ambientLight />
          <pointLight position={[10, 10, 10]} />

          {/* הדמיית פרגולה */}
          <Suspense fallback={<mesh><boxGeometry /><meshBasicMaterial /></mesh>}>
            {model.meshes && model.meshes.map(mesh => (
              <Mesh3DComponent key={mesh.id} mesh={mesh} />
            ))}
          </Suspense>

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

          {/* שליטה מלאה – ללא מגבלות סיבוב */}
          <OrbitControls
            enableRotate={true}
            enableZoom={true}
            enablePan={true}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
            minAzimuthAngle={-Infinity}
            maxAzimuthAngle={Infinity}
            makeDefault
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