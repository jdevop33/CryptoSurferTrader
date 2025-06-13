import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  TrendingUp, 
  Shield, 
  BarChart3, 
  Target, 
  AlertTriangle,
  DollarSign,
  Activity,
  Brain,
  Zap,
  CheckCircle,
  Clock
} from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

interface VaRResult {
  var_95: number;
  var_99: number;
  expected_shortfall: number;
  confidence_level: number;
  time_horizon: string;
  method: string;
  currency: string;
  portfolio_beta?: number;
  correlation_risk?: number;
}

interface StressTestResult {
  stress_tests: Record<string, {
    total_pnl: number;
    scenario_description: string;
  }>;
  worst_case: number;
  diversification_benefit: number;
  timestamp: string;
}

interface OptimizationResult {
  current_sharpe: number;
  optimized_sharpe: number;
  expected_return: number;
  expected_risk: number;
  recommended_weights: Record<string, number>;
  improvement_metrics: {
    return_improvement: number;
    risk_reduction: number;
    sharpe_improvement: number;
  };
}

interface BacktestResult {
  strategy_name: string;
  period: { start: string; end: string };
  performance: {
    total_return: number;
    annualized_return: number;
    volatility: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
    profit_factor: number;
  };
  risk_metrics: {
    var_95: number;
    expected_shortfall: number;
    calmar_ratio: number;
  };
}

export function GSQuantDashboard() {
  const [selectedTab, setSelectedTab] = useState('risk');
  const [optimizationParams, setOptimizationParams] = useState({
    targetReturn: 0.15,
    maxRisk: 0.20
  });

  const userId = 1;

  // Query for VaR calculation
  const { data: varData, isLoading: varLoading } = useQuery({
    queryKey: [`/api/risk/var/${userId}`],
    refetchInterval: 60000,
  });

  // Stress test mutation
  const stressTestMutation = useMutation({
    mutationFn: async (scenarios: string[]) => {
      const response = await fetch('/api/risk/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, scenarios }),
      });
      if (!response.ok) throw new Error('Failed to run stress tests');
      return response.json();
    },
  });

  // Portfolio optimization mutation
  const optimizationMutation = useMutation({
    mutationFn: async (params: { targetReturn: number; maxRisk: number }) => {
      const response = await fetch('/api/portfolio/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...params }),
      });
      if (!response.ok) throw new Error('Failed to optimize portfolio');
      return response.json();
    },
  });

  // Backtest mutation
  const backtestMutation = useMutation({
    mutationFn: async (strategy: any) => {
      const response = await fetch('/api/backtest/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          initialCapital: 10000
        }),
      });
      if (!response.ok) throw new Error('Failed to run backtest');
      return response.json();
    },
  });

  const runStressTest = () => {
    stressTestMutation.mutate(['market_crash', 'crypto_crash', 'volatility_spike']);
  };

  const optimizePortfolio = () => {
    optimizationMutation.mutate(optimizationParams);
  };

  const runBacktest = () => {
    backtestMutation.mutate({
      name: 'AI-Driven Momentum Strategy',
      alpha: 0.0002,
      type: 'momentum'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl">
            <Building2 className="h-6 w-6" />
            <span>Goldman Sachs Quant (GS Quant) Analytics</span>
            <Badge className="bg-gold-500 text-black font-semibold">Institutional Grade</Badge>
          </CardTitle>
          <CardDescription className="text-blue-200">
            Advanced quantitative finance toolkit powered by 25+ years of Goldman Sachs experience
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
          <TabsTrigger value="risk">Risk Management</TabsTrigger>
          <TabsTrigger value="optimization">Portfolio Optimization</TabsTrigger>
          <TabsTrigger value="stress">Stress Testing</TabsTrigger>
          <TabsTrigger value="backtest">Strategy Backtesting</TabsTrigger>
        </TabsList>

        {/* Risk Management Tab */}
        <TabsContent value="risk">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Value at Risk (VaR)</span>
                </CardTitle>
                <CardDescription>
                  Risk exposure using GS Quant risk models
                </CardDescription>
              </CardHeader>
              <CardContent>
                {varLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-700/30 rounded"></div>
                    <div className="h-16 bg-slate-700/30 rounded"></div>
                  </div>
                ) : varData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-400">95% VaR (1-day)</div>
                        <div className="text-2xl font-bold text-red-400">
                          {formatCurrency(varData.var_95)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">99% VaR (1-day)</div>
                        <div className="text-2xl font-bold text-red-500">
                          {formatCurrency(varData.var_99)}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-slate-400">Expected Shortfall</div>
                      <div className="text-xl font-semibold text-orange-400">
                        {formatCurrency(varData.expected_shortfall)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-600">
                      <div>
                        <div className="text-xs text-slate-400">Portfolio Beta</div>
                        <div className="font-semibold">{varData.portfolio_beta?.toFixed(2) || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Correlation Risk</div>
                        <div className="font-semibold">{formatPercentage(varData.correlation_risk || 0)}</div>
                      </div>
                    </div>

                    <Badge variant="outline" className="mt-2">
                      Method: {varData.method}
                    </Badge>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    No portfolio data available for VaR calculation
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Risk Metrics</span>
                </CardTitle>
                <CardDescription>
                  Advanced risk analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert className="bg-blue-900/30 border-blue-800">
                    <Brain className="h-4 w-4" />
                    <AlertDescription>
                      GS Quant provides institutional-grade risk models used by Goldman Sachs traders worldwide.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Confidence Level</span>
                      <span className="font-mono">{varData?.confidence_level ? formatPercentage(varData.confidence_level) : '95%'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Time Horizon</span>
                      <span className="font-mono">{varData?.time_horizon || '1 day'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Currency</span>
                      <span className="font-mono">{varData?.currency || 'USD'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Portfolio Optimization Tab */}
        <TabsContent value="optimization">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Mean-Variance Optimization</span>
                </CardTitle>
                <CardDescription>
                  Optimize portfolio using GS Quant methodologies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="targetReturn">Target Return</Label>
                    <Input
                      id="targetReturn"
                      type="number"
                      step="0.01"
                      value={optimizationParams.targetReturn}
                      onChange={(e) => setOptimizationParams(prev => ({
                        ...prev,
                        targetReturn: parseFloat(e.target.value)
                      }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxRisk">Maximum Risk</Label>
                    <Input
                      id="maxRisk"
                      type="number"
                      step="0.01"
                      value={optimizationParams.maxRisk}
                      onChange={(e) => setOptimizationParams(prev => ({
                        ...prev,
                        maxRisk: parseFloat(e.target.value)
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button 
                  onClick={optimizePortfolio}
                  disabled={optimizationMutation.isPending}
                  className="w-full"
                >
                  {optimizationMutation.isPending ? 'Optimizing...' : 'Optimize Portfolio'}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Optimization Results</CardTitle>
              </CardHeader>
              <CardContent>
                {optimizationMutation.data ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-400">Current Sharpe</div>
                        <div className="text-xl font-bold">{optimizationMutation.data.current_sharpe.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">Optimized Sharpe</div>
                        <div className="text-xl font-bold text-green-400">
                          {optimizationMutation.data.optimized_sharpe.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-400">Expected Return</div>
                        <div className="font-semibold">{formatPercentage(optimizationMutation.data.expected_return)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">Expected Risk</div>
                        <div className="font-semibold">{formatPercentage(optimizationMutation.data.expected_risk)}</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-600">
                      <div className="text-sm font-medium mb-2">Recommended Weights</div>
                      <div className="space-y-2">
                        {Object.entries(optimizationMutation.data.recommended_weights).map(([symbol, weight]) => (
                          <div key={symbol} className="flex justify-between items-center">
                            <span className="text-sm">{symbol}</span>
                            <span className="font-mono">{formatPercentage(weight as number)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Alert className="bg-green-900/30 border-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Optimization completed with {formatPercentage(optimizationMutation.data.improvement_metrics.sharpe_improvement)} Sharpe improvement
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    Run optimization to see results
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Stress Testing Tab */}
        <TabsContent value="stress">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Scenario Analysis</span>
                </CardTitle>
                <CardDescription>
                  Test portfolio resilience under extreme market conditions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert className="bg-yellow-900/30 border-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Stress tests simulate extreme market scenarios to assess portfolio vulnerability
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Scenarios to Test:</div>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• Market Crash (-30% equity, 2x volatility)</li>
                      <li>• Crypto Crash (-50% crypto markets)</li>
                      <li>• Volatility Spike (3x volatility increase)</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={runStressTest}
                    disabled={stressTestMutation.isPending}
                    className="w-full"
                    variant="outline"
                  >
                    {stressTestMutation.isPending ? 'Running Stress Tests...' : 'Run Stress Tests'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Stress Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                {stressTestMutation.data ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {Object.entries(stressTestMutation.data.stress_tests).map(([scenario, result]: [string, any]) => (
                        <div key={scenario} className="p-3 bg-slate-700/30 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium capitalize">{scenario.replace('_', ' ')}</span>
                            <span className={`font-bold ${result.total_pnl < 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {formatCurrency(result.total_pnl)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">{result.scenario_description}</div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-600">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-slate-400">Worst Case Loss</div>
                          <div className="text-xl font-bold text-red-400">
                            {formatCurrency(stressTestMutation.data.worst_case)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-400">Diversification Benefit</div>
                          <div className="text-xl font-bold text-green-400">
                            {formatPercentage(stressTestMutation.data.diversification_benefit)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    Run stress tests to see results
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Backtesting Tab */}
        <TabsContent value="backtest">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Strategy Backtesting</span>
                </CardTitle>
                <CardDescription>
                  Test trading strategies using GS Quant backtesting engine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert className="bg-blue-900/30 border-blue-800">
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      Backtesting uses historical data to evaluate strategy performance with institutional-grade accuracy
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Strategy Configuration:</div>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• Strategy: AI-Driven Momentum</li>
                      <li>• Period: 2024 Full Year</li>
                      <li>• Initial Capital: $10,000</li>
                      <li>• Rebalancing: Dynamic</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={runBacktest}
                    disabled={backtestMutation.isPending}
                    className="w-full"
                  >
                    {backtestMutation.isPending ? 'Running Backtest...' : 'Run Backtest'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Backtest Results</CardTitle>
              </CardHeader>
              <CardContent>
                {backtestMutation.data ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-400">Total Return</div>
                        <div className="text-xl font-bold text-green-400">
                          {formatPercentage(backtestMutation.data.performance.total_return)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">Annualized Return</div>
                        <div className="text-xl font-bold">
                          {formatPercentage(backtestMutation.data.performance.annualized_return)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-400">Sharpe Ratio</div>
                        <div className="text-lg font-semibold">{backtestMutation.data.performance.sharpe_ratio.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">Max Drawdown</div>
                        <div className="text-lg font-semibold text-red-400">
                          {formatPercentage(backtestMutation.data.performance.max_drawdown)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-400">Win Rate</div>
                        <div className="font-semibold">{formatPercentage(backtestMutation.data.performance.win_rate)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">Profit Factor</div>
                        <div className="font-semibold">{backtestMutation.data.performance.profit_factor.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-600">
                      <div className="text-sm font-medium mb-2">Risk Metrics</div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">95% VaR</span>
                          <span className="font-mono text-sm">{formatCurrency(backtestMutation.data.risk_metrics.var_95)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Calmar Ratio</span>
                          <span className="font-mono text-sm">{backtestMutation.data.risk_metrics.calmar_ratio.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    Run backtest to see performance results
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}