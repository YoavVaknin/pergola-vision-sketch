
import jsPDF from 'jspdf';
import { PergolaConfig } from '@/pages/CreateVisualization';

export const exportCanvasAsPNG = (canvasRef: React.RefObject<HTMLCanvasElement>, filename: string = 'pergola-design') => {
  const canvas = canvasRef.current;
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }

  // Create download link
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportAsPDF = (canvasRef: React.RefObject<HTMLCanvasElement>, config: PergolaConfig, filename: string = 'pergola-design') => {
  const canvas = canvasRef.current;
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }

  // Create PDF document
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  
  // Add title
  pdf.setFontSize(20);
  pdf.text('Pergola Design Visualization', 20, 20);
  
  // Add canvas image
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 200;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  pdf.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);
  
  // Add specifications below the image
  const startY = 30 + imgHeight + 20;
  pdf.setFontSize(16);
  pdf.text('Design Specifications:', 20, startY);
  
  pdf.setFontSize(12);
  const specs = [
    `Dimensions: ${config.width} x ${config.length} cm`,
    `Total Area: ${((config.width * config.length) / 10000).toFixed(2)} m²`,
    `Frame Profile: ${config.profile_frame}`,
    `Division Profile: ${config.profile_division}`,
    `Shading Profile: ${config.profile_shading}`,
    `Beam Spacing: ${config.beamSpacing} cm`,
    `Beam Direction: ${config.beamDirection}°`,
    `Frame Color: ${config.color_frame}`,
    `Division Color: ${config.color_division}`,
    `Shading Color: ${config.color_shading}`,
    `Columns: ${config.column_placement === "corners" ? "4 corners" : config.columns}`,
    `Walls: ${[
      config.wall_front && 'Front',
      config.wall_back && 'Back', 
      config.wall_left && 'Left',
      config.wall_right && 'Right'
    ].filter(Boolean).join(', ') || 'None'}`
  ];
  
  specs.forEach((spec, index) => {
    pdf.text(spec, 20, startY + 10 + (index * 6));
  });
  
  // Save PDF
  pdf.save(`${filename}.pdf`);
};
