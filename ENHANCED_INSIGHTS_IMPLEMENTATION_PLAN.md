# Enhanced Recent Insights Implementation Plan

## 📋 Overview
Transform the Recent Insights section into an intelligent, AI-powered summary system that combines:
- Assessment scores & insights (with timestamps)
- Chatbot conversation summaries
- Daily automatic updates
- Manual refresh capability

---

## 🎯 Requirements Summary

### Data Sources
1. **Assessment Data**: Scores, insights, completion timestamps
2. **Chatbot Conversations**: Full chat history with AI-generated summaries per conversation
3. **Combined Insights**: AI-powered summary merging both sources

### Update Strategy
- **Daily Auto-Update**: When user logs in (if new interactions exist)
- **Manual Refresh**: User-triggered button to check for new data
- **No Constant Updates**: Only when assessments/chats are completed

### AI Rate Limit
- Increase Gemini API rate limit configuration

---

## 📝 Step-by-Step Implementation Plan

## **PHASE 1: Database Schema & Models** (Priority: HIGH)

### Step 1.1: Create ChatbotConversation Model
**File**: `backend/prisma/schema.prisma`

```prisma
model ChatbotConversation {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  // Conversation metadata
  startedAt DateTime @default(now())
  endedAt   DateTime?
  
  // Conversation content
  messages  Json     // Array of {role, content, timestamp}
  
  // AI-generated summary
  summary   String?  @db.Text
  summaryGeneratedAt DateTime?
  
  // Insights extracted from conversation
  emotionalState String? // e.g., "anxious", "hopeful", "overwhelmed"
  keyTopics      String[] // e.g., ["work stress", "sleep issues"]
  urgencyLevel   String?  // "low", "medium", "high"
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId, startedAt])
  @@index([userId, endedAt])
}
```

### Step 1.2: Create DashboardInsights Model (Cached Insights)
```prisma
model DashboardInsights {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  
  // Combined insights data
  insightsData Json    // Structured insights object
  aiSummary    String  @db.Text // AI-generated combined summary
  
  // Source tracking
  assessmentCount Int    @default(0)
  chatCount       Int    @default(0)
  lastAssessmentDate DateTime?
  lastChatDate       DateTime?
  
  // Cache management
  generatedAt DateTime @default(now())
  expiresAt   DateTime // Daily expiration
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId, expiresAt])
}
```

### Step 1.3: Update User Model
```prisma
model User {
  // ... existing fields ...
  
  chatbotConversations ChatbotConversation[]
  dashboardInsights    DashboardInsights?
}
```

### Step 1.4: Run Prisma Migration
```bash
npx prisma migrate dev --name add_chatbot_insights_system
npx prisma generate
```

**Estimated Time**: 1 hour

---

## **PHASE 2: Increase Gemini API Rate Limit** (Priority: HIGH)

### Step 2.1: Update Gemini Configuration
**File**: `backend/src/services/llmProvider.ts`

**Current Configuration** (find and update):
```typescript
private readonly config = {
  gemini: {
    maxFailures: 3,      // CHANGE TO: 10
    cooldownPeriod: 300, // CHANGE TO: 180 (3 minutes)
    retryDelay: 1000,
    // ADD THESE:
    requestsPerMinute: 15,  // NEW: Rate limiting
    tokensPerMinute: 32000, // NEW: Token limit
  }
}
```

### Step 2.2: Add Rate Limiting Logic
```typescript
// Add to LLMService class
private requestTimestamps: number[] = [];
private tokenUsage: { timestamp: number; tokens: number }[] = [];

private async checkRateLimit(estimatedTokens: number = 1000): Promise<void> {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // Clean old timestamps
  this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo);
  this.tokenUsage = this.tokenUsage.filter(t => t.timestamp > oneMinuteAgo);
  
  // Check request rate
  if (this.requestTimestamps.length >= this.config.gemini.requestsPerMinute) {
    const oldestRequest = this.requestTimestamps[0];
    const waitTime = oldestRequest + 60000 - now;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Check token rate
  const recentTokens = this.tokenUsage.reduce((sum, t) => sum + t.tokens, 0);
  if (recentTokens + estimatedTokens > this.config.gemini.tokensPerMinute) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
  }
  
  this.requestTimestamps.push(now);
}
```

### Step 2.3: Add Environment Variables
**File**: `backend/.env`
```env
# Gemini API Configuration
GEMINI_MAX_FAILURES=10
GEMINI_COOLDOWN_PERIOD=180
GEMINI_REQUESTS_PER_MINUTE=15
GEMINI_TOKENS_PER_MINUTE=32000
```

**Estimated Time**: 1 hour

---

## **PHASE 3: Chatbot Conversation Tracking** (Priority: HIGH)

### Step 3.1: Create Chatbot Service
**File**: `backend/src/services/chatbotService.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { LLMService } from './llmProvider';

const prisma = new PrismaClient();
const llmService = new LLMService();

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export class ChatbotService {
  // Start a new conversation
  async startConversation(userId: string): Promise<string> {
    const conversation = await prisma.chatbotConversation.create({
      data: {
        userId,
        messages: [],
        startedAt: new Date(),
      },
    });
    return conversation.id;
  }

  // Add message to conversation
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    const conversation = await prisma.chatbotConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new Error('Conversation not found');

    const messages = conversation.messages as ChatMessage[];
    messages.push({
      role,
      content,
      timestamp: new Date(),
    });

    await prisma.chatbotConversation.update({
      where: { id: conversationId },
      data: { messages },
    });
  }

  // End conversation and generate summary
  async endConversation(conversationId: string): Promise<void> {
    const conversation = await prisma.chatbotConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new Error('Conversation not found');

    const messages = conversation.messages as ChatMessage[];
    const summary = await this.generateConversationSummary(messages);
    const insights = this.extractInsights(messages);

    await prisma.chatbotConversation.update({
      where: { id: conversationId },
      data: {
        endedAt: new Date(),
        summary: summary,
        summaryGeneratedAt: new Date(),
        emotionalState: insights.emotionalState,
        keyTopics: insights.keyTopics,
        urgencyLevel: insights.urgencyLevel,
      },
    });

    // Invalidate dashboard insights cache
    await this.invalidateDashboardCache(conversation.userId);
  }

  // Generate AI summary of conversation
  private async generateConversationSummary(
    messages: ChatMessage[]
  ): Promise<string> {
    const userMessages = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n');

    const assistantMessages = messages
      .filter(m => m.role === 'assistant')
      .map(m => m.content)
      .join('\n');

    const prompt = `Summarize this mental health chatbot conversation in 2-3 sentences. Focus on:
1. Main concerns/topics discussed
2. User's emotional state
3. Key insights or breakthroughs

User messages:
${userMessages}

Assistant responses:
${assistantMessages}

Provide a compassionate, professional summary:`;

    try {
      const response = await llmService.generateResponse(
        [
          { role: 'system', content: 'You are a mental health professional summarizing therapy conversations.' },
          { role: 'user', content: prompt },
        ],
        { maxTokens: 150, temperature: 0.5 }
      );

      return response || this.generateFallbackSummary(messages);
    } catch (error) {
      console.error('[Chatbot] Failed to generate AI summary:', error);
      return this.generateFallbackSummary(messages);
    }
  }

  // Extract insights from conversation
  private extractInsights(messages: ChatMessage[]): {
    emotionalState: string;
    keyTopics: string[];
    urgencyLevel: string;
  } {
    const userContent = messages
      .filter(m => m.role === 'user')
      .map(m => m.content.toLowerCase())
      .join(' ');

    // Detect emotional state
    let emotionalState = 'neutral';
    if (userContent.includes('anxious') || userContent.includes('worried') || userContent.includes('nervous')) {
      emotionalState = 'anxious';
    } else if (userContent.includes('sad') || userContent.includes('depressed') || userContent.includes('down')) {
      emotionalState = 'sad';
    } else if (userContent.includes('stressed') || userContent.includes('overwhelmed')) {
      emotionalState = 'stressed';
    } else if (userContent.includes('happy') || userContent.includes('good') || userContent.includes('better')) {
      emotionalState = 'positive';
    }

    // Extract key topics
    const topicKeywords = {
      'work stress': ['work', 'job', 'career', 'boss', 'colleague'],
      'relationships': ['relationship', 'partner', 'family', 'friend'],
      'sleep': ['sleep', 'insomnia', 'tired', 'rest'],
      'anxiety': ['anxiety', 'anxious', 'panic', 'worry'],
      'depression': ['depression', 'sad', 'hopeless'],
      'self-care': ['exercise', 'meditation', 'hobby', 'self-care'],
    };

    const keyTopics: string[] = [];
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => userContent.includes(keyword))) {
        keyTopics.push(topic);
      }
    }

    // Determine urgency level
    let urgencyLevel = 'low';
    const urgentKeywords = ['crisis', 'harm', 'suicide', 'emergency', 'urgent'];
    const moderateKeywords = ['can\'t cope', 'desperate', 'severe', 'unbearable'];

    if (urgentKeywords.some(keyword => userContent.includes(keyword))) {
      urgencyLevel = 'high';
    } else if (moderateKeywords.some(keyword => userContent.includes(keyword))) {
      urgencyLevel = 'medium';
    }

    return { emotionalState, keyTopics, urgencyLevel };
  }

  // Fallback summary
  private generateFallbackSummary(messages: ChatMessage[]): string {
    const userMessageCount = messages.filter(m => m.role === 'user').length;
    return `Conversation included ${userMessageCount} exchanges about mental wellbeing and personal growth.`;
  }

  // Invalidate dashboard insights cache
  private async invalidateDashboardCache(userId: string): Promise<void> {
    await prisma.dashboardInsights.deleteMany({
      where: { userId },
    });
  }
}

export const chatbotService = new ChatbotService();
```

**Estimated Time**: 3 hours

---

## **PHASE 4: Enhanced Dashboard Insights Service** (Priority: HIGH)

### Step 4.1: Create Combined Insights Service
**File**: `backend/src/services/enhancedInsightsService.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { LLMService } from './llmProvider';
import { buildAssessmentInsights } from './assessmentInsightsService';

const prisma = new PrismaClient();
const llmService = new LLMService();

interface CombinedInsightsData {
  assessments: {
    scores: any[];
    insights: string[];
    lastDate: Date | null;
  };
  chatbot: {
    summaries: string[];
    emotionalStates: string[];
    keyTopics: string[];
    lastDate: Date | null;
  };
  aiSummary: string;
  generatedAt: Date;
}

export class EnhancedInsightsService {
  // Get or generate dashboard insights
  async getDashboardInsights(userId: string, forceRefresh: boolean = false): Promise<CombinedInsightsData> {
    // Check cache first
    if (!forceRefresh) {
      const cached = await this.getCachedInsights(userId);
      if (cached && cached.expiresAt > new Date()) {
        console.log('[Enhanced Insights] Using cached insights');
        return cached.insightsData as CombinedInsightsData;
      }
    }

    console.log('[Enhanced Insights] Generating fresh insights');
    return await this.generateFreshInsights(userId);
  }

  // Check if new interactions exist
  async hasNewInteractions(userId: string): Promise<boolean> {
    const cached = await prisma.dashboardInsights.findUnique({
      where: { userId },
    });

    if (!cached) return true;

    // Check for new assessments
    const newAssessments = await prisma.assessment.count({
      where: {
        userId,
        createdAt: { gt: cached.lastAssessmentDate || new Date(0) },
      },
    });

    // Check for new chats
    const newChats = await prisma.chatbotConversation.count({
      where: {
        userId,
        endedAt: { not: null },
        endedAt: { gt: cached.lastChatDate || new Date(0) },
      },
    });

    return newAssessments > 0 || newChats > 0;
  }

  // Generate fresh insights
  private async generateFreshInsights(userId: string): Promise<CombinedInsightsData> {
    // Fetch assessment data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const assessments = await prisma.assessment.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      include: { answers: true },
    });

    // Fetch chatbot conversations (last 30 days)
    const conversations = await prisma.chatbotConversation.findMany({
      where: {
        userId,
        endedAt: { not: null },
        endedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { endedAt: 'desc' },
    });

    // Build assessment insights
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const assessmentInsights = assessments.length > 0
      ? await buildAssessmentInsights(assessments, { userName: user?.firstName || user?.name || 'there' })
      : null;

    // Extract chatbot data
    const chatbotData = {
      summaries: conversations.map(c => c.summary).filter(Boolean) as string[],
      emotionalStates: conversations.map(c => c.emotionalState).filter(Boolean) as string[],
      keyTopics: conversations.flatMap(c => c.keyTopics),
      lastDate: conversations[0]?.endedAt || null,
    };

    // Generate combined AI summary
    const aiSummary = await this.generateCombinedAISummary(
      assessmentInsights,
      chatbotData,
      user?.firstName || 'there'
    );

    const insightsData: CombinedInsightsData = {
      assessments: {
        scores: assessments.map(a => ({
          type: a.type,
          score: a.score,
          createdAt: a.createdAt,
        })),
        insights: assessmentInsights?.insights.byType ? Object.values(assessmentInsights.insights.byType).map((i: any) => i.interpretation) : [],
        lastDate: assessments[0]?.createdAt || null,
      },
      chatbot: chatbotData,
      aiSummary,
      generatedAt: new Date(),
    };

    // Cache the insights
    await this.cacheInsights(userId, insightsData, assessments, conversations);

    return insightsData;
  }

  // Generate combined AI summary
  private async generateCombinedAISummary(
    assessmentInsights: any,
    chatbotData: any,
    userName: string
  ): Promise<string> {
    const context = this.buildCombinedContext(assessmentInsights, chatbotData, userName);

    try {
      const response = await llmService.generateResponse(
        [
          {
            role: 'system',
            content: `You are a compassionate mental health coach. Create a holistic summary combining assessment results and chat conversations. Be warm, encouraging, and insightful.`,
          },
          { role: 'user', content: context },
        ],
        { maxTokens: 300, temperature: 0.6 }
      );

      return response || this.generateFallbackSummary(assessmentInsights, chatbotData);
    } catch (error) {
      console.error('[Enhanced Insights] AI summary failed:', error);
      return this.generateFallbackSummary(assessmentInsights, chatbotData);
    }
  }

  // Build combined context for AI
  private buildCombinedContext(assessmentInsights: any, chatbotData: any, userName: string): string {
    let context = `Create a holistic wellbeing summary for ${userName}.\n\n`;

    // Add assessment context
    if (assessmentInsights?.insights?.byType) {
      context += `ASSESSMENT INSIGHTS:\n`;
      Object.entries(assessmentInsights.insights.byType).forEach(([type, data]: [string, any]) => {
        context += `- ${type}: ${data.interpretation} (${data.trend})\n`;
      });
      context += `\n`;
    }

    // Add chatbot context
    if (chatbotData.summaries.length > 0) {
      context += `RECENT CONVERSATIONS:\n`;
      chatbotData.summaries.slice(0, 3).forEach((summary: string, i: number) => {
        context += `${i + 1}. ${summary}\n`;
      });
      context += `\n`;
    }

    if (chatbotData.keyTopics.length > 0) {
      const uniqueTopics = [...new Set(chatbotData.keyTopics)];
      context += `Key themes: ${uniqueTopics.join(', ')}\n`;
    }

    context += `\nProvide a warm, insightful summary (150 words max) that:
1. Acknowledges their current state
2. Highlights progress or patterns
3. Offers one gentle suggestion
4. Ends with encouragement`;

    return context;
  }

  // Fallback summary
  private generateFallbackSummary(assessmentInsights: any, chatbotData: any): string {
    let summary = 'Here\'s an overview of your recent wellbeing journey: ';

    if (assessmentInsights?.insights?.byType) {
      const interpretations = Object.values(assessmentInsights.insights.byType)
        .map((i: any) => i.interpretation)
        .join(', ');
      summary += interpretations + '. ';
    }

    if (chatbotData.summaries.length > 0) {
      summary += `You've engaged in ${chatbotData.summaries.length} meaningful conversations about your mental health. `;
    }

    summary += 'Keep nurturing your wellbeing with consistent self-care practices.';
    return summary;
  }

  // Cache insights
  private async cacheInsights(
    userId: string,
    insightsData: CombinedInsightsData,
    assessments: any[],
    conversations: any[]
  ): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Expire at midnight

    await prisma.dashboardInsights.upsert({
      where: { userId },
      create: {
        userId,
        insightsData: insightsData as any,
        aiSummary: insightsData.aiSummary,
        assessmentCount: assessments.length,
        chatCount: conversations.length,
        lastAssessmentDate: assessments[0]?.createdAt || null,
        lastChatDate: conversations[0]?.endedAt || null,
        expiresAt: tomorrow,
      },
      update: {
        insightsData: insightsData as any,
        aiSummary: insightsData.aiSummary,
        assessmentCount: assessments.length,
        chatCount: conversations.length,
        lastAssessmentDate: assessments[0]?.createdAt || null,
        lastChatDate: conversations[0]?.endedAt || null,
        expiresAt: tomorrow,
        updatedAt: new Date(),
      },
    });
  }

  // Get cached insights
  private async getCachedInsights(userId: string): Promise<any> {
    return await prisma.dashboardInsights.findUnique({
      where: { userId },
    });
  }
}

export const enhancedInsightsService = new EnhancedInsightsService();
```

**Estimated Time**: 4 hours

---

## **PHASE 5: Update Chatbot API Routes** (Priority: MEDIUM)

### Step 5.1: Update Chatbot Controller
**File**: `backend/src/controllers/chatbotController.ts`

```typescript
import { Request, Response } from 'express';
import { chatbotService } from '../services/chatbotService';
import { LLMService } from '../services/llmProvider';

const llmService = new LLMService();

// Track active conversations per user
const activeConversations = new Map<string, string>();

export const chatbotController = {
  // Send message
  async sendMessage(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { message } = req.body;

      if (!userId || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get or create conversation
      let conversationId = activeConversations.get(userId);
      if (!conversationId) {
        conversationId = await chatbotService.startConversation(userId);
        activeConversations.set(userId, conversationId);
      }

      // Add user message
      await chatbotService.addMessage(conversationId, 'user', message);

      // Get conversation history for context
      const conversation = await prisma.chatbotConversation.findUnique({
        where: { id: conversationId },
      });

      const messages = conversation?.messages as any[] || [];
      const recentMessages = messages.slice(-10); // Last 10 messages for context

      // Generate AI response
      const aiResponse = await llmService.generateResponse(
        [
          {
            role: 'system',
            content: 'You are a compassionate mental health support chatbot. Provide empathetic, helpful responses while encouraging professional help when needed.',
          },
          ...recentMessages.map(m => ({ role: m.role, content: m.content })),
        ],
        { maxTokens: 500, temperature: 0.7 }
      );

      const response = aiResponse || "I'm here to listen. Could you tell me more about what's on your mind?";

      // Add assistant message
      await chatbotService.addMessage(conversationId, 'assistant', response);

      res.json({ response, conversationId });
    } catch (error) {
      console.error('[Chatbot] Error:', error);
      res.status(500).json({ error: 'Failed to process message' });
    }
  },

  // End conversation
  async endConversation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const conversationId = activeConversations.get(userId);
      if (conversationId) {
        await chatbotService.endConversation(conversationId);
        activeConversations.delete(userId);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('[Chatbot] Error ending conversation:', error);
      res.status(500).json({ error: 'Failed to end conversation' });
    }
  },

  // Get conversation history
  async getHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const conversations = await prisma.chatbotConversation.findMany({
        where: { userId, endedAt: { not: null } },
        orderBy: { endedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          startedAt: true,
          endedAt: true,
          summary: true,
          emotionalState: true,
          keyTopics: true,
        },
      });

      res.json({ conversations });
    } catch (error) {
      console.error('[Chatbot] Error fetching history:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  },
};
```

**Estimated Time**: 2 hours

---

## **PHASE 6: Update Dashboard API Routes** (Priority: HIGH)

### Step 6.1: Update Dashboard Routes
**File**: `backend/src/routes/dashboard.ts`

Add new endpoints:

```typescript
import { enhancedInsightsService } from '../services/enhancedInsightsService';

// Get enhanced insights
router.get('/insights/enhanced', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const forceRefresh = req.query.refresh === 'true';
    const insights = await enhancedInsightsService.getDashboardInsights(userId, forceRefresh);

    res.json(insights);
  } catch (error) {
    console.error('[Dashboard] Enhanced insights error:', error);
    res.status(500).json({ error: 'Failed to fetch enhanced insights' });
  }
});

// Check for new interactions
router.get('/insights/check-updates', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hasNew = await enhancedInsightsService.hasNewInteractions(userId);

    res.json({ hasNewInteractions: hasNew });
  } catch (error) {
    console.error('[Dashboard] Check updates error:', error);
    res.status(500).json({ error: 'Failed to check updates' });
  }
});
```

**Estimated Time**: 1 hour

---

## **PHASE 7: Frontend Updates** (Priority: HIGH)

### Step 7.1: Create Enhanced Insights Hook
**File**: `frontend/src/hooks/useEnhancedInsights.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface EnhancedInsights {
  assessments: {
    scores: any[];
    insights: string[];
    lastDate: string | null;
  };
  chatbot: {
    summaries: string[];
    emotionalStates: string[];
    keyTopics: string[];
    lastDate: string | null;
  };
  aiSummary: string;
  generatedAt: string;
}

export function useEnhancedInsights() {
  const queryClient = useQueryClient();

  // Fetch enhanced insights
  const { data, isLoading, error } = useQuery({
    queryKey: ['enhancedInsights'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await axios.get<EnhancedInsights>(
        `${API_URL}/api/dashboard/insights/enhanced`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });

  // Check for updates
  const { data: updateStatus } = useQuery({
    queryKey: ['insightsUpdateStatus'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await axios.get<{ hasNewInteractions: boolean }>(
        `${API_URL}/api/dashboard/insights/check-updates`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  // Refresh insights mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await axios.get<EnhancedInsights>(
        `${API_URL}/api/dashboard/insights/enhanced?refresh=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['enhancedInsights'], data);
      queryClient.invalidateQueries({ queryKey: ['insightsUpdateStatus'] });
    },
  });

  return {
    insights: data,
    isLoading,
    error,
    hasUpdates: updateStatus?.hasNewInteractions || false,
    refresh: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
  };
}
```

**Estimated Time**: 1.5 hours

### Step 7.2: Update Dashboard Component
**File**: `frontend/src/components/features/dashboard/Dashboard.tsx`

Replace the Recent Insights section:

```typescript
import { useEnhancedInsights } from '../../../hooks/useEnhancedInsights';

// Inside Dashboard component:
const { insights, hasUpdates, refresh, isRefreshing } = useEnhancedInsights();

// In the render section (replace existing Recent Insights):
<div className="space-y-2">
  {/* Header with refresh button */}
  <div className="flex items-center justify-between">
    <button
      onClick={() => setShowInsights(!showInsights)}
      className="flex items-center justify-between w-full p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <div className="text-left">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Insights
          </h3>
          {hasUpdates && (
            <span className="text-xs text-indigo-600 dark:text-indigo-400">
              • New insights available
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            refresh();
          }}
          disabled={isRefreshing}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          title="Refresh insights"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
        {showInsights ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </div>
    </button>
  </div>

  {/* Insights content */}
  {showInsights && insights && (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      {/* AI Summary */}
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-gray-700 dark:text-gray-300">{insights.aiSummary}</p>
      </div>

      {/* Assessment Insights */}
      {insights.assessments.insights.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Assessment Highlights
          </h4>
          <ul className="space-y-1">
            {insights.assessments.insights.map((insight, i) => (
              <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                • {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Chatbot Topics */}
      {insights.chatbot.keyTopics.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Recent Topics
          </h4>
          <div className="flex flex-wrap gap-2">
            {[...new Set(insights.chatbot.keyTopics)].map((topic, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Last updated */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
        Last updated: {new Date(insights.generatedAt).toLocaleString()}
      </div>
    </div>
  )}
</div>
```

**Estimated Time**: 2 hours

---

## **PHASE 8: Testing & Refinement** (Priority: MEDIUM)

### Step 8.1: Test Chatbot Conversation Tracking
- Start a chat conversation
- Send multiple messages
- End conversation
- Verify summary is generated
- Check database for stored conversation

### Step 8.2: Test Enhanced Insights Generation
- Complete an assessment
- Have a chatbot conversation
- Check dashboard insights
- Verify AI summary combines both sources
- Test manual refresh button

### Step 8.3: Test Daily Cache Expiration
- Generate insights
- Wait for cache to expire (or manually update expiresAt)
- Login again
- Verify fresh insights are generated

### Step 8.4: Test Rate Limiting
- Make multiple AI requests quickly
- Verify rate limiting works
- Check cooldown behavior

**Estimated Time**: 3 hours

---

## 📊 Implementation Timeline

| Phase | Task | Time | Dependencies |
|-------|------|------|--------------|
| 1 | Database Schema | 1h | - |
| 2 | Increase API Rate Limit | 1h | - |
| 3 | Chatbot Service | 3h | Phase 1 |
| 4 | Enhanced Insights Service | 4h | Phase 1, 3 |
| 5 | Chatbot API Routes | 2h | Phase 3 |
| 6 | Dashboard API Routes | 1h | Phase 4 |
| 7 | Frontend Updates | 3.5h | Phase 6 |
| 8 | Testing | 3h | All phases |

**Total Estimated Time**: 18.5 hours (2-3 days)

---

## 🎯 Success Criteria

✅ **Phase 1-2**: Database models created, migrations run, API rate limit increased
✅ **Phase 3-5**: Chatbot conversations tracked, summaries generated
✅ **Phase 6-7**: Dashboard shows combined insights from assessments + chats
✅ **Phase 8**: Daily auto-update works, manual refresh works, AI summaries generate successfully

---

## 🚀 Next Steps

1. **Start with Phase 1**: Create database schema
2. **Phase 2**: Increase Gemini rate limits
3. **Phase 3-4**: Build backend services
4. **Phase 5-6**: Create API endpoints
5. **Phase 7**: Update frontend
6. **Phase 8**: Test everything

Would you like me to start implementing any specific phase?
