import { PergolaElementType, FrameElement, Point, ShadingConfig } from "@/types/pergola";

export interface Model3D {
  id: string;
  name: string;
  elements: Model3DElement[];
  meshes: Model3DElement[]; // Alias for backwards compatibility
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  metadata: {
    createdAt: Date;
    frameColor: string;
    shadingConfig: ShadingConfig;
    totalElements: number;
    dimensions: {
      width: number;
      height: number;
      depth: number;
    };
  };
}

export interface Model3DElement {
  id: string;
  type: 'frame_beam' | 'division_beam' | 'shading_slat';
  geometry: {
    type: 'box';
    width: number;  // X dimension
    height: number; // Z dimension (vertical)
    depth: number;  // Y dimension
  };
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  color: string;
  material: {
    type: 'standard';
    metalness: number;
    roughness: number;
  };
}

export interface ModelStatistics {
  totalBeams: number;
  totalLength: number;
  frameBeams: number;
  divisionBeams: number;
  shadingSlats: number;
  estimatedWeight: number;
  meshCounts: {
    frame_beam: number;
    division_beam: number;
    shading_slat: number;
    total: number;
  };
  dimensions: {
    width: number;
    height: number;
    depth: number;
    totalVolume: number;
  };
}

export interface Mesh3D extends Model3DElement {}

export interface DrawingData {
  elements: PergolaElementType[];
  pixelsPerCm: number;
  frameColor: string;
  shadingConfig: ShadingConfig;
}

// Convert pixels to centimeters
const pixelToCm = (pixels: number, pixelsPerCm: number): number => {
  return pixels / pixelsPerCm;
};

// Calculate distance between two points
const calculateDistance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Create frame structure from drawing outline
const createFrameStructure = (
  frameElement: FrameElement,
  pixelsPerCm: number,
  frameColor: string,
  shadingConfig: ShadingConfig
): Model3DElement[] => {
  if (!frameElement.closed || frameElement.points.length < 3) {
    return [];
  }

  const elements: Model3DElement[] = [];
  const points = frameElement.points;
  
  // Create frame beams along the perimeter
  // Each beam represents the actual width of the frame profile
  for (let i = 0; i < points.length; i++) {
    const currentPoint = points[i];
    const nextPoint = points[(i + 1) % points.length];
    
    const beamLengthPixels = calculateDistance(currentPoint, nextPoint);
    const beamLengthCm = pixelToCm(beamLengthPixels, pixelsPerCm);
    
    if (beamLengthCm < 1) continue; // Skip very short segments
    
    // Calculate beam center position
    const centerX = (currentPoint.x + nextPoint.x) / 2;
    const centerY = (currentPoint.y + nextPoint.y) / 2;
    
    // Calculate rotation angle
    const angle = Math.atan2(nextPoint.y - currentPoint.y, nextPoint.x - currentPoint.x);
    
    // קבע כיוון הקורה
    const isHorizontal = Math.abs(angle) < Math.PI / 4 || Math.abs(angle) > 3 * Math.PI / 4;
    
    elements.push({
      id: `frame_beam_${i}`,
      type: 'frame_beam',
      geometry: {
        type: 'box',
        width: isHorizontal ? beamLengthCm : 5,  // רוחב 5 ס"מ או אורך הקורה
        height: 15,                              // גובה 15 ס"מ (ציר Z)
        depth: isHorizontal ? 5 : beamLengthCm   // עומק 5 ס"מ או אורך הקורה
      },
      position: {
        x: pixelToCm(centerX, pixelsPerCm),
        y: pixelToCm(centerY, pixelsPerCm),
        z: shadingConfig.pergolaHeight + 15 / 2  // קבוע לגובה 15 ס"מ
      },
      rotation: {
        x: 0,
        y: 0,
        z: angle
      },
      color: frameColor,
      material: {
        type: 'standard',
        metalness: 0.8,
        roughness: 0.2
      }
    });
  }
  
  return elements;
};

// Calculate the inner boundary of the frame (accounting for frame width)
const calculateInnerBoundary = (
  framePoints: Point[],
  frameWidth: number,
  pixelsPerCm: number
): Point[] => {
  // For simplicity, we'll create an inner rectangle that's smaller by the frame width
  // In a real implementation, this would need proper polygon offsetting
  const frameWidthPixels = frameWidth * pixelsPerCm;
  
  // Find bounding box
  const minX = Math.min(...framePoints.map(p => p.x));
  const maxX = Math.max(...framePoints.map(p => p.x));
  const minY = Math.min(...framePoints.map(p => p.y));
  const maxY = Math.max(...framePoints.map(p => p.y));
  
  // Create inner boundary (simplified rectangular)
  return [
    { x: minX + frameWidthPixels, y: minY + frameWidthPixels },
    { x: maxX - frameWidthPixels, y: minY + frameWidthPixels },
    { x: maxX - frameWidthPixels, y: maxY - frameWidthPixels },
    { x: minX + frameWidthPixels, y: maxY - frameWidthPixels }
  ];
};

// Create division beams within the inner boundary
const createDivisionBeams = (
  innerBoundary: Point[],
  pixelsPerCm: number,
  shadingConfig: ShadingConfig
): Model3DElement[] => {
  if (!shadingConfig.divisionEnabled) return [];
  
  const elements: Model3DElement[] = [];
  
  // Find inner boundary dimensions
  const minX = Math.min(...innerBoundary.map(p => p.x));
  const maxX = Math.max(...innerBoundary.map(p => p.x));
  const minY = Math.min(...innerBoundary.map(p => p.y));
  const maxY = Math.max(...innerBoundary.map(p => p.y));
  
  const innerWidthPixels = maxX - minX;
  const innerHeightPixels = maxY - minY;
  const divisionSpacingPixels = shadingConfig.divisionSpacing * pixelsPerCm;
  
  // Create division beams based on direction
  if (shadingConfig.divisionDirection === 'width' || shadingConfig.divisionDirection === 'both') {
    // Division beams along width (vertical beams)
    const numBeams = Math.floor(innerWidthPixels / divisionSpacingPixels);
    
    for (let i = 1; i < numBeams; i++) {
      const x = minX + (i * divisionSpacingPixels);
      const beamLengthCm = pixelToCm(innerHeightPixels, pixelsPerCm);
      
      elements.push({
        id: `division_width_${i}`,
        type: 'division_beam',
        geometry: {
          type: 'box',
          width: 4,          // רוחב 4 ס"מ
          height: 10,        // גובה 10 ס"מ (ציר Z)
          depth: beamLengthCm // אורך הקורה (ציר Y)
        },
        position: {
          x: pixelToCm(x, pixelsPerCm),
          y: pixelToCm((minY + maxY) / 2, pixelsPerCm),
          z: shadingConfig.pergolaHeight + 10 / 2  // קבוע לגובה 10 ס"מ
        },
        rotation: {
          x: 0,
          y: 0,
          z: 0 // ללא סיבוב - מיושר עם ציר Y
        },
        color: shadingConfig.divisionColor,
        material: {
          type: 'standard',
          metalness: 0.8,
          roughness: 0.2
        }
      });
    }
  }
  
  if (shadingConfig.divisionDirection === 'length' || shadingConfig.divisionDirection === 'both') {
    // Division beams along length (horizontal beams)
    const numBeams = Math.floor(innerHeightPixels / divisionSpacingPixels);
    
    for (let i = 1; i < numBeams; i++) {
      const y = minY + (i * divisionSpacingPixels);
      const beamLengthCm = pixelToCm(innerWidthPixels, pixelsPerCm);
      
      elements.push({
        id: `division_length_${i}`,
        type: 'division_beam',
        geometry: {
          type: 'box',
          width: beamLengthCm, // אורך הקורה (ציר X)
          height: 10,          // גובה 10 ס"מ (ציר Z)
          depth: 4             // רוחב 4 ס"מ (ציר Y)
        },
        position: {
          x: pixelToCm((minX + maxX) / 2, pixelsPerCm),
          y: pixelToCm(y, pixelsPerCm),
          z: shadingConfig.pergolaHeight + 10 / 2  // קבוע לגובה 10 ס"מ
        },
        rotation: {
          x: 0,
          y: 0,
          z: 0 // ללא סיבוב - מיושר עם ציר X
        },
        color: shadingConfig.divisionColor,
        material: {
          type: 'standard',
          metalness: 0.8,
          roughness: 0.2
        }
      });
    }
  }
  
  return elements;
};

// Create shading slats within the inner boundary
const createShadingSlats = (
  innerBoundary: Point[],
  pixelsPerCm: number,
  shadingConfig: ShadingConfig
): Model3DElement[] => {
  if (!shadingConfig.enabled) return [];
  
  const elements: Model3DElement[] = [];
  
  // Find inner boundary dimensions
  const minX = Math.min(...innerBoundary.map(p => p.x));
  const maxX = Math.max(...innerBoundary.map(p => p.x));
  const minY = Math.min(...innerBoundary.map(p => p.y));
  const maxY = Math.max(...innerBoundary.map(p => p.y));
  
  const innerWidthPixels = maxX - minX;
  const innerHeightPixels = maxY - minY;
  const shadingSpacingPixels = shadingConfig.spacing * pixelsPerCm;
  
  // Shading slats are positioned at the bottom of the pergola
  const slatZPosition = shadingConfig.pergolaHeight - shadingConfig.shadingProfile.height / 2;
  
  if (shadingConfig.shadingDirection === 'width') {
    // Shading slats along width direction (vertical slats)
    const numSlats = Math.floor(innerWidthPixels / shadingSpacingPixels);
    
    for (let i = 0; i <= numSlats; i++) {
      const x = minX + (i * shadingSpacingPixels);
      if (x > maxX) break;
      
      const slatLengthCm = pixelToCm(innerHeightPixels, pixelsPerCm);
      
      elements.push({
        id: `shading_width_${i}`,
        type: 'shading_slat',
        geometry: {
          type: 'box',
          width: 7,            // רוחב 7 ס"מ (ציר X)
          height: 2,           // גובה 2 ס"מ (ציר Z)
          depth: slatLengthCm  // אורך הפרופיל (ציר Y)
        },
        position: {
          x: pixelToCm(x, pixelsPerCm),
          y: pixelToCm((minY + maxY) / 2, pixelsPerCm),
          z: 2 / 2  // ממוקם בתחתית - גובה חצי הפרופיל
        },
        rotation: {
          x: 0,
          y: 0,
          z: 0 // ללא סיבוב - מיושר עם ציר Y
        },
        color: shadingConfig.color,
        material: {
          type: 'standard',
          metalness: 0.8,
          roughness: 0.2
        }
      });
    }
  } else if (shadingConfig.shadingDirection === 'length') {
    // Shading slats along length direction (horizontal slats)
    const numSlats = Math.floor(innerHeightPixels / shadingSpacingPixels);
    
    for (let i = 0; i <= numSlats; i++) {
      const y = minY + (i * shadingSpacingPixels);
      if (y > maxY) break;
      
      const slatLengthCm = pixelToCm(innerWidthPixels, pixelsPerCm);
      
      elements.push({
        id: `shading_length_${i}`,
        type: 'shading_slat',
        geometry: {
          type: 'box',
          width: slatLengthCm, // אורך הפרופיל (ציר X)
          height: 2,           // גובה 2 ס"מ (ציר Z)
          depth: 7             // רוחב 7 ס"מ (ציר Y)
        },
        position: {
          x: pixelToCm((minX + maxX) / 2, pixelsPerCm),
          y: pixelToCm(y, pixelsPerCm),
          z: 2 / 2  // ממוקם בתחתית - גובה חצי הפרופיל
        },
        rotation: {
          x: 0,
          y: 0,
          z: 0 // ללא סיבוב - מיושר עם ציר X
        },
        color: shadingConfig.color,
        material: {
          type: 'standard',
          metalness: 0.8,
          roughness: 0.2
        }
      });
    }
  }
  
  return elements;
};

// Main function to generate 3D model from drawing
export const generate3DModelFromDrawing = async (
  elements: PergolaElementType[],
  pixelsPerCm: number,
  frameColor: string,
  shadingConfig: ShadingConfig
): Promise<Model3D> => {
  // Find the frame element (should be the closed polygon)
  const frameElement = elements.find(
    (element): element is FrameElement => 
      element.type === 'frame' && element.closed
  );
  
  if (!frameElement) {
    throw new Error('לא נמצא מסגרת סגורה בשרטוט');
  }
  
  const model3DElements: Model3DElement[] = [];
  
  // 1. Create frame structure from the outer boundary
  const frameElements = createFrameStructure(frameElement, pixelsPerCm, frameColor, shadingConfig);
  model3DElements.push(...frameElements);
  
  // 2. Calculate inner boundary (frame outer boundary minus frame width)
  const innerBoundary = calculateInnerBoundary(
    frameElement.points,
    shadingConfig.frameProfile.width,
    pixelsPerCm
  );
  
  // 3. Create division beams within inner boundary
  const divisionElements = createDivisionBeams(innerBoundary, pixelsPerCm, shadingConfig);
  model3DElements.push(...divisionElements);
  
  // 4. Create shading slats within inner boundary
  const shadingElements = createShadingSlats(innerBoundary, pixelsPerCm, shadingConfig);
  model3DElements.push(...shadingElements);
  
  // Calculate bounding box
  const minX = Math.min(...model3DElements.map(e => e.position.x - e.geometry.width / 2));
  const maxX = Math.max(...model3DElements.map(e => e.position.x + e.geometry.width / 2));
  const minY = Math.min(...model3DElements.map(e => e.position.y - e.geometry.depth / 2));
  const maxY = Math.max(...model3DElements.map(e => e.position.y + e.geometry.depth / 2));
  const minZ = Math.min(...model3DElements.map(e => e.position.z - e.geometry.height / 2));
  const maxZ = Math.max(...model3DElements.map(e => e.position.z + e.geometry.height / 2));

  return {
    id: `pergola_${Date.now()}`,
    name: `פרגולה ${new Date().toLocaleDateString('he-IL')}`,
    elements: model3DElements,
    meshes: model3DElements, // Alias for backwards compatibility
    boundingBox: {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ }
    },
    metadata: {
      createdAt: new Date(),
      frameColor,
      shadingConfig,
      totalElements: model3DElements.length,
      dimensions: {
        width: maxX - minX,
        height: maxZ - minZ,
        depth: maxY - minY
      }
    }
  };
};

// Get model statistics
export const getModelStatistics = (model: Model3D): ModelStatistics => {
  const frameBeams = model.elements.filter(e => e.type === 'frame_beam').length;
  const divisionBeams = model.elements.filter(e => e.type === 'division_beam').length;  
  const shadingSlats = model.elements.filter(e => e.type === 'shading_slat').length;
  
  // Calculate total length (simplified)
  const totalLength = model.elements.reduce((sum, element) => {
    return sum + element.geometry.width; // Width represents the length along the beam
  }, 0);
  
  // Estimated weight (kg) - simplified calculation
  const estimatedWeight = (frameBeams * 2.5) + (divisionBeams * 2.0) + (shadingSlats * 0.5);
  
  // Calculate dimensions
  const minX = Math.min(...model.elements.map(e => e.position.x - e.geometry.width / 2));
  const maxX = Math.max(...model.elements.map(e => e.position.x + e.geometry.width / 2));
  const minY = Math.min(...model.elements.map(e => e.position.y - e.geometry.depth / 2));
  const maxY = Math.max(...model.elements.map(e => e.position.y + e.geometry.depth / 2));
  const minZ = Math.min(...model.elements.map(e => e.position.z - e.geometry.height / 2));
  const maxZ = Math.max(...model.elements.map(e => e.position.z + e.geometry.height / 2));
  
  const width = maxX - minX;
  const height = maxZ - minZ;
  const depth = maxY - minY;
  
  return {
    totalBeams: frameBeams + divisionBeams,
    totalLength: Math.round(totalLength),
    frameBeams,
    divisionBeams,
    shadingSlats,
    estimatedWeight: Math.round(estimatedWeight),
    meshCounts: {
      frame_beam: frameBeams,
      division_beam: divisionBeams,
      shading_slat: shadingSlats,
      total: frameBeams + divisionBeams + shadingSlats
    },
    dimensions: {
      width: Math.round(width),
      height: Math.round(height),
      depth: Math.round(depth),
      totalVolume: Math.round(width * height * depth)
    }
  };
};

// Export model data
export const exportModelAsJSON = (model: Model3D): string => {
  return JSON.stringify(model, null, 2);
};