import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment, Html } from '@react-three/drei';
import { Model3D, Mesh3D } from '@/utils/3dModelGenerator';
import * as THREE from 'three';
import { Suspense, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Edit3, Info, MessageSquare, Eye, EyeOff } from 'lucide-react';

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
        enableRotate={editMode ? false : true} // Disable rotation in edit mode
        maxPolarAngle={Math.PI * 0.95}
        minPolarAngle={0.05}
        minDistance={maxDimension * 0.3}
        maxDistance={maxDimension * 4}
        autoRotate={false}
        rotateSpeed={1.0}
        zoomSpeed={1.2}
        panSpeed={0.8}
        mouseButtons={{
          LEFT: editMode ? 2 : 0, // 0=rotate, 2=pan
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
  const [comment, setComment] = useState('');

  const selectedMeshData = selectedMesh ? model?.meshes.find(m => m.id === selectedMesh) : null;

  const handleSendComment = () => {
    if (!comment.trim()) return;
    
    const commentData = {
      timestamp: new Date().toISOString(),
      selectedMesh: selectedMesh,
      meshData: selectedMeshData,
      comment: comment.trim(),
      meshType: selectedMeshData?.type || 'unknown',
      meshId: selectedMeshData?.id || 'unknown'
    };
    
    console.log('🗨️ USER FEEDBACK:', commentData);
    console.log('📝 Comment Details:', {
      comment: comment.trim(),
      meshType: selectedMeshData?.type,
      meshId: selectedMeshData?.id,
      position: selectedMeshData?.position,
      dimensions: selectedMeshData?.geometry
    });
    
    // Clear comment after sending
    setComment('');
    
    // Show confirmation (you can add a toast here later)
    alert('ההערה נשלחה בהצלחה! אני אראה אותה בקונסול.');
  };

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

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">הערות והנחיות לשיפור:</label>
                <Textarea
                  placeholder="תאר מה צריך לתקן או לשפר ברכיב הנבחר..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={6}
                  className="text-sm"
                />
              </div>
              
              <Button 
                variant="default" 
                size="sm" 
                className="w-full"
                disabled={!comment.trim()}
                onClick={handleSendComment}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                שלח הערה
              </Button>
            </div>

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