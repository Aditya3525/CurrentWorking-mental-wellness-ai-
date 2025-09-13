import { Heart, Brain, Target, Sparkles, Play, MessageCircle, BookOpen, TrendingUp, Calendar, Award, ArrowRight, Users, Shield, Loader2, RefreshCw } from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { assessmentsApi, insightsApi, chatApi, moodApi } from '../../../services/api';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';

interface UserLike {
  firstName?: string; lastName?: string; name?: string; approach?: string; birthday?: string; region?: string; profilePhoto?: string;
  emergencyContact?: string; emergencyPhone?: string; assessmentScores?: Record<string, number>;
  [k: string]: unknown;
}
interface DashboardProps {
  user: UserLike;
  onNavigate: (page: string) => void;
  onStartAssessment: (assessmentId: string) => void;
  onLogout?: () => void;
}

interface AssessmentScores {
  anxiety?: number;
  stress?: number;
  depression?: number;
  wellness?: number;
  emotionalIntelligence?: number;
  overthinking?: number;
}

export function Dashboard({ user, onNavigate, onStartAssessment, onLogout }: DashboardProps) {
  const [todayMood, setTodayMood] = useState<string>('');
  const [assessmentScores, setAssessmentScores] = useState<AssessmentScores>({});
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState<{ practices: number; moods: number; assessmentCompleted: number; streak: number }>({ practices: 0, moods: 0, assessmentCompleted: 0, streak: 0 });
  const [insights, setInsights] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistoryItem[]>([]);
  const [serverMoodHistory, setServerMoodHistory] = useState<{ date: string; mood: string }[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const lastRefreshStartRef = useRef<number>(0);
  // summaryLoading & history not yet wired to backend streaming; placeholder removed to satisfy lint

  interface AssessmentHistoryItem { id?: string; assessmentType?: string; type?: string; score?: number; completedAt?: string; createdAt?: string; date?: string; }
  interface ChatMessage { id?: string; role?: string; sender?: string; content?: string; createdAt?: string; }
  interface MoodHistoryItem { date: string; mood: string }

  // Fetch user's assessments and create scores object
  // Rolling 7-day computation (today inclusive) (defined early for hooks ordering)
  const computeRollingWeek = useCallback(() => {
    // Calculate Sunday-to-Sunday weekly cycle as requested
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Find the start of current week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Find the end of current week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const dateKey = (d: Date) => d.toISOString().slice(0,10);
    const inRange = (d: string) => {
      const dt = new Date(d + 'T00:00:00');
      return dt >= startOfWeek && dt <= endOfWeek;
    };
    // Use server mood history (single source of truth) plus optimistic today's mood if not yet in history
    const moodMap: Record<string,string> = {};
    serverMoodHistory.forEach(m => { if (m.date) moodMap[m.date] = m.mood; });
    const todayKey = new Date().toISOString().slice(0,10);
    if (todayMood && !moodMap[todayKey]) moodMap[todayKey] = todayMood; // optimistic
    const moodLogs: { date: string; mood: string }[] = Object.entries(moodMap).map(([date, mood]) => ({ date, mood }));
    const practiceLogs: { date: string; id?: string }[] = JSON.parse(localStorage.getItem('mw_practice_logs') || '[]');
    // Derive assessments directly from history (avoid stale local cache)
    const assessmentLogs: { date: string; type: string }[] = assessmentHistory.map(h => ({
      date: (h.completedAt || h.createdAt || h.date || '').slice(0,10),
      type: (h.assessmentType || h.type || '').toLowerCase()
    })).filter(a => a.date);
    const moods = moodLogs.filter(l => inRange(l.date)).length;
    const practices = practiceLogs.filter(l => inRange(l.date)).length;
    const assessmentsCompleted = assessmentLogs.filter(l => inRange(l.date)).length;
    
    // Calculate consecutive daily streak from today backwards
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const k = dateKey(d);
      const has = moodLogs.some(l => l.date === k) || practiceLogs.some(p => p.date === k) || assessmentLogs.some(a => a.date === k);
      if (has) streak++; else break;
    }
    setWeeklyStats({ practices, moods, assessmentCompleted: assessmentsCompleted, streak });
  }, [assessmentHistory, serverMoodHistory, todayMood]);

  const fetchAssessments = useCallback(async () => {
    try {
      // Use history to derive latest scores per assessment type (catalog endpoint lacks user scores)
      const histResp = await assessmentsApi.getAssessmentHistory();
      if (histResp.success && Array.isArray(histResp.data)) {
        const scores: AssessmentScores = {};
        // Group by assessmentType and pick latest by completedAt
        const latestByType: Record<string, { score: number; completedAt: string }> = {};
  histResp.data.forEach((item: AssessmentHistoryItem) => {
          const type = item.assessmentType || item.type;
          if (!type || typeof item.score !== 'number') return;
            const completedAt = item.completedAt || item.createdAt || item.date || '';
            if (!latestByType[type] || new Date(completedAt) > new Date(latestByType[type].completedAt)) {
              latestByType[type] = { score: item.score, completedAt };
            }
        });
        Object.entries(latestByType).forEach(([type, data]) => {
          const key = type.toLowerCase().replace(/[-\s]/g,'');
          scores[key as keyof AssessmentScores] = data.score;
        });
        setAssessmentScores(scores);
      }
    } catch (error) {
      console.error('Failed to derive assessment scores from history:', error);
    } finally { setLoadingAssessments(false); }
  }, []);

  useEffect(() => {
    fetchAssessments();
    computeRollingWeek();
  }, [fetchAssessments, computeRollingWeek]);

    // (Removed duplicate old computeRollingWeek definition after refactor)

  useEffect(() => {
    if (!loadingAssessments && Object.keys(assessmentScores).length > 0) {
      localStorage.setItem('mw_prev_assessment_scores', JSON.stringify(assessmentScores));
    }
  }, [loadingAssessments, assessmentScores]);

  const moodOptions = [
    { mood: 'Great', emoji: '😊', color: 'bg-green-100 text-green-800' },
    { mood: 'Good', emoji: '🙂', color: 'bg-blue-100 text-blue-800' },
    { mood: 'Okay', emoji: '😐', color: 'bg-yellow-100 text-yellow-800' },
    { mood: 'Struggling', emoji: '😔', color: 'bg-orange-100 text-orange-800' },
    { mood: 'Anxious', emoji: '😰', color: 'bg-red-100 text-red-800' },
  ];

  const logMood = async (mood: string) => {
    setTodayMood(mood);
    const todayKey = new Date().toISOString().slice(0,10);
    setServerMoodHistory(prev => {
      const exists = prev.some(p => p.date === todayKey);
      if (exists) return prev.map(p => p.date === todayKey ? { ...p, mood } : p);
      return [...prev, { date: todayKey, mood }];
    });
    try { await moodApi.logMood(mood); } catch { /* ignore server mood failure for now */ }
    computeRollingWeek();
    // Intentionally NOT regenerating insights automatically on mood change per new requirement
  };
  // Generate insights (5-7 lines) optionally skipping remote calls
  const generateInsights = useCallback(async ({ skipRemote = false, assessmentHistory }: { skipRemote?: boolean; assessmentHistory?: AssessmentHistoryItem[] } = {}) => {
    try {
      const newLines: string[] = [];
      let summaryData: { overall?: string; summary?: string; message?: string; recommendation?: string } | null = null;
      if (!skipRemote) {
        try {
          const summaryResp = await insightsApi.getMentalHealthSummary();
            if (summaryResp.success && summaryResp.data) summaryData = summaryResp.data;
        } catch { /* ignore summary errors */ }
      }

      // 1. Overall summary line
      if (summaryData) {
        const overall = summaryData.overall || summaryData.summary || summaryData.message;
        if (typeof overall === 'string') newLines.push(overall.trim().slice(0, 220));
      }

      // Mood distribution this week (Sunday to Sunday)
      const mergedMoodMap: Record<string, string> = {};
      serverMoodHistory.forEach(m => { if (m.date) mergedMoodMap[m.date] = m.mood; });
      // Include today's optimistic mood if not persisted yet
      const todayKey = new Date().toISOString().slice(0,10);
      if (todayMood && !mergedMoodMap[todayKey]) mergedMoodMap[todayKey] = todayMood;
      const moodLogs = Object.entries(mergedMoodMap).map(([date, mood]) => ({ date, mood }));
      
      // Use same Sunday-to-Sunday calculation as weekly stats  
      const todayForMood = new Date();
      const currentDayOfWeek = todayForMood.getDay();
      const startOfWeek = new Date(todayForMood);
      startOfWeek.setDate(todayForMood.getDate() - currentDayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const inRange = (d: string) => { 
        const dt = new Date(d + 'T00:00:00'); 
        return dt >= startOfWeek && dt <= endOfWeek; 
      };
      const thisWeekMoods = moodLogs.filter(l => inRange(l.date));
      if (thisWeekMoods.length > 0) {
        const counts: Record<string, number> = {};
        thisWeekMoods.forEach(m => { counts[m.mood] = (counts[m.mood] || 0) + 1; });
        const topMood = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
        newLines.push(`This week's mood: '${topMood[0]}' most frequent (${topMood[1]} of ${thisWeekMoods.length} check-ins).`);
      }

      // Assessment deltas using history (fallback to prev local scores)
      let history = assessmentHistory;
      if (!history && !skipRemote) {
        try {
          const histResp = await assessmentsApi.getAssessmentHistory();
          if (histResp.success && histResp.data) history = histResp.data;
        } catch { /* ignore history errors */ }
      }

      if (history && Array.isArray(history) && history.length > 0) {
        // Normalize & update local assessment logs for weekly counts
        const existing: { date: string; type: string }[] = JSON.parse(localStorage.getItem('mw_assessment_logs') || '[]');
        let changed = false;
        history.forEach((h: AssessmentHistoryItem) => {
          const date = (h.completedAt || h.createdAt || h.date || '').slice(0,10);
            if (!date) return;
            const typeRaw = (h.assessmentType || h.type || '').toLowerCase().replace(/[-\s]/g,'');
            if (!existing.some(e => e.date === date && e.type === typeRaw)) { existing.push({ date, type: typeRaw }); changed = true; }
        });
        if (changed) localStorage.setItem('mw_assessment_logs', JSON.stringify(existing));

        // Compute latest vs previous per type for a few key assessments
        const byType: Record<string, AssessmentHistoryItem[]> = {};
  history.forEach((h: AssessmentHistoryItem) => { const t = (h.assessmentType || h.type || '').toLowerCase(); byType[t] = byType[t] || []; byType[t].push(h); });
  Object.values(byType).forEach(arr => arr.sort((a,b) => new Date(b.completedAt || b.createdAt || b.date || '').getTime() - new Date(a.completedAt || a.createdAt || a.date || '').getTime()));
        // Unified keys based on current backend types
        ['anxiety','stress','emotionalintelligence','overthinking','personality','trauma-fear'].forEach(key => {
          const arr = byType[key];
          if (arr && arr.length >= 2) {
            const latest = arr[0]; const prev = arr[1];
            if (typeof latest.score === 'number' && typeof prev.score === 'number') {
              const diff = latest.score - prev.score;
              if (Math.abs(diff) >= 4) {
                newLines.push(`${(latest.assessmentType||key).replace(/-/g,' ')} ${diff > 0 ? 'rose' : 'improved'} by ${Math.abs(diff)} since last measure.`);
              }
            }
          }
        });
      } else {
        // Fallback to previously stored scores diff
        const prevScores: AssessmentScores = JSON.parse(localStorage.getItem('mw_prev_assessment_scores') || '{}');
        if (assessmentScores.anxiety && prevScores.anxiety) {
          const diff = assessmentScores.anxiety - prevScores.anxiety;
          if (Math.abs(diff) >= 5) newLines.push(`Anxiety score ${diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(diff)} points.`);
        }
        if (assessmentScores.stress && prevScores.stress) {
          const diff = assessmentScores.stress - prevScores.stress;
          if (Math.abs(diff) >= 5) newLines.push(`Stress score ${diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(diff)} points.`);
        }
      }

      // Engagement & streak
      newLines.push(`This week: ${weeklyStats.moods} mood logs, ${weeklyStats.practices} practices, ${weeklyStats.assessmentCompleted} assessments (Sunday-Saturday).`);
      if (weeklyStats.streak > 0) newLines.push(`Current streak: ${weeklyStats.streak} day${weeklyStats.streak === 1 ? '' : 's'} of consistent activity.`);

      // Recommendation heuristic
      if (!skipRemote && summaryData?.recommendation) {
        newLines.push(String(summaryData.recommendation).slice(0, 200));
      } else {
        if (weeklyStats.practices < 3) newLines.push('Consider adding 1 short practice to deepen progress.');
        else newLines.push('Nice consistency—maintain momentum with another check-in tomorrow.');
      }

      // Limit to 7 lines & ensure minimum fallback
      const finalLines = newLines.filter(Boolean).slice(0,7);
      if (finalLines.length === 0) finalLines.push('Log moods and complete assessments to unlock personalized insights.');
      setInsights(finalLines);
    } catch (e) {
      setInsights(['Unable to generate insights right now. Try again later.']);
    }
  }, [assessmentScores.anxiety, assessmentScores.stress, weeklyStats.moods, weeklyStats.practices, weeklyStats.assessmentCompleted, weeklyStats.streak, serverMoodHistory, todayMood]);

  const refreshAll = useCallback(async () => {
    const now = Date.now();
    // Debounce rapid clicks (1.5s) & block if currently refreshing
    if (refreshing || (now - lastRefreshStartRef.current) < 1500) return;
    lastRefreshStartRef.current = now;
    setRefreshing(true);
    try {
      // Fetch assessment history & update local stats
      let history: AssessmentHistoryItem[] | undefined;
      try {
        const histResp = await assessmentsApi.getAssessmentHistory();
        if (histResp.success && histResp.data) history = histResp.data;
      } catch { /* ignore */ }

      // Fetch server mood history (merge later inside computeRollingWeek)
      try {
        const moodResp = await moodApi.getMoodHistory();
        if (moodResp.success && Array.isArray(moodResp.data)) {
          type RawMood = { createdAt?: string; date?: string; mood?: string };
          const normalized: MoodHistoryItem[] = moodResp.data.map((m: RawMood) => ({
            date: ((m.createdAt || m.date) || '').slice(0,10),
            mood: m.mood || ''
          })).filter((m: MoodHistoryItem) => m.date && m.mood);
          setServerMoodHistory(normalized);
        }
      } catch { /* ignore server mood errors */ }

      // Optional chat history (heuristic summary appended as a line if useful)
      let chatSummaryLine: string | null = null;
      try {
        const chatResp = await chatApi.getChatHistory();
        if (chatResp.success && chatResp.data && Array.isArray(chatResp.data)) {
          const recent: ChatMessage[] = chatResp.data.slice(-6);
          const userMsgs = recent.filter((m: ChatMessage) => (m.role || m.sender) === 'user').length;
          const aiMsgs = recent.filter((m: ChatMessage) => (m.role || m.sender) === 'assistant').length;
          if (userMsgs + aiMsgs > 0) chatSummaryLine = `Recent chat: ${userMsgs} queries, ${aiMsgs} AI replies (last ${recent.length} messages).`;
        }
      } catch { /* ignore chat errors */ }

      // Generate insights first so assessmentLogs are updated BEFORE computing weekly counts
  if (history) setAssessmentHistory(history);
  await generateInsights({ assessmentHistory: history });
      computeRollingWeek();
      if (chatSummaryLine) {
        setInsights(prev => {
          if (prev.some(l => l.startsWith('Recent chat:'))) return prev;
          const updated = [...prev];
          if (updated.length >= 7) updated.pop();
          updated.push(chatSummaryLine!);
          return updated;
        });
      }
    } finally {
      setRefreshing(false);
      setLastRefreshed(new Date());
      try {
        localStorage.setItem('mw_cached_insights', JSON.stringify(insights));
        localStorage.setItem('mw_cached_weekly_stats', JSON.stringify(weeklyStats));
        localStorage.setItem('mw_cached_last_refreshed', new Date().toISOString());
      } catch { /* ignore cache errors */ }
    }
  }, [generateInsights, computeRollingWeek, refreshing, insights, weeklyStats]);

  // Event listeners: only refresh after assessment completion or chat interaction (custom events)
  useEffect(() => {
    const onAssessmentCompleted = () => refreshAll();
    const onChatInteraction = () => refreshAll();
    window.addEventListener('assessment:completed', onAssessmentCompleted as EventListener);
    window.addEventListener('chat:interaction', onChatInteraction as EventListener);
    return () => {
      window.removeEventListener('assessment:completed', onAssessmentCompleted as EventListener);
      window.removeEventListener('chat:interaction', onChatInteraction as EventListener);
    };
  }, [refreshAll]);

  // On mount: load cached insights & stats (do not auto refresh)
  useEffect(() => {
    try {
      const cachedInsights = JSON.parse(localStorage.getItem('mw_cached_insights') || '[]');
      if (Array.isArray(cachedInsights) && cachedInsights.length) setInsights(cachedInsights);
      const cachedStats = JSON.parse(localStorage.getItem('mw_cached_weekly_stats') || 'null');
      if (cachedStats && typeof cachedStats === 'object') setWeeklyStats(prev => ({ ...prev, ...cachedStats }));
      const cachedTime = localStorage.getItem('mw_cached_last_refreshed');
      if (cachedTime) setLastRefreshed(new Date(cachedTime));
    } catch { /* ignore cache load errors */ }
  }, []);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let timeGreeting = '';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';
    
    // Personalized greeting based on user profile completeness
    const hasProfile = user?.birthday || user?.region || user?.approach;
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || 'there';
    if (!hasProfile) {
      return `${timeGreeting}, ${fullName}! Welcome to your journey 🌟`;
    }
    return `${timeGreeting}, ${fullName}! 👋`;
  };

  const getProfileCompletion = () => {
    if (!user) return 0;
    // Updated to remove deprecated language field and include first/last name & emergency phone
    const tracked = [
      user.firstName,
      user.lastName,
      user.birthday,
      user.region,
      user.approach,
      user.emergencyContact,
      user.emergencyPhone
    ];
    const total = tracked.length;
    const completed = tracked.filter(v => v !== null && v !== undefined && v !== '').length;
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const inverseMetrics = ['anxiety','stress','overthinking','trauma-fear'];
  const getScoreLabel = (score: number, key?: string) => {
    const isInverse = key ? inverseMetrics.includes(key) : false;
    if (isInverse) {
      // Lower is better
      if (score <= 20) return 'Very low';
      if (score <= 40) return 'Low';
      if (score <= 60) return 'Moderate';
      if (score <= 80) return 'High';
      return 'Severe';
    }
    // Higher is better pattern
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Moderate';
    if (score >= 40) return 'Developing';
    return 'Needs attention';
  };

  const practiceTitle = (() => {
    switch (user?.approach) {
      case 'western': return "CBT Reflection Exercise";
      case 'eastern': return "Guided Mindful Breathing";
      case 'hybrid': return "Blended Mindfulness & CBT Practice";
      default: return "10-Minute Calm Breathing";
    }
  })();

  const practiceTags = (() => {
    switch (user?.approach) {
      case 'western': return ['CBT technique', 'Thought tracking', '5–10 min'];
      case 'eastern': return ['Meditation', 'Breathwork', 'Grounding'];
      case 'hybrid': return ['Mindfulness', 'Cognitive reframing', 'Balanced'];
      default: return ['Anxiety relief', 'Beginner friendly', '10 min'];
    }
  })();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2">
              <h1 className="text-2xl">
                {getWelcomeMessage()}
              </h1>
              <p className="text-muted-foreground">How are you feeling today?</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshAll()}
                  disabled={refreshing}
                  aria-label="Refresh insights and weekly stats"
                  title="Refresh insights and weekly stats"
                  className="flex items-center gap-1"
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline text-xs">Refresh</span>
                </Button>
                {lastRefreshed && (
                  <span className="text-[10px] leading-none text-muted-foreground">
                    Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>
              {/* Profile Completion Indicator */}
              {getProfileCompletion() < 100 && (
                <div className="text-right">
                  <p className="text-sm font-medium">Profile {getProfileCompletion()}% complete</p>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => onNavigate('profile')}>
                    Complete setup →
                  </Button>
                </div>
              )}
              
              {/* Profile Photo/Avatar */}
              <button 
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                onClick={() => onNavigate('profile')}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {user?.profilePhoto ? (
                    <img 
                      src={user.profilePhoto} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-primary">
                      {(user?.firstName?.[0] || user?.name?.[0] || 'U').toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">
                    {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">View Profile</p>
                </div>
              </button>
              
              <Button 
                variant="ghost" 
                onClick={() => {
                  if (onLogout && window.confirm('Log out of your session?')) onLogout();
                }} 
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Quick Mood Check */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Heart className="h-5 w-5 text-primary" />
                <span className="font-medium">Quick mood check</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {moodOptions.map(({ mood, emoji }) => (
                  <Button
                    key={mood}
                    variant="outline"
                    size="sm"
                    className={`${todayMood === mood ? 'border-primary bg-primary/10' : ''}`}
                    onClick={() => logMood(mood)}
                  >
                    <span className="mr-2">{emoji}</span>
                    {mood}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Key Metrics Overview */}
        {!loadingAssessments && Object.keys(assessmentScores).length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Anxiety Assessment */}
            {assessmentScores.anxiety && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Anxiety Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-semibold">
                        {assessmentScores.anxiety}%
                      </span>
                      <Badge variant="secondary">
                        {getScoreLabel(assessmentScores.anxiety, 'anxiety')}
                      </Badge>
                    </div>
                    <Progress value={assessmentScores.anxiety} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Based on your latest assessment
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stress Assessment */}
            {user.assessmentScores.stress && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Stress Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-semibold">
                        {user.assessmentScores.stress}%
                      </span>
                      <Badge variant="secondary">
                        {getScoreLabel(user.assessmentScores.stress, 'stress')}
                      </Badge>
                    </div>
                    <Progress value={user.assessmentScores.stress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Trending down this week
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Emotional Intelligence Assessment */}
            {user.assessmentScores.emotionalIntelligence && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Emotional Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-semibold">
                        {user.assessmentScores.emotionalIntelligence}%
                      </span>
                      <Badge variant="secondary">
                        {getScoreLabel(user.assessmentScores.emotionalIntelligence, 'emotionalIntelligence')}
                      </Badge>
                    </div>
                    <Progress value={user.assessmentScores.emotionalIntelligence} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Strong foundation to build on
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Overthinking Assessment */}
            {user.assessmentScores.overthinking && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-orange-500" />
                    Overthinking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-semibold">
                        {user.assessmentScores.overthinking}%
                      </span>
                      <Badge variant="secondary">
                        {getScoreLabel(user.assessmentScores.overthinking, 'overthinking')}
                      </Badge>
                    </div>
                    <Progress value={user.assessmentScores.overthinking} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Thought pattern insights
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Personality Assessment */}
            {user.assessmentScores.personality && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Personality
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-semibold">
                        {user.assessmentScores.personality}%
                      </span>
                      <Badge variant="secondary">
                        {getScoreLabel(user.assessmentScores.personality, 'personality')}
                      </Badge>
                    </div>
                    <Progress value={user.assessmentScores.personality} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Personality trait insights
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trauma-Fear Assessment */}
            {user.assessmentScores['trauma-fear'] && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-500" />
                    Trauma Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-semibold">
                        {user.assessmentScores['trauma-fear']}%
                      </span>
                      <Badge variant="secondary">
                        {getScoreLabel(user.assessmentScores['trauma-fear'], 'trauma-fear')}
                      </Badge>
                    </div>
                    <Progress value={user.assessmentScores['trauma-fear']} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Trauma response patterns
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* No Assessments Taken Yet */
          <Card className="text-center py-8">
            <CardContent>
              <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Get Started with Assessments</h3>
              <p className="text-muted-foreground mb-6">
                Take your first mental health assessment to unlock personalized insights and AI support.
              </p>
              <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <Button 
                  variant="outline" 
                  onClick={() => onStartAssessment('anxiety')}
                  className="flex flex-col h-auto p-4"
                >
                  <Brain className="h-8 w-8 mb-2 text-primary" />
                  <span className="font-medium">Anxiety</span>
                  <span className="text-xs text-muted-foreground">5-7 minutes</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onStartAssessment('stress')}
                  className="flex flex-col h-auto p-4"
                >
                  <Target className="h-8 w-8 mb-2 text-primary" />
                  <span className="font-medium">Stress</span>
                  <span className="text-xs text-muted-foreground">4-6 minutes</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onStartAssessment('emotional-intelligence')}
                  className="flex flex-col h-auto p-4"
                >
                  <Sparkles className="h-8 w-8 mb-2 text-primary" />
                  <span className="font-medium">Emotional Intelligence</span>
                  <span className="text-xs text-muted-foreground">8-10 minutes</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Recommended Practice */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Today&apos;s Practice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold">{practiceTitle}</h3>
                  <p className="text-sm text-muted-foreground">
                    {user?.approach ? 'Personalized for your chosen approach.' : 'Perfect for reducing anxiety and centering yourself.'}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    {practiceTags.map(tag => <span key={tag}>{tag}</span>)}
                  </div>
                </div>
                <Button onClick={() => onNavigate('practices')}>
                  Start Practice
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => onNavigate('practices')}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span className="font-medium">5-min Mindfulness</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Quick reset for busy days</p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => onNavigate('practices')}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span className="font-medium">Gentle Yoga</span>
                  </div>
                  <p className="text-xs text-muted-foreground">15-min body & mind</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-between"
              onClick={() => onStartAssessment('anxiety')}
            >
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Take Assessment
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => onNavigate('chatbot')}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat with AI
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => onNavigate('library')}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Browse Library
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => onNavigate('progress')}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                View Progress
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Insights & This Week */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recent Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.length > 0 ? (
                <div className="space-y-3">
                  {insights.map((text, idx) => (
                    <div key={idx} className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm">{text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center space-y-3 py-6">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">No insights yet</p>
                    <p className="text-xs text-muted-foreground">Log activity to start generating summaries.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Daily practices</span>
                  </div>
                  <Badge variant="secondary">{weeklyStats.practices}/7 days</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Mood check-ins</span>
                  </div>
                  <Badge variant="secondary">{weeklyStats.moods}/7 days</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Assessments</span>
                  </div>
                  <Badge variant="secondary">{weeklyStats.assessmentCompleted} this week</Badge>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="h-4 w-4" />
                  <span>Current streak: {weeklyStats.streak} {weeklyStats.streak === 1 ? 'day' : 'days'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Shortcuts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="ghost"
            className="h-20 flex-col gap-2"
            onClick={() => onNavigate('assessments')}
          >
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-sm">Assessments</span>
          </Button>

          <Button
            variant="ghost"
            className="h-20 flex-col gap-2"
            onClick={() => onNavigate('practices')}
          >
            <Heart className="h-6 w-6 text-primary" />
            <span className="text-sm">Practices</span>
          </Button>

          <Button
            variant="ghost"
            className="h-20 flex-col gap-2"
            onClick={() => onNavigate('library')}
          >
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-sm">Library</span>
          </Button>

          <Button
            variant="ghost"
            className="h-20 flex-col gap-2"
            onClick={() => onNavigate('help')}
          >
            <Heart className="h-6 w-6 text-primary" />
            <span className="text-sm">Help</span>
          </Button>
        </div>
      </div>
    </div>
  );
}