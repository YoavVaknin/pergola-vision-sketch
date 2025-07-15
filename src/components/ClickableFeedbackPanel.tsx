import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Send, MessageCircle, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Mesh3D } from '@/utils/3dModelGenerator';

interface ClickableFeedbackSystem {
  selectedMesh: Mesh3D | null;
  comments: Record<string, string>;
  isOpen: boolean;
}

interface ClickableFeedbackPanelProps {
  selectedMesh: Mesh3D | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitComment: (meshId: string, comment: string) => void;
  existingComments: Record<string, string>;
}

export const ClickableFeedbackPanel = ({ 
  selectedMesh, 
  isOpen, 
  onClose, 
  onSubmitComment,
  existingComments 
}: ClickableFeedbackPanelProps) => {
  const [comment, setComment] = useState('');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!selectedMesh || !comment.trim()) return;
    
    onSubmitComment(selectedMesh.id, comment);
    
    toast({
      title: "הערה נשמרה!",
      description: `הערה על ${getMeshTypeName(selectedMesh.type)} נשמרה בהצלחה`,
      duration: 3000,
    });
    
    setComment('');
    onClose();
  };

  const getMeshTypeName = (type: string) => {
    switch (type) {
      case 'frame_beam': return 'קורת מסגרת';
      case 'shading_slat': return 'רצועת הצללה';
      case 'column': return 'עמוד';
      case 'division_beam': return 'קורת חלוקה';
      default: return 'רכיב';
    }
  };

  const getMeshColor = (type: string) => {
    switch (type) {
      case 'frame_beam': return 'bg-blue-500';
      case 'shading_slat': return 'bg-green-500';
      case 'column': return 'bg-purple-500';
      case 'division_beam': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (!isOpen || !selectedMesh) return null;

  const existingComment = existingComments[selectedMesh.id];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              הערה על רכיב
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            הוסף הערה ספציפית על הרכיב שבחרת
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Selected Mesh Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${getMeshColor(selectedMesh.type)}`} />
              <span className="font-medium">{getMeshTypeName(selectedMesh.type)}</span>
            </div>
            <div className="text-sm text-gray-600">
              <p>מיקום: X:{selectedMesh.position.x.toFixed(1)}, Y:{selectedMesh.position.y.toFixed(1)}, Z:{selectedMesh.position.z.toFixed(1)}</p>
              <p>גודל: {selectedMesh.geometry.width.toFixed(1)}×{selectedMesh.geometry.height.toFixed(1)}×{selectedMesh.geometry.depth.toFixed(1)} ס"מ</p>
            </div>
          </div>

          {/* Existing Comment */}
          {existingComment && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">הערה קיימת:</span>
              </div>
              <p className="text-sm text-blue-700">{existingComment}</p>
            </div>
          )}

          {/* Comment Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {existingComment ? 'עדכן הערה:' : 'הוסף הערה:'}
            </label>
            <Textarea
              placeholder="מה צריך לתקן ברכיב הזה? איך לעשות אותו יותר מציאותי?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={300}
            />
            <p className="text-xs text-gray-500 text-left">
              {comment.length}/300 תווים
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            className="w-full flex items-center gap-2"
            disabled={!comment.trim()}
          >
            <Send className="w-4 h-4" />
            {existingComment ? 'עדכן הערה' : 'שמור הערה'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

interface FeedbackSummaryProps {
  comments: Record<string, string>;
  meshes: Mesh3D[];
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackSummary = ({ comments, meshes, isOpen, onClose }: FeedbackSummaryProps) => {
  const { toast } = useToast();

  const getMeshTypeName = (type: string) => {
    switch (type) {
      case 'frame_beam': return 'קורת מסגרת';
      case 'shading_slat': return 'רצועת הצללה';
      case 'column': return 'עמוד';
      case 'division_beam': return 'קורת חלוקה';
      default: return 'רכיב';
    }
  };

  const exportComments = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      totalComments: Object.keys(comments).length,
      comments: Object.entries(comments).map(([meshId, comment]) => {
        const mesh = meshes.find(m => m.id === meshId);
        return {
          meshId,
          meshType: mesh?.type || 'unknown',
          meshTypeName: getMeshTypeName(mesh?.type || ''),
          position: mesh?.position,
          comment
        };
      })
    };

    console.log('📝 All feedback comments exported:', exportData);
    
    toast({
      title: "הערות יוצאו!",
      description: `${Object.keys(comments).length} הערות יוצאו לקונסול`,
      duration: 3000,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              סיכום הערות ({Object.keys(comments).length})
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {Object.keys(comments).length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              עדיין אין הערות. לחץ על רכיבים בהדמיה להוספת הערות.
            </p>
          ) : (
            <>
              {Object.entries(comments).map(([meshId, comment]) => {
                const mesh = meshes.find(m => m.id === meshId);
                return (
                  <div key={meshId} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {getMeshTypeName(mesh?.type || '')}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {mesh?.position.x.toFixed(1)}, {mesh?.position.y.toFixed(1)}, {mesh?.position.z.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm">{comment}</p>
                  </div>
                );
              })}
              
              <Button onClick={exportComments} className="w-full">
                יצא את כל ההערות
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
