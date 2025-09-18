import { ReactNode } from 'react';

// Enums for better type safety
export enum MessageType {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system'
}

export enum CrisisKeyword {
  SUICIDE = 'suicide',
  KILL_MYSELF = 'kill myself',
  END_IT_ALL = 'end it all',
  DONT_WANT_TO_LIVE = 'don\'t want to live',
  HURT_MYSELF = 'hurt myself',
  SELF_HARM = 'self harm',
  CUTTING = 'cutting',
  OVERDOSE = 'overdose',
  HOPELESS = 'hopeless',
  NO_POINT = 'no point',
  BETTER_OFF_DEAD = 'better off dead'
}

export enum CrisisSeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe'
}

export interface CrisisDetection {
  detected: boolean;
  severity: CrisisSeverity | null;
  triggers: string[];
  recommendedActions: string[];
  requiresImmediate: boolean;
  emergencyContacts?: EmergencyContact[];
  followUpScheduled?: Date;
  lastCheckIn?: Date;
}

export interface CrisisFollowUp {
  id: string;
  userId: string;
  crisisDetectionId: string;
  scheduledTime: Date;
  completed: boolean;
  type: 'proactive_checkin' | 'resource_followup' | 'safety_check';
  message: string;
  response?: string;
  responseTime?: Date;
}

export interface EmergencyContact {
  name: string;
  number: string;
  type: 'hotline' | 'emergency' | 'professional';
  available: string; // "24/7", "business hours", etc.
}

export enum AttachmentType {
  IMAGE = 'image',
  PDF = 'pdf',
  VIDEO = 'video',
  LINK = 'link'
}

// Attachment interface
export interface MessageAttachment {
  type: AttachmentType;
  url: string;
  thumbnail?: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

// Base Message interface
interface BaseMessage {
  id: string;
  content: string;
  timestamp: Date;
  attachments?: MessageAttachment[];
}

// Discriminated union types for different message types
interface UserMessage extends BaseMessage {
  type: MessageType.USER;
  suggestions?: never;
  isTyping?: never;
}

interface BotMessage extends BaseMessage {
  type: MessageType.BOT;
  suggestions?: string[];
  isTyping?: boolean;
  isStreaming?: boolean;
  streamingComplete?: boolean;
}

interface SystemMessage extends BaseMessage {
  type: MessageType.SYSTEM;
  suggestions?: never;
  isTyping?: never;
}

// Union type for all messages
export type Message = UserMessage | BotMessage | SystemMessage;

// User-related types
export interface User {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  isOnboarded?: boolean;
  assessmentScores?: Record<string, unknown>;
}

// Chat-related types
export interface ChatState {
  messages: Message[];
  inputValue: string;
  isTyping: boolean;
  isStreamingActive: boolean;
  streamingMessageId: string | null;
  showCrisisWarning: boolean;
  crisisDetection: CrisisDetection | null;
  crisisHistory: CrisisDetection[];
  followUpReminders: CrisisFollowUp[];
  selectedFiles: File[];
  isDragOver: boolean;
  isRecording: boolean;
  speechRecognitionSupported: boolean;
  microphonePermission: 'granted' | 'denied' | 'prompt' | 'checking';
  speechError: string | null;
}

export interface ChatActions {
  setInputValue: (value: string) => void;
  setShowCrisisWarning: (show: boolean) => void;
  setCrisisDetection: (detection: CrisisDetection | null) => void;
  scheduleFollowUp: (detection: CrisisDetection, type: CrisisFollowUp['type'], delay: number) => void;
  checkPendingFollowUps: () => void;
  handleSendMessage: () => Promise<void>;
  handleSuggestionClick: (suggestion: string) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  detectCrisisLanguage: (text: string) => CrisisDetection;
  initializeChat: (user: User) => void;
  handleFileSelect: (files: FileList) => void;
  removeSelectedFile: (index: number) => void;
  clearSelectedFiles: () => void;
  toggleSpeechRecognition: () => void;
  stopSpeechRecognition: () => void;
  requestMicrophonePermission: () => Promise<boolean>;
  clearSpeechError: () => void;
}

export interface ChatContextType extends ChatState, ChatActions {
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

// Component prop types
export interface ChatProviderProps {
  children: ReactNode;
}

export interface ChatbotProps {
  user: User;
  onNavigate: (page: string) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export interface MessageBubbleProps {
  message: Message;
  isConsecutive?: boolean;
  isLastInGroup?: boolean;
}

// API-related types
export interface ChatApiResponse {
  success: boolean;
  data?: {
    message?: {
      content: string;
    };
    response?: string;
  };
  error?: string;
}

// Utility types
export type MessageContentGetter = (message: Message) => string;
export type MessageTypeChecker = (message: Message, type: MessageType) => boolean;
export type CrisisKeywordList = readonly string[];

// Message grouping types
export interface MessageGroupInfo {
  isConsecutive: boolean;
  isLastInGroup: boolean;
}

// Helper functions for message grouping
export const areConsecutiveMessages = (
  currentMessage: Message, 
  previousMessage: Message | null,
  timeThresholdMinutes: number = 5
): boolean => {
  if (!previousMessage) return false;
  
  // Must be from the same sender
  if (currentMessage.type !== previousMessage.type) return false;
  
  // Check time threshold (optional)
  const timeDiff = currentMessage.timestamp.getTime() - previousMessage.timestamp.getTime();
  const timeDiffMinutes = timeDiff / (1000 * 60);
  
  return timeDiffMinutes <= timeThresholdMinutes;
};

export const isLastInGroup = (
  currentMessage: Message,
  nextMessage: Message | null,
  timeThresholdMinutes: number = 5
): boolean => {
  if (!nextMessage) return true;
  
  // If next message is from different sender, this is last in group
  if (currentMessage.type !== nextMessage.type) return true;
  
  // Check time threshold
  const timeDiff = nextMessage.timestamp.getTime() - currentMessage.timestamp.getTime();
  const timeDiffMinutes = timeDiff / (1000 * 60);
  
  return timeDiffMinutes > timeThresholdMinutes;
};

export const getMessageGroupInfo = (
  messages: Message[], 
  currentIndex: number, 
  timeThresholdMinutes: number = 5
): MessageGroupInfo => {
  const currentMessage = messages[currentIndex];
  const previousMessage = currentIndex > 0 ? messages[currentIndex - 1] : null;
  const nextMessage = currentIndex < messages.length - 1 ? messages[currentIndex + 1] : null;
  
  return {
    isConsecutive: areConsecutiveMessages(currentMessage, previousMessage, timeThresholdMinutes),
    isLastInGroup: isLastInGroup(currentMessage, nextMessage, timeThresholdMinutes)
  };
};

// Type guards
export const isUserMessage = (message: Message): message is UserMessage => {
  return message.type === MessageType.USER;
};

export const isBotMessage = (message: Message): message is BotMessage => {
  return message.type === MessageType.BOT;
};

export const isSystemMessage = (message: Message): message is SystemMessage => {
  return message.type === MessageType.SYSTEM;
};

// Helper functions with proper typing
export const createMessage = {
  user: (content: string, attachments?: MessageAttachment[]): UserMessage => ({
    id: Date.now().toString(),
    type: MessageType.USER,
    content,
    timestamp: new Date(),
    attachments
  }),
  
  bot: (content: string, suggestions?: string[], attachments?: MessageAttachment[], isStreaming?: boolean): BotMessage => ({
    id: (Date.now() + 1).toString(),
    type: MessageType.BOT,
    content,
    timestamp: new Date(),
    suggestions,
    attachments,
    isStreaming,
    streamingComplete: !isStreaming
  }),
  
  system: (content: string, attachments?: MessageAttachment[]): SystemMessage => ({
    id: (Date.now() + 2).toString(),
    type: MessageType.SYSTEM,
    content,
    timestamp: new Date(),
    attachments
  })
};

// Constants
export const DEFAULT_SUGGESTIONS: readonly string[] = [
  "I'm feeling anxious",
  "I need a breathing exercise",
  "I'm having trouble sleeping",
  "I want to talk about my day"
] as const;

export const ANXIOUS_SUGGESTIONS: readonly string[] = [
  'Try breathing exercise',
  'Tell me more',
  'What helps you calm down?'
] as const;

export const DEFAULT_SUGGESTIONS_FALLBACK: readonly string[] = [
  'That\'s helpful',
  'Tell me more',
  'What else?'
] as const;

// Crisis keywords organized by severity - clinically validated terms
export const MILD_CRISIS_KEYWORDS = [
  // Stress and overwhelm indicators
  'stressed', 'overwhelmed', 'anxious', 'worried', 'upset', 'frustrated',
  'discouraged', 'down', 'low mood', 'sad', 'emotional', 'struggling',
  'tired of this', 'can\'t handle', 'too much', 'burnout', 'exhausted',
  
  // Mild distress signals
  'feeling lost', 'confused', 'uncertain', 'scared', 'nervous', 'panicked',
  'restless', 'agitated', 'irritable', 'moody', 'tearful', 'crying',
  
  // Early warning signs
  'not myself', 'off balance', 'spiraling', 'losing control', 'falling apart',
  'can\'t sleep', 'no appetite', 'eating too much', 'avoiding people'
] as const;

export const MODERATE_CRISIS_KEYWORDS = [
  // Depression indicators
  'depressed', 'hopeless', 'worthless', 'useless', 'trapped', 'stuck',
  'no way out', 'can\'t go on', 'give up', 'no point', 'meaningless',
  'empty', 'numb', 'isolate', 'withdraw', 'escape', 'disappear',
  'alone', 'broken', 'failure',
  
  // Moderate distress and dysfunction
  'can\'t function', 'falling behind', 'losing everything', 'ruining my life',
  'destroying relationships', 'pushing everyone away', 'burden to others',
  'nobody cares', 'nobody understands', 'completely alone',
  
  // Self-worth and identity crisis
  'hate myself', 'disgusted with myself', 'ashamed', 'guilty', 'regret everything',
  'wasted life', 'missed opportunities', 'too late for me', 'beyond help',
  
  // Moderate self-harm ideation
  'want to hurt myself', 'punish myself', 'deserve pain', 'need to feel something',
  'cutting thoughts', 'self-destructive', 'reckless behavior'
] as const;

export const SEVERE_CRISIS_KEYWORDS = [
  // Direct suicidal ideation
  'suicide', 'suicidal', 'kill myself', 'end my life', 'take my life',
  'don\'t want to live', 'want to die', 'wish I was dead', 'better off dead',
  'end it all', 'final solution', 'permanent solution', 'escape forever',
  
  // Suicide planning and methods
  'suicide plan', 'how to kill myself', 'ways to die', 'overdose', 'pills',
  'jump off', 'hang myself', 'hanging', 'gun', 'shoot myself', 'knife',
  'razor', 'cut wrists', 'carbon monoxide', 'poison', 'drowning',
  
  // Active self-harm
  'self harm', 'self-harm', 'cutting', 'hurt myself', 'injure myself',
  'blood', 'scars', 'burning myself', 'hitting myself', 'starving myself',
  
  // Immediate danger signals
  'tonight\'s the night', 'can\'t take another day', 'this is goodbye',
  'final goodbye', 'won\'t be here tomorrow', 'last time', 'it\'s time',
  'ready to go', 'peace at last', 'no more pain', 'joining them',
  
  // Severe desperation
  'nothing left', 'no hope left', 'can\'t survive this', 'too much pain',
  'unbearable', 'torture', 'living hell', 'rather be dead'
] as const;

export const CRISIS_KEYWORDS: CrisisKeywordList = [
  CrisisKeyword.SUICIDE,
  CrisisKeyword.KILL_MYSELF,
  CrisisKeyword.END_IT_ALL,
  CrisisKeyword.DONT_WANT_TO_LIVE,
  CrisisKeyword.HURT_MYSELF,
  CrisisKeyword.SELF_HARM,
  CrisisKeyword.CUTTING,
  CrisisKeyword.OVERDOSE,
  CrisisKeyword.HOPELESS,
  CrisisKeyword.NO_POINT,
  CrisisKeyword.BETTER_OFF_DEAD
] as const;

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    name: 'National Suicide Prevention Lifeline',
    number: '988',
    type: 'hotline',
    available: '24/7'
  },
  {
    name: 'Crisis Text Line',
    number: 'Text HOME to 741741',
    type: 'hotline',
    available: '24/7'
  },
  {
    name: 'Emergency Services',
    number: '911',
    type: 'emergency',
    available: '24/7'
  },
  {
    name: 'SAMHSA National Helpline',
    number: '1-800-662-4357',
    type: 'professional',
    available: '24/7'
  }
];

// Recommended actions by crisis severity
export const MILD_CRISIS_ACTIONS = [
  'Take slow, deep breaths',
  'Try grounding techniques (5-4-3-2-1 method)',
  'Reach out to a trusted friend or family member',
  'Consider professional counseling if stress persists',
  'Practice self-care activities',
  'Take breaks when feeling overwhelmed'
];

export const MODERATE_CRISIS_ACTIONS = [
  'Contact a mental health professional immediately',
  'Reach out to trusted friends or family for support',
  'Consider calling a crisis helpline',
  'Avoid isolation - stay with supportive people',
  'Remove access to means of self-harm',
  'Create a safety plan with specific coping strategies'
];

export const SEVERE_CRISIS_ACTIONS = [
  'Call 988 (Suicide Prevention Lifeline) IMMEDIATELY',
  'Go to the nearest emergency room',
  'Call 911 if in immediate danger',
  'Stay with a trusted person - do not be alone',
  'Remove all means of self-harm from your environment',
  'Contact your mental health provider or psychiatrist urgently'
];