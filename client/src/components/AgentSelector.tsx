import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  Star,
  DollarSign,
  Activity,
  Zap,
  Award,
  Users,
  Brain
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AgentPerformance {
  agentName: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  avgConfidence: number;
  totalProfitLoss: number;
  winRate: number;
  ranking: number;
  bestTimeframe: string;
  recentForm: number;
}

interface UserPortfolio {
  userId: string;
  selectedAgents: string[];
  allocationPercentages: Record<string, number>;
  totalValue: number;
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
    allTime: number;
  };
  rank: number;
}

export default function AgentSelector({ userId }: { userId: string }) {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const queryClient = useQueryClient();

  // Get agent performance data
  const { data: agentPerformance } = useQuery({
    queryKey: ['/api/predictions/agents'],
    refetchInterval: 30000
  });

  // Get user portfolio
  const { data: userPortfolio } = useQuery({
    queryKey: [`/api/predictions/user/${userId}`],
    refetchInterval: 15000
  });

  // Get leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ['/api/predictions/leaderboard'],
    refetchInterval: 60000
  });

  // Update user agents mutation
  const updateAgentsMutation = useMutation({
    mutationFn: async ({ agents, allocations }: { agents: string[], allocations: Record<string, number> }) => {
      return await apiRequest('POST', '/api/predictions/agents/update', {
        userId,
        selectedAgents: agents,
        allocations
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/predictions/user/${userId}`] });
    }
  });

  useEffect(() => {
    if (userPortfolio?.portfolio) {
      setSelectedAgents(userPortfolio.portfolio.selectedAgents || []);
      setAllocations(userPortfolio.portfolio.allocationPercentages || {});
    }
  }, [userPortfolio]);

  const handleAgentSelect = (agentName: string) => {
    if (selectedAgents.includes(agentName)) {
      const newSelected = selectedAgents.filter(a => a !== agentName);
      const newAllocations = { ...allocations };
      delete newAllocations[agentName];
      
      // Redistribute remaining allocation equally
      const remainingTotal = 100;
      const perAgent = newSelected.length > 0 ? remainingTotal / newSelected.length : 0;
      newSelected.forEach(agent => {
        newAllocations[agent] = perAgent;
      });
      
      setSelectedAgents(newSelected);
      setAllocations(newAllocations);
    } else if (selectedAgents.length < 5) {
      const newSelected = [...selectedAgents, agentName];
      const newAllocations = { ...allocations };
      const perAgent = 100 / newSelected.length;
      
      newSelected.forEach(agent => {
        newAllocations[agent] = perAgent;
      });
      
      setSelectedAgents(newSelected);
      setAllocations(newAllocations);
    }
  };

  const handleAllocationChange = (agentName: string, value: number[]) => {
    const newAllocations = { ...allocations };
    newAllocations[agentName] = value[0];
    
    // Ensure total doesn't exceed 100%
    const total = Object.values(newAllocations).reduce((sum, val) => sum + val, 0);
    if (total <= 100) {
      setAllocations(newAllocations);
    }
  };

  const handleSaveTeam = () => {
    updateAgentsMutation.mutate({ agents: selectedAgents, allocations });
  };

  const getRankingColor = (ranking: number) => {
    if (ranking === 1) return 'text-yellow-500';
    if (ranking <= 3) return 'text-gray-400';
    if (ranking <= 5) return 'text-amber-600';
    return 'text-gray-600';
  };

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const agentAvatars = {
    'Jim Simons': '🧮',
    'Ray Dalio': '🌊',
    'Paul Tudor Jones': '📈',
    'George Soros': '💰',
    'Peter Lynch': '🎯',
    'Warren Buffett': '🏛️',
    'Carl Icahn': '⚡',
    'David Tepper': '🦈'
  };

  if (showLeaderboard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Trader Leaderboard
          </h2>
          <Button onClick={() => setShowLeaderboard(false)} variant="outline">
            Back to Agents
          </Button>
        </div>

        <div className="grid gap-4">
          {leaderboard?.slice(0, 10).map((user: any, index: number) => (
            <Card key={user.userId} className={`${index < 3 ? 'border-yellow-500/20 bg-yellow-500/5' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">Trader #{user.userId.slice(-6)}</div>
                      <div className="text-sm text-gray-600">
                        {user.selectedAgents?.length || 0} agents selected
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">${user.totalValue.toLocaleString()}</div>
                    <div className={`text-sm ${getPerformanceColor(user.performance?.allTime || 0)}`}>
                      {user.performance?.allTime > 0 ? '+' : ''}{user.performance?.allTime?.toFixed(1) || 0}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Build Your Trading Team
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Select up to 5 legendary trading agents and allocate your portfolio
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowLeaderboard(true)} variant="outline">
            <Trophy className="h-4 w-4 mr-2" />
            Leaderboard
          </Button>
          {selectedAgents.length > 0 && (
            <Button onClick={handleSaveTeam} disabled={updateAgentsMutation.isPending}>
              Save Team
            </Button>
          )}
        </div>
      </div>

      {/* User Portfolio Summary */}
      {userPortfolio?.portfolio && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Your Performance
              </span>
              <Badge variant="secondary">Rank #{userPortfolio.portfolio.rank}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Portfolio Value</div>
                <div className="text-2xl font-bold">${userPortfolio.portfolio.totalValue.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Daily P&L</div>
                <div className={`text-lg font-semibold ${getPerformanceColor(userPortfolio.portfolio.performance.daily)}`}>
                  {userPortfolio.portfolio.performance.daily > 0 ? '+' : ''}{userPortfolio.portfolio.performance.daily.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Weekly P&L</div>
                <div className={`text-lg font-semibold ${getPerformanceColor(userPortfolio.portfolio.performance.weekly)}`}>
                  {userPortfolio.portfolio.performance.weekly > 0 ? '+' : ''}{userPortfolio.portfolio.performance.weekly.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">All-Time P&L</div>
                <div className={`text-lg font-semibold ${getPerformanceColor(userPortfolio.portfolio.performance.allTime)}`}>
                  {userPortfolio.portfolio.performance.allTime > 0 ? '+' : ''}{userPortfolio.portfolio.performance.allTime.toFixed(2)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Team */}
      {selectedAgents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Your Trading Team ({selectedAgents.length}/5)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedAgents.map(agentName => (
                <div key={agentName} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{agentAvatars[agentName as keyof typeof agentAvatars]}</div>
                    <div>
                      <div className="font-semibold">{agentName}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {allocations[agentName]?.toFixed(1) || 0}% allocation
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <Slider
                        value={[allocations[agentName] || 0]}
                        onValueChange={(value) => handleAllocationChange(agentName, value)}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAgentSelect(agentName)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                Total Allocation: {Object.values(allocations).reduce((sum, val) => sum + val, 0).toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Agents */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Available Trading Legends</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agentPerformance?.map((agent: AgentPerformance) => (
            <Card 
              key={agent.agentName} 
              className={`cursor-pointer transition-all hover:scale-105 ${
                selectedAgents.includes(agent.agentName) ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => handleAgentSelect(agent.agentName)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{agentAvatars[agent.agentName as keyof typeof agentAvatars]}</div>
                    <div>
                      <div className="font-semibold">{agent.agentName}</div>
                      <div className={`text-sm font-medium ${getRankingColor(agent.ranking)}`}>
                        Rank #{agent.ranking}
                      </div>
                    </div>
                  </div>
                  {selectedAgents.includes(agent.agentName) && (
                    <Badge className="bg-blue-500 text-white">Selected</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Accuracy</div>
                    <div className="font-semibold flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {(agent.accuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Win Rate</div>
                    <div className="font-semibold flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {(agent.winRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Total P&L</div>
                    <div className={`font-semibold flex items-center gap-1 ${getPerformanceColor(agent.totalProfitLoss)}`}>
                      <DollarSign className="h-3 w-3" />
                      {agent.totalProfitLoss > 0 ? '+' : ''}${agent.totalProfitLoss.toFixed(0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Predictions</div>
                    <div className="font-semibold flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {agent.totalPredictions}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Recent Form</div>
                  <Progress value={agent.recentForm * 100} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Best Timeframe</span>
                  <Badge variant="outline" className="text-xs">
                    {agent.bestTimeframe}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedAgents.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Choose Your Trading Legends</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Select legendary traders to manage your portfolio. Each agent brings unique expertise and trading strategies.
            </p>
            <p className="text-sm text-gray-500">
              All predictions are stored transparently on blockchain for full accountability.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}