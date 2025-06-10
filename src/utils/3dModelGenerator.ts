
import { Point, PergolaElementType, FrameElement, ShadingElement, DivisionElement } from '@/types/pergola';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Beam3D {
  id: string;
  type: 'frame' | 'division' | 'shading';
  start: Vector3D;
  end: Vector3D;
  width: number;
  height: number;
  depth: number;
  color: string;
  profile: string;
}

export interface ShadingPanel3D {
  id: string;
  type: 'shading_panel';
  position: Vector3D;
  width: number;
  height: number;
  depth: number;
  color: string;
  direction: number; // 0 = vertical, 90 = horizontal
}

export interface Model3D {
  beams: Beam3D[];
  shadingPanels: ShadingPanel3D[];
  boundingBox: {
    min: Vector3D;
    max: Vector3D;
  };
  defaultHeight: number;
  scale: number; // pixels to cm conversion
}

export interface DrawingData {
  elements: PergolaElementType[];
  pixelsPerCm: number;
  frameColor: string;
}

export const generate3DModelFromDrawing = (drawingData: DrawingData): Model3D => {
  const { elements, pixelsPerCm, frameColor } = drawingData;
  const defaultHeight = 250; // cm
  const frameDepth = 15; // cm
  const divisionDepth = 12; // cm
  const shadingDepth = 3; // cm
  
  const beams: Beam3D[] = [];
  const shadingPanels: ShadingPanel3D[] = [];
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  console.log('Starting 3D model generation with', elements.length, 'elements');

  elements.forEach((element, index) => {
    console.log(`Processing element ${index}:`, element.type, element.id);
    
    switch (element.type) {
      case 'frame':
        const frame = element as FrameElement;
        
        // Convert frame segments to 3D beams
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
          
          const beam: Beam3D = {
            id: `${element.id}_segment_${i}`,
            type: 'frame',
            start: {
              x: start.x / pixelsPerCm,
              y: start.y / pixelsPerCm,
              z: 0
            },
            end: {
              x: end.x / pixelsPerCm,
              y: end.y / pixelsPerCm,
              z: 0
            },
            width: frameDepth,
            height: defaultHeight,
            depth: frameDepth,
            color: frameColor || '#1f2937',
            profile: 'rectangular'
          };
          
          beams.push(beam);
          console.log(`Added frame beam ${i}:`, beam);
        }
        break;
        
      case 'division':
        const division = element as DivisionElement;
        
        // Update bounding box
        minX = Math.min(minX, division.start.x, division.end.x);
        maxX = Math.max(maxX, division.start.x, division.end.x);
        minY = Math.min(minY, division.start.y, division.end.y);
        maxY = Math.max(maxY, division.start.y, division.end.y);
        
        const divisionBeam: Beam3D = {
          id: element.id,
          type: 'division',
          start: {
            x: division.start.x / pixelsPerCm,
            y: division.start.y / pixelsPerCm,
            z: 0
          },
          end: {
            x: division.end.x / pixelsPerCm,
            y: division.end.y / pixelsPerCm,
            z: 0
          },
          width: divisionDepth,
          height: defaultHeight,
          depth: divisionDepth,
          color: division.color || '#f97316',
          profile: 'rectangular'
        };
        
        beams.push(divisionBeam);
        console.log('Added division beam:', divisionBeam);
        break;
        
      case 'shading':
        const shading = element as ShadingElement;
        
        // Update bounding box
        minX = Math.min(minX, shading.start.x, shading.end.x);
        maxX = Math.max(maxX, shading.start.x, shading.end.x);
        minY = Math.min(minY, shading.start.y, shading.end.y);
        maxY = Math.max(maxY, shading.start.y, shading.end.y);
        
        // Create thin shading beam
        const shadingBeam: Beam3D = {
          id: element.id,
          type: 'shading',
          start: {
            x: shading.start.x / pixelsPerCm,
            y: shading.start.y / pixelsPerCm,
            z: defaultHeight - 20 // Slightly below the top
          },
          end: {
            x: shading.end.x / pixelsPerCm,
            y: shading.end.y / pixelsPerCm,
            z: defaultHeight - 20
          },
          width: shadingDepth,
          height: 20, // Height of shading slat
          depth: shadingDepth,
          color: shading.color || '#8b4513',
          profile: 'flat'
        };
        
        beams.push(shadingBeam);
        
        // Create shading panel (flat surface between beams if needed)
        const length = Math.sqrt(
          Math.pow(shading.end.x - shading.start.x, 2) + 
          Math.pow(shading.end.y - shading.start.y, 2)
        ) / pixelsPerCm;
        
        const centerX = (shading.start.x + shading.end.x) / 2 / pixelsPerCm;
        const centerY = (shading.start.y + shading.end.y) / 2 / pixelsPerCm;
        
        const shadingPanel: ShadingPanel3D = {
          id: `${element.id}_panel`,
          type: 'shading_panel',
          position: {
            x: centerX,
            y: centerY,
            z: defaultHeight - 10
          },
          width: shading.direction === 0 ? shadingDepth : length,
          height: 10, // Panel thickness
          depth: shading.direction === 0 ? length : shadingDepth,
          color: shading.color || '#8b4513',
          direction: shading.direction
        };
        
        shadingPanels.push(shadingPanel);
        console.log('Added shading beam and panel:', shadingBeam, shadingPanel);
        break;
    }
  });
  
  // Calculate bounding box in 3D space
  const boundingBox = {
    min: {
      x: minX === Infinity ? 0 : minX / pixelsPerCm,
      y: minY === Infinity ? 0 : minY / pixelsPerCm,
      z: 0
    },
    max: {
      x: maxX === -Infinity ? 100 : maxX / pixelsPerCm,
      y: maxY === -Infinity ? 100 : maxY / pixelsPerCm,
      z: defaultHeight
    }
  };
  
  const model: Model3D = {
    beams,
    shadingPanels,
    boundingBox,
    defaultHeight,
    scale: pixelsPerCm
  };
  
  console.log('Generated 3D model:', model);
  console.log(`Model contains: ${beams.length} beams, ${shadingPanels.length} shading panels`);
  
  return model;
};

// Helper function to calculate beam length
export const calculateBeamLength = (beam: Beam3D): number => {
  const dx = beam.end.x - beam.start.x;
  const dy = beam.end.y - beam.start.y;
  const dz = beam.end.z - beam.start.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Helper function to calculate beam angle
export const calculateBeamAngle = (beam: Beam3D): { xy: number; xz: number; yz: number } => {
  const dx = beam.end.x - beam.start.x;
  const dy = beam.end.y - beam.start.y;
  const dz = beam.end.z - beam.start.z;
  
  return {
    xy: Math.atan2(dy, dx) * 180 / Math.PI, // Angle in XY plane
    xz: Math.atan2(dz, dx) * 180 / Math.PI, // Angle in XZ plane
    yz: Math.atan2(dz, dy) * 180 / Math.PI  // Angle in YZ plane
  };
};

// Helper function to export model as JSON
export const exportModelAsJSON = (model: Model3D): string => {
  return JSON.stringify(model, null, 2);
};

// Helper function to get model statistics
export const getModelStatistics = (model: Model3D) => {
  const frameBeams = model.beams.filter(b => b.type === 'frame');
  const divisionBeams = model.beams.filter(b => b.type === 'division');
  const shadingBeams = model.beams.filter(b => b.type === 'shading');
  
  const totalFrameLength = frameBeams.reduce((sum, beam) => sum + calculateBeamLength(beam), 0);
  const totalDivisionLength = divisionBeams.reduce((sum, beam) => sum + calculateBeamLength(beam), 0);
  const totalShadingLength = shadingBeams.reduce((sum, beam) => sum + calculateBeamLength(beam), 0);
  
  const dimensions = {
    width: model.boundingBox.max.x - model.boundingBox.min.x,
    depth: model.boundingBox.max.y - model.boundingBox.min.y,
    height: model.boundingBox.max.z - model.boundingBox.min.z
  };
  
  return {
    beamCounts: {
      frame: frameBeams.length,
      division: divisionBeams.length,
      shading: shadingBeams.length,
      total: model.beams.length
    },
    lengths: {
      frame: totalFrameLength,
      division: totalDivisionLength,
      shading: totalShadingLength,
      total: totalFrameLength + totalDivisionLength + totalShadingLength
    },
    dimensions,
    shadingPanels: model.shadingPanels.length,
    volume: dimensions.width * dimensions.depth * dimensions.height
  };
};
