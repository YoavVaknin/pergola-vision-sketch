import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Grid, 
  PerspectiveCamera, 
  Environment,
  ContactShadows,
  Lightformer,
  AccumulativeShadows,
  RandomizedLight,
  useTexture,
  MeshReflectorMaterial,
  Sky
} from '@react-three/drei';
import { 
  EffectComposer, 
  Bloom, 
  ToneMapping, 
  SSAO,
  BrightnessContrast,
  HueSaturation
} from '@react-three/postprocessing';
import { Model3D, Mesh3D } from '@/utils/3dModelGenerator';
import * as THREE from 'three';
import { Suspense } from 'react';

interface Model3DViewerProps {
  model: Model3D | null;
  width?: number;
  height?: number;
}

// Enhanced mesh component with cinema-quality PBR materials
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
    material,
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

  // Cinema-quality PBR materials for different components
  const getMaterialProps = () => {
    const baseColor = new THREE.Color(color);
    
    switch (type) {
      case 'frame_beam':
        // Premium aluminum/steel frame - reflective with subtle scratches
        return {
          color: baseColor,
          roughness: 0.15,
          metalness: 0.9,
          envMapIntensity: 1.5,
          clearcoat: 0.3,
          clearcoatRoughness: 0.1
        };
      case 'column':
        // Brushed metal columns - directional texture
        return {
          color: baseColor,
          roughness: 0.25,
          metalness: 0.8,
          envMapIntensity: 1.2,
          clearcoat: 0.1,
          clearcoatRoughness: 0.3
        };
      case 'shading_slat':
        // Natural wood slats - warm and organic
        return {
          color: baseColor.multiplyScalar(0.8), // Slightly darker for realism
          roughness: 0.8,
          metalness: 0.0,
          envMapIntensity: 0.3,
          transparent: true,
          opacity: 0.95
        };
      default:
        return {
          color: baseColor,
          roughness: 0.4,
          metalness: 0.3,
          envMapIntensity: 1.0
        };
    }
  };
  
  return (
    <mesh position={threePosition} rotation={threeRotation} castShadow receiveShadow>
      {createGeometry()}
      <meshPhysicalMaterial {...getMaterialProps()} />
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
      {/* Cinema-grade camera positioning */}
      <PerspectiveCamera 
        makeDefault 
        position={[center.x + cameraDistance * 0.8, center.y + cameraDistance * 0.6, center.z + cameraDistance * 0.8]} 
        fov={35} 
        near={0.1} 
        far={10000}
      />
      
      {/* Professional orbit controls */}
      <OrbitControls 
        target={[center.x, center.y, center.z]} 
        enableDamping 
        dampingFactor={0.03}
        enableZoom 
        enablePan 
        enableRotate 
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
        minAzimuthAngle={-Infinity}
        maxAzimuthAngle={Infinity}
        minDistance={maxDimension * 0.3}
        maxDistance={maxDimension * 5}
        autoRotate={false}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        panSpeed={0.5}
      />
      
      {/* VRay-style HDRI environment lighting */}
      <Environment
        preset="city"
        environmentIntensity={0.8}
        backgroundIntensity={0.4}
        background={true}
      />
      
      {/* Additional architectural lighting */}
      <ambientLight intensity={0.2} />
      
      {/* Key light - sun simulation */}
      <directionalLight 
        position={[center.x + 500, center.y + 800, center.z + 300]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize-width={4096} 
        shadow-mapSize-height={4096} 
        shadow-camera-far={2000} 
        shadow-camera-left={-500} 
        shadow-camera-right={500} 
        shadow-camera-top={500} 
        shadow-camera-bottom={-500}
        shadow-bias={-0.0001}
      />
      
      {/* Cinema-quality soft shadows */}
      <AccumulativeShadows
        temporal
        frames={200}
        color="black"
        colorBlend={0.5}
        alphaTest={0.9}
        opacity={0.8}
        scale={dimensions.width * 3}
        position={[center.x, center.y, -2]}
      >
        <RandomizedLight
          amount={8}
          radius={dimensions.width * 0.5}
          ambient={0.5}
          intensity={1}
          position={[center.x, center.y + 400, center.z + 200]}
          bias={0.001}
        />
      </AccumulativeShadows>
      
      {/* Photorealistic ground plane */}
      <mesh 
        position={[center.x, center.y, -2]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[dimensions.width * 4, dimensions.depth * 4]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={2048}
          mixBlur={1}
          mixStrength={40}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#ffffff"
          metalness={0.0}
          mirror={0.0}
        />
      </mesh>
      
      {/* Professional grid system */}
      <Grid 
        position={[center.x, center.y, 0]} 
        args={[dimensions.width * 2, dimensions.depth * 2]} 
        cellSize={50} 
        cellThickness={0.3} 
        sectionSize={200} 
        sectionThickness={0.8} 
        sectionColor="#888888" 
        cellColor="#cccccc" 
        infiniteGrid={false} 
        fadeDistance={maxDimension * 3} 
        fadeStrength={0.7} 
      />
      
      {/* Render all pergola components */}
      {model.meshes && model.meshes.map(mesh => (
        <Mesh3DComponent key={mesh.id} mesh={mesh} />
      ))}
      
      {/* Professional reference axes */}
      <group position={[bounds.min.x, bounds.min.y, 0]}>
        <mesh position={[25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.8, 0.8, 50]} />
          <meshStandardMaterial color="#ff4444" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 25, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 50]} />
          <meshStandardMaterial color="#44ff44" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 25]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 50]} />
          <meshStandardMaterial color="#4444ff" roughness={0.2} metalness={0.8} />
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
        <h4 className="text-sm font-medium text-gray-700">הדמיה תלת-ממדית - פרגולה (VRay Style)</h4>
        <p className="text-xs text-gray-500">
          רנדרינג בסטנדרט VRay/Corona • תאורה HDRI • PBR Materials • צלליות רכות
        </p>
      </div>
      
      <div style={{ width, height }} className="w-full">
        <Canvas
          shadows
          camera={{ position: [100, 100, 100], fov: 35 }}
          style={{ background: 'transparent' }}
        >
          <Scene model={model} />
          
          {/* Post-processing effects for cinematic quality */}
          <EffectComposer>
            <Bloom
              intensity={0.3}
              luminanceThreshold={0.9}
              luminanceSmoothing={0.4}
              blendFunction={1}
            />
            <ToneMapping
              adaptive={true}
              resolution={256}
              whitePoint={4.0}
              middleGrey={0.6}
              minLuminance={0.01}
              averageLuminance={1.0}
              adaptationRate={2.0}
            />
            <SSAO
              blendFunction={1}
              samples={30}
              rings={4}
              distanceThreshold={1.0}
              distanceFalloff={0.0}
              rangeThreshold={0.5}
              rangeFalloff={0.1}
              luminanceInfluence={0.9}
              radius={20}
              bias={0.5}
            />
            <BrightnessContrast
              brightness={0.05}
              contrast={0.1}
            />
            <HueSaturation
              hue={0.0}
              saturation={0.1}
            />
          </EffectComposer>
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