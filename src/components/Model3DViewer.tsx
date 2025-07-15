import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment, Html } from '@react-three/drei';
import { Model3D, Mesh3D } from '@/utils/3dModelGenerator';
import * as THREE from 'three';
import { Suspense, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Edit3, Eye, EyeOff } from 'lucide-react';

interface Model3DViewerProps {
  model: Model3D | null;
  width?: number;
  height?: number;
}

// Interactive mesh component with selection capability
const InteractiveMesh3DComponent = ({
  mesh,
  isSelected,
  onSelect,
  editMode
}: {
  mesh: Mesh3D;
  isSelected: boolean;
  onSelect: (meshId: string) => void;
  editMode: boolean;
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
    
    // Apply selection highlight
    if (isSelected) {
      return {
        color: new THREE.Color('#ffff00'), // Yellow highlight
        roughness: 0.1,
        metalness: 0.9,
        envMapIntensity: 2.0,
        emissive: new THREE.Color('#333300')
      };
    }
    
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

  const handleClick = (e: any) => {
    if (editMode) {
      e.stopPropagation();
      onSelect(mesh.id);
    }
  };
  
  return (
    <mesh 
      position={threePosition} 
      rotation={threeRotation} 
      castShadow 
      receiveShadow
      onClick={handleClick}
      onPointerEnter={(e) => editMode && (e.object.userData.hovered = true)}
      onPointerLeave={(e) => editMode && (e.object.userData.hovered = false)}
    >
      {createGeometry()}
      <meshStandardMaterial {...getMaterialProps()} />
      
      {/* Show info label when selected */}
      {isSelected && (
        <Html position={[0, 0, geometry.height / 2 + 10]}>
          <div className="bg-black text-white px-2 py-1 rounded text-xs pointer-events-none">
            {type}: {mesh.id}
          </div>
        </Html>
      )}
    </mesh>
  );
};


const Scene = ({
  model,
  editMode,
  selectedMesh,
  onMeshSelect,
  showAxes
}: {
  model: Model3D;
  editMode: boolean;
  selectedMesh: string | null;
  onMeshSelect: (meshId: string) => void;
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
        <InteractiveMesh3DComponent 
          key={mesh.id} 
          mesh={mesh} 
          isSelected={selectedMesh === mesh.id}
          onSelect={onMeshSelect}
          editMode={editMode}
        />
      ))}
      
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
  const [editMode, setEditMode] = useState(false);
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null);
  const [showAxes, setShowAxes] = useState(true);
  

  const selectedMeshData = selectedMesh ? model?.meshes.find(m => m.id === selectedMesh) : null;


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
          <p className="text-xs text-gray-500">
            {editMode ? 'מצב עריכה - לחץ על רכיבים לבחירתם' : 'הדמיה אינטראקטיבית'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setEditMode(!editMode);
              setSelectedMesh(null);
            }}
          >
            <Edit3 className="w-4 h-4 mr-1" />
            {editMode ? 'סיים עריכה' : 'מצב עריכה'}
          </Button>
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
      
      <div className="flex">
        {/* 3D Canvas */}
        <div style={{ width: editMode ? width - 300 : width, height }} className="flex-1">
          <Canvas
            shadows
            camera={{ position: [100, 100, 100], fov: 40 }}
            style={{ background: 'linear-gradient(to bottom, #87ceeb, #f0f8ff)' }}
          >
            <Scene 
              model={model}
              editMode={editMode}
              selectedMesh={selectedMesh}
              onMeshSelect={setSelectedMesh}
              showAxes={showAxes}
            />
          </Canvas>
        </div>
        
        {/* Side panel in edit mode */}
        {editMode && (
          <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
            <h5 className="font-medium mb-3">כלי עריכה</h5>
            
            {selectedMeshData ? (
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">רכיב נבחר</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedMeshData.type}</Badge>
                    <span className="text-xs text-gray-600">{selectedMeshData.id}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    מיקום: X:{selectedMeshData.position.x.toFixed(1)}, Y:{selectedMeshData.position.y.toFixed(1)}, Z:{selectedMeshData.position.z.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">
                    מימדים: {selectedMeshData.geometry.width.toFixed(1)} × {selectedMeshData.geometry.height.toFixed(1)} × {selectedMeshData.geometry.depth.toFixed(1)} ס"מ
                  </div>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-gray-500 mb-4">לחץ על רכיב כדי לבחור אותו</p>
            )}


            <div className="mt-4 pt-4 border-t">
              <h6 className="text-sm font-medium mb-2">מידע על המודל</h6>
              <div className="space-y-1 text-xs text-gray-600">
                <div>קורות מסגרת: {model.meshes.filter(m => m.type === 'frame_beam').length}</div>
                <div>רצועות הצללה: {model.meshes.filter(m => m.type === 'shading_slat').length}</div>
                <div>עמודים: {model.meshes.filter(m => m.type === 'column').length}</div>
                <div>סה"כ רכיבים: {model.meshes.length}</div>
              </div>
            </div>
          </div>
        )}
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