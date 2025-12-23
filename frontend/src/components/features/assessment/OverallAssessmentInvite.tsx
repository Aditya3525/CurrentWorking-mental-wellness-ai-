import { Heart, Sparkles } from 'lucide-react';
import React from 'react';

import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';

interface OverallAssessmentInviteProps {
  onDecision: (accept: boolean) => void;
  userName?: string;
}

export function OverallAssessmentInvite({ onDecision, userName }: OverallAssessmentInviteProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8">
      <Card
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl shadow-2xl border-2 border-primary/30 bg-gradient-to-br from-background to-primary/5"
      >
        <CardHeader className="space-y-6 text-center pb-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Heart className="h-10 w-10 text-white" fill="white" />
          </div>
          <div className="space-y-3">
            <CardTitle className="text-3xl md:text-4xl font-bold">
              Welcome to Your Wellbeing Journey{userName ? `, ${userName}` : ''}!
            </CardTitle>
            <CardDescription className="text-lg leading-relaxed text-foreground/70 max-w-xl mx-auto">
              To personalize your experience and provide tailored recommendations, we invite you to complete
              a comprehensive wellbeing assessment.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pb-8">
          <div className="bg-muted/50 rounded-lg p-6 space-y-3">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">What you&apos;ll discover:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Your current mental wellness baseline</li>
                  <li>• Personalized insights and recommendations</li>
                  <li>• Custom-tailored support and practices</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => onDecision(true)} 
              className="w-full md:w-auto px-8 h-12 text-base font-semibold"
            >
              <Heart className="h-5 w-5 mr-2" />
              Start Assessment
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onDecision(false)}
              className="w-full md:w-auto px-8 h-12 text-base"
            >
              Skip for Now
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Takes approximately 10-15 minutes • You can pause anytime
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
