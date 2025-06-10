
import { useState, useCallback } from 'react';
import { generate3DModelFromDrawing, Model3D, getModelStatistics, exportModelAsJSON } from '@/utils/3dModelGenerator';
import { PergolaElementType } from '@/types/pergola';

export const use3DModel = () => {
  const [currentModel, setCurrentModel] = useState<Model3D | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);

  const generateModel = useCallback(async (
    elements: PergolaElementType[],
    pixelsPerCm: number,
    frameColor: string
  ) => {
    console.log('🎯 Starting model generation process...');
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(null);
    
    try {
      console.log('📝 Input data:', { 
        elementsCount: elements.length, 
        pixelsPerCm, 
        frameColor,
        elements: elements.map(el => ({ type: el.type, id: el.id }))
      });
      
      if (elements.length === 0) {
        throw new Error('אין אלמנטים לייצור מודל תלת-ממדי');
      }
      
      const drawingData = {
        elements,
        pixelsPerCm,
        frameColor
      };
      
      const model = generate3DModelFromDrawing(drawingData);
      setCurrentModel(model);
      
      const stats = getModelStatistics(model);
      console.log('📊 Model statistics:', stats);
      
      const successMessage = `מודל נוצר בהצלחה! ${stats.meshCounts.total} meshes, מימדים: ${stats.dimensions.width.toFixed(1)}×${stats.dimensions.depth.toFixed(1)}×${stats.dimensions.height.toFixed(1)} ס"מ`;
      setGenerationSuccess(successMessage);
      
      return model;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה בייצור המודל';
      setGenerationError(errorMessage);
      console.error('❌ Error generating 3D model:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const exportModelJSON = useCallback(() => {
    if (!currentModel) {
      throw new Error('אין מודל זמין לייצוא');
    }
    
    console.log('💾 Exporting model as JSON...');
    return exportModelAsJSON(currentModel);
  }, [currentModel]);

  const getStatistics = useCallback(() => {
    if (!currentModel) {
      return null;
    }
    
    return getModelStatistics(currentModel);
  }, [currentModel]);

  const clearModel = useCallback(() => {
    console.log('🗑️ Clearing current model...');
    setCurrentModel(null);
    setGenerationError(null);
    setGenerationSuccess(null);
  }, []);

  return {
    currentModel,
    isGenerating,
    generationError,
    generationSuccess,
    generateModel,
    exportModelJSON,
    getStatistics,
    clearModel
  };
};
