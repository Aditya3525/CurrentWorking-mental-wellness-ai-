import { llmService } from './llmProvider';
import type { MentalHealthState } from '../types/mentalHealth';
import { UserContext } from '../types/ai';

export interface ApproachResponse {
  message: string;
  approach: string;
  contentSuggestions: string[];
  shouldSuggestProfessional: boolean;
  provider: string;
}

export class ApproachRouter {
  /**
   * Route user message to appropriate approach-based response
   */
  async routeResponse(
    userMessage: string,
    userContext: UserContext,
    mentalHealthState: MentalHealthState
  ): Promise<ApproachResponse> {
    try {
      const approach = userContext.approach || 'hybrid';
      
      // Generate approach-specific system prompt
      const systemPrompt = this.generateSystemPrompt(approach, mentalHealthState);
      
      // Create conversation context
      const conversationPrompt = `${systemPrompt}

User's current mental health state: ${mentalHealthState.state} (Score: ${mentalHealthState.score}/100)
Key concerns: ${mentalHealthState.topConcerns?.join(', ') || 'General wellbeing'}
Current situation: ${mentalHealthState.reasons?.join('; ') || 'Baseline assessment'}

User says: "${userMessage}"

Please provide a supportive response following the ${approach} approach guidelines above.`;

      // Generate response using existing LLM service
      const aiResponse = await llmService.generateResponse(
        [{ role: 'user', content: conversationPrompt }],
        { maxTokens: 300, temperature: 0.7 }
      );

      // Generate content suggestions based on state and concerns
      const contentSuggestions = this.generateContentSuggestions(
        mentalHealthState,
        approach
      );

      // Determine if professional support should be suggested
      const shouldSuggestProfessional = this.shouldSuggestProfessional(mentalHealthState);

      return {
        message: aiResponse.content,
        approach,
        contentSuggestions,
        shouldSuggestProfessional,
        provider: aiResponse.provider || 'ai-' + approach
      };

    } catch (error) {
      console.error('Approach routing failed:', error);
      
      // Fallback to simple empathetic response
      return {
        message: this.getFallbackResponse(userMessage, userContext.approach || 'hybrid'),
        approach: userContext.approach || 'hybrid',
        contentSuggestions: [],
        shouldSuggestProfessional: false,
        provider: 'fallback'
      };
    }
  }

  /**
   * Generate approach-specific system prompt
   */
  private generateSystemPrompt(approach: string, state: MentalHealthState): string {
    const baseGuidelines = `You are a supportive mental health assistant. Always:
- Be empathetic and non-judgmental
- Avoid giving medical diagnosis or advice
- Encourage professional help when appropriate
- Keep responses to 2-3 paragraphs maximum
- Focus on practical, actionable guidance`;

    switch (approach) {
      case 'western':
        return `${baseGuidelines}

WESTERN APPROACH GUIDELINES:
- Use evidence-based therapeutic techniques (CBT, mindfulness-based interventions)
- Focus on cognitive restructuring and behavioral changes
- Provide structured, step-by-step coping strategies
- Emphasize self-monitoring and pattern recognition
- Reference research-backed methods when appropriate
- Help identify thought patterns and offer alternative perspectives`;

      case 'eastern':
        return `${baseGuidelines}

EASTERN APPROACH GUIDELINES:
- Draw from mindfulness, meditation, and holistic wellness traditions
- Emphasize present-moment awareness and acceptance
- Suggest breath work, body awareness, and gentle movement
- Focus on inner wisdom and natural healing capacity
- Use compassionate, non-directive language
- Integrate mind-body-spirit perspectives on wellbeing`;

      case 'hybrid':
      default:
        return `${baseGuidelines}

HYBRID APPROACH GUIDELINES:
- Blend evidence-based Western techniques with Eastern wisdom practices
- Offer both structured cognitive strategies and mindful awareness practices
- Balance practical action steps with acceptance and inner reflection
- Integrate body-mind approaches with cognitive tools
- Provide both immediate coping techniques and deeper growth practices
- Honor both analytical and intuitive ways of healing`;
    }
  }

  /**
   * Generate content suggestions based on mental health state and concerns
   */
  private generateContentSuggestions(
    state: MentalHealthState,
    approach: string
  ): string[] {
    const suggestions: string[] = [];

    // Base suggestions on state severity
    if (state.state === 'worst' || state.state === 'bad') {
      // Crisis/high distress - focus on immediate relief
      if (approach === 'western') {
        suggestions.push('Guided breathing exercises for immediate anxiety relief');
        suggestions.push('Cognitive restructuring techniques for negative thoughts');
        suggestions.push('Grounding exercises using 5-4-3-2-1 method');
      } else if (approach === 'eastern') {
        suggestions.push('5-minute mindfulness meditation for grounding');
        suggestions.push('Body scan practice for tension release');
        suggestions.push('Loving-kindness meditation for self-compassion');
      } else {
        suggestions.push('Quick grounding techniques combining breath and cognitive focus');
        suggestions.push('Gentle movement with mindful awareness');
        suggestions.push('Progressive muscle relaxation with affirmations');
      }
    } else {
      // Good/great state - focus on maintenance and growth
      if (approach === 'western') {
        suggestions.push('Stress management and prevention strategies');
        suggestions.push('Building emotional intelligence skills');
        suggestions.push('Goal-setting and problem-solving techniques');
      } else if (approach === 'eastern') {
        suggestions.push('Daily mindfulness practices for wellbeing');
        suggestions.push('Yoga or tai chi for mind-body balance');
        suggestions.push('Nature-based meditation and reflection');
      } else {
        suggestions.push('Integrated wellness practices for sustained wellbeing');
        suggestions.push('Mindful goal-setting and progress reflection');
        suggestions.push('Holistic stress prevention with cognitive tools');
      }
    }

    // Add concern-specific suggestions
    state.topConcerns?.forEach((concern: string) => {
      if (concern.includes('anxiety')) {
        suggestions.push('Anxiety-specific coping techniques and exposure methods');
      } else if (concern.includes('stress')) {
        suggestions.push('Stress reduction and time management resources');
      } else if (concern.includes('overthinking')) {
        suggestions.push('Mindfulness practices for racing thoughts');
      } else if (concern.includes('trauma')) {
        suggestions.push('Trauma-informed grounding and safety techniques');
      } else if (concern.includes('emotional')) {
        suggestions.push('Emotional regulation and intelligence building');
      }
    });

    // Return unique suggestions, max 3
    return [...new Set(suggestions)].slice(0, 3);
  }

  /**
   * Determine if professional support should be suggested
   */
  private shouldSuggestProfessional(state: MentalHealthState): boolean {
    // Suggest professional support for severe states
    if (state.state === 'worst') return true;
    if (state.state === 'bad' && state.score >= 70) return true;
    
    // Check for trauma or severe assessment patterns
    const severeConcerns = ['trauma-fear', 'severe'];
    const hasSevereConcerns = state.topConcerns?.some((concern: string) =>
      severeConcerns.some(severe => concern.includes(severe))
    );
    
    return hasSevereConcerns || false;
  }

  /**
   * Fallback response when AI routing fails
   */
  private getFallbackResponse(message: string, approach: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (approach === 'western') {
      if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
        return "I can hear that you're feeling anxious. One effective technique is the 5-4-3-2-1 grounding method: identify 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This helps redirect your focus to the present moment and can reduce anxiety symptoms.";
      }
      return "Thank you for sharing. It sounds like you're going through something difficult. Remember that thoughts and feelings are temporary, and there are evidence-based strategies that can help. What's one small step you could take right now to support yourself?";
    } else if (approach === 'eastern') {
      if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
        return "I hear you, and your anxiety is completely understandable. Let's take a moment to breathe together - inhale slowly for 4 counts, hold for 4, and exhale for 6. Your breath is always available as an anchor to the present moment. What does your body need right now to feel more grounded?";
      }
      return "I hear you, and your feelings are completely valid. Sometimes our minds and hearts need gentle attention. Take a moment to breathe deeply - let your breath be an anchor to the present moment. What does your inner wisdom tell you about what you need right now?";
    } else {
      if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
        return "I understand you're feeling anxious, and that's a natural response to stress. Let's combine some practical grounding with gentle awareness: notice 3 things around you, take 3 slow breaths, and remind yourself 'This feeling will pass.' Both your thinking mind and your intuitive body have wisdom to offer right now.";
      }
      return "Thank you for sharing what you're experiencing. Your feelings matter, and it's brave to reach out. Both practical strategies and gentle self-compassion can be helpful right now. What feels most supportive to you at this moment - taking action or simply being present with what you're feeling?";
    }
  }

  /**
   * Test approach routing
   */
  async testApproaches(): Promise<{ western: boolean; eastern: boolean; hybrid: boolean }> {
    const testMessage = "I'm feeling stressed about work";
    const testContext = {
      id: 'test',
      name: 'Test User',
      approach: 'hybrid' as const
    };
    const testState: MentalHealthState = {
      state: 'good',
      score: 45,
      reasons: ['Test assessment'],
      topConcerns: ['stress'],
      confidence: 0.8,
      lastUpdated: new Date()
    };

    const results = {
      western: false,
      eastern: false,
      hybrid: false
    };

    // Test each approach
    const approaches: Array<'western' | 'eastern' | 'hybrid'> = ['western', 'eastern', 'hybrid'];
    
    for (const approach of approaches) {
      try {
        const context = { ...testContext, approach };
        await this.routeResponse(testMessage, context, testState);
        results[approach] = true;
      } catch (error) {
        console.error(`${approach} approach test failed:`, error);
      }
    }

    return results;
  }
}

// Export singleton instance
export const approachRouter = new ApproachRouter();
