import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment, Html } from '@react-three/drei';
import { Model3D, Mesh3D } from '@/utils/3dModelGenerator';
import * as THREE from 'three';
import { Suspense, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Edit3, Info, MessageSquare, Eye, EyeOff, Camera, Target } from 'lucide-react';

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

// Component to capture current camera position
const CameraCapture = ({ onCameraCapture }: { onCameraCapture: (data: any) => void }) => {
  const { camera, controls } = useThree();
  
  const handleCapture = () => {
    const cameraData = {
      position: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      },
      rotation: {
        x: camera.rotation.x,
        y: camera.rotation.y,
        z: camera.rotation.z
      },
      fov: (camera as any).fov || 50, // Default FOV if not available
      target: (controls as any)?.target ? {
        x: (controls as any).target.x,
        y: (controls as any).target.y,
        z: (controls as any).target.z
      } : { x: 0, y: 0, z: 0 },
      up: {
        x: camera.up.x,
        y: camera.up.y,
        z: camera.up.z
      },
      quaternion: {
        x: camera.quaternion.x,
        y: camera.quaternion.y,
        z: camera.quaternion.z,
        w: camera.quaternion.w
      }
    };
    
    onCameraCapture(cameraData);
  };

  return (
    <Html position={[0, 0, 0]} style={{ pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto' }}>
        <Button
          size="sm"
          onClick={handleCapture}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Camera className="w-4 h-4 mr-1" />
          תפוס זווית נוכחית
        </Button>
      </div>
    </Html>
  );
};

// Manual Camera Control - NO OrbitControls
const ManualCameraController = ({ editMode }: { editMode: boolean }) => {
  const { camera, gl } = useThree();
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [lastPointer, setLastPointer] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const canvas = gl.domElement;
    
    const onPointerDown = (e: PointerEvent) => {
      if (editMode) return;
      setIsPointerDown(true);
      setLastPointer({ x: e.clientX, y: e.clientY });
      canvas.setPointerCapture(e.pointerId);
    };
    
    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown || editMode) return;
      
      const deltaX = e.clientX - lastPointer.x;
      const deltaY = e.clientY - lastPointer.y;
      
      // Rotate camera around origin
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      
      spherical.theta -= deltaX * 0.01; // Horizontal rotation
      spherical.phi += deltaY * 0.01;   // Vertical rotation
      
      // NO LIMITS - complete freedom
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);
      
      setLastPointer({ x: e.clientX, y: e.clientY });
    };
    
    const onPointerUp = (e: PointerEvent) => {
      setIsPointerDown(false);
      canvas.releasePointerCapture(e.pointerId);
    };
    
    const onWheel = (e: WheelEvent) => {
      if (editMode) return;
      e.preventDefault();
      
      const direction = camera.position.clone().normalize();
      const distance = camera.position.length();
      const newDistance = Math.max(10, Math.min(1000, distance + e.deltaY * 0.1));
      
      camera.position.copy(direction.multiplyScalar(newDistance));
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
  }, [camera, gl, isPointerDown, lastPointer, editMode]);
  
  return null;
};


const Scene = ({
  model,
  editMode,
  selectedMesh,
  onMeshSelect,
  showAxes,
  onCameraCapture
}: {
  model: Model3D;
  editMode: boolean;
  selectedMesh: string | null;
  onMeshSelect: (meshId: string) => void;
  showAxes: boolean;
  onCameraCapture: (data: any) => void;
}) => {
  if (!model || !model.boundingBox || !model.metadata || !model.metadata.dimensions) {
    console.warn('Invalid model data:', model);
    return null;
  }

  // Simple pergola center calculation
  const bounds = model.boundingBox;
  const pergolaCenter: [number, number, number] = [
    (bounds.min.x + bounds.max.x) / 2,
    (bounds.min.y + bounds.max.y) / 2, 
    (bounds.min.z + bounds.max.z) / 2
  ];

  return (
    <Suspense fallback={<mesh><boxGeometry /><meshBasicMaterial /></mesh>}>
      {/* Lighting */}
      <Environment preset="city" environmentIntensity={0.6} />
      <ambientLight intensity={0.4} />
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
      
      {/* FRESH Manual Camera Control - Completely replacing OrbitControls */}
      <ManualCameraController editMode={editMode} />
      
      {/* Render pergola components */}
      {model.meshes && model.meshes.map(mesh => (
        <InteractiveMesh3DComponent 
          key={mesh.id} 
          mesh={mesh} 
          isSelected={selectedMesh === mesh.id}
          onSelect={onMeshSelect}
          editMode={editMode}
        />
      ))}
      
      {/* Reference axes at origin */}
      {showAxes && (
        <group position={[0, 0, 0]}>
          <mesh position={[25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[1, 1, 50]} />
            <meshStandardMaterial color="#ff0000" />
          </mesh>
          <mesh position={[0, 25, 0]}>
            <cylinderGeometry args={[1, 1, 50]} />
            <meshStandardMaterial color="#00ff00" />
          </mesh>
          <mesh position={[0, 0, 25]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1, 1, 50]} />
            <meshStandardMaterial color="#0000ff" />
          </mesh>
        </group>
      )}
      
      {/* Camera capture button - fresh render */}
      <CameraCapture onCameraCapture={onCameraCapture} />
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

  const handleCameraCapture = (cameraData: any) => {
    console.log('📸 CAMERA POSITION CAPTURED:', cameraData);
    console.log('📐 Camera Details:', {
      position: cameraData.position,
      rotation: cameraData.rotation,
      target: cameraData.target,
      fov: cameraData.fov,
      up: cameraData.up,
      quaternion: cameraData.quaternion
    });
    
    const viewDescription = {
      timestamp: new Date().toISOString(),
      message: 'הזווית הנוכחית של המצלמה',
      position: cameraData.position,
      rotation: cameraData.rotation,
      target: cameraData.target,
      fov: cameraData.fov,
      analysis: {
        lookingFrom: `נקודת הצפייה: X=${cameraData.position.x.toFixed(1)}, Y=${cameraData.position.y.toFixed(1)}, Z=${cameraData.position.z.toFixed(1)}`,
        lookingAt: `מסתכל על: X=${cameraData.target.x.toFixed(1)}, Y=${cameraData.target.y.toFixed(1)}, Z=${cameraData.target.z.toFixed(1)}`,
        orientation: `כיוון: ${cameraData.position.z > 0 ? 'מלמעלה' : 'מלמטה'}, ${cameraData.position.y < 0 ? 'מאחור' : 'מלפנים'}, ${cameraData.position.x > 0 ? 'מימין' : 'משמאל'}`,
        fieldOfView: `זווית ראיה: ${cameraData.fov}°`
      }
    };
    
    console.log('🔍 VIEW ANALYSIS:', viewDescription);
    alert('זווית הראיה נתפסה! אני אראה את הנתונים בקונסול.');
  };

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
            camera={{ 
              position: [218, 517, 102], 
              fov: 45 
            }}
            style={{ background: 'linear-gradient(to bottom, #87ceeb, #f0f8ff)' }}
          >
            <Scene 
              model={model}
              editMode={editMode}
              selectedMesh={selectedMesh}
              onMeshSelect={setSelectedMesh}
              showAxes={showAxes}
              onCameraCapture={handleCameraCapture}
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