import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ExpertAgent {
  name: string;
  expertise: string[];
}

interface AgentDecision {
  action: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
  confidence: number;
  reasoning: string[];
  questions: string[];
  riskAssessment: string;
  positionSize: number;
  stopLoss?: number;
  takeProfit?: number;
  timeline: string;
}

interface TeamConsensus {
  finalDecision: AgentDecision;
  agentVotes: Record<string, AgentDecision>;
  consensusStrength: number;
  dissentingViews: string[];
  riskScore: number;
}

interface AnalysisResult {
  symbol: string;
  consensus: TeamConsensus;
}

export default function TradingExpertAgents() {
  const [selectedSymbol, setSelectedSymbol] = useState('DOGECOIN');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const queryClient = useQueryClient();

  // Get team information
  const { data: teamInfo } = useQuery({
    queryKey: ['/api/expert-agents/team'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Single symbol analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: async (symbol: string): Promise<TeamConsensus> => {
      const marketData = {
        symbol,
        currentPrice: Math.random() * 1000 + 100,
        historicalPrices: Array.from({length: 30}, () => Math.random() * 1000 + 100),
        volume: Math.floor(Math.random() * 10000000) + 1000000,
        marketCap: Math.floor(Math.random() * 1000000000) + 100000000,
        sentiment: Math.random() * 0.6 + 0.2 // 0.2 to 0.8
      };
      
      const response = await apiRequest('POST', '/api/expert-agents/analyze', marketData);
      return response as TeamConsensus;
    },
    onSuccess: (consensus: TeamConsensus) => {
      setAnalysisResults(prev => {
        const filtered = prev.filter(r => r.symbol !== selectedSymbol);
        return [...filtered, { symbol: selectedSymbol, consensus }];
      });
      setIsAnalyzing(false);
    }
  });

  // Batch analysis mutation
  const batchAnalyzeMutation = useMutation({
    mutationFn: async (): Promise<{ analyses: AnalysisResult[] }> => {
      const symbols = ['DOGECOIN', 'SHIBA', 'PEPE', 'FLOKI'];
      const response = await apiRequest('POST', '/api/expert-agents/batch-analyze', { symbols });
      return response as { analyses: AnalysisResult[] };
    },
    onSuccess: (data: { analyses: AnalysisResult[] }) => {
      setAnalysisResults(data.analyses);
      setIsAnalyzing(false);
    }
  });

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    analyzeMutation.mutate(selectedSymbol);
  };

  const handleBatchAnalyze = () => {
    setIsAnalyzing(true);
    batchAnalyzeMutation.mutate();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'bg-green-500';
      case 'SELL': return 'bg-red-500';
      case 'HOLD': return 'bg-yellow-500';
      case 'WATCH': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY': return TrendingUp;
      case 'SELL': return TrendingUp;
      case 'HOLD': return Target;
      case 'WATCH': return Activity;
      default: return Brain;
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-green-600';
    if (score <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-blue-600" />
            Trading Expert Agents
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Programmatic clones of legendary traders providing real-time market analysis
          </p>
        </div>
        
        <div className="flex gap-3">
          <select 
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="DOGECOIN">DOGECOIN</option>
            <option value="SHIBA">SHIBA</option>
            <option value="PEPE">PEPE</option>
            <option value="FLOKI">FLOKI</option>
          </select>
          
          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            Analyze {selectedSymbol}
          </Button>
          
          <Button 
            onClick={handleBatchAnalyze}
            disabled={isAnalyzing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Analyze All
          </Button>
        </div>
      </div>

      {/* Team Overview */}
      {teamInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Expert Trading Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {teamInfo.agents?.map((agent: ExpertAgent, index: number) => (
                <div key={agent.name} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Avatar className="h-12 w-12">
                    <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {agent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{agent.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {agent.expertise?.slice(0, 2).join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysisResults.length > 0 && (
        <Tabs defaultValue={analysisResults[0]?.symbol} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {analysisResults.map((result) => (
              <TabsTrigger key={result.symbol} value={result.symbol}>
                {result.symbol}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {analysisResults.map((result) => (
            <TabsContent key={result.symbol} value={result.symbol}>
              <div className="grid lg:grid-cols-2 gap-6">
                
                {/* Team Consensus */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Team Consensus
                      </span>
                      <Badge className={`${getActionColor(result.consensus.finalDecision.action)} text-white`}>
                        {result.consensus.finalDecision.action}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Confidence</div>
                        <div className="text-2xl font-bold">
                          {(result.consensus.finalDecision.confidence * 100).toFixed(0)}%
                        </div>
                        <Progress 
                          value={result.consensus.finalDecision.confidence * 100} 
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Agreement</div>
                        <div className="text-2xl font-bold">
                          {(result.consensus.consensusStrength * 100).toFixed(0)}%
                        </div>
                        <Progress 
                          value={result.consensus.consensusStrength * 100} 
                          className="mt-2"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Key Reasoning</div>
                      <div className="space-y-1">
                        {result.consensus.finalDecision.reasoning?.slice(0, 3).map((reason, idx) => (
                          <div key={idx} className="text-sm flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {reason}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Position Size</div>
                        <div className="font-semibold">
                          {(result.consensus.finalDecision.positionSize * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Risk Score</div>
                        <div className={`font-semibold ${getRiskColor(result.consensus.riskScore)}`}>
                          {result.consensus.riskScore.toFixed(1)}/10
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Timeline</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{result.consensus.finalDecision.timeline}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Individual Agent Votes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Individual Expert Opinions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(result.consensus.agentVotes || {}).map(([agentName, decision]) => {
                        const ActionIcon = getActionIcon(decision.action);
                        return (
                          <div key={agentName} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold">{agentName}</div>
                              <div className="flex items-center gap-2">
                                <Badge className={`${getActionColor(decision.action)} text-white`}>
                                  <ActionIcon className="h-3 w-3 mr-1" />
                                  {decision.action}
                                </Badge>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {(decision.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {decision.reasoning?.[0]}
                            </div>
                            {decision.questions?.[0] && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Key question: {decision.questions[0]}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {result.consensus.dissentingViews?.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="text-sm font-semibold flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          Dissenting Views
                        </div>
                        <div className="space-y-1">
                          {result.consensus.dissentingViews.map((view, idx) => (
                            <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                              {view}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span>Expert agents analyzing market conditions...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      {analysisResults.length === 0 && !isAnalyzing && (
        <Card>
          <CardContent className="p-6 text-center">
            <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Expert Trading Analysis</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Get insights from programmatic clones of legendary traders including Jim Simons, Ray Dalio, and George Soros.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={handleAnalyze} className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Analyze {selectedSymbol}
              </Button>
              <Button onClick={handleBatchAnalyze} variant="outline" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analyze All Tokens
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}