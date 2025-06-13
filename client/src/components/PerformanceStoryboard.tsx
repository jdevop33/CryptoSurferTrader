import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  Target, 
  Activity, 
  Calendar,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Brain,
  Shield,
  DollarSign,
  FastForward,
  Rewind,
  Volume2,
  VolumeX
} from 'lucide-react';

interface TradingMilestone {
  id: string;
  date: string;
  title: string;
  description: string;
  value: number;
  change: number;
  type: 'profit' | 'loss' | 'milestone' | 'achievement';
  significance: 'low' | 'medium' | 'high';
  trades: number;
}

interface PerformanceChapter {
  id: string;
  title: string;
  period: string;
  summary: string;
  keyMetrics: {
    totalReturn: number;
    winRate: number;
    bestTrade: number;
    worstTrade: number;
    totalTrades: number;
  };
  milestones: TradingMilestone[];
  narrative: string;
  mood: 'bullish' | 'bearish' | 'neutral';
}

interface PerformanceStoryboardProps {
  portfolio: any;
  trades: any[];
}

export function PerformanceStoryboard({ portfolio, trades }: PerformanceStoryboardProps) {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(3000); // 3 seconds per chapter
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Generate performance chapters from trading data
  const generateChapters = (): PerformanceChapter[] => {
    const now = new Date();
    const chapters: PerformanceChapter[] = [];

    // Chapter 1: The Beginning
    chapters.push({
      id: 'genesis',
      title: 'The Genesis',
      period: 'Portfolio Initialization',
      summary: 'Your trading journey begins with $10,000 and ambitious goals.',
      keyMetrics: {
        totalReturn: 0,
        winRate: 0,
        bestTrade: 0,
        worstTrade: 0,
        totalTrades: 0
      },
      milestones: [{
        id: 'start',
        date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        title: 'Portfolio Activated',
        description: 'AI trading system initialized with $10,000 virtual capital',
        value: 10000,
        change: 0,
        type: 'milestone',
        significance: 'high',
        trades: 0
      }],
      narrative: 'Every great trader starts with a dream and capital. Your AI-powered journey begins here, armed with advanced algorithms and real-time market sentiment analysis.',
      mood: 'neutral'
    });

    // Chapter 2: First Moves
    const firstTrades = trades.slice(0, 5);
    const firstWeekPnL = firstTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl || '0'), 0);
    
    chapters.push({
      id: 'first-moves',
      title: 'First Moves',
      period: 'Week 1',
      summary: `Your AI made its first ${firstTrades.length} trades with ${firstWeekPnL >= 0 ? 'promising' : 'challenging'} results.`,
      keyMetrics: {
        totalReturn: firstWeekPnL,
        winRate: firstTrades.filter(t => parseFloat(t.pnl || '0') > 0).length / Math.max(firstTrades.length, 1) * 100,
        bestTrade: Math.max(...firstTrades.map(t => parseFloat(t.pnl || '0')), 0),
        worstTrade: Math.min(...firstTrades.map(t => parseFloat(t.pnl || '0')), 0),
        totalTrades: firstTrades.length
      },
      milestones: firstTrades.map((trade, index) => ({
        id: `trade-${index}`,
        date: trade.executedAt,
        title: `${trade.symbol} ${trade.side}`,
        description: `AI detected ${trade.signal} signal and executed trade`,
        value: parseFloat(trade.pnl || '0'),
        change: parseFloat(trade.pnl || '0'),
        type: parseFloat(trade.pnl || '0') > 0 ? 'profit' : 'loss' as 'profit' | 'loss',
        significance: Math.abs(parseFloat(trade.pnl || '0')) > 50 ? 'high' : 'medium' as 'medium' | 'high',
        trades: index + 1
      })),
      narrative: firstWeekPnL >= 0 
        ? 'The AI algorithms quickly identified profitable opportunities, demonstrating the power of sentiment-driven trading strategies.'
        : 'Initial trades faced market headwinds, but each loss provided valuable learning data for the AI system.',
      mood: firstWeekPnL >= 0 ? 'bullish' : 'bearish'
    });

    // Chapter 3: Growth Phase
    const growthTrades = trades.slice(5, 15);
    const growthPnL = growthTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl || '0'), 0);
    
    chapters.push({
      id: 'growth-phase',
      title: 'The Growth Phase',
      period: 'Week 2-3',
      summary: 'AI algorithms adapt and optimize based on market patterns.',
      keyMetrics: {
        totalReturn: growthPnL,
        winRate: growthTrades.filter(t => parseFloat(t.pnl || '0') > 0).length / Math.max(growthTrades.length, 1) * 100,
        bestTrade: Math.max(...growthTrades.map(t => parseFloat(t.pnl || '0')), 0),
        worstTrade: Math.min(...growthTrades.map(t => parseFloat(t.pnl || '0')), 0),
        totalTrades: growthTrades.length
      },
      milestones: [
        {
          id: 'optimization',
          date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          title: 'Algorithm Optimization',
          description: 'AI system learned from previous trades and improved signal accuracy',
          value: 0,
          change: 15,
          type: 'achievement',
          significance: 'high',
          trades: 10
        }
      ],
      narrative: 'The AI system demonstrates its learning capabilities, refining its understanding of market sentiment and social media signals.',
      mood: 'bullish'
    });

    // Chapter 4: Current Status
    const totalPnL = parseFloat(portfolio?.realizedPnL || '0') + parseFloat(portfolio?.unrealizedPnL || '0');
    
    chapters.push({
      id: 'current-status',
      title: 'Present Day',
      period: 'Today',
      summary: 'Your AI trading portfolio continues to evolve and adapt.',
      keyMetrics: {
        totalReturn: totalPnL,
        winRate: trades.filter(t => parseFloat(t.pnl || '0') > 0).length / Math.max(trades.length, 1) * 100,
        bestTrade: Math.max(...trades.map(t => parseFloat(t.pnl || '0')), 0),
        worstTrade: Math.min(...trades.map(t => parseFloat(t.pnl || '0')), 0),
        totalTrades: trades.length
      },
      milestones: [
        {
          id: 'current',
          date: now.toISOString(),
          title: 'Portfolio Status',
          description: `Currently managing ${portfolio?.activePositions || 0} positions with AI monitoring 4 meme coins`,
          value: parseFloat(portfolio?.totalValue || '10000'),
          change: totalPnL,
          type: totalPnL >= 0 ? 'profit' : 'loss',
          significance: 'high',
          trades: trades.length
        }
      ],
      narrative: 'Your portfolio represents the culmination of AI-driven decision making, social sentiment analysis, and adaptive learning algorithms.',
      mood: totalPnL >= 0 ? 'bullish' : 'bearish'
    });

    return chapters;
  };

  const chapters = generateChapters();

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrentChapter(prev => (prev + 1) % chapters.length);
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isAutoPlay, playbackSpeed, chapters.length]);

  const handlePrevious = () => {
    setCurrentChapter(prev => prev === 0 ? chapters.length - 1 : prev - 1);
  };

  const handleNext = () => {
    setCurrentChapter(prev => (prev + 1) % chapters.length);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlay(!isAutoPlay);
  };

  const resetStory = () => {
    setCurrentChapter(0);
    setIsAutoPlay(false);
  };

  const currentChapterData = chapters[currentChapter];
  const progressPercent = ((currentChapter + 1) / chapters.length) * 100;

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'bullish': return 'text-green-400 border-green-400';
      case 'bearish': return 'text-red-400 border-red-400';
      default: return 'text-blue-400 border-blue-400';
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'bullish': return <TrendingUp className="w-5 h-5" />;
      case 'bearish': return <TrendingDown className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Story Header */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span>Your Trading Story</span>
              </CardTitle>
              <CardDescription>
                An interactive journey through your AI-powered trading performance
              </CardDescription>
            </div>
            
            {/* Playback Controls */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={resetStory}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrevious}>
                <Rewind className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={toggleAutoPlay}>
                {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext}>
                <FastForward className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAdvancedControls(!showAdvancedControls)}
              >
                ⚙️
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Chapter {currentChapter + 1} of {chapters.length}</span>
              <span>{Math.round(progressPercent)}% Complete</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Advanced Controls */}
          {showAdvancedControls && (
            <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <h3 className="font-semibold mb-3">Advanced Playback Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">
                    Playback Speed: {playbackSpeed / 1000}s per chapter
                  </label>
                  <Slider
                    value={[playbackSpeed]}
                    onValueChange={(value) => setPlaybackSpeed(value[0])}
                    min={1000}
                    max={10000}
                    step={500}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">
                    Chapter Navigation
                  </label>
                  <Slider
                    value={[currentChapter]}
                    onValueChange={(value) => setCurrentChapter(value[0])}
                    min={0}
                    max={chapters.length - 1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {chapters.map((chapter, index) => (
                  <Button
                    key={chapter.id}
                    variant={index === currentChapter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentChapter(index)}
                    className="text-xs"
                  >
                    {index + 1}. {chapter.title}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Current Chapter */}
      <Card className={`bg-slate-800/50 border-2 ${getMoodColor(currentChapterData.mood)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getMoodIcon(currentChapterData.mood)}
              <div>
                <CardTitle className="text-2xl">{currentChapterData.title}</CardTitle>
                <CardDescription className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{currentChapterData.period}</span>
                </CardDescription>
              </div>
            </div>
            
            <Badge variant="outline" className={getMoodColor(currentChapterData.mood)}>
              {currentChapterData.mood.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Chapter Summary */}
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h3 className="font-semibold mb-2">Chapter Summary</h3>
            <p className="text-slate-300">{currentChapterData.summary}</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-400" />
              <div className="text-sm text-slate-400">Total Return</div>
              <div className={`font-bold ${
                currentChapterData.keyMetrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatCurrency(currentChapterData.keyMetrics.totalReturn)}
              </div>
            </div>
            
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <Target className="w-5 h-5 mx-auto mb-1 text-blue-400" />
              <div className="text-sm text-slate-400">Win Rate</div>
              <div className="font-bold text-blue-400">
                {currentChapterData.keyMetrics.winRate.toFixed(1)}%
              </div>
            </div>
            
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-400" />
              <div className="text-sm text-slate-400">Best Trade</div>
              <div className="font-bold text-green-400">
                {formatCurrency(currentChapterData.keyMetrics.bestTrade)}
              </div>
            </div>
            
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <TrendingDown className="w-5 h-5 mx-auto mb-1 text-red-400" />
              <div className="text-sm text-slate-400">Worst Trade</div>
              <div className="font-bold text-red-400">
                {formatCurrency(currentChapterData.keyMetrics.worstTrade)}
              </div>
            </div>
            
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <Activity className="w-5 h-5 mx-auto mb-1 text-purple-400" />
              <div className="text-sm text-slate-400">Total Trades</div>
              <div className="font-bold text-purple-400">
                {currentChapterData.keyMetrics.totalTrades}
              </div>
            </div>
          </div>

          {/* Milestones Timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span>Key Milestones</span>
            </h3>
            
            <div className="space-y-3">
              {currentChapterData.milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="flex items-center space-x-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600"
                >
                  <div className={`w-3 h-3 rounded-full ${
                    milestone.type === 'profit' ? 'bg-green-400' :
                    milestone.type === 'loss' ? 'bg-red-400' :
                    milestone.type === 'achievement' ? 'bg-yellow-400' :
                    'bg-blue-400'
                  }`} />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{milestone.title}</h4>
                      <div className="text-right">
                        {milestone.type === 'profit' || milestone.type === 'loss' ? (
                          <span className={`font-bold ${
                            milestone.value >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(milestone.value)}
                          </span>
                        ) : (
                          <Badge variant="outline">
                            {milestone.significance.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{milestone.description}</p>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(milestone.date).toLocaleDateString()} • Trade #{milestone.trades}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Narrative */}
          <div className="p-4 bg-slate-700/30 rounded-lg border-l-4 border-blue-400">
            <h3 className="font-semibold mb-2 flex items-center space-x-2">
              <Brain className="w-5 h-5 text-blue-400" />
              <span>AI Insights</span>
            </h3>
            <p className="text-slate-300 italic">"{currentChapterData.narrative}"</p>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentChapter === 0}
            >
              Previous Chapter
            </Button>
            
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <span>Chapter {currentChapter + 1}</span>
              <ArrowRight className="w-4 h-4" />
              <span>
                {currentChapter === chapters.length - 1 
                  ? 'Story Complete' 
                  : chapters[currentChapter + 1]?.title
                }
              </span>
            </div>
            
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentChapter === chapters.length - 1}
            >
              Next Chapter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}