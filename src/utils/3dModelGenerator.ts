
import { Point, PergolaElementType, FrameElement, ShadingElement, DivisionElement } from '@/types/pergola';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Mesh3D {
  id: string;
  type: 'beam' | 'panel';
  geometry: {
    type: 'box' | 'plane';
    width: number;
    height: number;
    depth: number;
  };
  position: Vector3D;
  rotation: Vector3D;
  color: string;
  material: {
    type: 'basic' | 'standard';
    roughness?: number;
    metalness?: number;
  };
}

export interface Model3D {
  meshes: Mesh3D[];
  boundingBox: {
    min: Vector3D;
    max: Vector3D;
  };
  metadata: {
    frameHeight: number;
    scale: number;
    elementCount: number;
    generatedAt: string;
  };
}

export interface DrawingData {
  elements: PergolaElementType[];
  pixelsPerCm: number;
  frameColor: string;
}

// Convert pixel coordinates to real-world coordinates (cm)
const pixelToCm = (pixelValue: number, pixelsPerCm: number): number => {
  return pixelValue / pixelsPerCm;
};

// Calculate beam rotation based on start and end points
const calculateBeamRotation = (start: Point, end: Point): Vector3D => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  
  // Calculate rotation around Z axis (in radians)
  const rotationZ = Math.atan2(dy, dx);
  
  return {
    x: 0,
    y: 0,
    z: rotationZ
  };
};

// Calculate beam length in pixels
const calculateBeamLength = (start: Point, end: Point): number => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const generate3DModelFromDrawing = (drawingData: DrawingData): Model3D => {
  console.log('🚀 Starting 3D model generation with data:', drawingData);
  
  const { elements, pixelsPerCm, frameColor } = drawingData;
  const frameHeight = 250; // cm - default pergola height
  const frameDepth = 15; // cm - beam cross-section depth
  const divisionDepth = 12; // cm
  const shadingDepth = 3; // cm
  
  const meshes: Mesh3D[] = [];
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  console.log(`📊 Processing ${elements.length} elements`);

  elements.forEach((element, index) => {
    console.log(`🔨 Processing element ${index}: ${element.type} (ID: ${element.id})`);
    
    switch (element.type) {
      case 'frame':
        const frame = element as FrameElement;
        console.log(`📐 Frame with ${frame.points.length} points:`, frame.points);
        
        // Create beam for each segment of the frame
        for (let i = 0; i < frame.points.length; i++) {
          const nextIndex = frame.closed ? (i + 1) % frame.points.length : i + 1;
          if (!frame.closed && nextIndex >= frame.points.length) break;
          
          const start = frame.points[i];
          const end = frame.points[nextIndex];
          
          // Update bounding box
          minX = Math.min(minX, start.x, end.x);
          maxX = Math.max(maxX, start.x, end.x);
          minY = Math.min(minY, start.y, end.y);
          maxY = Math.max(maxY, start.y, end.y);
          
          const beamLength = calculateBeamLength(start, end);
          const beamLengthCm = pixelToCm(beamLength, pixelsPerCm);
          
          // Calculate center position of the beam
          const centerX = (start.x + end.x) / 2;
          const centerY = (start.y + end.y) / 2;
          
          const mesh: Mesh3D = {
            id: `${element.id}_segment_${i}`,
            type: 'beam',
            geometry: {
              type: 'box',
              width: beamLengthCm,
              height: frameDepth,
              depth: frameHeight
            },
            position: {
              x: pixelToCm(centerX, pixelsPerCm),
              y: pixelToCm(centerY, pixelsPerCm),
              z: frameHeight / 2 // Center the beam vertically
            },
            rotation: calculateBeamRotation(start, end),
            color: frameColor || '#1f2937',
            material: {
              type: 'standard',
              roughness: 0.7,
              metalness: 0.1
            }
          };
          
          meshes.push(mesh);
          console.log(`✅ Added frame beam segment ${i}:`, {
            length: beamLengthCm.toFixed(1),
            position: mesh.position,
            rotation: mesh.rotation
          });
        }
        break;
        
      case 'division':
        const division = element as DivisionElement;
        console.log(`🔗 Division beam from (${division.start.x}, ${division.start.y}) to (${division.end.x}, ${division.end.y})`);
        
        // Update bounding box
        minX = Math.min(minX, division.start.x, division.end.x);
        maxX = Math.max(maxX, division.start.x, division.end.x);
        minY = Math.min(minY, division.start.y, division.end.y);
        maxY = Math.max(maxY, division.start.y, division.end.y);
        
        const divisionLength = calculateBeamLength(division.start, division.end);
        const divisionLengthCm = pixelToCm(divisionLength, pixelsPerCm);
        
        const divisionCenterX = (division.start.x + division.end.x) / 2;
        const divisionCenterY = (division.start.y + division.end.y) / 2;
        
        const divisionMesh: Mesh3D = {
          id: element.id,
          type: 'beam',
          geometry: {
            type: 'box',
            width: divisionLengthCm,
            height: divisionDepth,
            depth: frameHeight
          },
          position: {
            x: pixelToCm(divisionCenterX, pixelsPerCm),
            y: pixelToCm(divisionCenterY, pixelsPerCm),
            z: frameHeight / 2
          },
          rotation: calculateBeamRotation(division.start, division.end),
          color: division.color || '#f97316',
          material: {
            type: 'standard',
            roughness: 0.6,
            metalness: 0.2
          }
        };
        
        meshes.push(divisionMesh);
        console.log(`✅ Added division beam:`, {
          length: divisionLengthCm.toFixed(1),
          position: divisionMesh.position
        });
        break;
        
      case 'shading':
        const shading = element as ShadingElement;
        console.log(`🌴 Shading element from (${shading.start.x}, ${shading.start.y}) to (${shading.end.x}, ${shading.end.y})`);
        
        // Update bounding box
        minX = Math.min(minX, shading.start.x, shading.end.x);
        maxX = Math.max(maxX, shading.start.x, shading.end.x);
        minY = Math.min(minY, shading.start.y, shading.end.y);
        maxY = Math.max(maxY, shading.start.y, shading.end.y);
        
        const shadingLength = calculateBeamLength(shading.start, shading.end);
        const shadingLengthCm = pixelToCm(shadingLength, pixelsPerCm);
        
        const shadingCenterX = (shading.start.x + shading.end.x) / 2;
        const shadingCenterY = (shading.start.y + shading.end.y) / 2;
        
        // Create thin shading slat
        const shadingMesh: Mesh3D = {
          id: element.id,
          type: 'beam',
          geometry: {
            type: 'box',
            width: shadingLengthCm,
            height: shadingDepth,
            depth: 20 // Thin shading slat
          },
          position: {
            x: pixelToCm(shadingCenterX, pixelsPerCm),
            y: pixelToCm(shadingCenterY, pixelsPerCm),
            z: frameHeight - 10 // Position near the top
          },
          rotation: calculateBeamRotation(shading.start, shading.end),
          color: shading.color || '#8b4513',
          material: {
            type: 'standard',
            roughness: 0.8,
            metalness: 0.0
          }
        };
        
        meshes.push(shadingMesh);
        console.log(`✅ Added shading slat:`, {
          length: shadingLengthCm.toFixed(1),
          position: shadingMesh.position
        });
        break;
    }
  });
  
  // Calculate bounding box in 3D space
  const boundingBox = {
    min: {
      x: minX === Infinity ? 0 : pixelToCm(minX, pixelsPerCm),
      y: minY === Infinity ? 0 : pixelToCm(minY, pixelsPerCm),
      z: 0
    },
    max: {
      x: maxX === -Infinity ? 100 : pixelToCm(maxX, pixelsPerCm),
      y: maxY === -Infinity ? 100 : pixelToCm(maxY, pixelsPerCm),
      z: frameHeight
    }
  };
  
  const model: Model3D = {
    meshes,
    boundingBox,
    metadata: {
      frameHeight,
      scale: pixelsPerCm,
      elementCount: elements.length,
      generatedAt: new Date().toISOString()
    }
  };
  
  console.log('🎉 3D Model generated successfully!');
  console.log(`📈 Statistics:`, {
    totalMeshes: meshes.length,
    boundingBox,
    dimensions: {
      width: boundingBox.max.x - boundingBox.min.x,
      depth: boundingBox.max.y - boundingBox.min.y,
      height: boundingBox.max.z - boundingBox.min.z
    }
  });
  
  return model;
};

// Helper function to export model as JSON
export const exportModelAsJSON = (model: Model3D): string => {
  return JSON.stringify(model, null, 2);
};

// Helper function to get model statistics
export const getModelStatistics = (model: Model3D) => {
  const frameMeshes = model.meshes.filter(m => m.color === '#1f2937' || m.color.includes('gray'));
  const divisionMeshes = model.meshes.filter(m => m.color === '#f97316' || m.color.includes('orange'));
  const shadingMeshes = model.meshes.filter(m => m.color === '#8b4513' || m.color.includes('brown'));
  
  const dimensions = {
    width: model.boundingBox.max.x - model.boundingBox.min.x,
    depth: model.boundingBox.max.y - model.boundingBox.min.y,
    height: model.boundingBox.max.z - model.boundingBox.min.z
  };
  
  return {
    meshCounts: {
      frame: frameMeshes.length,
      division: divisionMeshes.length,
      shading: shadingMeshes.length,
      total: model.meshes.length
    },
    dimensions,
    volume: dimensions.width * dimensions.depth * dimensions.height,
    generatedAt: model.metadata.generatedAt
  };
};
