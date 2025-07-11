import jsPDF from 'jspdf';

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

export const exportToPDF = (drawingData: any) => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Add drawing
  const drawingURL = drawingData.current.toDataURL('image/png');
  pdf.addImage(drawingURL, 'PNG', 10, 10, 280, 150);

  pdf.save('pergola_design.pdf');
};
