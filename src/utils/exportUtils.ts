import jsPDF from 'jspdf';
import { PergolaConfig } from '@/types/pergolaConfig';

export interface DrawingData {
  elements: any[];
  pixelsPerCm: number;
  frameColor: string;
  shadingConfig: any;
}

export const exportDrawingAsJSON = (drawingData: DrawingData): string => {
  return JSON.stringify(drawingData, null, 2);
};

export const importDrawingFromJSON = (json: string): DrawingData => {
  return JSON.parse(json);
};

export const exportToPDF = (drawingData: any, pergolaConfig: PergolaConfig) => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Add drawing
  const drawingURL = drawingData.current.toDataURL('image/png');
  pdf.addImage(drawingURL, 'PNG', 10, 10, 280, 150);

  // Add pergola configuration
  pdf.setFontSize(12);
  pdf.text(`Pergola Configuration:`, 10, 170);
  pdf.setFontSize(10);
  let yOffset = 175;
  for (const key in pergolaConfig) {
    if (Object.prototype.hasOwnProperty.call(pergolaConfig, key)) {
      pdf.text(`${key}: ${pergolaConfig[key]}`, 10, yOffset);
      yOffset += 5;
    }
  }

  pdf.save('pergola_design.pdf');
};
