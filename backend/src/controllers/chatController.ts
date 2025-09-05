import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { chatService } from '../services/chatService';

const prisma = new PrismaClient();

const messageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required()
});

export const sendMessage = async (req: any, res: Response) => {
  try {
    const { error } = messageSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, error: error.details[0].message });
      return;
    }
    
    const userId = req.user.id;
    const { content } = req.body;

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
