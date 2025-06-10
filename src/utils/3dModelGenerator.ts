import { Point, PergolaElementType, FrameElement, ShadingElement, DivisionElement } from '@/types/pergola';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Mesh3D {
  id: string;
  type: 'frame_beam' | 'shading_slat' | 'division_beam' | 'column' | 'support';
  geometry: {
    type: 'box' | 'cylinder';
    width: number;
    height: number;
    depth: number;
    radius?: number;
  };
  position: Vector3D;
  rotation: Vector3D;
  color: string;
  material: {
    type: 'basic' | 'standard';
    roughness?: number;
    metalness?: number;
    opacity?: number;
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
    dimensions: {
      width: number;
      depth: number;
      height: number;
    };
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

// Generate proper pergola beams with realistic dimensions
const createPergolaBeam = (
  id: string,
  start: Point,
  end: Point,
  pixelsPerCm: number,
  height: number,
  beamWidth: number,
  beamHeight: number,
  color: string,
  type: 'frame_beam' | 'division_beam' = 'frame_beam'
): Mesh3D => {
  const beamLength = calculateBeamLength(start, end);
  const beamLengthCm = pixelToCm(beamLength, pixelsPerCm);
  
  const centerX = (start.x + end.x) / 2;
  const centerY = (start.y + end.y) / 2;
  
  return {
    id,
    type,
    geometry: {
      type: 'box',
      width: beamLengthCm,
      height: beamHeight,
      depth: beamWidth
    },
    position: {
      x: pixelToCm(centerX, pixelsPerCm),
      y: pixelToCm(centerY, pixelsPerCm),
      z: height + beamWidth / 2 // Position beam at the top
    },
    rotation: calculateBeamRotation(start, end),
    color,
    material: {
      type: 'standard',
      roughness: 0.6,
      metalness: 0.1
    }
  };
};

// Generate shading slats with proper spacing and dimensions
const createShadingSlats = (
  shading: ShadingElement,
  pixelsPerCm: number,
  frameHeight: number,
  id: string
): Mesh3D[] => {
  const slats: Mesh3D[] = [];
  const slatWidth = 8; // cm
  const slatThickness = 2; // cm
  const spacing = 15; // cm between slats
  
  const beamLength = calculateBeamLength(shading.start, shading.end);
  const beamLengthCm = pixelToCm(beamLength, pixelsPerCm);
  
  // Calculate perpendicular direction for slat placement
  const dx = shading.end.x - shading.start.x;
  const dy = shading.end.y - shading.start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / length;
  const perpY = dx / length;
  
  const numSlats = Math.floor(beamLengthCm / spacing);
  
  for (let i = 0; i < numSlats; i++) {
    const t = (i + 0.5) / numSlats;
    const slatCenterX = shading.start.x + t * dx;
    const slatCenterY = shading.start.y + t * dy;
    
    slats.push({
      id: `${id}_slat_${i}`,
      type: 'shading_slat',
      geometry: {
        type: 'box',
        width: slatWidth,
        height: slatThickness,
        depth: 100 // Length of the slat
      },
      position: {
        x: pixelToCm(slatCenterX, pixelsPerCm),
        y: pixelToCm(slatCenterY, pixelsPerCm),
        z: frameHeight - 5 // Position just below the frame
      },
      rotation: {
        x: 0,
        y: 0,
        z: Math.atan2(perpY, perpX) // Perpendicular to the shading beam
      },
      color: shading.color || '#8b4513',
      material: {
        type: 'standard',
        roughness: 0.8,
        metalness: 0.0
      }
    });
  }
  
  return slats;
};

// Generate support columns
const createSupportColumn = (
  position: Point,
  pixelsPerCm: number,
  height: number,
  id: string
): Mesh3D => {
  const columnSize = 15; // cm
  
  return {
    id,
    type: 'column',
    geometry: {
      type: 'box',
      width: columnSize,
      height: columnSize,
      depth: height
    },
    position: {
      x: pixelToCm(position.x, pixelsPerCm),
      y: pixelToCm(position.y, pixelsPerCm),
      z: height / 2 // Center vertically
    },
    rotation: { x: 0, y: 0, z: 0 },
    color: '#654321',
    material: {
      type: 'standard',
      roughness: 0.7,
      metalness: 0.2
    }
  };
};

export const generate3DModelFromDrawing = (drawingData: DrawingData): Model3D => {
  console.log('🚀 Starting enhanced 3D pergola generation with data:', drawingData);
  
  const { elements, pixelsPerCm, frameColor } = drawingData;
  const frameHeight = 250; // cm - pergola height
  const frameBeamWidth = 20; // cm - main beam cross-section
  const frameBeamHeight = 15; // cm
  const divisionBeamWidth = 15; // cm
  const divisionBeamHeight = 12; // cm
  
  const meshes: Mesh3D[] = [];
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  console.log(`📊 Processing ${elements.length} elements for pergola generation`);

  elements.forEach((element, index) => {
    console.log(`🔨 Processing element ${index}: ${element.type} (ID: ${element.id})`);
    
    switch (element.type) {
      case 'frame':
        const frame = element as FrameElement;
        console.log(`📐 Frame with ${frame.points.length} points:`, frame.points);
        
        // Create main structural beams for each segment
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
          
          // Create main structural beam
          const beam = createPergolaBeam(
            `${element.id}_beam_${i}`,
            start,
            end,
            pixelsPerCm,
            frameHeight,
            frameBeamWidth,
            frameBeamHeight,
            frameColor || '#2d4a2b',
            'frame_beam'
          );
          
          meshes.push(beam);
          
          // Add support columns at corners for closed frames
          if (frame.closed && i < 4) { // Limit to 4 corners max
            const column = createSupportColumn(
              start,
              pixelsPerCm,
              frameHeight,
              `${element.id}_column_${i}`
            );
            meshes.push(column);
          }
          
          console.log(`✅ Added frame beam segment ${i} with support structures`);
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
        
        const divisionBeam = createPergolaBeam(
          element.id,
          division.start,
          division.end,
          pixelsPerCm,
          frameHeight,
          divisionBeamWidth,
          divisionBeamHeight,
          division.color || '#f97316',
          'division_beam'
        );
        
        meshes.push(divisionBeam);
        console.log(`✅ Added division beam with proper dimensions`);
        break;
        
      case 'shading':
        const shading = element as ShadingElement;
        console.log(`🌴 Shading element from (${shading.start.x}, ${shading.start.y}) to (${shading.end.x}, ${shading.end.y})`);
        
        // Update bounding box
        minX = Math.min(minX, shading.start.x, shading.end.x);
        maxX = Math.max(maxX, shading.start.x, shading.end.x);
        minY = Math.min(minY, shading.start.y, shading.end.y);
        maxY = Math.max(maxY, shading.start.y, shading.end.y);
        
        // Create multiple shading slats instead of single beam
        const slats = createShadingSlats(shading, pixelsPerCm, frameHeight, element.id);
        meshes.push(...slats);
        
        console.log(`✅ Added ${slats.length} shading slats with proper spacing`);
        break;
    }
  });
  
  // Calculate realistic bounding box in 3D space
  const boundingBox = {
    min: {
      x: minX === Infinity ? 0 : pixelToCm(minX, pixelsPerCm) - frameBeamWidth,
      y: minY === Infinity ? 0 : pixelToCm(minY, pixelsPerCm) - frameBeamWidth,
      z: 0
    },
    max: {
      x: maxX === -Infinity ? 100 : pixelToCm(maxX, pixelsPerCm) + frameBeamWidth,
      y: maxY === -Infinity ? 100 : pixelToCm(maxY, pixelsPerCm) + frameBeamWidth,
      z: frameHeight + frameBeamHeight
    }
  };
  
  const dimensions = {
    width: boundingBox.max.x - boundingBox.min.x,
    depth: boundingBox.max.y - boundingBox.min.y,
    height: boundingBox.max.z - boundingBox.min.z
  };
  
  const model: Model3D = {
    meshes,
    boundingBox,
    metadata: {
      frameHeight,
      scale: pixelsPerCm,
      elementCount: elements.length,
      generatedAt: new Date().toISOString(),
      dimensions
    }
  };
  
  console.log('🎉 Enhanced 3D Pergola Model generated successfully!');
  console.log(`📈 Statistics:`, {
    totalMeshes: meshes.length,
    frameBeams: meshes.filter(m => m.type === 'frame_beam').length,
    divisionBeams: meshes.filter(m => m.type === 'division_beam').length,
    shadingSlats: meshes.filter(m => m.type === 'shading_slat').length,
    columns: meshes.filter(m => m.type === 'column').length,
    dimensions
  });
  
  return model;
};

// Enhanced function to render model from JSON data
export const renderModelFromJSON = (jsonData: string): Model3D => {
  try {
    const model = JSON.parse(jsonData) as Model3D;
    console.log('📝 Rendering model from JSON:', model.metadata);
    return model;
  } catch (error) {
    console.error('❌ Error parsing JSON model:', error);
    throw new Error('Invalid JSON model data');
  }
};

// Helper function to export model as JSON
export const exportModelAsJSON = (model: Model3D): string => {
  return JSON.stringify(model, null, 2);
};

// Helper function to get model statistics
export const getModelStatistics = (model: Model3D) => {
  const frameBeams = model.meshes.filter(m => m.type === 'frame_beam');
  const divisionBeams = model.meshes.filter(m => m.type === 'division_beam');
  const shadingSlats = model.meshes.filter(m => m.type === 'shading_slat');
  const columns = model.meshes.filter(m => m.type === 'column');
  
  return {
    meshCounts: {
      frameBeams: frameBeams.length,
      divisionBeams: divisionBeams.length,
      shadingSlats: shadingSlats.length,
      columns: columns.length,
      total: model.meshes.length
    },
    dimensions: model.metadata.dimensions,
    volume: model.metadata.dimensions.width * model.metadata.dimensions.depth * model.metadata.dimensions.height,
    generatedAt: model.metadata.generatedAt
  };
};
