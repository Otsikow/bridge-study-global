import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Video, 
  Mic, 
  Play, 
  Pause, 
  Square, 
  Download, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Target,
  Clock,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tips: string[];
  sampleAnswer?: string;
}

interface InterviewSession {
  id: string;
  questions: InterviewQuestion[];
  responses: {
    questionId: string;
    audioUrl?: string;
    videoUrl?: string;
    transcript?: string;
    score?: number;
    feedback?: string;
  }[];
  overallScore?: number;
  completedAt?: Date;
}

export default function InterviewPractice() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('practice');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const questions: InterviewQuestion[] = [
    {
      id: '1',
      question: 'Tell me about yourself and why you want to study in this country.',
      category: 'personal',
      difficulty: 'easy',
      tips: [
        'Keep it concise (2-3 minutes)',
        'Focus on academic and professional background',
        'Mention specific reasons for choosing this country',
        'Show enthusiasm and passion'
      ],
      sampleAnswer: 'I am a recent graduate with a Bachelor\'s in Computer Science from [University]. I have always been passionate about technology and innovation, which led me to pursue advanced studies. I chose [Country] because of its world-class education system and cutting-edge research opportunities in my field.'
    },
    {
      id: '2',
      question: 'What are your career goals and how will this program help you achieve them?',
      category: 'academic',
      difficulty: 'medium',
      tips: [
        'Be specific about your short-term and long-term goals',
        'Connect your goals to the program curriculum',
        'Show research into the program and university',
        'Demonstrate clear career progression'
      ]
    },
    {
      id: '3',
      question: 'Why did you choose this specific university and program?',
      category: 'academic',
      difficulty: 'medium',
      tips: [
        'Research the university\'s strengths and reputation',
        'Mention specific faculty members or research areas',
        'Connect to your academic interests',
        'Show knowledge of program structure'
      ]
    },
    {
      id: '4',
      question: 'How do you plan to finance your studies?',
      category: 'financial',
      difficulty: 'easy',
      tips: [
        'Be honest about your financial situation',
        'Mention scholarships, savings, or family support',
        'Show awareness of living costs',
        'Demonstrate financial planning'
      ]
    },
    {
      id: '5',
      question: 'What challenges do you expect to face as an international student?',
      category: 'personal',
      difficulty: 'medium',
      tips: [
        'Acknowledge potential challenges honestly',
        'Show problem-solving mindset',
        'Mention support systems you\'ll use',
        'Demonstrate adaptability'
      ]
    },
    {
      id: '6',
      question: 'Describe a time when you had to work in a team with people from different cultural backgrounds.',
      category: 'behavioral',
      difficulty: 'hard',
      tips: [
        'Use the STAR method (Situation, Task, Action, Result)',
        'Show cultural sensitivity and adaptability',
        'Highlight communication skills',
        'Demonstrate leadership when appropriate'
      ]
    },
    {
      id: '7',
      question: 'What do you know about the culture and lifestyle in this country?',
      category: 'cultural',
      difficulty: 'easy',
      tips: [
        'Research cultural norms and values',
        'Mention specific aspects you\'re excited about',
        'Show respect for local customs',
        'Demonstrate cultural awareness'
      ]
    },
    {
      id: '8',
      question: 'How do you plan to contribute to the university community?',
      category: 'academic',
      difficulty: 'medium',
      tips: [
        'Mention specific clubs, organizations, or activities',
        'Show leadership potential',
        'Connect to your skills and interests',
        'Demonstrate community involvement'
      ]
    }
  ];

  const categories = ['all', 'personal', 'academic', 'financial', 'behavioral', 'cultural'];
  const difficulties = ['all', 'easy', 'medium', 'hard'];

  const filteredQuestions = questions.filter(q => {
    if (selectedCategory !== 'all' && q.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedChunks([blob]);
        // In a real implementation, you would upload this to a server
        toast({
          title: 'Recording Complete',
          description: 'Your response has been recorded successfully'
        });
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: 'Error',
        description: 'Could not access camera/microphone. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (recordedChunks.length > 0) {
      const blob = recordedChunks[0];
      const url = URL.createObjectURL(blob);
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const pauseRecording = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const startNewSession = () => {
    const session: InterviewSession = {
      id: Date.now().toString(),
      questions: filteredQuestions,
      responses: []
    };
    setCurrentSession(session);
    setCurrentQuestionIndex(0);
    setRecordedChunks([]);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setRecordedChunks([]);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setRecordedChunks([]);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'personal': return 'bg-blue-100 text-blue-800';
      case 'academic': return 'bg-purple-100 text-purple-800';
      case 'financial': return 'bg-green-100 text-green-800';
      case 'behavioral': return 'bg-orange-100 text-orange-800';
      case 'cultural': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            Interview Practice
          </h2>
          <p className="text-muted-foreground">Practice for your university interview with AI-powered feedback</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="practice">Practice Session</TabsTrigger>
          <TabsTrigger value="questions">Question Bank</TabsTrigger>
          <TabsTrigger value="feedback">Feedback & Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="practice" className="space-y-6">
          {!currentSession ? (
            <Card>
              <CardHeader>
                <CardTitle>Start Your Interview Practice</CardTitle>
                <CardDescription>
                  Choose your preferences and start practicing with common interview questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Question Category</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Difficulty Level</label>
                      <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {difficulties.map(difficulty => (
                            <SelectItem key={difficulty} value={difficulty}>
                              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-medium mb-2">Session Overview</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Questions:</span>
                          <span>{filteredQuestions.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated time:</span>
                          <span>{filteredQuestions.length * 5} minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Categories:</span>
                          <span>{new Set(filteredQuestions.map(q => q.category)).size}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={startNewSession} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Start Practice Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Progress */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Question {currentQuestionIndex + 1} of {filteredQuestions.length}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                        {currentQuestion.difficulty}
                      </Badge>
                      <Badge className={getCategoryColor(currentQuestion.category)}>
                        {currentQuestion.category}
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={((currentQuestionIndex + 1) / filteredQuestions.length) * 100} 
                    className="h-2" 
                  />
                </CardContent>
              </Card>

              {/* Question */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Interview Question
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg">{currentQuestion.question}</p>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Tips for answering:</h4>
                    <ul className="space-y-1">
                      {currentQuestion.tips.map((tip, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {currentQuestion.sampleAnswer && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Sample Answer:</h4>
                      <p className="text-sm text-muted-foreground">{currentQuestion.sampleAnswer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recording Interface */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    Record Your Response
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className="w-full max-w-md rounded-lg"
                      autoPlay
                      muted={isMuted}
                    />
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    {!isRecording ? (
                      <Button onClick={startRecording} size="lg">
                        <Video className="h-5 w-5 mr-2" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button onClick={stopRecording} size="lg" variant="destructive">
                        <Square className="h-5 w-5 mr-2" />
                        Stop Recording
                      </Button>
                    )}

                    {recordedChunks.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={isPlaying ? pauseRecording : playRecording}
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" onClick={() => setIsMuted(!isMuted)}>
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={previousQuestion}
                      disabled={currentQuestionIndex === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={nextQuestion}
                      disabled={currentQuestionIndex === filteredQuestions.length - 1}
                    >
                      Next Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interview Question Bank</CardTitle>
              <CardDescription>
                Browse and practice with common university interview questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.map((question) => (
                  <Card key={question.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <p className="text-lg font-medium">{question.question}</p>
                          <div className="flex items-center gap-2">
                            <Badge className={getDifficultyColor(question.difficulty)}>
                              {question.difficulty}
                            </Badge>
                            <Badge className={getCategoryColor(question.category)}>
                              {question.category}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Tips:</h4>
                          <ul className="space-y-1">
                            {question.tips.map((tip, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {question.sampleAnswer && (
                          <div className="p-3 bg-muted rounded-lg">
                            <h4 className="font-medium text-sm mb-2">Sample Answer:</h4>
                            <p className="text-sm text-muted-foreground">{question.sampleAnswer}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analysis</CardTitle>
              <CardDescription>
                Review your interview performance and get personalized feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No recordings yet</h3>
                <p className="text-muted-foreground">
                  Complete a practice session to see your performance analysis
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}