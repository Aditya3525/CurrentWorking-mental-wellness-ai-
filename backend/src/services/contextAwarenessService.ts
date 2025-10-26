import { logger } from '../utils/logger';

const contextLogger = logger.child({ module: 'ContextAwareness' });

/**
 * Types for Context Awareness
 */
export interface TimeContext {
  hour: number;
  period: 'early-morning' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night' | 'late-night';
  greeting: string;
  suggestions: string[];
}

export interface RecentEvent {
  id: string;
  userId: string;
  eventType: 'life-event' | 'stressor' | 'achievement' | 'challenge' | 'milestone';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'mixed';
  intensity: 1 | 2 | 3 | 4 | 5; // 1 = minor, 5 = major
  occurred: Date;
  createdAt: Date;
}

export interface ContextualInsight {
  timeOfDay: TimeContext;
  recentEvents: RecentEvent[];
  recommendations: string[];
  tone: 'energizing' | 'calming' | 'supportive' | 'celebratory' | 'gentle';
}

/**
 * Context Awareness Service
 * Provides time-sensitive and contextually-aware conversation support
 */
export class ContextAwarenessService {
  
  /**
   * Get time-of-day context
   */
  getTimeContext(date: Date = new Date()): TimeContext {
    const hour = date.getHours();

    if (hour >= 4 && hour < 7) {
      return {
        hour,
        period: 'early-morning',
        greeting: 'Good early morning',
        suggestions: [
          'Set a positive intention for the day',
          'Try a gentle morning stretch or meditation',
          'Hydrate and eat a nourishing breakfast',
          'Journal about your goals for today'
        ]
      };
    }

    if (hour >= 7 && hour < 12) {
      return {
        hour,
        period: 'morning',
        greeting: 'Good morning',
        suggestions: [
          'Tackle your most important task first',
          'Take a mindful walk to energize',
          'Practice gratitude for three things',
          'Set realistic goals for the day'
        ]
      };
    }

    if (hour >= 12 && hour < 14) {
      return {
        hour,
        period: 'midday',
        greeting: 'Good afternoon',
        suggestions: [
          'Take a proper lunch break away from screens',
          'Do a quick breathing exercise to reset',
          'Check in with your energy levels',
          'Stretch to release midday tension'
        ]
      };
    }

    if (hour >= 14 && hour < 17) {
      return {
        hour,
        period: 'afternoon',
        greeting: 'Good afternoon',
        suggestions: [
          'Take a short break to recharge',
          'Stay hydrated',
          'Review your accomplishments so far',
          'Adjust your evening plans based on your energy'
        ]
      };
    }

    if (hour >= 17 && hour < 20) {
      return {
        hour,
        period: 'evening',
        greeting: 'Good evening',
        suggestions: [
          'Transition from work mode with a ritual',
          'Prepare a nourishing meal',
          'Connect with loved ones',
          'Reflect on your day in a journal'
        ]
      };
    }

    if (hour >= 20 && hour < 23) {
      return {
        hour,
        period: 'night',
        greeting: 'Good evening',
        suggestions: [
          'Begin winding down for sleep',
          'Limit screen time before bed',
          'Try a relaxation exercise',
          'Prepare for tomorrow to ease anxiety'
        ]
      };
    }

    // 23:00 - 4:00
    return {
      hour,
      period: 'late-night',
      greeting: 'Hello',
      suggestions: [
        'If you can\'t sleep, try the 4-7-8 breathing technique',
        'Avoid screens and bright lights',
        'Try progressive muscle relaxation',
        'Remember, some sleeplessness is normal - don\'t stress about it'
      ]
    };
  }

  /**
   * Get contextual recommendations based on time and user state
   */
  getContextualRecommendations(params: {
    timeContext: TimeContext;
    emotion: string;
    energyLevel: 'low' | 'medium' | 'high';
  }): string[] {
    const { timeContext, emotion, energyLevel } = params;
    const recommendations: string[] = [];

    // Time-specific recommendations
    if (timeContext.period === 'early-morning' || timeContext.period === 'morning') {
      if (energyLevel === 'low') {
        recommendations.push('Consider some gentle movement like stretching or yoga to wake up your body');
        recommendations.push('Exposure to natural light can help regulate your circadian rhythm');
      }
      if (emotion === 'anxious') {
        recommendations.push('Morning anxiety is common - try journaling your worries to externalize them');
      }
    }

    if (timeContext.period === 'midday' || timeContext.period === 'afternoon') {
      if (energyLevel === 'low') {
        recommendations.push('The afternoon slump is real - try a 10-minute walk or power nap if possible');
        recommendations.push('Avoid heavy carbs at lunch to prevent energy crashes');
      }
      if (emotion === 'stressed') {
        recommendations.push('Take a proper lunch break - working through lunch increases stress');
      }
    }

    if (timeContext.period === 'evening') {
      recommendations.push('Create a transition ritual between work and personal time');
      if (emotion === 'anxious' || emotion === 'stressed') {
        recommendations.push('Evening is a good time for calming practices like yin yoga or meditation');
      }
    }

    if (timeContext.period === 'night' || timeContext.period === 'late-night') {
      recommendations.push('Establish a consistent bedtime routine for better sleep');
      if (emotion === 'anxious') {
        recommendations.push('Worry time: set aside 15 minutes to write worries, then let them go for the night');
      }
      if (timeContext.period === 'late-night') {
        recommendations.push('Late-night rumination is common but not helpful - try a body scan to shift focus');
      }
    }

    return recommendations;
  }

  /**
   * Determine appropriate conversation tone based on context
   */
  determineConversationTone(params: {
    timeContext: TimeContext;
    emotionalState: 'positive' | 'neutral' | 'negative';
    recentEventImpact: 'positive' | 'negative' | 'mixed' | 'none';
  }): ContextualInsight['tone'] {
    const { timeContext, emotionalState, recentEventImpact } = params;

    // Positive event + positive emotion = celebratory
    if (recentEventImpact === 'positive' && emotionalState === 'positive') {
      return 'celebratory';
    }

    // Negative event or emotion = supportive/gentle
    if (recentEventImpact === 'negative' || emotionalState === 'negative') {
      return timeContext.period === 'early-morning' || timeContext.period === 'morning' ? 'gentle' : 'supportive';
    }

    // Morning = energizing
    if ((timeContext.period === 'early-morning' || timeContext.period === 'morning') && emotionalState === 'positive') {
      return 'energizing';
    }

    // Evening/night = calming
    if ((timeContext.period === 'evening' || timeContext.period === 'night' || timeContext.period === 'late-night')) {
      return 'calming';
    }

    // Default
    return 'supportive';
  }

  /**
   * Generate time-aware greeting
   */
  generateGreeting(userName?: string, timeContext?: TimeContext): string {
    const context = timeContext || this.getTimeContext();
    const name = userName || 'there';

    const greetings = {
      'early-morning': [
        `${context.greeting}, ${name}. You're up early today.`,
        `${context.greeting}, ${name}. How are you feeling this early morning?`,
      ],
      'morning': [
        `${context.greeting}, ${name}! How's your morning going?`,
        `${context.greeting}, ${name}. Ready to tackle the day?`,
      ],
      'midday': [
        `${context.greeting}, ${name}. How's your day shaping up?`,
        `${context.greeting}, ${name}. Taking a break from your day?`,
      ],
      'afternoon': [
        `${context.greeting}, ${name}. How are you feeling this afternoon?`,
        `${context.greeting}, ${name}. Making it through the afternoon?`,
      ],
      'evening': [
        `${context.greeting}, ${name}. How was your day?`,
        `${context.greeting}, ${name}. Winding down for the evening?`,
      ],
      'night': [
        `${context.greeting}, ${name}. How are you doing tonight?`,
        `${context.greeting}, ${name}. Getting ready to rest?`,
      ],
      'late-night': [
        `Hello, ${name}. Trouble sleeping?`,
        `Hello, ${name}. What's on your mind at this hour?`,
      ]
    };

    const periodGreetings = greetings[context.period];
    return periodGreetings[Math.floor(Math.random() * periodGreetings.length)];
  }

  /**
   * Analyze if time of day might be affecting mood
   */
  analyzeTimeImpact(params: {
    hour: number;
    emotion: string;
    commonPattern?: boolean;
  }): {
    likelyTimeRelated: boolean;
    insight: string;
    recommendation: string;
  } {
    const { hour, emotion } = params;

    // Morning anxiety
    if ((hour >= 4 && hour < 10) && (emotion === 'anxious' || emotion === 'worried')) {
      return {
        likelyTimeRelated: true,
        insight: 'Morning anxiety is very common and often related to cortisol levels being highest in the morning.',
        recommendation: 'Try a morning routine with calming activities like meditation or gentle movement to ease into your day.'
      };
    }

    // Afternoon energy dip
    if ((hour >= 14 && hour < 16) && (emotion === 'tired' || emotion === 'low energy')) {
      return {
        likelyTimeRelated: true,
        insight: 'The afternoon energy dip (around 2-4pm) is a natural part of your circadian rhythm.',
        recommendation: 'A short walk, light snack, or even a 20-minute power nap can help. Avoid heavy carbs at lunch.'
      };
    }

    // Evening rumination
    if ((hour >= 21 || hour < 4) && (emotion === 'anxious' || emotion === 'worried' || emotion === 'overthinking')) {
      return {
        likelyTimeRelated: true,
        insight: 'Late evening and nighttime rumination is common because there are fewer distractions and the mind becomes more active.',
        recommendation: 'Try the "worry dump" technique: write down your worries for 10 minutes, then close the notebook. This signals to your brain that you\'ve addressed them.'
      };
    }

    // Seasonal affective considerations (would need date for full implementation)
    if ((hour >= 15 && hour < 18) && emotion === 'sad') {
      return {
        likelyTimeRelated: false,
        insight: 'Late afternoon sadness can sometimes be related to decreasing daylight, especially in fall/winter.',
        recommendation: 'Consider getting outdoor light exposure earlier in the day, or using a light therapy box if recommended by your doctor.'
      };
    }

    return {
      likelyTimeRelated: false,
      insight: '',
      recommendation: ''
    };
  }

  /**
   * Get comprehensive contextual insight
   */
  getContextualInsight(params: {
    userId: string;
    recentEvents: RecentEvent[];
    emotionalState: 'positive' | 'neutral' | 'negative';
    emotion: string;
    energyLevel: 'low' | 'medium' | 'high';
    userName?: string;
  }): ContextualInsight {
    const timeContext = this.getTimeContext();

    const recentEventImpact: ContextualInsight['tone'] = 
      params.recentEvents.length > 0 
        ? params.recentEvents[0].impact === 'positive' ? 'celebratory' : 'supportive'
        : 'supportive';

    const tone = this.determineConversationTone({
      timeContext,
      emotionalState: params.emotionalState,
      recentEventImpact: params.recentEvents.length > 0 ? params.recentEvents[0].impact : 'none'
    });

    const recommendations = this.getContextualRecommendations({
      timeContext,
      emotion: params.emotion,
      energyLevel: params.energyLevel
    });

    // Add time-impact analysis
    const timeImpact = this.analyzeTimeImpact({
      hour: timeContext.hour,
      emotion: params.emotion
    });

    if (timeImpact.likelyTimeRelated) {
      recommendations.unshift(timeImpact.insight);
      recommendations.push(timeImpact.recommendation);
    }

    return {
      timeOfDay: timeContext,
      recentEvents: params.recentEvents,
      recommendations,
      tone
    };
  }

  /**
   * Build context-aware system prompt additions
   */
  buildContextPrompt(contextInsight: ContextualInsight): string {
    let prompt = `\n\nCONTEXTUAL AWARENESS:\n`;
    prompt += `Time of day: ${contextInsight.timeOfDay.period} (${contextInsight.timeOfDay.hour}:00)\n`;
    prompt += `Conversation tone: ${contextInsight.tone}\n`;

    if (contextInsight.recentEvents.length > 0) {
      prompt += `\nRecent events to be aware of:\n`;
      contextInsight.recentEvents.forEach(event => {
        prompt += `- ${event.title} (${event.impact} impact, intensity: ${event.intensity}/5)\n`;
      });
    }

    if (contextInsight.recommendations.length > 0) {
      prompt += `\nTime-appropriate recommendations to consider mentioning:\n`;
      contextInsight.recommendations.forEach(rec => {
        prompt += `- ${rec}\n`;
      });
    }

    prompt += `\nAdjust your language and suggestions based on the time of day and recent events.`;

    return prompt;
  }
}

export const contextAwarenessService = new ContextAwarenessService();
