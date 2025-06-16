import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Users, 
  Target, 
  Activity,
  TrendingUp,
  Zap,
  Clock,
  DollarSign,
  Shield,
  ChevronRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import AgentSelector from '@/components/AgentSelector';
import BlockchainPredictionArena from '@/components/BlockchainPredictionArena';
import { useAuth } from '@/hooks/useAuth';

export default function TradingArena() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('agents');
  
  // Get recent predictions for transparency
  const { data: recentPredictions } = useQuery({
    queryKey: ['/api/predictions/recent'],
    refetchInterval: 30000
  });

  // Get agent performance
  const { data: agentPerformance } = useQuery({
    queryKey: ['/api/predictions/agents'],
    refetchInterval: 30000
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'expired': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'correct': return 'text-green-500';
      case 'incorrect': return 'text-red-500';
      case 'partial': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Trading Arena
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Compete with legendary trading agents. Build your team, track transparent predictions on blockchain, 
            and compete with traders worldwide.
          </p>
          
          {/* Key Features */}
          <div className="grid md:grid-cols-4 gap-4 mt-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
              <CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Blockchain Transparency</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  All predictions stored on blockchain
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <h3 className="font-semibold text-green-900 dark:text-green-100">Legendary Agents</h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  AI clones of trading legends
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">Global Leaderboard</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  Compete with traders worldwide
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Performance Tracking</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Real-time accuracy metrics
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              My Trading Team
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Predictions
            </TabsTrigger>
            <TabsTrigger value="blockchain" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Blockchain Betting
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="mt-6">
            {user ? (
              <AgentSelector userId={user.id || 'demo-user'} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Connect your wallet to start building your trading team and competing with other traders.
                  </p>
                  <Button onClick={() => window.location.href = '/api/login'}>
                    Connect Wallet
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="predictions" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Live Prediction Feed</h2>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {recentPredictions?.length || 0} Active
                </Badge>
              </div>

              <div className="grid gap-4">
                {recentPredictions?.slice(0, 20).map((prediction: any) => (
                  <Card key={prediction.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(prediction.status)}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{prediction.agentName}</span>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                              <span className="font-bold">{prediction.symbol}</span>
                              <Badge 
                                variant={prediction.prediction === 'BUY' ? 'default' : 
                                        prediction.prediction === 'SELL' ? 'destructive' : 'secondary'}
                              >
                                {prediction.prediction}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Target: ${prediction.targetPrice.toFixed(4)} | 
                              Current: ${prediction.currentPrice.toFixed(4)} | 
                              Confidence: {(prediction.confidence * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatTimeAgo(prediction.timestamp)}
                            </span>
                          </div>
                          
                          {prediction.outcome && (
                            <div className={`text-sm font-semibold ${getOutcomeColor(prediction.outcome)}`}>
                              {prediction.outcome.toUpperCase()}
                              {prediction.profitLoss && (
                                <span className="ml-2">
                                  {prediction.profitLoss > 0 ? '+' : ''}${prediction.profitLoss.toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {prediction.blockchainTxHash && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              <Shield className="h-3 w-3 inline mr-1" />
                              Blockchain Verified
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {prediction.reasoning && prediction.reasoning.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Reasoning:</strong> {prediction.reasoning.join('; ')}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {!recentPredictions || recentPredictions.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Activity className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Active Predictions</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Predictions from trading agents will appear here in real-time.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Agent Performance Rankings</h2>
              
              <div className="grid gap-4">
                {agentPerformance?.slice(0, 8).map((agent: any, index: number) => (
                  <Card key={agent.agentName} className={`${index < 3 ? 'border-yellow-500/20 bg-yellow-500/5' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-lg">{agent.agentName}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {agent.totalPredictions} predictions • Best at {agent.bestTimeframe}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-6 text-center">
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                            <div className="text-xl font-bold text-green-600">
                              {(agent.accuracy * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Win Rate</div>
                            <div className="text-xl font-bold text-blue-600">
                              {(agent.winRate * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total P&L</div>
                            <div className={`text-xl font-bold ${agent.totalProfitLoss > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {agent.totalProfitLoss > 0 ? '+' : ''}${agent.totalProfitLoss.toFixed(0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}