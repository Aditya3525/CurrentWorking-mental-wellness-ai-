import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

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

    // Store user message
    const userMsg = await prisma.chatMessage.create({
      data: { userId, content, type: 'user' }
    });

    // Placeholder AI response (replace with real model integration)
    const botContent = 'Thanks for sharing. I\'m here with you. Can you tell me a bit more about how this makes you feel?';
    const botMsg = await prisma.chatMessage.create({
      data: { userId, content: botContent, type: 'bot' }
    });

    res.status(201).json({ success: true, data: { messages: [userMsg, botMsg] } });
  } catch (e) {
    console.error('Send chat message error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getChatHistory = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 200
    });
    res.json({ success: true, data: messages });
  } catch (e) {
    console.error('Get chat history error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
