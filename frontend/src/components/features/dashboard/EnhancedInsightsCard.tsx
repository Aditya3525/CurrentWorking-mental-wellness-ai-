import { RefreshCw, Sparkles, TrendingUp, MessageCircle, Brain, Clock, Database } from 'lucide-react';
import React from 'react';

import { useDevice } from '../../../hooks/use-device';
import { useInsights, useRefreshInsights } from '../../../hooks/useDashboardData';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';

interface EnhancedInsightsCardProps {
  onNavigate?: (page: string) => void;
}

export function EnhancedInsightsCard({ onNavigate }: EnhancedInsightsCardProps) {
  const device = useDevice();
  const { data: insights, isLoading, error } = useInsights();
  const refreshInsights = useRefreshInsights();

  const handleRefresh = async () => {
    try {
      await refreshInsights.mutateAsync();
    } catch (error) {
      console.error('Failed to refresh insights:', error);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              Unable to load insights. Please try refreshing.
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshInsights.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshInsights.isPending ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasEnhancedData = insights?.assessments || insights?.chatbot;
  const isCombined = insights?.source === 'combined';
  const isCached = insights?.cached !== false;

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Data Source Badge */}
            {hasEnhancedData && (
              <Badge variant={isCombined ? "default" : "secondary"} className="text-xs">
                {isCombined ? (
                  <><Database className="h-3 w-3 mr-1" />Combined</>
                ) : (
                  <>Assessments only</>
                )}
              </Badge>
            )}
            
            {/* Refresh Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshInsights.isPending}
              className={device.isMobile ? "h-8 w-8 p-0" : "h-8"}
              title="Refresh insights"
            >
              <RefreshCw className={`h-4 w-4 ${refreshInsights.isPending ? 'animate-spin' : ''} ${device.isMobile ? '' : 'mr-2'}`} />
              {!device.isMobile && 'Refresh'}
            </Button>
          </div>
        </div>
        
        {/* Last Updated */}
        {insights?.generatedAt && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <Clock className="h-3 w-3" />
            <span>
              {isCached ? 'Last updated' : 'Generated'} {formatDate(insights.generatedAt)}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Summary */}
        {insights?.aiSummary && (
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm leading-relaxed">{insights.aiSummary}</p>
                {insights.overallTrend && (
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp className={`h-3 w-3 ${
                      insights.overallTrend === 'improving' ? 'text-green-600' :
                      insights.overallTrend === 'declining' ? 'text-red-600' :
                      'text-yellow-600'
                    }`} />
                    <span className="font-medium capitalize">{insights.overallTrend}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Data Sections */}
        {hasEnhancedData && (
          <div className={device.isMobile ? "space-y-3" : "grid md:grid-cols-2 gap-4"}>
            {/* Assessment Stats */}
            {insights.assessments && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Assessment Insights</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Completed</span>
                    <Badge variant="secondary" className="text-xs">
                      {insights.assessments.count}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Average Score</span>
                    <span className="font-medium">{Math.round(insights.assessments.averageScore)}%</span>
                  </div>
                  {insights.assessments.trend && (
                    <div className="flex items-center gap-2 text-xs pt-1">
                      <TrendingUp className={`h-3 w-3 ${
                        insights.assessments.trend === 'improving' ? 'text-green-600' :
                        insights.assessments.trend === 'declining' ? 'text-red-600' :
                        'text-yellow-600'
                      }`} />
                      <span className="capitalize">{insights.assessments.trend}</span>
                    </div>
                  )}
                  {insights.assessments.recentScores && insights.assessments.recentScores.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs text-muted-foreground mb-2 block">Recent trend</span>
                      <Progress value={insights.assessments.recentScores[0] || 0} className="h-2" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chatbot Stats */}
            {insights.chatbot && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Chatbot Insights</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Conversations</span>
                    <Badge variant="secondary" className="text-xs">
                      {insights.chatbot.conversationCount}
                    </Badge>
                  </div>
                  {insights.chatbot.averageEmotionalState && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Emotional State</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          insights.chatbot.averageEmotionalState === 'positive' ? 'border-green-500 text-green-700' :
                          insights.chatbot.averageEmotionalState === 'negative' ? 'border-red-500 text-red-700' :
                          'border-yellow-500 text-yellow-700'
                        }`}
                      >
                        {insights.chatbot.averageEmotionalState}
                      </Badge>
                    </div>
                  )}
                  {insights.chatbot.commonTopics && insights.chatbot.commonTopics.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs text-muted-foreground mb-2 block">Common Topics</span>
                      <div className="flex flex-wrap gap-1">
                        {insights.chatbot.commonTopics.slice(0, 3).map((topic, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {insights.chatbot.commonTopics.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{insights.chatbot.commonTopics.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {insights.chatbot.lastConversationDate && (
                    <div className="text-xs text-muted-foreground pt-1">
                      Last chat: {formatDate(insights.chatbot.lastConversationDate)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!insights?.aiSummary && !hasEnhancedData && (
          <div className="text-center space-y-3 py-6">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <p className="text-sm font-medium">No insights yet</p>
              <p className="text-xs text-muted-foreground">
                Complete an assessment or chat with our AI to receive personalized insights
              </p>
            </div>
            <div className={device.isMobile ? "flex flex-col gap-2" : "flex gap-2 justify-center"}>
              <Button 
                size="sm" 
                onClick={() => onNavigate?.('assessments')}
                className={device.isMobile ? "w-full min-h-[44px]" : ""}
              >
                <Brain className="h-4 w-4 mr-2" />
                Take Assessment
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onNavigate?.('chatbot')}
                className={device.isMobile ? "w-full min-h-[44px]" : ""}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            </div>
          </div>
        )}

        {/* Wellness Score */}
        {insights?.wellnessScore && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Wellness Score</span>
              <span className="text-2xl font-bold text-primary">
                {Math.round(insights.wellnessScore.value)}%
              </span>
            </div>
            <Progress value={insights.wellnessScore.value} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              Calculated using {insights.wellnessScore.method}
            </p>
          </div>
        )}

        {/* Action Prompts */}
        {hasEnhancedData && onNavigate && (
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onNavigate('progress')}
              className={device.isMobile ? "flex-1 min-h-[44px]" : "flex-1"}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Progress
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => onNavigate('chatbot')}
              className={device.isMobile ? "flex-1 min-h-[44px]" : "flex-1"}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
