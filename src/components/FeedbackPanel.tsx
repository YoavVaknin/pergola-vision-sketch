import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Send, Star, ThumbsUp, ThumbsDown, Zap, Eye, Palette, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeedbackPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackPanel = ({ isOpen, onClose }: FeedbackPanelProps) => {
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [quickFeedback, setQuickFeedback] = useState<'good' | 'bad' | null>(null);
  const { toast } = useToast();

  const quickTags = [
    { id: 'realistic', label: 'מציאותי', icon: Eye },
    { id: 'fast', label: 'מהיר', icon: Zap },
    { id: 'beautiful', label: 'יפה', icon: Palette },
    { id: 'needs_improvement', label: 'צריך שיפור', icon: Settings },
    { id: 'perfect', label: 'מושלם', icon: Star },
    { id: 'slow', label: 'אטי', icon: Settings },
    { id: 'unrealistic', label: 'לא מציאותי', icon: Eye },
    { id: 'missing_details', label: 'חסרים פרטים', icon: Settings }
  ];

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = () => {
    const feedback = {
      rating,
      quickFeedback,
      tags: selectedTags,
      comment,
      timestamp: new Date().toISOString()
    };

    console.log('🔍 Feedback submitted:', feedback);
    
    toast({
      title: "פידבק נשלח!",
      description: "תודה על הפידבק שלך, זה יעזור לנו לשפר את ההדמיה",
      duration: 3000,
    });

    // Reset form
    setRating(0);
    setSelectedTags([]);
    setComment('');
    setQuickFeedback(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">פאנל שיפור הדמיה</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            תן לנו פידבק מהיר על איכות ההדמיה כדי שנוכל לשפר
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Feedback */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">פידבק מהיר</h4>
            <div className="flex gap-2">
              <Button
                variant={quickFeedback === 'good' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFeedback('good')}
                className="flex items-center gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                מעולה
              </Button>
              <Button
                variant={quickFeedback === 'bad' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setQuickFeedback('bad')}
                className="flex items-center gap-2"
              >
                <ThumbsDown className="w-4 h-4" />
                צריך שיפור
              </Button>
            </div>
          </div>

          <Separator />

          {/* Star Rating */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">דירוג איכות (1-5 כוכבים)</h4>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="sm"
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Quick Tags */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">תגיות מהירות (בחר כמה שרוצה)</h4>
            <div className="flex flex-wrap gap-2">
              {quickTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                  className="cursor-pointer flex items-center gap-1"
                  onClick={() => toggleTag(tag.id)}
                >
                  <tag.icon className="w-3 h-3" />
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Comment */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">הערות נוספות (אופציונלי)</h4>
            <Textarea
              placeholder="מה הבעיה? מה אפשר לשפר? איך לעשות את זה יותר מציאותי?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-left">
              {comment.length}/500 תווים
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            className="w-full flex items-center gap-2"
            disabled={!rating && !quickFeedback && selectedTags.length === 0 && !comment.trim()}
          >
            <Send className="w-4 h-4" />
            שלח פידבק
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};