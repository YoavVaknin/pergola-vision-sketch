
import { useState, useCallback } from 'react';
import { generate3DModelFromDrawing, Model3D, getModelStatistics, exportModelAsJSON } from '@/utils/3dModelGenerator';
import { PergolaElementType } from '@/types/pergola';

export const use3DModel = () => {
  const [currentModel, setCurrentModel] = useState<Model3D | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const generateModel = useCallback(async (
    elements: PergolaElementType[],
    pixelsPerCm: number,
    frameColor: string
  ) => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      console.log('Generating 3D model from drawing data...');
      
      const drawingData = {
        elements,
        pixelsPerCm,
        frameColor
      };
      
      const model = generate3DModelFromDrawing(drawingData);
      setCurrentModel(model);
      
      const stats = getModelStatistics(model);
      console.log('3D Model generated successfully:', stats);
      
      return model;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setGenerationError(errorMessage);
      console.error('Error generating 3D model:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const exportModelJSON = useCallback(() => {
    if (!currentModel) {
      throw new Error('No model available to export');
    }
    
    return exportModelAsJSON(currentModel);
  }, [currentModel]);

  const getStatistics = useCallback(() => {
    if (!currentModel) {
      return null;
    }
    
    return getModelStatistics(currentModel);
  }, [currentModel]);

  const clearModel = useCallback(() => {
    setCurrentModel(null);
    setGenerationError(null);
  }, []);

  return {
    currentModel,
    isGenerating,
    generationError,
    generateModel,
    exportModelJSON,
    getStatistics,
    clearModel
  };
};
