import { llmService } from './llmProvider';
import { AIMessage, UserContext } from '../types/ai';

export const approachRouter = {
  async routeResponse(
    userMessage: string,
    userContext: UserContext,
    mentalHealthState: any
  ) {
    try {
      // Create a comprehensive system prompt based on the user's approach and mental health state
      const systemPrompt = this.createSystemPrompt(userContext, mentalHealthState);
      
      // Prepare the conversation for the AI
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Generate AI response using the LLM service
      const aiResponse = await llmService.generateResponse(messages, {
        maxTokens: 300,
        temperature: 0.7
      }, {
        user: userContext,
        messages: messages,
        sessionId: `session_${userContext.id}_${Date.now()}`,
        timestamp: new Date()
      });

      // Analyze the response to determine if professional help should be suggested
      const shouldSuggestProfessional = this.analyzeCrisisIndicators(userMessage, aiResponse.content);
      
      // Extract content suggestions from the context
      const contentSuggestions = this.extractContentSuggestions(mentalHealthState, userContext);

      return {
        message: aiResponse.content,
        approach: userContext.approach || 'general',
        provider: aiResponse.provider,
        model: aiResponse.model,
        shouldSuggestProfessional,
        contentSuggestions,
        usage: aiResponse.usage
      };

    } catch (error) {
      console.error('[ApproachRouter] Error generating AI response:', error);
      
      // Fallback response if AI fails
      return {
        message: "I understand you're reaching out for support. While I'm experiencing some technical difficulties right now, please know that your mental health is important. If you're in crisis, please reach out to a mental health professional or crisis hotline immediately.",
        approach: userContext.approach || 'general',
        provider: 'fallback',
        shouldSuggestProfessional: true,
        contentSuggestions: []
      };
    }
  },

  createSystemPrompt(userContext: UserContext, mentalHealthState: any): string {
    const approach = userContext.approach || 'general';
    const userName = userContext.name || 'there';
    const concerns = mentalHealthState?.topConcerns || [];
    const severity = mentalHealthState?.state || 'unknown';

    let systemPrompt = `You are a compassionate AI mental health companion trained to provide supportive, empathetic responses. 

User Profile:
- Name: ${userName}
- Preferred Approach: ${approach}
- Current Mental Health State: ${severity}
- Main Concerns: ${concerns.join(', ') || 'None specified'}

Guidelines:
1. Always be empathetic, non-judgmental, and supportive
2. Provide responses tailored to the ${approach} approach`;

    // Add approach-specific instructions
    switch (approach) {
      case 'western':
        systemPrompt += `
3. Focus on evidence-based therapeutic techniques like CBT, DBT, mindfulness
4. Suggest practical coping strategies and self-care activities
5. Reference psychological concepts when appropriate`;
        break;
      case 'eastern':
        systemPrompt += `
3. Incorporate mindfulness, meditation, and holistic wellness concepts
4. Reference balance, inner peace, and spiritual well-being
5. Suggest practices like breathing exercises, yoga, or contemplation`;
        break;
      case 'hybrid':
        systemPrompt += `
3. Blend evidence-based Western techniques with Eastern mindfulness practices
4. Offer both practical strategies and holistic approaches
5. Adapt your style to what seems most helpful for this specific conversation`;
        break;
      default:
        systemPrompt += `
3. Provide balanced, evidence-based support
4. Focus on active listening and validation
5. Suggest appropriate coping strategies`;
    }

    systemPrompt += `

6. Keep responses concise but meaningful (aim for 2-3 sentences)
7. If the user expresses suicidal thoughts or immediate danger, strongly encourage professional help
8. Never provide medical diagnoses or replace professional therapy
9. Be warm, human-like, and genuinely caring in your tone
10. Ask follow-up questions when appropriate to show engagement

Respond naturally and conversationally, as if you're a trusted friend with mental health training.`;

    return systemPrompt;
  },

  analyzeCrisisIndicators(userMessage: string, aiResponse: string): boolean {
    const crisisKeywords = [
      'suicide', 'suicidal', 'kill myself', 'end it all', 'death', 'dying',
      'hurt myself', 'self-harm', 'cut myself', 'overdose', 'jump',
      'give up', 'no point', 'worthless', 'hopeless', 'can\'t go on'
    ];

    const userMessageLower = userMessage.toLowerCase();
    const hasCrisisIndicators = crisisKeywords.some(keyword => 
      userMessageLower.includes(keyword)
    );

    // Also check if the AI response suggests professional help
    const aiSuggestsProfessional = aiResponse.toLowerCase().includes('professional') ||
                                   aiResponse.toLowerCase().includes('therapist') ||
                                   aiResponse.toLowerCase().includes('counselor') ||
                                   aiResponse.toLowerCase().includes('crisis');

    return hasCrisisIndicators || aiSuggestsProfessional;
  },

  extractContentSuggestions(mentalHealthState: any, userContext: UserContext): string[] {
    const suggestions = [];
    const concerns = mentalHealthState?.topConcerns || [];
    const approach = userContext.approach || 'general';

    // Add suggestions based on concerns and approach
    if (concerns.includes('anxiety')) {
      suggestions.push('breathing exercises', 'mindfulness meditation');
    }
    if (concerns.includes('depression')) {
      suggestions.push('mood tracking', 'self-care activities');
    }
    if (concerns.includes('stress')) {
      suggestions.push('stress management techniques', 'relaxation exercises');
    }

    // Add approach-specific suggestions
    if (approach === 'eastern') {
      suggestions.push('meditation guides', 'yoga practices');
    } else if (approach === 'western') {
      suggestions.push('CBT exercises', 'therapy worksheets');
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }
};