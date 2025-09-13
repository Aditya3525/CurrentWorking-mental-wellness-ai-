import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Label } from '../../ui/label';
import { 
  ArrowLeft,
  ArrowRight,
  Clock,
  Brain,
  Heart,
  Sparkles,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface AssessmentFlowProps {
  assessmentId: string;
  onComplete: (scores: any) => void;
  onNavigate: (page: string) => void;
}

interface Question {
  id: string;
  text: string;
  subtext?: string;
  type: 'likert' | 'multiple-choice' | 'binary';
  options: Array<{
    value: string;
    label: string;
    score: number;
  }>;
}

interface AssessmentData {
  title: string;
  description: string;
  totalQuestions: number;
  estimatedTime: string;
  questions: Question[];
  scoringKey: string;
}

export function AssessmentFlow({ assessmentId, onComplete, onNavigate }: AssessmentFlowProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime] = useState(Date.now());
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock assessment data - in real app this would come from API
  const getAssessmentData = (id: string): AssessmentData => {
    const assessments: Record<string, AssessmentData> = {
      anxiety: {
        title: 'Anxiety Assessment',
        description: 'This assessment helps identify your anxiety patterns and triggers.',
        totalQuestions: 10, // Shortened for demo
        estimatedTime: '5-7 minutes',
        scoringKey: 'anxiety',
        questions: [
          {
            id: 'anxiety_1',
            text: 'How often do you feel nervous, anxious, or on edge?',
            type: 'likert',
            options: [
              { value: '0', label: 'Not at all', score: 0 },
              { value: '1', label: 'Several days', score: 25 },
              { value: '2', label: 'More than half the days', score: 50 },
              { value: '3', label: 'Nearly every day', score: 75 },
            ]
          },
          {
            id: 'anxiety_2',
            text: 'How often do you have trouble relaxing?',
            type: 'likert',
            options: [
              { value: '0', label: 'Not at all', score: 0 },
              { value: '1', label: 'Several days', score: 25 },
              { value: '2', label: 'More than half the days', score: 50 },
              { value: '3', label: 'Nearly every day', score: 75 },
            ]
          },
          {
            id: 'anxiety_3',
            text: 'Do you worry too much about different things?',
            type: 'likert',
            options: [
              { value: '0', label: 'Not at all', score: 0 },
              { value: '1', label: 'Several days', score: 25 },
              { value: '2', label: 'More than half the days', score: 50 },
              { value: '3', label: 'Nearly every day', score: 75 },
            ]
          },
          {
            id: 'anxiety_4',
            text: 'How often do you feel restless or find it hard to sit still?',
            type: 'likert',
            options: [
              { value: '0', label: 'Not at all', score: 0 },
              { value: '1', label: 'Several days', score: 25 },
              { value: '2', label: 'More than half the days', score: 50 },
              { value: '3', label: 'Nearly every day', score: 75 },
            ]
          },
          {
            id: 'anxiety_5',
            text: 'Do you have trouble falling or staying asleep due to worry?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, my sleep is fine', score: 0 },
              { value: 'sometimes', label: 'Sometimes it affects my sleep', score: 50 },
              { value: 'yes', label: 'Yes, frequently affects my sleep', score: 100 },
            ]
          },
          {
            id: 'anxiety_6',
            text: 'How often do you experience physical symptoms when anxious (rapid heartbeat, sweating, trembling)?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '3', label: 'Often', score: 80 },
            ]
          },
          {
            id: 'anxiety_7',
            text: 'Do you avoid certain situations because they make you anxious?',
            type: 'multiple-choice',
            options: [
              { value: 'never', label: 'Never avoid situations', score: 0 },
              { value: 'rarely', label: 'Rarely avoid situations', score: 25 },
              { value: 'sometimes', label: 'Sometimes avoid situations', score: 50 },
              { value: 'often', label: 'Often avoid situations', score: 75 },
              { value: 'always', label: 'Frequently avoid situations', score: 100 },
            ]
          },
          {
            id: 'anxiety_8',
            text: 'How would you rate your overall anxiety level in the past two weeks?',
            type: 'likert',
            options: [
              { value: '1', label: 'Very low', score: 10 },
              { value: '2', label: 'Low', score: 30 },
              { value: '3', label: 'Moderate', score: 50 },
              { value: '4', label: 'High', score: 70 },
              { value: '5', label: 'Very high', score: 90 },
            ]
          },
          {
            id: 'anxiety_9',
            text: 'Do you feel like your worries are hard to control?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, I can usually manage my worries', score: 0 },
              { value: 'sometimes', label: 'Sometimes they feel out of control', score: 50 },
              { value: 'yes', label: 'Yes, they often feel uncontrollable', score: 100 },
            ]
          },
          {
            id: 'anxiety_10',
            text: 'How much do anxiety symptoms interfere with your daily activities?',
            type: 'likert',
            options: [
              { value: '0', label: 'Not at all', score: 0 },
              { value: '1', label: 'A little bit', score: 25 },
              { value: '2', label: 'Moderately', score: 50 },
              { value: '3', label: 'Quite a bit', score: 75 },
              { value: '4', label: 'Extremely', score: 100 },
            ]
          },
        ]
      },
      overthinking: {
        title: 'Overthinking Patterns Assessment',
        description: 'Identify rumination patterns and thought loops that create anxiety',
        totalQuestions: 20,
        estimatedTime: '6-8 minutes',
        scoringKey: 'overthinking',
        questions: [
          {
            id: 'overthinking_1',
            text: 'How often do you find yourself replaying conversations or events in your mind?',
            type: 'likert',
            options: [
              { value: '0', label: 'Rarely or never', score: 0 },
              { value: '1', label: 'Sometimes', score: 25 },
              { value: '2', label: 'Often', score: 50 },
              { value: '3', label: 'Very often', score: 75 },
              { value: '4', label: 'Almost constantly', score: 100 },
            ]
          },
          {
            id: 'overthinking_2',
            text: 'Do you have trouble making decisions because you consider too many possibilities?',
            type: 'likert',
            options: [
              { value: '0', label: 'Not at all', score: 0 },
              { value: '1', label: 'Slightly', score: 25 },
              { value: '2', label: 'Moderately', score: 50 },
              { value: '3', label: 'Considerably', score: 75 },
              { value: '4', label: 'Extremely', score: 100 },
            ]
          },
          {
            id: 'overthinking_3',
            text: 'How often do you worry about what others think of you?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 40 },
              { value: '3', label: 'Often', score: 70 },
              { value: '4', label: 'Almost always', score: 100 },
            ]
          },
          {
            id: 'overthinking_4',
            text: 'Do you find yourself analyzing your own thoughts and behaviors excessively?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, I rarely self-analyze', score: 0 },
              { value: 'sometimes', label: 'Sometimes I do this', score: 50 },
              { value: 'yes', label: 'Yes, I do this frequently', score: 100 },
            ]
          },
          {
            id: 'overthinking_5',
            text: 'How often do you have trouble falling asleep because your mind is racing?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: '1-2 times per month', score: 20 },
              { value: '2', label: '1-2 times per week', score: 50 },
              { value: '3', label: 'Most nights', score: 80 },
              { value: '4', label: 'Every night', score: 100 },
            ]
          },
          {
            id: 'overthinking_6',
            text: 'Do you often think about worst-case scenarios?',
            type: 'likert',
            options: [
              { value: '0', label: 'Rarely', score: 0 },
              { value: '1', label: 'Sometimes', score: 25 },
              { value: '2', label: 'Often', score: 50 },
              { value: '3', label: 'Very often', score: 75 },
              { value: '4', label: 'Almost always', score: 100 },
            ]
          },
          {
            id: 'overthinking_7',
            text: 'How often do you second-guess decisions you\'ve already made?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 40 },
              { value: '3', label: 'Often', score: 70 },
              { value: '4', label: 'Almost always', score: 100 },
            ]
          },
          {
            id: 'overthinking_8',
            text: 'Do you find it difficult to be present in the moment because you\'re thinking about other things?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, I can usually stay present', score: 0 },
              { value: 'sometimes', label: 'Sometimes I get distracted', score: 50 },
              { value: 'yes', label: 'Yes, my mind wanders frequently', score: 100 },
            ]
          },
          {
            id: 'overthinking_9',
            text: 'How often do you ruminate on past mistakes or embarrassing moments?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 40 },
              { value: '3', label: 'Often', score: 70 },
              { value: '4', label: 'Very frequently', score: 100 },
            ]
          },
          {
            id: 'overthinking_10',
            text: 'Do you often feel mentally exhausted from thinking too much?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, thinking doesn\'t tire me', score: 0 },
              { value: 'sometimes', label: 'Sometimes I feel mentally drained', score: 50 },
              { value: 'yes', label: 'Yes, I often feel mentally exhausted', score: 100 },
            ]
          },
          {
            id: 'overthinking_11',
            text: 'How often do you create elaborate scenarios in your head about future events?',
            type: 'likert',
            options: [
              { value: '0', label: 'Rarely', score: 0 },
              { value: '1', label: 'Sometimes', score: 25 },
              { value: '2', label: 'Often', score: 50 },
              { value: '3', label: 'Very often', score: 75 },
              { value: '4', label: 'Almost constantly', score: 100 },
            ]
          },
          {
            id: 'overthinking_12',
            text: 'Do you have difficulty accepting compliments because you analyze their sincerity?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, I accept compliments easily', score: 0 },
              { value: 'sometimes', label: 'Sometimes I question them', score: 50 },
              { value: 'yes', label: 'Yes, I always analyze their meaning', score: 100 },
            ]
          },
          {
            id: 'overthinking_13',
            text: 'How often do you seek excessive reassurance from others about your decisions?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 40 },
              { value: '3', label: 'Often', score: 70 },
              { value: '4', label: 'Almost always', score: 100 },
            ]
          },
          {
            id: 'overthinking_14',
            text: 'Do you find yourself stuck in loops of "what if" thinking?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, I rarely think in "what ifs"', score: 0 },
              { value: 'sometimes', label: 'Sometimes I get caught in this', score: 50 },
              { value: 'yes', label: 'Yes, I frequently get stuck in "what if" loops', score: 100 },
            ]
          },
          {
            id: 'overthinking_15',
            text: 'How often do you feel like you can\'t turn off your thoughts?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 40 },
              { value: '3', label: 'Often', score: 70 },
              { value: '4', label: 'Almost constantly', score: 100 },
            ]
          },
          {
            id: 'overthinking_16',
            text: 'Do you tend to overanalyze text messages or social media interactions?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, I take them at face value', score: 0 },
              { value: 'sometimes', label: 'Sometimes I read into them', score: 50 },
              { value: 'yes', label: 'Yes, I frequently overanalyze them', score: 100 },
            ]
          },
          {
            id: 'overthinking_17',
            text: 'How often do you postpone taking action because you\'re still thinking about it?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 40 },
              { value: '3', label: 'Often', score: 70 },
              { value: '4', label: 'Very frequently', score: 100 },
            ]
          },
          {
            id: 'overthinking_18',
            text: 'Do you find yourself rehearsing conversations before they happen?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, I speak spontaneously', score: 0 },
              { value: 'sometimes', label: 'Sometimes for important conversations', score: 30 },
              { value: 'yes', label: 'Yes, I rehearse most conversations', score: 100 },
            ]
          },
          {
            id: 'overthinking_19',
            text: 'How often do you feel overwhelmed by the number of thoughts in your head?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 40 },
              { value: '3', label: 'Often', score: 70 },
              { value: '4', label: 'Almost daily', score: 100 },
            ]
          },
          {
            id: 'overthinking_20',
            text: 'Do you believe that thinking more about a problem will always lead to a better solution?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, sometimes I need to stop thinking and act', score: 0 },
              { value: 'sometimes', label: 'Sometimes, depending on the situation', score: 40 },
              { value: 'yes', label: 'Yes, more thinking always helps', score: 100 },
            ]
          },
        ]
      },
      personality: {
        title: 'Personality Type Assessment',
        description: 'Discover your core personality traits using the Big 5 model',
        totalQuestions: 25,
        estimatedTime: '10-12 minutes',
        scoringKey: 'personality',
        questions: [
          {
            id: 'personality_1',
            text: 'I see myself as someone who is talkative',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 20 },
              { value: '2', label: 'Disagree a little', score: 40 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 80 },
              { value: '5', label: 'Agree strongly', score: 100 },
            ]
          },
          {
            id: 'personality_2',
            text: 'I see myself as someone who tends to find fault with others',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 100 },
              { value: '2', label: 'Disagree a little', score: 80 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 40 },
              { value: '5', label: 'Agree strongly', score: 20 },
            ]
          },
          {
            id: 'personality_3',
            text: 'I see myself as someone who does a thorough job',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 20 },
              { value: '2', label: 'Disagree a little', score: 40 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 80 },
              { value: '5', label: 'Agree strongly', score: 100 },
            ]
          },
          {
            id: 'personality_4',
            text: 'I see myself as someone who is depressed, blue',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 100 },
              { value: '2', label: 'Disagree a little', score: 80 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 40 },
              { value: '5', label: 'Agree strongly', score: 20 },
            ]
          },
          {
            id: 'personality_5',
            text: 'I see myself as someone who is original, comes up with new ideas',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 20 },
              { value: '2', label: 'Disagree a little', score: 40 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 80 },
              { value: '5', label: 'Agree strongly', score: 100 },
            ]
          },
          {
            id: 'personality_6',
            text: 'I see myself as someone who is reserved',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 100 },
              { value: '2', label: 'Disagree a little', score: 80 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 40 },
              { value: '5', label: 'Agree strongly', score: 20 },
            ]
          },
          {
            id: 'personality_7',
            text: 'I see myself as someone who is helpful and unselfish with others',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 20 },
              { value: '2', label: 'Disagree a little', score: 40 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 80 },
              { value: '5', label: 'Agree strongly', score: 100 },
            ]
          },
          {
            id: 'personality_8',
            text: 'I see myself as someone who can be somewhat careless',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 100 },
              { value: '2', label: 'Disagree a little', score: 80 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 40 },
              { value: '5', label: 'Agree strongly', score: 20 },
            ]
          },
          {
            id: 'personality_9',
            text: 'I see myself as someone who is relaxed, handles stress well',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 20 },
              { value: '2', label: 'Disagree a little', score: 40 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 80 },
              { value: '5', label: 'Agree strongly', score: 100 },
            ]
          },
          {
            id: 'personality_10',
            text: 'I see myself as someone who is curious about many different things',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 20 },
              { value: '2', label: 'Disagree a little', score: 40 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 80 },
              { value: '5', label: 'Agree strongly', score: 100 },
            ]
          },
          {
            id: 'personality_11',
            text: 'I see myself as someone who is full of energy',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 20 },
              { value: '2', label: 'Disagree a little', score: 40 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 80 },
              { value: '5', label: 'Agree strongly', score: 100 },
            ]
          },
          {
            id: 'personality_12',
            text: 'I see myself as someone who starts quarrels with others',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 100 },
              { value: '2', label: 'Disagree a little', score: 80 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 40 },
              { value: '5', label: 'Agree strongly', score: 20 },
            ]
          },
          {
            id: 'personality_13',
            text: 'I see myself as someone who is a reliable worker',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 20 },
              { value: '2', label: 'Disagree a little', score: 40 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 80 },
              { value: '5', label: 'Agree strongly', score: 100 },
            ]
          },
          {
            id: 'personality_14',
            text: 'I see myself as someone who can be tense',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 100 },
              { value: '2', label: 'Disagree a little', score: 80 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 40 },
              { value: '5', label: 'Agree strongly', score: 20 },
            ]
          },
          {
            id: 'personality_15',
            text: 'I see myself as someone who is ingenious, a deep thinker',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 20 },
              { value: '2', label: 'Disagree a little', score: 40 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 80 },
              { value: '5', label: 'Agree strongly', score: 100 },
            ]
          },
          {
            id: 'personality_16',
            text: 'I see myself as someone who generates a lot of enthusiasm',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 20 },
              { value: '2', label: 'Disagree a little', score: 40 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 80 },
              { value: '5', label: 'Agree strongly', score: 100 },
            ]
          },
          {
            id: 'personality_17',
            text: 'I see myself as someone who has a forgiving nature',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 20 },
              { value: '2', label: 'Disagree a little', score: 40 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 80 },
              { value: '5', label: 'Agree strongly', score: 100 },
            ]
          },
          {
            id: 'personality_18',
            text: 'I see myself as someone who tends to be disorganized',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 100 },
              { value: '2', label: 'Disagree a little', score: 80 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 40 },
              { value: '5', label: 'Agree strongly', score: 20 },
            ]
          },
          {
            id: 'personality_19',
            text: 'I see myself as someone who worries a lot',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 100 },
              { value: '2', label: 'Disagree a little', score: 80 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 40 },
              { value: '5', label: 'Agree strongly', score: 20 },
            ]
          },
          {
            id: 'personality_20',
            text: 'I see myself as someone who has an active imagination',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 20 },
              { value: '2', label: 'Disagree a little', score: 40 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 80 },
              { value: '5', label: 'Agree strongly', score: 100 },
            ]
          },
          {
            id: 'personality_21',
            text: 'I see myself as someone who tends to be quiet',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 100 },
              { value: '2', label: 'Disagree a little', score: 80 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 40 },
              { value: '5', label: 'Agree strongly', score: 20 },
            ]
          },
          {
            id: 'personality_22',
            text: 'I see myself as someone who is generally trusting',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 20 },
              { value: '2', label: 'Disagree a little', score: 40 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 80 },
              { value: '5', label: 'Agree strongly', score: 100 },
            ]
          },
          {
            id: 'personality_23',
            text: 'I see myself as someone who tends to be lazy',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 100 },
              { value: '2', label: 'Disagree a little', score: 80 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 40 },
              { value: '5', label: 'Agree strongly', score: 20 },
            ]
          },
          {
            id: 'personality_24',
            text: 'I see myself as someone who is emotionally stable, not easily upset',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 20 },
              { value: '2', label: 'Disagree a little', score: 40 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 80 },
              { value: '5', label: 'Agree strongly', score: 100 },
            ]
          },
          {
            id: 'personality_25',
            text: 'I see myself as someone who is inventive',
            type: 'likert',
            options: [
              { value: '1', label: 'Disagree strongly', score: 20 },
              { value: '2', label: 'Disagree a little', score: 40 },
              { value: '3', label: 'Neither agree nor disagree', score: 60 },
              { value: '4', label: 'Agree a little', score: 80 },
              { value: '5', label: 'Agree strongly', score: 100 },
            ]
          },
        ]
      },
      'trauma-fear': {
        title: 'Trauma & Fear Response Assessment',
        description: 'Gentle assessment of trauma responses and fear patterns (optional, sensitive content)',
        totalQuestions: 22,
        estimatedTime: '8-10 minutes',
        scoringKey: 'trauma-fear',
        questions: [
          {
            id: 'trauma_1',
            text: 'How often do you experience unwanted memories of distressing events?',
            subtext: 'Take your time with this question. You can skip any question that feels too difficult.',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 40 },
              { value: '3', label: 'Often', score: 70 },
              { value: '4', label: 'Very often', score: 100 },
            ]
          },
          {
            id: 'trauma_2',
            text: 'Do you find yourself avoiding places, people, or activities that remind you of difficult experiences?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, I don\'t avoid things', score: 0 },
              { value: 'sometimes', label: 'Sometimes I avoid certain triggers', score: 50 },
              { value: 'yes', label: 'Yes, I frequently avoid reminders', score: 100 },
            ]
          },
          {
            id: 'trauma_3',
            text: 'How often do you feel emotionally numb or disconnected from others?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 40 },
              { value: '3', label: 'Often', score: 70 },
              { value: '4', label: 'Almost always', score: 100 },
            ]
          },
          {
            id: 'trauma_4',
            text: 'Do you experience sudden, intense fear or panic in situations that remind you of past events?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, I don\'t experience this', score: 0 },
              { value: 'sometimes', label: 'Sometimes in specific situations', score: 60 },
              { value: 'yes', label: 'Yes, this happens frequently', score: 100 },
            ]
          },
          {
            id: 'trauma_5',
            text: 'How often do you feel hypervigilant or constantly on guard?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 40 },
              { value: '3', label: 'Often', score: 70 },
              { value: '4', label: 'Almost constantly', score: 100 },
            ]
          },
          {
            id: 'trauma_6',
            text: 'Do you have trouble sleeping due to distressing thoughts or nightmares?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, my sleep is usually fine', score: 0 },
              { value: 'sometimes', label: 'Sometimes I have sleep difficulties', score: 50 },
              { value: 'yes', label: 'Yes, sleep is frequently disrupted', score: 100 },
            ]
          },
          {
            id: 'trauma_7',
            text: 'How often do you feel like you\'re watching yourself from outside your body?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 25 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '3', label: 'Often', score: 75 },
              { value: '4', label: 'Very often', score: 100 },
            ]
          },
          {
            id: 'trauma_8',
            text: 'Do you experience sudden mood changes or emotional outbursts?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, my emotions are usually stable', score: 0 },
              { value: 'sometimes', label: 'Sometimes I have unexpected reactions', score: 50 },
              { value: 'yes', label: 'Yes, this happens frequently', score: 100 },
            ]
          },
          {
            id: 'trauma_9',
            text: 'How often do you feel like you can\'t trust your own judgment?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 40 },
              { value: '3', label: 'Often', score: 70 },
              { value: '4', label: 'Almost always', score: 100 },
            ]
          },
          {
            id: 'trauma_10',
            text: 'Do you experience physical symptoms (headaches, stomach issues, muscle tension) when stressed?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, stress doesn\'t affect me physically', score: 0 },
              { value: 'sometimes', label: 'Sometimes I notice physical symptoms', score: 40 },
              { value: 'yes', label: 'Yes, I frequently have physical symptoms', score: 100 },
            ]
          },
          {
            id: 'trauma_11',
            text: 'How often do you feel like you\'re in danger even when you\'re safe?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 25 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '3', label: 'Often', score: 75 },
              { value: '4', label: 'Almost constantly', score: 100 },
            ]
          },
          {
            id: 'trauma_12',
            text: 'Do you find it difficult to concentrate or remember things?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, my concentration is usually fine', score: 0 },
              { value: 'sometimes', label: 'Sometimes I have focus issues', score: 50 },
              { value: 'yes', label: 'Yes, concentration is often difficult', score: 100 },
            ]
          },
          {
            id: 'trauma_13',
            text: 'How often do you feel guilty or blame yourself for things that happened?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 40 },
              { value: '3', label: 'Often', score: 70 },
              { value: '4', label: 'Almost always', score: 100 },
            ]
          },
          {
            id: 'trauma_14',
            text: 'Do you have trouble feeling positive emotions like joy or love?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, I can feel positive emotions normally', score: 0 },
              { value: 'sometimes', label: 'Sometimes positive emotions feel muted', score: 50 },
              { value: 'yes', label: 'Yes, positive emotions are rare or absent', score: 100 },
            ]
          },
          {
            id: 'trauma_15',
            text: 'How often do you startle easily at unexpected sounds or movements?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 40 },
              { value: '3', label: 'Often', score: 70 },
              { value: '4', label: 'Almost always', score: 100 },
            ]
          },
          {
            id: 'trauma_16',
            text: 'Do you feel like you don\'t deserve good things in your life?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, I believe I deserve good things', score: 0 },
              { value: 'sometimes', label: 'Sometimes I question if I deserve happiness', score: 50 },
              { value: 'yes', label: 'Yes, I often feel undeserving', score: 100 },
            ]
          },
          {
            id: 'trauma_17',
            text: 'How often do you engage in self-destructive behaviors when distressed?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 25 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '3', label: 'Often', score: 75 },
              { value: '4', label: 'Very often', score: 100 },
            ]
          },
          {
            id: 'trauma_18',
            text: 'Do you find it hard to trust others or form close relationships?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, I can trust and connect with others', score: 0 },
              { value: 'sometimes', label: 'Sometimes I struggle with trust', score: 50 },
              { value: 'yes', label: 'Yes, trust and connection are very difficult', score: 100 },
            ]
          },
          {
            id: 'trauma_19',
            text: 'How often do you feel like the world is generally unsafe?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 40 },
              { value: '3', label: 'Often', score: 70 },
              { value: '4', label: 'Almost always', score: 100 },
            ]
          },
          {
            id: 'trauma_20',
            text: 'Do you use substances (alcohol, drugs, medication) to cope with difficult feelings?',
            type: 'binary',
            options: [
              { value: 'no', label: 'No, I don\'t use substances to cope', score: 0 },
              { value: 'sometimes', label: 'Sometimes I use substances for relief', score: 70 },
              { value: 'yes', label: 'Yes, I frequently use substances to cope', score: 100 },
            ]
          },
          {
            id: 'trauma_21',
            text: 'How often do you feel like you\'re different from other people in a fundamental way?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 40 },
              { value: '3', label: 'Often', score: 70 },
              { value: '4', label: 'Almost always', score: 100 },
            ]
          },
          {
            id: 'trauma_22',
            text: 'Do you feel hopeful about your ability to heal and recover?',
            type: 'binary',
            options: [
              { value: 'yes', label: 'Yes, I feel hopeful about recovery', score: 0 },
              { value: 'sometimes', label: 'Sometimes I feel hopeful', score: 40 },
              { value: 'no', label: 'No, recovery feels impossible', score: 100 },
            ]
          },
        ]
      },
      stress: {
        title: 'Stress Level Check',
        description: 'Evaluate your current stress levels and identify key stressors in your daily life.',
        totalQuestions: 18,
        estimatedTime: '4-6 minutes',
        scoringKey: 'stress',
        questions: [
          {
            id: 'stress_1',
            text: 'How often have you been upset because of something that happened unexpectedly?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Almost never', score: 20 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '3', label: 'Fairly often', score: 75 },
              { value: '4', label: 'Very often', score: 100 },
            ]
          },
          {
            id: 'stress_2',
            text: 'How often have you felt that you were unable to control the important things in your life?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Almost never', score: 20 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '3', label: 'Fairly often', score: 75 },
              { value: '4', label: 'Very often', score: 100 },
            ]
          },
          {
            id: 'stress_3',
            text: 'How often have you felt nervous and stressed?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Almost never', score: 20 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '3', label: 'Fairly often', score: 75 },
              { value: '4', label: 'Very often', score: 100 },
            ]
          },
          {
            id: 'stress_4',
            text: 'How often have you felt confident about your ability to handle your personal problems?',
            type: 'likert',
            options: [
              { value: '4', label: 'Never', score: 100 },
              { value: '3', label: 'Almost never', score: 75 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '1', label: 'Fairly often', score: 20 },
              { value: '0', label: 'Very often', score: 0 },
            ]
          },
          {
            id: 'stress_5',
            text: 'How often have you felt that things were going your way?',
            type: 'likert',
            options: [
              { value: '4', label: 'Never', score: 100 },
              { value: '3', label: 'Almost never', score: 75 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '1', label: 'Fairly often', score: 20 },
              { value: '0', label: 'Very often', score: 0 },
            ]
          },
          {
            id: 'stress_6',
            text: 'How often have you found that you could not cope with all the things that you had to do?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Almost never', score: 20 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '3', label: 'Fairly often', score: 75 },
              { value: '4', label: 'Very often', score: 100 },
            ]
          },
          {
            id: 'stress_7',
            text: 'How often have you been able to control irritations in your life?',
            type: 'likert',
            options: [
              { value: '4', label: 'Never', score: 100 },
              { value: '3', label: 'Almost never', score: 75 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '1', label: 'Fairly often', score: 20 },
              { value: '0', label: 'Very often', score: 0 },
            ]
          },
          {
            id: 'stress_8',
            text: 'How often have you felt that you were on top of things?',
            type: 'likert',
            options: [
              { value: '4', label: 'Never', score: 100 },
              { value: '3', label: 'Almost never', score: 75 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '1', label: 'Fairly often', score: 20 },
              { value: '0', label: 'Very often', score: 0 },
            ]
          },
          {
            id: 'stress_9',
            text: 'How often have you been angered because of things that happened that were outside of your control?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Almost never', score: 20 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '3', label: 'Fairly often', score: 75 },
              { value: '4', label: 'Very often', score: 100 },
            ]
          },
          {
            id: 'stress_10',
            text: 'How often have you felt difficulties were piling up so high that you could not overcome them?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Almost never', score: 20 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '3', label: 'Fairly often', score: 75 },
              { value: '4', label: 'Very often', score: 100 },
            ]
          },
          {
            id: 'stress_11',
            text: 'How often do you experience physical symptoms of stress (headaches, muscle tension, fatigue)?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '3', label: 'Often', score: 75 },
              { value: '4', label: 'Very often', score: 100 },
            ]
          },
          {
            id: 'stress_12',
            text: 'How would you rate your overall stress level in the past month?',
            type: 'likert',
            options: [
              { value: '1', label: 'Very low', score: 10 },
              { value: '2', label: 'Low', score: 30 },
              { value: '3', label: 'Moderate', score: 50 },
              { value: '4', label: 'High', score: 70 },
              { value: '5', label: 'Very high', score: 90 },
            ]
          },
          {
            id: 'stress_13',
            text: 'How often do work or school demands cause you stress?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '3', label: 'Often', score: 75 },
              { value: '4', label: 'Always', score: 100 },
            ]
          },
          {
            id: 'stress_14',
            text: 'How often do financial concerns cause you stress?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '3', label: 'Often', score: 75 },
              { value: '4', label: 'Always', score: 100 },
            ]
          },
          {
            id: 'stress_15',
            text: 'How often do relationship issues cause you stress?',
            type: 'likert',
            options: [
              { value: '0', label: 'Never', score: 0 },
              { value: '1', label: 'Rarely', score: 20 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '3', label: 'Often', score: 75 },
              { value: '4', label: 'Always', score: 100 },
            ]
          },
          {
            id: 'stress_16',
            text: 'How often do you use healthy coping strategies when stressed?',
            type: 'likert',
            options: [
              { value: '4', label: 'Never', score: 100 },
              { value: '3', label: 'Rarely', score: 75 },
              { value: '2', label: 'Sometimes', score: 50 },
              { value: '1', label: 'Often', score: 25 },
              { value: '0', label: 'Always', score: 0 },
            ]
          },
          {
            id: 'stress_17',
            text: 'How well do you feel you manage stress overall?',
            type: 'likert',
            options: [
              { value: '4', label: 'Very poorly', score: 100 },
              { value: '3', label: 'Poorly', score: 75 },
              { value: '2', label: 'Average', score: 50 },
              { value: '1', label: 'Well', score: 25 },
              { value: '0', label: 'Very well', score: 0 },
            ]
          },
          {
            id: 'stress_18',
            text: 'How much do stress symptoms interfere with your daily life?',
            type: 'likert',
            options: [
              { value: '0', label: 'Not at all', score: 0 },
              { value: '1', label: 'A little', score: 25 },
              { value: '2', label: 'Moderately', score: 50 },
              { value: '3', label: 'Quite a bit', score: 75 },
              { value: '4', label: 'Extremely', score: 100 },
            ]
          },
        ]
      },
      emotionalIntelligence: {
        title: 'Emotional Intelligence Assessment',
        description: 'Assess your ability to understand and manage emotions effectively.',
        totalQuestions: 28,
        estimatedTime: '8-10 minutes',
        scoringKey: 'emotionalIntelligence',
        questions: [
          {
            id: 'ei_1',
            text: 'I can easily identify my emotions as they occur.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_2',
            text: 'I am aware of the physical sensations that accompany my emotions.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_3',
            text: 'I can regulate my emotions when needed.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_4',
            text: 'I am good at reading other people\'s emotions.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_5',
            text: 'I can usually understand why I feel the way I do.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_6',
            text: 'I am sensitive to the emotional cues of others.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_7',
            text: 'I can calm myself down when I am upset.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_8',
            text: 'I can motivate myself to try again when I fail.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_9',
            text: 'I can tell when someone is upset even if they don\'t say so.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_10',
            text: 'I am aware of my emotions as I experience them.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_11',
            text: 'I can delay gratification in pursuit of my goals.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_12',
            text: 'I can manage my emotions effectively.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_13',
            text: 'I can handle criticism without becoming defensive.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_14',
            text: 'I can accurately express my emotions to others.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_15',
            text: 'I can empathize with others when they are experiencing difficulties.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_16',
            text: 'I can bounce back quickly from setbacks.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_17',
            text: 'I can stay calm under pressure.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_18',
            text: 'I can help others feel better when they are down.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_19',
            text: 'I can control my impulses.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_20',
            text: 'I am good at resolving conflicts.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_21',
            text: 'I can adapt to change easily.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_22',
            text: 'I am aware of how my behavior affects others.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_23',
            text: 'I can maintain a positive attitude even during difficult times.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_24',
            text: 'I can inspire and motivate others.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_25',
            text: 'I can communicate my needs effectively.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_26',
            text: 'I can work well in a team.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_27',
            text: 'I am optimistic about my future.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
          {
            id: 'ei_28',
            text: 'I can learn from my mistakes.',
            type: 'likert',
            options: [
              { value: '1', label: 'Strongly disagree', score: 0 },
              { value: '2', label: 'Disagree', score: 25 },
              { value: '3', label: 'Neutral', score: 50 },
              { value: '4', label: 'Agree', score: 75 },
              { value: '5', label: 'Strongly agree', score: 100 },
            ]
          },
        ]
      },
      // Add other assessments as needed
    };

    return assessments[id] || assessments.anxiety;
  };

  const assessment = getAssessmentData(assessmentId);
  const currentQ = assessment.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessment.totalQuestions) * 100;
  const timeElapsed = Math.floor((Date.now() - startTime) / 1000 / 60);

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < assessment.totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    
    try {
      // Calculate score based on answers
      let totalScore = 0;
      let maxScore = 0;
      
      assessment.questions.forEach(question => {
        const answer = answers[question.id];
        if (answer) {
          const option = question.options.find(opt => opt.value === answer);
          if (option) {
            totalScore += option.score;
          }
        }
        maxScore += Math.max(...question.options.map(opt => opt.score));
      });

      const normalizedScore = Math.round((totalScore / maxScore) * 100);
      
      // Submit assessment data to backend
      const assessmentData = {
        assessmentType: assessmentId,
        responses: answers,
        score: normalizedScore
      };

      // Import API service
      const { assessmentsApi } = await import('../../../services/api');
      
      // Submit to backend (this will generate AI insights)
      const response = await assessmentsApi.submitAssessment(assessmentData);
      
      if (response.success) {
        const scores = {
          [assessment.scoringKey]: normalizedScore
        };
        
        // Pass both scores and assessment record to parent
        onComplete({ scores, assessmentRecord: response.data.assessment });
        try {
          window.dispatchEvent(new CustomEvent('assessment:completed', { detail: { type: assessmentId, score: normalizedScore, at: new Date().toISOString() } }));
        } catch {/* noop */}
      } else {
        throw new Error('Failed to submit assessment');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      
      // Calculate score again for fallback
      let totalScore = 0;
      let maxScore = 0;
      
      assessment.questions.forEach(question => {
        const answer = answers[question.id];
        if (answer) {
          const option = question.options.find(opt => opt.value === answer);
          if (option) {
            totalScore += option.score;
          }
        }
        maxScore += Math.max(...question.options.map(opt => opt.score));
      });

      const normalizedScore = Math.round((totalScore / maxScore) * 100);
      
      // Fallback to local-only mode if backend fails
      const scores = {
        [assessment.scoringKey]: normalizedScore
      };
      onComplete({ scores });
      try {
        window.dispatchEvent(new CustomEvent('assessment:completed', { detail: { type: assessmentId, score: totalScore, at: new Date().toISOString() } }));
      } catch {/* noop */}
    } finally {
      setIsProcessing(false);
    }
  };

  const canProceed = () => {
    return answers[currentQ?.id] !== undefined;
  };

  const getQuestionIcon = () => {
    if (assessmentId.includes('anxiety')) return <Brain className="h-5 w-5 text-primary" />;
    if (assessmentId.includes('stress')) return <Heart className="h-5 w-5 text-primary" />;
    return <Sparkles className="h-5 w-5 text-primary" />;
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl">Processing Your Results</h2>
              <p className="text-muted-foreground">
                We're analyzing your responses to provide personalized insights. This won't take long...
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Generating your personalized recommendations...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('assessments')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Exit Assessment
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{timeElapsed} min elapsed</span>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getQuestionIcon()}
                <span className="font-medium">{assessment.title}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {currentQuestion + 1} of {assessment.totalQuestions}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {Math.round(progress)}% complete
            </p>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* Question Text */}
              <div className="space-y-3">
                <h2 className="text-2xl leading-relaxed">
                  {currentQ?.text}
                </h2>
                {currentQ?.subtext && (
                  <p className="text-muted-foreground">
                    {currentQ.subtext}
                  </p>
                )}
              </div>

              {/* Answer Options */}
              <RadioGroup
                value={answers[currentQ?.id] || ''}
                onValueChange={handleAnswer}
              >
                <div className="space-y-3">
                  {currentQ?.options.map((option) => (
                    <div 
                      key={option.value}
                      className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleAnswer(option.value)}
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                      <Label 
                        htmlFor={option.value} 
                        className="text-base leading-relaxed cursor-pointer flex-1"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              {/* Safety Note for Sensitive Questions */}
              {(currentQ?.text.toLowerCase().includes('harm') || 
                currentQ?.text.toLowerCase().includes('suicide') ||
                currentQ?.text.toLowerCase().includes('death')) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm text-amber-800 font-medium">
                        Need immediate support?
                      </p>
                      <p className="text-sm text-amber-700">
                        If you're having thoughts of self-harm, please reach out for help immediately. 
                        Call 988 (US) or your local emergency services.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2"
          >
            {currentQuestion === assessment.totalQuestions - 1 ? (
              <>
                Complete Assessment
                <CheckCircle className="h-4 w-4" />
              </>
            ) : (
              <>
                Next Question
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Save Progress */}
        <div className="text-center mt-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Save & Continue Later
          </Button>
        </div>
      </div>
    </div>
  );
}