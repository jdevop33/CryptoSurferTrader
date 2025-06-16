import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Eye, Activity, TrendingUp, AlertTriangle, CheckCircle, Play, Zap, Target } from 'lucide-react';

interface Signal {
  token: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: string;
  change: string;
  reason: string;
  risk: string;
}

interface WhaleMove {
  token: string;
  amount: string;
  direction: 'IN' | 'OUT';
  wallet: string;
  impact: string;
  time: string;
}

interface ValidationResult {
  token: string;
  status: 'STRONG' | 'MODERATE' | 'WEAK';
  onChainScore: number;
  whaleActivity: number;
  volume: string;
  transactions: number;
}

export function InteractiveDemos() {
  const [activeDemo, setActiveDemo] = useState<'signals' | 'whale' | 'validation'>('signals');
  const [isRunning, setIsRunning] = useState(false);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [whaleMoves, setWhaleMoves] = useState<WhaleMove[]>([]);
  const [validations, setValidations] = useState<ValidationResult[]>([]);

  // Mock real-time data updates
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (activeDemo === 'signals') {
        updateSignals();
      } else if (activeDemo === 'whale') {
        updateWhaleMoves();
      } else if (activeDemo === 'validation') {
        updateValidations();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning, activeDemo]);

  const updateSignals = () => {
    const tokens = ['PEPE', 'SHIBA', 'FLOKI', 'DOGE'];
    const newSignals: Signal[] = tokens.map(token => ({
      token,
      signal: Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'SELL' : 'HOLD',
      confidence: Math.floor(Math.random() * 30) + 70,
      price: `$${(Math.random() * 0.001).toFixed(6)}`,
      change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 15).toFixed(1)}%`,
      reason: 'High social sentiment + whale accumulation detected',
      risk: Math.random() > 0.5 ? 'LOW' : 'MEDIUM'
    }));
    setSignals(newSignals);
  };

  const updateWhaleMoves = () => {
    const tokens = ['PEPE', 'SHIBA', 'FLOKI', 'DOGE'];
    const newMoves: WhaleMove[] = tokens.slice(0, 3).map(token => ({
      token,
      amount: `${(Math.random() * 50 + 10).toFixed(1)}M`,
      direction: Math.random() > 0.5 ? 'IN' : 'OUT',
      wallet: `0x${Math.random().toString(16).slice(2, 8)}...${Math.random().toString(16).slice(2, 6)}`,
      impact: `${(Math.random() * 8 + 2).toFixed(1)}%`,
      time: `${Math.floor(Math.random() * 60)}s ago`
    }));
    setWhaleMoves(newMoves);
  };

  const updateValidations = () => {
    const tokens = ['PEPE', 'SHIBA', 'FLOKI'];
    const statuses: ValidationResult['status'][] = ['STRONG', 'MODERATE', 'WEAK'];
    const newValidations: ValidationResult[] = tokens.map(token => ({
      token,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      onChainScore: Math.floor(Math.random() * 40) + 60,
      whaleActivity: Math.floor(Math.random() * 20) + 5,
      volume: `$${(Math.random() * 100 + 50).toFixed(1)}M`,
      transactions: Math.floor(Math.random() * 5000) + 1000
    }));
    setValidations(newValidations);
  };

  const startDemo = (demo: 'signals' | 'whale' | 'validation') => {
    setActiveDemo(demo);
    setIsRunning(true);
    
    // Initialize with data immediately
    if (demo === 'signals') {
      updateSignals();
    } else if (demo === 'whale') {
      updateWhaleMoves();
    } else if (demo === 'validation') {
      updateValidations();
    }
  };

  const stopDemo = () => {
    setIsRunning(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Try Our AI Agents Live</h2>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          See real AI analysis in action. No wallet required, no signup needed.
        </p>
      </div>

      <Tabs value={activeDemo} onValueChange={(v) => setActiveDemo(v as any)} className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="signals" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Signals
          </TabsTrigger>
          <TabsTrigger value="whale" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Whale Tracker
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Scam Detector
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signals" className="mt-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Brain className="w-6 h-6 text-blue-600" />
                <CardTitle>AI Trading Signals</CardTitle>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Watch our AI analyze social sentiment, whale movements, and technical indicators in real-time
              </p>
              <div className="mt-4">
                {!isRunning ? (
                  <Button onClick={() => startDemo('signals')} className="bg-blue-600 hover:bg-blue-700">
                    <Play className="w-4 h-4 mr-2" />
                    Start Live Demo
                  </Button>
                ) : (
                  <div className="flex items-center gap-4 justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span>AI Analyzing...</span>
                    </div>
                    <Button onClick={stopDemo} variant="outline">
                      Stop Demo
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {signals.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                  {signals.map((signal, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border-2 ${
                      signal.signal === 'BUY' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' :
                      signal.signal === 'SELL' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' :
                      'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{signal.token}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{signal.price}</p>
                        </div>
                        <Badge variant={signal.signal === 'BUY' ? 'default' : signal.signal === 'SELL' ? 'destructive' : 'secondary'}>
                          {signal.signal}
                        </Badge>
                      </div>
                      <div className="mb-2">
                        <div className="text-sm text-slate-600 dark:text-slate-300 mb-1">
                          Confidence: {signal.confidence}%
                        </div>
                        <Progress value={signal.confidence} className="h-2" />
                      </div>
                      <div className="text-sm">
                        <div className={`font-medium ${
                          signal.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {signal.change} today
                        </div>
                        <div className="text-slate-500 mt-1">
                          {signal.reason}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {signals.length === 0 && isRunning && (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>AI analyzing market data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whale" className="mt-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Eye className="w-6 h-6 text-purple-600" />
                <CardTitle>Whale Movement Tracker</CardTitle>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Monitor large wallet movements that often predict major price movements
              </p>
              <div className="mt-4">
                {!isRunning ? (
                  <Button onClick={() => startDemo('whale')} className="bg-purple-600 hover:bg-purple-700">
                    <Play className="w-4 h-4 mr-2" />
                    Track Whales Live
                  </Button>
                ) : (
                  <div className="flex items-center gap-4 justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                      <span>Monitoring Blockchain...</span>
                    </div>
                    <Button onClick={stopDemo} variant="outline">
                      Stop Tracking
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {whaleMoves.length > 0 && (
                <div className="space-y-4">
                  {whaleMoves.map((move, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border-2 ${
                      move.direction === 'IN' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' :
                      'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold">{move.token}</h3>
                            <Badge variant={move.direction === 'IN' ? 'default' : 'destructive'}>
                              {move.direction === 'IN' ? 'WHALE BUY' : 'WHALE SELL'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {move.amount} tokens • Wallet: {move.wallet}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-500">{move.time}</div>
                          <div className="font-medium">
                            Price Impact: {move.impact}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {whaleMoves.length === 0 && isRunning && (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Scanning blockchain for whale movements...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="mt-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className="w-6 h-6 text-green-600" />
                <CardTitle>On-Chain Scam Detector</CardTitle>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Validate social media hype against real blockchain transaction data
              </p>
              <div className="mt-4">
                {!isRunning ? (
                  <Button onClick={() => startDemo('validation')} className="bg-green-600 hover:bg-green-700">
                    <Play className="w-4 h-4 mr-2" />
                    Validate Signals
                  </Button>
                ) : (
                  <div className="flex items-center gap-4 justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Validating On-Chain...</span>
                    </div>
                    <Button onClick={stopDemo} variant="outline">
                      Stop Validation
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {validations.length > 0 && (
                <div className="space-y-4">
                  {validations.map((validation, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border-2 ${
                      validation.status === 'STRONG' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' :
                      validation.status === 'MODERATE' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700' :
                      'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{validation.token}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {validation.transactions.toLocaleString()} transactions • {validation.volume} volume
                          </p>
                        </div>
                        <Badge variant={
                          validation.status === 'STRONG' ? 'default' :
                          validation.status === 'MODERATE' ? 'secondary' : 'destructive'
                        }>
                          {validation.status} VALIDATION
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-slate-600 dark:text-slate-300 mb-1">
                            On-Chain Score: {validation.onChainScore}%
                          </div>
                          <Progress value={validation.onChainScore} className="h-2" />
                        </div>
                        <div>
                          <div className="text-sm text-slate-600 dark:text-slate-300 mb-1">
                            Whale Activity: {validation.whaleActivity}
                          </div>
                          <Progress value={validation.whaleActivity * 5} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {validations.length === 0 && isRunning && (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Cross-referencing social signals with blockchain data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Value Proposition */}
      <div className="text-center mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
        <h3 className="text-xl font-bold mb-2">See the Difference?</h3>
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          This is just a taste. Get access to all agents, real-time alerts, and portfolio tracking.
        </p>
        <div className="flex justify-center gap-4">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Zap className="w-4 h-4 mr-2" />
            Connect Wallet - Start Free
          </Button>
          <Button variant="outline">
            <Target className="w-4 h-4 mr-2" />
            See Full Features
          </Button>
        </div>
      </div>
    </div>
  );
}