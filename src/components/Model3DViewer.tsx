import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment } from '@react-three/drei';
import { Model3D, Mesh3D } from '@/utils/3dModelGenerator';
import * as THREE from 'three';
import { Suspense, useState } from 'react';
import { ClickableFeedbackPanel, FeedbackSummary } from '@/components/ClickableFeedbackPanel';
import { Button } from '@/components/ui/button';
import { MessageCircle, Settings, List, Target } from 'lucide-react';

interface Model3DViewerProps {
  model: Model3D | null;
  width?: number;
  height?: number;
}

// Enhanced clickable mesh component
const ClickableMesh3DComponent = ({
  mesh,
  isSelected,
  hasComment,
  onMeshClick,
  onMeshHover,
  onMeshLeave
}: {
  mesh: Mesh3D;
  isSelected: boolean;
  hasComment: boolean;
  onMeshClick: (mesh: Mesh3D) => void;
  onMeshHover: (mesh: Mesh3D) => void;
  onMeshLeave: () => void;
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

  // Improved materials for different components with interaction states
  const getMaterialProps = () => {
    const baseColor = new THREE.Color(color);
    
    // Modify color based on state
    let finalColor = baseColor;
    if (isSelected) {
      finalColor = new THREE.Color('#ff6b6b'); // Red for selected
    } else if (hasComment) {
      finalColor = new THREE.Color('#4ecdc4'); // Teal for commented
    }
    
    switch (type) {
      case 'frame_beam':
        return {
          color: finalColor,
          roughness: 0.2,
          metalness: 0.8,
          envMapIntensity: 1.0,
          transparent: isSelected,
          opacity: isSelected ? 0.8 : 1.0
        };
      case 'column':
        return {
          color: finalColor,
          roughness: 0.3,
          metalness: 0.7,
          envMapIntensity: 0.8,
          transparent: isSelected,
          opacity: isSelected ? 0.8 : 1.0
        };
      case 'shading_slat':
        return {
          color: finalColor.multiplyScalar(0.9),
          roughness: 0.7,
          metalness: 0.1,
          envMapIntensity: 0.4,
          transparent: isSelected,
          opacity: isSelected ? 0.8 : 1.0
        };
      default:
        return {
          color: finalColor,
          roughness: 0.5,
          metalness: 0.3,
          envMapIntensity: 0.6,
          transparent: isSelected,
          opacity: isSelected ? 0.8 : 1.0
        };
    }
  };
  
  return (
    <mesh 
      position={threePosition} 
      rotation={threeRotation} 
      castShadow 
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        onMeshClick(mesh);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onMeshHover(mesh);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'default';
        onMeshLeave();
      }}
    >
      {createGeometry()}
      <meshStandardMaterial {...getMaterialProps()} />
    </mesh>
  );
};

const Scene = ({
  model,
  selectedMesh,
  comments,
  onMeshClick,
  onMeshHover,
  onMeshLeave
}: {
  model: Model3D;
  selectedMesh: Mesh3D | null;
  comments: Record<string, string>;
  onMeshClick: (mesh: Mesh3D) => void;
  onMeshHover: (mesh: Mesh3D) => void;
  onMeshLeave: () => void;
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
      
      {/* Render all clickable pergola components */}
      {model.meshes && model.meshes.map(mesh => (
        <ClickableMesh3DComponent 
          key={mesh.id} 
          mesh={mesh}
          isSelected={selectedMesh?.id === mesh.id}
          hasComment={!!comments[mesh.id]}
          onMeshClick={onMeshClick}
          onMeshHover={onMeshHover}
          onMeshLeave={onMeshLeave}
        />
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
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const [selectedMesh, setSelectedMesh] = useState<Mesh3D | null>(null);
  const [hoveredMesh, setHoveredMesh] = useState<Mesh3D | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [feedbackPanelOpen, setFeedbackPanelOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  if (!model || !model.meshes || model.meshes.length === 0) {
    return;
  }

  const handleMeshClick = (mesh: Mesh3D) => {
    if (!feedbackEnabled) return;
    setSelectedMesh(mesh);
    setFeedbackPanelOpen(true);
  };

  const handleMeshHover = (mesh: Mesh3D) => {
    if (!feedbackEnabled) return;
    setHoveredMesh(mesh);
  };

  const handleMeshLeave = () => {
    setHoveredMesh(null);
  };

  const handleCommentSubmit = (meshId: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [meshId]: comment
    }));
    console.log('💬 Comment added:', { meshId, comment });
  };

  const getMeshTypeName = (type: string) => {
    switch (type) {
      case 'frame_beam': return 'קורת מסגרת';
      case 'shading_slat': return 'רצועת הצללה';
      case 'column': return 'עמוד';
      case 'division_beam': return 'קורת חלוקה';
      default: return 'רכיב';
    }
  };

  console.log('🎬 Rendering clickable 3D pergola model with', model.meshes.length, 'components');
  
  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm w-full">
        <div className="bg-gray-50 px-3 py-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700">הדמיה תלת-ממדית - פרגולה (לחץ על רכיבים)</h4>
              <p className="text-xs text-gray-500">
                {feedbackEnabled ? 'לחץ על רכיבים בהדמיה להוספת הערות ספציפיות' : 'פאנל שיפור הדמיה מושבת'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {feedbackEnabled && Object.keys(comments).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSummaryOpen(true)}
                  className="flex items-center gap-1"
                >
                  <List className="w-4 h-4" />
                  הערות ({Object.keys(comments).length})
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFeedbackEnabled(!feedbackEnabled)}
                className="flex items-center gap-1"
                title={feedbackEnabled ? "כבה פאנל שיפור הדמיה" : "הפעל פאנל שיפור הדמיה"}
              >
                <Settings className="w-4 h-4" />
                {feedbackEnabled ? "כבה" : "הפעל"}
              </Button>
            </div>
          </div>
        </div>
        
        <div style={{ width, height }} className="w-full relative">
          <Canvas
            shadows
            camera={{ position: [100, 100, 100], fov: 40 }}
            style={{ background: 'linear-gradient(to bottom, #87ceeb, #f0f8ff)' }}
          >
            <Scene 
              model={model} 
              selectedMesh={selectedMesh}
              comments={comments}
              onMeshClick={handleMeshClick}
              onMeshHover={handleMeshHover}
              onMeshLeave={handleMeshLeave}
            />
          </Canvas>
          
          {/* Hover info */}
          {feedbackEnabled && hoveredMesh && (
            <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-2 rounded text-sm z-10">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>{getMeshTypeName(hoveredMesh.type)}</span>
              </div>
              <p className="text-xs opacity-75">לחץ להוספת הערה</p>
            </div>
          )}
          
          {/* Instructions */}
          {feedbackEnabled && (
            <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-2 rounded shadow-lg text-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>נבחר</span>
                <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                <span>עם הערה</span>
              </div>
              <p className="text-xs text-gray-600">לחץ על רכיבים להוספת הערות</p>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 px-3 py-2 border-t">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              רכיבי פרגולה: {model.meshes.filter(m => m.type === 'frame_beam').length} קורות מסגרת | 
              {model.meshes.filter(m => m.type === 'shading_slat').length} רצועות הצללה | 
              {model.meshes.filter(m => m.type === 'column').length} עמודים |
              מימדים: {model.metadata?.dimensions ? `${model.metadata.dimensions.width.toFixed(0)}×${model.metadata.dimensions.depth.toFixed(0)}×${model.metadata.dimensions.height.toFixed(0)} ס"מ` : 'לא זמין'}
            </div>
            {feedbackEnabled && (
              <div className="text-xs text-green-600 flex items-center gap-1">
                <Target className="w-3 h-3" />
                פאנל שיפור הדמיה מופעל
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clickable Feedback Panel */}
      {feedbackEnabled && (
        <ClickableFeedbackPanel
          selectedMesh={selectedMesh}
          isOpen={feedbackPanelOpen}
          onClose={() => {
            setFeedbackPanelOpen(false);
            setSelectedMesh(null);
          }}
          onSubmitComment={handleCommentSubmit}
          existingComments={comments}
        />
      )}

      {/* Feedback Summary */}
      {feedbackEnabled && (
        <FeedbackSummary
          comments={comments}
          meshes={model.meshes}
          isOpen={summaryOpen}
          onClose={() => setSummaryOpen(false)}
        />
      )}
    </>
  );
};