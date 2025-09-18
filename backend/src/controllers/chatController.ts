import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { chatService } from '../services/chatService';

const prisma = new PrismaClient();

const messageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
  userContext: Joi.object({
    name: Joi.string().optional(),
    recentMoods: Joi.array().optional(),
    completedAssessments: Joi.array().optional(),
    preferredApproach: Joi.string().optional()
  }).optional(),
  messageHistory: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('user', 'assistant').required(),
      content: Joi.string().required()
    })
  ).optional()
});

const streamMessageSchema = Joi.object({
  message: Joi.string().min(1).max(2000).required(),
  userContext: Joi.object({
    name: Joi.string().optional(),
    recentMoods: Joi.array().optional(),
    completedAssessments: Joi.array().optional(),
    preferredApproach: Joi.string().optional()
  }).optional(),
  messageHistory: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('user', 'assistant').required(),
      content: Joi.string().required()
    })
  ).optional()
});

export const streamMessage = async (req: any, res: Response) => {
  try {
    const { error } = streamMessageSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, error: error.details[0].message });
      return;
    }
    
    const userId = req.user.id;
    const { message, userContext, messageHistory } = req.body;

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Check for crisis language first
    if (chatService.detectCrisisLanguage(message)) {
      // For crisis messages, send the response immediately (no streaming)
      const result = await chatService.generateAIResponse(userId, message);
      res.write(result.botMessage?.content || 'Crisis resources are available to help you.');
      res.end();
      return;
    }

    try {
      // Try to use streaming from chatService
      const stream = await chatService.generateStreamingResponse(userId, message);
      
      // Pipe the stream to the response
      stream.on('data', (chunk: string) => {
        res.write(chunk);
      });

      stream.on('end', () => {
        res.end();
      });

      stream.on('error', (error: any) => {
        console.error('Streaming error:', error);
        res.write('\n[Error: Stream failed, falling back to regular response]');
        res.end();
      });

    } catch (streamError) {
      console.warn('Streaming not available, falling back to regular response:', streamError);
      
      // Fallback to regular response
      const result = await chatService.generateAIResponse(userId, message);
      const content = result.botMessage?.content || 'I apologize, but I encountered an issue generating a response.';
      
      // Simulate streaming by sending in chunks
      const words = content.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = (i === 0 ? '' : ' ') + words[i];
        res.write(chunk);
        
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      res.end();
    }

  } catch (e) {
    console.error('Stream message error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const sendMessage = async (req: any, res: Response) => {
  try {
    const { error } = messageSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, error: error.details[0].message });
      return;
    }
    
    const userId = req.user.id;
    const { content, userContext, messageHistory } = req.body;

    // Log the enhanced context for debugging
    console.log(`[ChatController] Received enhanced context for user ${userId}:`, {
      userContext: userContext ? 'provided' : 'none',
      messageHistoryLength: messageHistory ? messageHistory.length : 0
    });

    // Check for crisis language first
    if (chatService.detectCrisisLanguage(content)) {
      // Generate crisis response directly through chatService
      const result = await chatService.generateAIResponse(userId, content);
      
      res.status(201).json({ 
        success: true, 
        data: { 
          message: result.botMessage,
          crisis: true,
          context: result.context
        } 
      });
      return;
    }

    // Generate AI response (this handles saving messages automatically)
    const result = await chatService.generateAIResponse(userId, content);

    res.status(201).json({ 
      success: true, 
      data: { 
        message: result.botMessage,
        ai_metadata: {
          provider: result.provider,
          model: result.model,
          usage: result.usage,
          context: result.context
        }
      } 
    });

  } catch (e) {
    console.error('Send chat message error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getChatHistory = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: limit
    });
    
    res.json({ success: true, data: messages });
  } catch (e) {
    console.error('Get chat history error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getChatInsights = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const insights = await chatService.getConversationInsights(userId);
    
    res.json({ success: true, data: insights });
  } catch (e) {
    console.error('Get chat insights error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getAIHealthCheck = async (req: Request, res: Response) => {
  try {
    const status = await chatService.getProviderStatus();
    
    res.json({ 
      success: true, 
      data: {
        providers: status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (e) {
    console.error('AI health check error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const testAIProviders = async (req: Request, res: Response) => {
  try {
    const results = await chatService.testProviders();
    
    res.json({ 
      success: true, 
      data: {
        test_results: results,
        timestamp: new Date().toISOString()
      }
    });
  } catch (e) {
    console.error('AI provider test error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
