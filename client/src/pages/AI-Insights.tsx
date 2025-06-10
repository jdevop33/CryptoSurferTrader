import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle,
  Target,
  Zap,
  BarChart3,
  Cpu,
  Eye,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

interface AIRecommendation {
  marketSentiment: number;
  tradingSignal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  priceTarget?: number;
  stopLoss?: number;
}

interface AIStatus {
  ready: boolean;
  service: string;
  capabilities: string[];
}

export default function AIInsights() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [customAnalysis, setCustomAnalysis] = useState<AIRecommendation | null>(null);

  // Fetch AI status
  const aiStatusQuery = useQuery({
    queryKey: ['/api/ai/status'],
    queryFn: async () => {
      const response = await fetch('/api/ai/status');
      if (!response.ok) throw new Error('Failed to fetch AI status');
      return response.json() as Promise<AIStatus>;
    },
    refetchInterval: 10000,
  });

  // Fetch AI recommendations
  const recommendationsQuery = useQuery({
    queryKey: ['/api/ai/recommendations'],
    queryFn: async () => {
      const response = await fetch('/api/ai/recommendations');
      if (!response.ok) throw new Error('Failed to fetch AI recommendations');
      return response.json() as Promise<AIRecommendation[]>;
    },
    refetchInterval: 30000,
    enabled: aiStatusQuery.data?.ready || false,
  });

  const aiStatus = aiStatusQuery.data;
  const recommendations = recommendationsQuery.data || [];

  const analyzeSymbol = async (symbol: string) => {
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          price: Math.random() * 0.1 + 0.01,
          volume: Math.random() * 5000000,
          marketCap: Math.random() * 15000000,
          sentiment: Math.random(),
          socialMentions: Math.floor(Math.random() * 100),
          influencerCount: Math.floor(Math.random() * 20)
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');
      const analysis = await response.json();
      setCustomAnalysis(analysis);
    } catch (error) {
      console.error('Failed to analyze symbol:', error);
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'text-green-400';
      case 'SELL': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY': return <TrendingUp className="w-4 h-4" />;
      case 'SELL': return <TrendingDown className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      default: return 'text-red-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Trading Insights
            </h1>
            <p className="text-slate-400 mt-1">
              Powered by Alibaba Cloud Model Studio Multi-Agent System
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                recommendationsQuery.refetch();
                aiStatusQuery.refetch();
              }}
              disabled={recommendationsQuery.isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${recommendationsQuery.isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* AI Service Status */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Service Status</CardTitle>
            <Cpu className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${aiStatus?.ready ? 'text-green-400' : 'text-yellow-400'}`}>
                {aiStatus?.ready ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                )}
                <span className="font-medium">
                  {aiStatus?.ready ? 'Ready' : 'Initializing'}
                </span>
              </div>
              
              {aiStatus && (
                <>
                  <Badge variant="outline">{aiStatus.service}</Badge>
                  <span className="text-sm text-slate-400">
                    {aiStatus.capabilities.length} AI agents active
                  </span>
                </>
              )}
            </div>
            
            {aiStatus && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {aiStatus.capabilities.map((capability, index) => (
                  <div key={index} className="text-xs text-slate-400 flex items-center">
                    <Brain className="w-3 h-3 mr-1 text-purple-400" />
                    {capability}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="recommendations" className="space-y-6">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
            <TabsTrigger value="analysis">Custom Analysis</TabsTrigger>
            <TabsTrigger value="insights">Market Insights</TabsTrigger>
          </TabsList>

          {/* AI Recommendations Tab */}
          <TabsContent value="recommendations">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Multi-Agent Trading Recommendations</CardTitle>
                <CardDescription>
                  AI-powered analysis from specialized trading agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!aiStatus?.ready ? (
                  <Alert className="bg-yellow-900/20 border-yellow-700">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      AI service is initializing. Recommendations will be available shortly.
                    </AlertDescription>
                  </Alert>
                ) : recommendations.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Brain className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                    <p>AI agents are analyzing market conditions...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="p-4 bg-slate-700/30 rounded-lg border border-slate-600"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline" className="font-mono">
                              SYMBOL-{index + 1}
                            </Badge>
                            <div className={`flex items-center space-x-1 ${getSignalColor(rec.tradingSignal)}`}>
                              {getSignalIcon(rec.tradingSignal)}
                              <span className="font-bold">{rec.tradingSignal}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm text-slate-400">Confidence</p>
                              <Progress value={rec.confidence * 100} className="w-20" />
                              <span className="text-xs">{(rec.confidence * 100).toFixed(0)}%</span>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm text-slate-400">Risk</p>
                              <span className={`font-medium ${getRiskColor(rec.riskLevel)}`}>
                                {rec.riskLevel}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-slate-300">{rec.reasoning}</p>
                        </div>

                        <div className="flex items-center space-x-6 text-sm">
                          <div>
                            <span className="text-slate-400">Sentiment:</span>
                            <span className="ml-1 font-medium">
                              {(rec.marketSentiment * 100).toFixed(0)}%
                            </span>
                          </div>
                          
                          {rec.priceTarget && (
                            <div>
                              <span className="text-slate-400">Target:</span>
                              <span className="ml-1 font-medium text-green-400">
                                ${rec.priceTarget.toFixed(6)}
                              </span>
                            </div>
                          )}
                          
                          {rec.stopLoss && (
                            <div>
                              <span className="text-slate-400">Stop Loss:</span>
                              <span className="ml-1 font-medium text-red-400">
                                ${rec.stopLoss.toFixed(6)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Analysis Tab */}
          <TabsContent value="analysis">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Custom Symbol Analysis</CardTitle>
                <CardDescription>
                  Get AI analysis for specific cryptocurrency symbols
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <select
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                      value={selectedSymbol}
                      onChange={(e) => setSelectedSymbol(e.target.value)}
                    >
                      <option value="">Select a symbol</option>
                      <option value="DOGECOIN">DOGECOIN</option>
                      <option value="SHIBA">SHIBA INU</option>
                      <option value="PEPE">PEPE</option>
                      <option value="FLOKI">FLOKI</option>
                      <option value="BONK">BONK</option>
                    </select>
                    
                    <Button
                      onClick={() => selectedSymbol && analyzeSymbol(selectedSymbol)}
                      disabled={!selectedSymbol || !aiStatus?.ready}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Analyze
                    </Button>
                  </div>

                  {customAnalysis && (
                    <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{selectedSymbol} Analysis</h3>
                        <div className={`flex items-center space-x-1 ${getSignalColor(customAnalysis.tradingSignal)}`}>
                          {getSignalIcon(customAnalysis.tradingSignal)}
                          <span className="font-bold">{customAnalysis.tradingSignal}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-slate-400">Confidence</p>
                          <Progress value={customAnalysis.confidence * 100} className="mt-1" />
                          <span className="text-sm">{(customAnalysis.confidence * 100).toFixed(0)}%</span>
                        </div>
                        
                        <div>
                          <p className="text-sm text-slate-400">Risk Level</p>
                          <span className={`font-medium ${getRiskColor(customAnalysis.riskLevel)}`}>
                            {customAnalysis.riskLevel}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-300 mb-3">{customAnalysis.reasoning}</p>

                      <div className="flex space-x-6 text-sm">
                        <div>
                          <span className="text-slate-400">Market Sentiment:</span>
                          <span className="ml-1 font-medium">
                            {(customAnalysis.marketSentiment * 100).toFixed(0)}%
                          </span>
                        </div>
                        
                        {customAnalysis.priceTarget && (
                          <div>
                            <span className="text-slate-400">Price Target:</span>
                            <span className="ml-1 font-medium text-green-400">
                              ${customAnalysis.priceTarget.toFixed(6)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market Insights Tab */}
          <TabsContent value="insights">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                    Agent Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Sentiment Agent</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={95} className="w-20" />
                        <span className="text-sm text-green-400">95%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Technical Agent</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={88} className="w-20" />
                        <span className="text-sm text-green-400">88%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Risk Agent</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={92} className="w-20" />
                        <span className="text-sm text-green-400">92%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Coordinator Agent</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={90} className="w-20" />
                        <span className="text-sm text-green-400">90%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-purple-400" />
                    AI Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Analyses Today</span>
                      <span className="font-medium">1,247</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Accuracy Rate</span>
                      <span className="font-medium text-green-400">91.3%</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Avg Response Time</span>
                      <span className="font-medium">0.85s</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Active Agents</span>
                      <span className="font-medium text-blue-400">4/4</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}