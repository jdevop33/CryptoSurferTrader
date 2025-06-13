import { useQuery } from '@tanstack/react-query';
import { PerformanceStoryboard } from '@/components/PerformanceStoryboard';
import { useTradingQueries } from '@/lib/trading-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, TrendingUp, Brain, Zap } from 'lucide-react';

const userId = 1; // Current user ID

export default function PerformanceStory() {
  const portfolioQuery = useQuery(useTradingQueries.portfolio(userId));
  const tradesQuery = useQuery(useTradingQueries.trades(userId, 50)); // Get more trades for better story

  const portfolio = portfolioQuery.data;
  const trades = tradesQuery.data || [];

  if (portfolioQuery.isLoading || tradesQuery.isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-slate-400">Generating your trading story...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <BookOpen className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Performance Storytelling
          </h1>
        </div>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Experience your trading journey through interactive chapters that reveal key milestones, 
          performance insights, and AI-driven narratives of your cryptocurrency trading adventure.
        </p>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <CardTitle className="text-lg">Chapter-Based Journey</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Your trading performance organized into compelling narrative chapters, 
              from initial setup to current achievements.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <Brain className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <CardTitle className="text-lg">AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Intelligent analysis of your trading patterns with contextual 
              narratives explaining market conditions and decisions.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <CardTitle className="text-lg">Interactive Playback</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Auto-play feature with manual controls to explore your trading 
              timeline at your own pace.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Main Storyboard Component */}
      <PerformanceStoryboard portfolio={portfolio} trades={trades} />

      {/* Usage Tips */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg">How to Use Performance Storytelling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-400 mb-2">Navigation Controls</h4>
              <ul className="space-y-1 text-slate-400">
                <li>• Use ← → buttons to navigate between chapters</li>
                <li>• Click Play to auto-advance through your story</li>
                <li>• Reset button returns to the beginning</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-400 mb-2">Story Elements</h4>
              <ul className="space-y-1 text-slate-400">
                <li>• Each chapter shows key performance metrics</li>
                <li>• Milestones highlight significant trading events</li>
                <li>• AI insights provide context and analysis</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}