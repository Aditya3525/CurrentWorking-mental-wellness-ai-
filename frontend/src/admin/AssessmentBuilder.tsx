  import {
  ClipboardList,
  Plus,
  Trash2,
  GripVertical,
  Save,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { adminApi } from '../services/api';
import { useNotificationStore } from '../stores/notificationStore';

import type { Assessment } from './AssessmentList';

interface Question {
  id?: string;
  text: string;
  order: number;
  responseType: string;
  domain?: string | null;
  reverseScored?: boolean;
  options: ResponseOption[];
}

interface ResponseOption {
  id?: string;
  value: number;
  text: string;
  order: number;
}

interface InterpretationBand {
  max: number;
  label: string;
  color: string;
}

interface ScoringConfig {
  minScore: number;
  maxScore: number;
  interpretationBands: InterpretationBand[];
}

interface AssessmentBuilderProps {
  assessment: Assessment | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

const CATEGORIES = ['anxiety', 'depression', 'stress', 'trauma', 'wellbeing', 'other'];
const RESPONSE_TYPES = [
  { value: 'likert', label: 'Likert (0-3)' },
  { value: 'likert_5', label: 'Likert (0-4)' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'binary', label: 'Yes / No' }
];
const RESPONSE_TYPE_VALUES = RESPONSE_TYPES.map((type) => type.value);
const COLORS = [
  { value: '#10b981', label: 'Green' },
  { value: '#fbbf24', label: 'Yellow' },
  { value: '#f97316', label: 'Orange' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#3b82f6', label: 'Blue' },
];

export const AssessmentBuilder: React.FC<AssessmentBuilderProps> = ({
  assessment,
  open,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'scoring' | 'questions'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotificationStore();

  // Basic Info State
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('anxiety');
  const [description, setDescription] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [isActive, setIsActive] = useState(false);

  // Scoring State
  const [minScore, setMinScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [interpretationBands, setInterpretationBands] = useState<InterpretationBand[]>([
    { max: 5, label: 'Minimal', color: '#10b981' },
  ]);

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);

  const recalculateScoreRange = useCallback((questionList: Question[]) => {
    if (!questionList.length) {
      setMinScore(0);
      setMaxScore(0);
      setInterpretationBands((prev) => {
        if (!prev.length) {
          return prev;
        }
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex].max === 0) {
          return prev;
        }
        updated[lastIndex] = {
          ...updated[lastIndex],
          max: 0
        };
        return updated;
      });
      return;
    }

    const totals = questionList.reduce(
      (acc, question) => {
        if (!question.options.length) {
          return acc;
        }
        const optionValues = question.options.map((opt) => Number(opt.value));
        return {
          min: acc.min + Math.min(...optionValues),
          max: acc.max + Math.max(...optionValues)
        };
      },
      { min: 0, max: 0 }
    );

    setMinScore(totals.min);
    setMaxScore(totals.max);
    setInterpretationBands((prev) => {
      if (!prev.length) {
        return prev;
      }
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      if (updated[lastIndex].max === totals.max) {
        return prev;
      }
      updated[lastIndex] = {
        ...updated[lastIndex],
        max: totals.max
      };
      return updated;
    });
  }, []);

  const loadAssessment = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const response = await adminApi.getAssessment(id);

      // Backend returns: { success: true, data: { ...assessment... } }
      // So response.success is the success flag, and response.data is the assessment
      if (response.success && response.data) {
        const data = response.data as {
          name: string;
          type: string;
          category: string;
          description: string | null;
          timeEstimate: string | null;
          isActive: boolean;
          scoringConfig: ScoringConfig | null;
          questions: Question[];
        };
        
        setName(data.name);
        setType(data.type);
        setCategory(data.category);
        setDescription(data.description || '');
        setTimeEstimate(data.timeEstimate || '');
        setIsActive(data.isActive);

        if (data.scoringConfig) {
          setMinScore(data.scoringConfig.minScore);
          setMaxScore(data.scoringConfig.maxScore);
          setInterpretationBands(data.scoringConfig.interpretationBands);
        }

        setQuestions(data.questions || []);
        recalculateScoreRange(data.questions || []);
      } else {
        // Handle API error response
        addNotification({
          type: 'error',
          title: 'Error',
          description: response.error || 'Failed to load assessment'
        });
      }
    } catch (error: unknown) {
      console.error('Failed to load assessment:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load assessment'
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, recalculateScoreRange]);

  const resetForm = useCallback(() => {
    setName('');
    setType('');
    setCategory('anxiety');
    setDescription('');
    setTimeEstimate('');
    setIsActive(false);
    setMinScore(0);
    setMaxScore(0);
    setInterpretationBands([{ max: 5, label: 'Minimal', color: '#10b981' }]);
    setQuestions([]);
    recalculateScoreRange([]);
    setActiveTab('basic');
  }, [recalculateScoreRange]);

  // Load assessment data when editing
  useEffect(() => {
    if (!open) {
      return;
    }

    if (assessment?.id) {
      void loadAssessment(assessment.id);
    } else {
      resetForm();
    }
  }, [assessment, open, loadAssessment, resetForm]);

  const validateBasicInfo = (): string | null => {
    if (!name.trim()) return 'Assessment name is required';
    if (!type.trim()) return 'Assessment type is required';
    if (!category) return 'Category is required';
    if (!description.trim()) return 'Description is required';
    return null;
  };

  const validateScoring = (): string | null => {
    if (maxScore <= minScore) return 'Max score must be greater than min score';
    if (interpretationBands.length === 0) return 'At least one interpretation band is required';
    
    const sortedBands = [...interpretationBands].sort((a, b) => a.max - b.max);
    if (sortedBands[sortedBands.length - 1].max !== maxScore) {
      return 'Highest interpretation band must match max score';
    }

    return null;
  };

  const validateQuestions = (): string | null => {
    if (questions.length === 0) return 'At least one question is required';

    for (const question of questions) {
      if (!question.text.trim()) return 'All questions must have text';
      if (question.options.length === 0) return 'All questions must have response options';
    }

    return null;
  };

  const handleSave = async () => {
    // Validate all sections
    const basicError = validateBasicInfo();
    if (basicError) {
      setActiveTab('basic');
      addNotification({
        type: 'error',
        title: 'Validation Error',
        description: basicError
      });
      return;
    }

    const scoringError = validateScoring();
    if (scoringError) {
      setActiveTab('scoring');
      addNotification({
        type: 'error',
        title: 'Validation Error',
        description: scoringError
      });
      return;
    }

    const questionsError = validateQuestions();
    if (questionsError) {
      setActiveTab('questions');
      addNotification({
        type: 'error',
        title: 'Validation Error',
        description: questionsError
      });
      return;
    }

    // Prepare data
    const assessmentData = {
      name: name.trim(),
      type: type.trim().toLowerCase().replace(/\s+/g, '_'),
      category,
      description: description.trim(),
      timeEstimate: timeEstimate.trim() || null,
      isActive,
      scoringConfig: {
        minScore,
        maxScore,
        interpretationBands: interpretationBands.map(b => ({
          max: b.max,
          label: b.label,
          color: b.color
        }))
      },
      questions: questions.map((q, index) => ({
        text: q.text.trim(),
        order: index + 1,
        responseType: q.responseType,
        domain: q.domain || null,
        reverseScored: q.reverseScored || false,
        options: q.options.map((opt, optIndex) => ({
          value: opt.value,
          text: opt.text.trim(),
          order: optIndex + 1
        }))
      }))
    };

    try {
      setIsSaving(true);

      if (assessment?.id) {
        // Update existing
        await adminApi.updateAssessment(assessment.id, assessmentData);
        addNotification({
          type: 'success',
          title: 'Success',
          description: 'Assessment updated successfully'
        });
      } else {
        // Create new
        await adminApi.createAssessment(assessmentData);
        addNotification({
          type: 'success',
          title: 'Success',
          description: 'Assessment created successfully'
        });
      }

      onSave();
      onClose();
    } catch (error: unknown) {
      console.error('Failed to save assessment:', error);
      const err = error as { response?: { data?: { error?: string } } };
      addNotification({
        type: 'error',
        title: 'Error',
        description: err.response?.data?.error || 'Failed to save assessment'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Interpretation Band Functions
  const addBand = () => {
    const lastBand = interpretationBands[interpretationBands.length - 1];
    const newMax = lastBand ? lastBand.max + 5 : 5;
    setInterpretationBands([
      ...interpretationBands,
      { max: newMax, label: '', color: '#8b5cf6' }
    ]);
  };

  const updateBand = (index: number, field: keyof InterpretationBand, value: string | number) => {
    const updated = [...interpretationBands];
    updated[index] = { ...updated[index], [field]: value };
    setInterpretationBands(updated);
  };

  const removeBand = (index: number) => {
    setInterpretationBands(interpretationBands.filter((_, i) => i !== index));
  };

  // Question Functions
  const openQuestionModal = (question: Question | null = null) => {
    if (question) {
      setEditingQuestion(question);
    } else {
      setEditingQuestion({
        text: '',
        order: questions.length + 1,
        responseType: 'likert',
        options: [
          { value: 0, text: 'Not at all', order: 1 },
          { value: 1, text: 'Several days', order: 2 },
          { value: 2, text: 'More than half the days', order: 3 },
          { value: 3, text: 'Nearly every day', order: 4 },
        ]
      });
    }
    setQuestionModalOpen(true);
  };

  const saveQuestion = (question: Question) => {
    const nextQuestions = (() => {
      if (question.id) {
        const existing = questions.find((q) => q.id === question.id);
        if (existing) {
          return questions.map((q) => (q.id === question.id ? { ...question } : q));
        }
      }
      return [...questions, { ...question, id: question.id ?? `temp-${Date.now()}` }];
    })()
      .map((q, index) => ({ ...q, order: index + 1 }));

    setQuestions(nextQuestions);
    recalculateScoreRange(nextQuestions);

    setQuestionModalOpen(false);
    setEditingQuestion(null);
  };

  const deleteQuestion = (questionId: string | undefined) => {
    if (!questionId) return;
    const filtered = questions
      .filter((q) => q.id !== questionId)
      .map((q, index) => ({ ...q, order: index + 1 }));
    setQuestions(filtered);
    recalculateScoreRange(filtered);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[95vw] h-[88vh] max-h-[88vh] overflow-hidden flex flex-col p-4 sm:p-5">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base font-semibold">
            <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
            {assessment?.id ? 'Edit Assessment' : 'Create Assessment'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 overflow-hidden flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-3 flex-shrink-0 h-9 sm:h-10 mb-1">
                <TabsTrigger value="basic" className="text-xs sm:text-sm font-medium">
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="scoring" className="text-xs sm:text-sm font-medium">
                  Scoring
                </TabsTrigger>
                <TabsTrigger value="questions" className="text-xs sm:text-sm font-medium">
                  Questions {questions.length > 0 && `(${questions.length})`}
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden min-h-0">
                <ScrollArea className="h-full">
                  <TabsContent value="basic" className="space-y-3 pr-3 sm:pr-4 mt-0 pb-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium">Assessment Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., General Anxiety Disorder (GAD-7)"
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="type" className="text-sm font-medium">Type (Unique ID) *</Label>
                    <Input
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      placeholder="e.g., gad7"
                      disabled={!!assessment?.id}
                      className="h-9 text-sm"
                    />
                    {assessment?.id && (
                      <p className="text-xs text-muted-foreground">Type cannot be changed</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category" className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-sm">
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of what this assessment measures"
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="timeEstimate" className="text-sm font-medium">Time Estimate</Label>
                    <Input
                      id="timeEstimate"
                      value={timeEstimate}
                      onChange={(e) => setTimeEstimate(e.target.value)}
                      placeholder="e.g., 5 minutes"
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <Switch
                      id="isActive"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                    <Label htmlFor="isActive" className="text-sm font-medium">Active (visible to users)</Label>
                  </div>
                </TabsContent>

                <TabsContent value="scoring" className="space-y-3 pr-3 sm:pr-4 mt-0 pb-2">
                  <Card className="border-muted">
                    <CardHeader className="p-3 sm:p-4 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">Score Range</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="minScore" className="text-xs">Min Score</Label>
                          <Input
                            id="minScore"
                            type="number"
                            value={minScore}
                            onChange={(e) => setMinScore(Number(e.target.value))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="maxScore" className="text-xs">Max Score</Label>
                          <Input
                            id="maxScore"
                            type="number"
                            value={maxScore}
                            onChange={(e) => setMaxScore(Number(e.target.value))}
                            className="h-8 text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            Auto-calculated
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-muted">
                    <CardHeader className="p-3 sm:p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-xs sm:text-sm font-medium">Interpretation Bands</CardTitle>
                      <Button onClick={addBand} size="sm" variant="outline" className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
                      {interpretationBands.map((band, index) => (
                        <div key={index} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">Max Score</Label>
                            <Input
                              type="number"
                              value={band.max}
                              onChange={(e) => updateBand(index, 'max', Number(e.target.value))}
                              className="w-full h-8 text-sm"
                            />
                          </div>
                          <div className="flex-[2] space-y-1">
                            <Label className="text-xs">Label</Label>
                            <Input
                              value={band.label}
                              onChange={(e) => updateBand(index, 'label', e.target.value)}
                              placeholder="e.g., Minimal"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">Color</Label>
                            <Select
                              value={band.color}
                              onValueChange={(value) => updateBand(index, 'color', value)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: band.color }}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {COLORS.map((color) => (
                                  <SelectItem key={color.value} value={color.value} className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded"
                                        style={{ backgroundColor: color.value }}
                                      />
                                      {color.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBand(index)}
                            disabled={interpretationBands.length === 1}
                            className="mt-0 sm:mt-5 h-8"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {interpretationBands.length === 0 && (
                        <div className="text-xs text-muted-foreground text-center py-3">
                          No bands. Click &quot;Add&quot; to create one.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="questions" className="space-y-3 pr-3 sm:pr-4 mt-0 pb-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {questions.length} question{questions.length !== 1 ? 's' : ''}
                    </p>
                    <Button onClick={() => openQuestionModal()} size="sm" className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>

                  {questions.length === 0 ? (
                    <Card className="border-muted">
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                        <h3 className="text-sm font-semibold mb-1">No questions yet</h3>
                        <p className="text-xs text-muted-foreground mb-3">Add your first question to get started</p>
                        <Button onClick={() => openQuestionModal()} size="sm" className="h-7 text-xs">
                          <Plus className="h-3 w-3 mr-1" />
                          Add Question
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {questions.map((question, index) => (
                        <Card key={question.id || index} className="border-muted">
                          <CardContent className="p-2 sm:p-3">
                            <div className="flex gap-2">
                              <div className="flex items-start pt-1 hidden sm:block">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-1 mb-1">
                                      <Badge variant="outline" className="h-5 text-xs px-1.5">Q{index + 1}</Badge>
                                      <Badge variant="secondary" className="h-5 text-xs px-1.5">{question.responseType}</Badge>
                                      {question.reverseScored && (
                                        <Badge variant="outline" className="h-5 text-xs px-1.5">Reverse</Badge>
                                      )}
                                    </div>
                                    <p className="text-xs sm:text-sm font-medium break-words">{question.text}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {question.options.length} options
                                    </p>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0 w-full sm:w-auto">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openQuestionModal(question)}
                                      className="flex-1 sm:flex-initial h-7 text-xs"
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteQuestion(question.id)}
                                      className="flex-1 sm:flex-initial h-7"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
              </div>
            </Tabs>

            <DialogFooter className="flex-shrink-0 mt-3 pt-3 border-t gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSaving} className="flex-1 sm:flex-initial h-9 text-sm">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-initial h-9 text-sm">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Assessment
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Question Builder Modal */}
        {editingQuestion && (
          <QuestionBuilderModal
            question={editingQuestion}
            open={questionModalOpen}
            onClose={() => {
              setQuestionModalOpen(false);
              setEditingQuestion(null);
            }}
            onSave={saveQuestion}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

// Simple Question Builder Modal Component
interface QuestionBuilderModalProps {
  question: Question;
  open: boolean;
  onClose: () => void;
  onSave: (question: Question) => void;
}

const QuestionBuilderModal: React.FC<QuestionBuilderModalProps> = ({
  question,
  open,
  onClose,
  onSave
}) => {
  const initialResponseType = RESPONSE_TYPE_VALUES.includes(question.responseType)
    ? question.responseType
    : 'likert';

  const [text, setText] = useState(question.text);
  const [responseType, setResponseType] = useState(initialResponseType);
  const [reverseScored, setReverseScored] = useState(question.reverseScored || false);
  const [options, setOptions] = useState<ResponseOption[]>(question.options);

  useEffect(() => {
    setText(question.text);
    setResponseType(RESPONSE_TYPE_VALUES.includes(question.responseType) ? question.responseType : 'likert');
    setReverseScored(question.reverseScored || false);
    setOptions(question.options);
  }, [question]);

  const addOption = () => {
    setOptions((prev) => {
      const newValue = prev.length;
      return [
        ...prev,
        { value: newValue, text: '', order: prev.length + 1 }
      ];
    });
  };

  const updateOption = (index: number, field: keyof ResponseOption, value: string | number) => {
    setOptions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeOption = (index: number) => {
    setOptions((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((option, idx) => ({ ...option, order: idx + 1 }))
    );
  };

  const handleSave = () => {
    if (!text.trim()) {
      return;
    }

    const sanitizedOptions = options
      .filter((opt) => opt.text.trim() !== '')
      .map((opt, index) => ({
        ...opt,
        text: opt.text.trim(),
        order: index + 1
      }));

    if (!sanitizedOptions.length) {
      return;
    }

    onSave({
      ...question,
      text: text.trim(),
      responseType,
      reverseScored,
      options: sanitizedOptions
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[92vw] max-h-[80vh] overflow-hidden flex flex-col p-3 sm:p-4">
        <DialogHeader className="flex-shrink-0 pb-1">
          <DialogTitle className="text-sm sm:text-base">
            {question.id ? 'Edit Question' : 'Add Question'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0">
          <ScrollArea className="h-full">
            <div className="space-y-3 pr-2 sm:pr-3">
            <div className="space-y-1.5">
              <Label htmlFor="questionText" className="text-xs sm:text-sm">Question Text *</Label>
              <Textarea
                id="questionText"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter your question"
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="responseType" className="text-xs sm:text-sm">Response Type</Label>
              <Select value={responseType} onValueChange={setResponseType}>
                <SelectTrigger id="responseType" className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-sm">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Switch
                id="reverseScored"
                checked={reverseScored}
                onCheckedChange={setReverseScored}
              />
              <Label htmlFor="reverseScored" className="text-xs sm:text-sm">Reverse Scored (higher = better)</Label>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <Label className="text-xs sm:text-sm">Response Options</Label>
                <Button onClick={addOption} size="sm" variant="outline" className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="w-14 sm:w-16">
                      <Input
                        type="number"
                        value={option.value}
                        onChange={(e) => updateOption(index, 'value', Number(e.target.value))}
                        placeholder="Val"
                        className="text-xs sm:text-sm h-8"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Input
                        value={option.text}
                        onChange={(e) => updateOption(index, 'text', e.target.value)}
                        placeholder="Option text"
                        className="text-xs sm:text-sm h-8"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      disabled={options.length === 1}
                      className="flex-shrink-0 h-8"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        </div>

        <DialogFooter className="flex-shrink-0 mt-2 pt-2 border-t gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-initial h-8 text-xs sm:text-sm">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!text.trim() || options.filter((opt) => opt.text.trim()).length === 0}
            className="flex-1 sm:flex-initial h-8 text-xs sm:text-sm"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
