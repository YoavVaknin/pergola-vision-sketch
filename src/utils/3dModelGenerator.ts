
import { Point, PergolaElementType, FrameElement, ShadingElement, DivisionElement, ShadingConfig } from '@/types/pergola';

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
  shadingConfig: ShadingConfig;
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

// Calculate the inner polygon by offsetting the frame inward by the frame profile width
// This represents the available inner space after placing frame beams
const calculateInnerFramePolygon = (framePoints: Point[], frameProfileWidth: number, pixelsPerCm: number): Point[] => {
  if (framePoints.length < 3) return framePoints;
  
  const offsetPixels = frameProfileWidth * pixelsPerCm; // Full profile width in pixels
  const innerPoints: Point[] = [];
  
  for (let i = 0; i < framePoints.length; i++) {
    const prevIndex = (i - 1 + framePoints.length) % framePoints.length;
    const nextIndex = (i + 1) % framePoints.length;
    
    const prevPoint = framePoints[prevIndex];
    const currentPoint = framePoints[i];
    const nextPoint = framePoints[nextIndex];
    
    // Calculate vectors from current point to neighbors
    const toPrev = { 
      x: prevPoint.x - currentPoint.x, 
      y: prevPoint.y - currentPoint.y 
    };
    const toNext = { 
      x: nextPoint.x - currentPoint.x, 
      y: nextPoint.y - currentPoint.y 
    };
    
    // Normalize vectors
    const prevLength = Math.sqrt(toPrev.x * toPrev.x + toPrev.y * toPrev.y);
    const nextLength = Math.sqrt(toNext.x * toNext.x + toNext.y * toNext.y);
    
    if (prevLength === 0 || nextLength === 0) {
      innerPoints.push(currentPoint);
      continue;
    }
    
    const prevNorm = { x: toPrev.x / prevLength, y: toPrev.y / prevLength };
    const nextNorm = { x: toNext.x / nextLength, y: toNext.y / nextLength };
    
    // Calculate inward perpendicular vectors for each edge
    const prevPerp = { x: prevNorm.y, y: -prevNorm.x }; // Perpendicular pointing inward
    const nextPerp = { x: -nextNorm.y, y: nextNorm.x }; // Perpendicular pointing inward
    
    // Calculate bisector direction (average of perpendiculars)
    const bisector = {
      x: (prevPerp.x + nextPerp.x) / 2,
      y: (prevPerp.y + nextPerp.y) / 2
    };
    
    // Normalize bisector
    const bisectorLength = Math.sqrt(bisector.x * bisector.x + bisector.y * bisector.y);
    if (bisectorLength === 0) {
      innerPoints.push(currentPoint);
      continue;
    }
    
    const bisectorNorm = { 
      x: bisector.x / bisectorLength, 
      y: bisector.y / bisectorLength 
    };
    
    // Calculate angle between edges to determine offset distance
    const cosAngle = Math.max(-1, Math.min(1, -(prevNorm.x * nextNorm.x + prevNorm.y * nextNorm.y)));
    const sinHalfAngle = Math.sqrt((1 - cosAngle) / 2);
    const offsetDistance = sinHalfAngle === 0 ? offsetPixels : offsetPixels / sinHalfAngle;
    
    // Move point inward
    const innerPoint = {
      x: currentPoint.x + bisectorNorm.x * offsetDistance,
      y: currentPoint.y + bisectorNorm.y * offsetDistance
    };
    
    innerPoints.push(innerPoint);
  }
  
  return innerPoints;
};

// Position frame beams so they sit inside the drawn boundary
const calculateFrameBeamPositions = (
  start: Point, 
  end: Point, 
  frameProfileWidth: number, 
  pixelsPerCm: number
): { innerStart: Point; innerEnd: Point } => {
  const frameWidthPixels = frameProfileWidth * pixelsPerCm;
  
  // Calculate beam direction vector
  const beamVector = { 
    x: end.x - start.x, 
    y: end.y - start.y 
  };
  const beamLength = Math.sqrt(beamVector.x * beamVector.x + beamVector.y * beamVector.y);
  
  if (beamLength === 0) {
    return { innerStart: start, innerEnd: end };
  }
  
  // Normalize beam vector
  const beamNorm = { 
    x: beamVector.x / beamLength, 
    y: beamVector.y / beamLength 
  };
  
  // Calculate perpendicular vector pointing inward (to the right of the beam direction for clockwise polygon)
  const inwardVector = { 
    x: beamNorm.y, 
    y: -beamNorm.x 
  };
  
  // Position frame beam inward by half the frame width
  const inwardOffset = frameWidthPixels / 2;
  
  return {
    innerStart: {
      x: start.x + inwardVector.x * inwardOffset,
      y: start.y + inwardVector.y * inwardOffset
    },
    innerEnd: {
      x: end.x + inwardVector.x * inwardOffset,
      y: end.y + inwardVector.y * inwardOffset
    }
  };
};

// Calculate beam length in pixels
const calculateBeamLength = (start: Point, end: Point): number => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Enhanced pergola beam creation with profile support - FIXED DIMENSIONS
const createPergolaBeam = (
  id: string,
  start: Point,
  end: Point,
  pixelsPerCm: number,
  zPosition: number,
  profile: { width: number; height: number },
  color: string,
  type: 'frame_beam' | 'division_beam' = 'frame_beam'
): Mesh3D => {
  const beamLength = calculateBeamLength(start, end);
  const beamLengthCm = pixelToCm(beamLength, pixelsPerCm);
  
  const centerX = (start.x + end.x) / 2;
  const centerY = (start.y + end.y) / 2;
  
  // FIXED: Correct mapping of dimensions
  // - width (Three.js X) = length along the beam direction
  // - depth (Three.js Z) = profile width (cross-section width visible from above)  
  // - height (Three.js Y) = profile height (vertical dimension)
  
  return {
    id,
    type,
    geometry: {
      type: 'box',
      width: beamLengthCm,        // X: Length along the beam direction
      height: profile.height,     // Y: Vertical height (profile.height)
      depth: profile.width        // Z: Cross-section width (profile.width)
    },
    position: {
      x: pixelToCm(centerX, pixelsPerCm),
      y: pixelToCm(centerY, pixelsPerCm),
      z: zPosition + profile.height / 2
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

// Check if point is inside polygon using ray casting algorithm
const isPointInsidePolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  const x = point.x;
  const y = point.y;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
};

// Create shading slats aligned with frame bottom - FIXED Z POSITION
const createBottomShadingSlats = (
  framePoints: Point[],
  config: ShadingConfig,
  pixelsPerCm: number,
  id: string,
  frameBaseZ: number
): Mesh3D[] => {
  if (!config.enabled || framePoints.length < 3) {
    console.log('Shading disabled or insufficient frame points');
    return [];
  }

  const slats: Mesh3D[] = [];
  
  // Calculate inner frame polygon - where shading slats should be constrained
  const innerFramePoints = calculateInnerFramePolygon(framePoints, config.frameProfile.width, pixelsPerCm);
  
  // Calculate bounding box of inner frame
  const minX = Math.min(...innerFramePoints.map(p => p.x));
  const maxX = Math.max(...innerFramePoints.map(p => p.x));
  const minY = Math.min(...innerFramePoints.map(p => p.y));
  const maxY = Math.max(...innerFramePoints.map(p => p.y));

  console.log('Creating bottom shading slats:', {
    direction: config.shadingDirection,
    spacing: config.spacing,
    bounds: { minX, maxX, minY, maxY },
    frameBaseZ
  });

  // FIXED: Shading slats at exact same Z as frame base
  const slatZPosition = frameBaseZ;

  if (config.shadingDirection === 'width') {
    // Shading slats along width (vertical orientation)
    for (let x = minX + config.spacing; x < maxX; x += config.spacing) {
      const intersections: { y: number; }[] = [];
      
      // Find intersections with inner frame edges (where shading slats should be constrained)
      for (let i = 0; i < innerFramePoints.length; i++) {
        const p1 = innerFramePoints[i];
        const p2 = innerFramePoints[(i + 1) % innerFramePoints.length];
        
        const minEdgeX = Math.min(p1.x, p2.x);
        const maxEdgeX = Math.max(p1.x, p2.x);
        
        if (x >= minEdgeX && x <= maxEdgeX && Math.abs(p2.x - p1.x) > 0.1) {
          const t = (x - p1.x) / (p2.x - p1.x);
          const y = p1.y + t * (p2.y - p1.y);
          intersections.push({ y });
        }
      }
      
      intersections.sort((a, b) => a.y - b.y);
      
      // Create slats between pairs of intersections
      for (let i = 0; i < intersections.length - 1; i += 2) {
        if (i + 1 < intersections.length) {
          const startY = intersections[i].y;
          const endY = intersections[i + 1].y;
          const centerY = (startY + endY) / 2;
          const slatLength = Math.abs(endY - startY);
          
          if (slatLength > 1) {
            slats.push({
              id: `${id}_shading_slat_${slats.length}`,
              type: 'shading_slat',
              geometry: {
                type: 'box',
                // FIXED: For shading slats along width (vertical orientation)
                // - width = the profile width (7 cm cross-section)
                // - height = the profile height (2 cm thickness)  
                // - depth = length of the slat (span distance)
                width: config.shadingProfile.width,     // 7 cm cross-section width
                height: config.shadingProfile.height,   // 2 cm thickness
                depth: pixelToCm(slatLength, pixelsPerCm)  // Length along span
              },
              position: {
                x: pixelToCm(x, pixelsPerCm),
                y: pixelToCm(centerY, pixelsPerCm),
                z: slatZPosition + config.shadingProfile.height / 2
              },
              rotation: { x: 0, y: 0, z: Math.PI / 2 },  // Rotated 90° for width direction
              color: config.color,
              material: {
                type: 'standard',
                roughness: 0.8,
                metalness: 0.0
              }
            });
          }
        }
      }
    }
  } else {
    // Shading slats along length (horizontal orientation)
    for (let y = minY + config.spacing; y < maxY; y += config.spacing) {
      const intersections: { x: number; }[] = [];
      
      // Find intersections with inner frame edges (where shading slats should be constrained)
      for (let i = 0; i < innerFramePoints.length; i++) {
        const p1 = innerFramePoints[i];
        const p2 = innerFramePoints[(i + 1) % innerFramePoints.length];
        
        const minEdgeY = Math.min(p1.y, p2.y);
        const maxEdgeY = Math.max(p1.y, p2.y);
        
        if (y >= minEdgeY && y <= maxEdgeY && Math.abs(p2.y - p1.y) > 0.1) {
          const t = (y - p1.y) / (p2.y - p1.y);
          const x = p1.x + t * (p2.x - p1.x);
          intersections.push({ x });
        }
      }
      
      intersections.sort((a, b) => a.x - b.x);
      
      // Create slats between pairs of intersections
      for (let i = 0; i < intersections.length - 1; i += 2) {
        if (i + 1 < intersections.length) {
          const startX = intersections[i].x;
          const endX = intersections[i + 1].x;
          const centerX = (startX + endX) / 2;
          const slatLength = Math.abs(endX - startX);
          
          if (slatLength > 1) {
            slats.push({
              id: `${id}_shading_slat_${slats.length}`,
              type: 'shading_slat',
              geometry: {
                type: 'box',
                // FIXED: For shading slats along length (horizontal orientation)
                // - width = length of the slat (span distance)
                // - height = the profile height (2 cm thickness)
                // - depth = the profile width (7 cm cross-section)
                width: pixelToCm(slatLength, pixelsPerCm),  // Length along span
                height: config.shadingProfile.height,       // 2 cm thickness  
                depth: config.shadingProfile.width          // 7 cm cross-section width
              },
              position: {
                x: pixelToCm(centerX, pixelsPerCm),
                y: pixelToCm(y, pixelsPerCm),
                z: slatZPosition + config.shadingProfile.height / 2
              },
              rotation: { x: 0, y: 0, z: 0 },  // No rotation for length direction
              color: config.color,
              material: {
                type: 'standard',
                roughness: 0.8,
                metalness: 0.0
              }
            });
          }
        }
      }
    }
  }
  
  console.log(`Generated ${slats.length} bottom shading slats at Z=${slatZPosition}`);
  return slats;
};

// Create division beams positioned above shading slats - FIXED Z POSITION
const createDivisionBeams = (
  framePoints: Point[],
  config: ShadingConfig,
  pixelsPerCm: number,
  id: string,
  frameBaseZ: number
): Mesh3D[] => {
  if (!config.divisionEnabled || framePoints.length < 3) {
    console.log('Division beams disabled or insufficient frame points');
    return [];
  }

  const beams: Mesh3D[] = [];
  
  // Calculate inner frame polygon - where division beams should be constrained
  const innerFramePoints = calculateInnerFramePolygon(framePoints, config.frameProfile.width, pixelsPerCm);
  
  // Calculate bounding box of inner frame
  const minX = Math.min(...innerFramePoints.map(p => p.x));
  const maxX = Math.max(...innerFramePoints.map(p => p.x));
  const minY = Math.min(...innerFramePoints.map(p => p.y));
  const maxY = Math.max(...innerFramePoints.map(p => p.y));

  console.log('Creating division beams:', {
    direction: config.divisionDirection,
    spacing: config.divisionSpacing,
    bounds: { minX, maxX, minY, maxY },
    frameBaseZ
  });

  // FIXED: Division beams positioned exactly above shading slats
  const divisionZPosition = frameBaseZ + config.shadingProfile.height;

  // Create division beams along width
  if (config.divisionDirection === 'width' || config.divisionDirection === 'both') {
    for (let x = minX + config.divisionSpacing; x < maxX; x += config.divisionSpacing) {
      const intersections: { y: number; }[] = [];
      
      for (let i = 0; i < innerFramePoints.length; i++) {
        const p1 = innerFramePoints[i];
        const p2 = innerFramePoints[(i + 1) % innerFramePoints.length];
        
        const minEdgeX = Math.min(p1.x, p2.x);
        const maxEdgeX = Math.max(p1.x, p2.x);
        
        if (x >= minEdgeX && x <= maxEdgeX && Math.abs(p2.x - p1.x) > 0.1) {
          const t = (x - p1.x) / (p2.x - p1.x);
          const y = p1.y + t * (p2.y - p1.y);
          intersections.push({ y });
        }
      }
      
      intersections.sort((a, b) => a.y - b.y);
      
      for (let i = 0; i < intersections.length - 1; i += 2) {
        if (i + 1 < intersections.length) {
          const start = { x, y: intersections[i].y };
          const end = { x, y: intersections[i + 1].y };
          
          beams.push(createPergolaBeam(
            `${id}_division_width_${beams.length}`,
            start,
            end,
            pixelsPerCm,
            divisionZPosition,
            config.divisionProfile,
            config.divisionColor,
            'division_beam'
          ));
        }
      }
    }
  }

  // Create division beams along length
  if (config.divisionDirection === 'length' || config.divisionDirection === 'both') {
    for (let y = minY + config.divisionSpacing; y < maxY; y += config.divisionSpacing) {
      const intersections: { x: number; }[] = [];
      
      for (let i = 0; i < innerFramePoints.length; i++) {
        const p1 = innerFramePoints[i];
        const p2 = innerFramePoints[(i + 1) % innerFramePoints.length];
        
        const minEdgeY = Math.min(p1.y, p2.y);
        const maxEdgeY = Math.max(p1.y, p2.y);
        
        if (y >= minEdgeY && y <= maxEdgeY && Math.abs(p2.y - p1.y) > 0.1) {
          const t = (y - p1.y) / (p2.y - p1.y);
          const x = p1.x + t * (p2.x - p1.x);
          intersections.push({ x });
        }
      }
      
      intersections.sort((a, b) => a.x - b.x);
      
      for (let i = 0; i < intersections.length - 1; i += 2) {
        if (i + 1 < intersections.length) {
          const start = { x: intersections[i].x, y };
          const end = { x: intersections[i + 1].x, y };
          
          beams.push(createPergolaBeam(
            `${id}_division_length_${beams.length}`,
            start,
            end,
            pixelsPerCm,
            divisionZPosition,
            config.divisionProfile,
            config.divisionColor,
            'division_beam'
          ));
        }
      }
    }
  }
  
  console.log(`Generated ${beams.length} division beams at Z=${divisionZPosition}`);
  return beams;
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
      z: height / 2
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
  console.log('🚀 Starting enhanced 3D pergola generation - Fixed Bottom Shading Model');
  
  const { elements, pixelsPerCm, frameColor, shadingConfig } = drawingData;
  const frameHeight = 0; // cm - pergola height fixed at ground level (0 cm)
  
  const meshes: Mesh3D[] = [];
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  console.log(`📊 Processing ${elements.length} elements for bottom shading pergola at height ${frameHeight}cm`);

  // FIXED: Calculate base Z position for frame (frame sits at pergola height)
  const frameBaseZ = frameHeight;

  elements.forEach((element, index) => {
    console.log(`🔨 Processing element ${index}: ${element.type} (ID: ${element.id})`);
    
    switch (element.type) {
      case 'frame':
        const frame = element as FrameElement;
        console.log(`📐 Frame with ${frame.points.length} points:`, frame.points);
        
        // Create main structural beams for each segment
        // Frame beams are positioned inside the drawn boundary (inward from outer edge)
        for (let i = 0; i < frame.points.length; i++) {
          const nextIndex = frame.closed ? (i + 1) % frame.points.length : i + 1;
          if (!frame.closed && nextIndex >= frame.points.length) break;
          
          const outerStart = frame.points[i];
          const outerEnd = frame.points[nextIndex];
          
          // Calculate the inner position for frame beams (positioned inside the drawn boundary)
          const { innerStart, innerEnd } = calculateFrameBeamPositions(
            outerStart, 
            outerEnd, 
            shadingConfig.frameProfile.width, 
            pixelsPerCm
          );
          
          // Update bounding box using outer drawn points (the full boundary)
          minX = Math.min(minX, outerStart.x, outerEnd.x);
          maxX = Math.max(maxX, outerStart.x, outerEnd.x);
          minY = Math.min(minY, outerStart.y, outerEnd.y);
          maxY = Math.max(maxY, outerStart.y, outerEnd.y);
          
          // Create frame beam positioned inward from the boundary
          const beam = createPergolaBeam(
            `${element.id}_beam_${i}`,
            innerStart,
            innerEnd,
            pixelsPerCm,
            frameBaseZ,
            shadingConfig.frameProfile,
            frameColor || '#2d4a2b',
            'frame_beam'
          );
          
          meshes.push(beam);
          console.log(`✅ Added frame beam segment ${i} at Z=${frameBaseZ} (positioned inward from boundary)`);
        }

        // Generate shading slats and division beams for closed frames only
        if (frame.closed && frame.points.length >= 3) {
          console.log('🌞 Generating shading and division elements for closed frame');
          
          // Generate shading slats aligned with frame base (same Z level)
          const shadingSlats = createBottomShadingSlats(
            frame.points,
            shadingConfig,
            pixelsPerCm,
            element.id,
            frameBaseZ
          );
          meshes.push(...shadingSlats);
          
          // Generate division beams positioned above shading slats
          const divisionBeams = createDivisionBeams(
            frame.points,
            shadingConfig,
            pixelsPerCm,
            element.id,
            frameBaseZ
          );
          meshes.push(...divisionBeams);
        }
        break;

      // Only add columns if they were explicitly drawn by the user
      case 'column':
        console.log('Adding explicitly drawn column');
        // Column creation logic here if needed - only for drawn columns
        break;
    }
  });
  
  // Calculate realistic bounding box in 3D space
  const totalHeight = frameBaseZ + shadingConfig.frameProfile.height + 
                      (shadingConfig.divisionEnabled ? shadingConfig.divisionProfile.height : 0);
  
  // Calculate bottom-left corner offset to normalize to origin
  const minXCm = minX === Infinity ? 0 : pixelToCm(minX, pixelsPerCm);
  const minYCm = minY === Infinity ? 0 : pixelToCm(minY, pixelsPerCm);
  
  // Normalize all mesh positions to ensure bottom-left corner is at origin
  meshes.forEach(mesh => {
    mesh.position.x -= minXCm;
    mesh.position.y -= minYCm;
  });
  
  const boundingBox = {
    min: {
      x: 0, // Always start at origin
      y: 0, // Always start at origin  
      z: frameBaseZ
    },
    max: {
      x: maxX === -Infinity ? 100 : pixelToCm(maxX, pixelsPerCm) - minXCm + shadingConfig.frameProfile.width,
      y: maxY === -Infinity ? 100 : pixelToCm(maxY, pixelsPerCm) - minYCm + shadingConfig.frameProfile.width,
      z: totalHeight
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
  
  console.log('🎉 Fixed Bottom Shading Pergola Model generated successfully!');
  console.log(`📈 Statistics:`, {
    totalMeshes: meshes.length,
    frameBeams: meshes.filter(m => m.type === 'frame_beam').length,
    divisionBeams: meshes.filter(m => m.type === 'division_beam').length,
    shadingSlats: meshes.filter(m => m.type === 'shading_slat').length,
    columns: meshes.filter(m => m.type === 'column').length,
    dimensions,
    frameBaseZ,
    totalHeight
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
