import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Star, 
  Send, 
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Bug,
  Lightbulb,
  Heart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeedbackForm {
  type: 'general' | 'bug' | 'feature' | 'improvement';
  rating: number;
  category: string;
  message: string;
  contact: boolean;
  email?: string;
}

export default function UserFeedback() {
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<FeedbackForm>({
    type: 'general',
    rating: 0,
    category: '',
    message: '',
    contact: false,
    email: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const feedbackTypes = [
    { value: 'general', label: 'General Feedback', icon: MessageSquare },
    { value: 'bug', label: 'Bug Report', icon: Bug },
    { value: 'feature', label: 'Feature Request', icon: Lightbulb },
    { value: 'improvement', label: 'Improvement Suggestion', icon: ThumbsUp }
  ];

  const categories = {
    general: ['User Experience', 'Navigation', 'Performance', 'Content', 'Other'],
    bug: ['Login Issues', 'Data Not Loading', 'Form Errors', 'Mobile Issues', 'Other'],
    feature: ['New Tools', 'Dashboard Features', 'AI Features', 'Communication', 'Other'],
    improvement: ['UI/UX', 'Performance', 'Functionality', 'Content', 'Other']
  };

  const handleSubmit = async () => {
    if (!feedback.message.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide your feedback message',
        variant: 'destructive'
      });
      return;
    }

    if (feedback.contact && !feedback.email) {
      toast({
        title: 'Error',
        description: 'Please provide your email address',
        variant: 'destructive'
      });
      return;
    }

    try {
      // In real implementation, this would send to backend
      console.log('Feedback submitted:', feedback);
      
      toast({
        title: 'Thank you!',
        description: 'Your feedback has been submitted successfully'
      });
      
      setSubmitted(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFeedback({
      type: 'general',
      rating: 0,
      category: '',
      message: '',
      contact: false,
      email: ''
    });
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 mx-auto text-success" />
            <div>
              <h3 className="text-xl font-semibold">Thank you for your feedback!</h3>
              <p className="text-muted-foreground">
                We appreciate you taking the time to help us improve GEG.
              </p>
            </div>
            <Button onClick={resetForm}>
              Submit Another Feedback
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          Share Your Feedback
        </h2>
        <p className="text-muted-foreground">
          Help us improve GEG by sharing your thoughts, reporting issues, or suggesting new features
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feedback Form</CardTitle>
          <CardDescription>
            Your feedback helps us make GEG better for everyone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Feedback Type */}
          <div className="space-y-3">
            <Label>What type of feedback is this?</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {feedbackTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    variant={feedback.type === type.value ? "default" : "outline"}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => setFeedback(prev => ({ ...prev, type: type.value as any, category: '' }))}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm">{type.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-3">
            <Label>Category</Label>
            <Select value={feedback.category} onValueChange={(value) => setFeedback(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories[feedback.type].map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <Label>How would you rate your overall experience?</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant={feedback.rating >= rating ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFeedback(prev => ({ ...prev, rating }))}
                  className="h-10 w-10 p-0"
                >
                  <Star className={`h-4 w-4 ${feedback.rating >= rating ? 'fill-current' : ''}`} />
                </Button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {feedback.rating === 0 ? 'Select rating' : 
                 feedback.rating === 1 ? 'Poor' :
                 feedback.rating === 2 ? 'Fair' :
                 feedback.rating === 3 ? 'Good' :
                 feedback.rating === 4 ? 'Very Good' : 'Excellent'}
              </span>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <Label>Your feedback *</Label>
            <Textarea
              placeholder="Please describe your feedback in detail..."
              value={feedback.message}
              onChange={(e) => setFeedback(prev => ({ ...prev, message: e.target.value }))}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Contact Preference */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="contact"
                checked={feedback.contact}
                onChange={(e) => setFeedback(prev => ({ ...prev, contact: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="contact" className="text-sm">
                I'd like to be contacted about this feedback
              </Label>
            </div>
            
            {feedback.contact && (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={feedback.email}
                  onChange={(e) => setFeedback(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={!feedback.message.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Submit Feedback
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Feedback Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Feedback</CardTitle>
          <CardDescription>
            Share quick thoughts about specific features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-success" />
              <span className="text-sm">AI Tools</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-destructive" />
              <span className="text-sm">Search</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-sm">Dashboard</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <MessageSquare className="h-5 w-5 text-info" />
              <span className="text-sm">Support</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}