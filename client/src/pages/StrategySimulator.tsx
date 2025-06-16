import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Brain, Play, DollarSign, Target, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { FeatureGate } from '@/components/FeatureGate';

interface BacktestResult {
  equity_curve: { date: string; equity: number }[];
  net_profit: number;
  win_rate: number;
  max_drawdown: number;
  total_trades: number;
  sharpe_ratio: number;
  profit_factor: number;
}

interface StrategyParams {
  strategy_type: string;
  symbol: string;
  fast_ma_period: number;
  slow_ma_period: number;
  stop_loss: number;
  take_profit: number;
  initial_capital: number;
}

export default function StrategySimulator() {
  const [params, setParams] = useState<StrategyParams>({
    strategy_type: 'moving_average_crossover',
    symbol: 'BTCUSD',
    fast_ma_period: 20,
    slow_ma_period: 50,
    stop_loss: 5,
    take_profit: 15,
    initial_capital: 10000
  });

  const [result, setResult] = useState<BacktestResult | null>(null);

  const backtestMutation = useMutation({
    mutationFn: async (strategyParams: StrategyParams) => {
      const response = await apiRequest('POST', '/api/strategy/backtest', strategyParams);
      return response;
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error) => {
      console.error('Backtest failed:', error);
    }
  });

  const handleRunBacktest = () => {
    backtestMutation.mutate(params);
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

  const getRiskLevel = (drawdown: number) => {
    if (drawdown <= 10) return { level: 'Low', color: 'text-green-600' };
    if (drawdown <= 25) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'High', color: 'text-red-600' };
  };

  return (
    <FeatureGate feature="strategySimulator" tier="PRO">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Strategy Simulator</h1>
            <span className="text-sm text-gray-500">Powered by Nautilus Trader</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Strategy Configuration */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Strategy Configuration
                </CardTitle>
                <CardDescription>
                  Define your trading strategy parameters for backtesting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="strategy-type">Strategy Type</Label>
                  <Select 
                    value={params.strategy_type} 
                    onValueChange={(value) => setParams({ ...params, strategy_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moving_average_crossover">Moving Average Crossover</SelectItem>
                      <SelectItem value="rsi_divergence">RSI Divergence</SelectItem>
                      <SelectItem value="bollinger_bands">Bollinger Bands</SelectItem>
                      <SelectItem value="macd_signal">MACD Signal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symbol">Trading Pair</Label>
                  <Select 
                    value={params.symbol} 
                    onValueChange={(value) => setParams({ ...params, symbol: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pair" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTCUSD">BTC/USD</SelectItem>
                      <SelectItem value="ETHUSD">ETH/USD</SelectItem>
                      <SelectItem value="DOGEUSD">DOGE/USD</SelectItem>
                      <SelectItem value="SHIBUSD">SHIB/USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fast-ma">Fast MA Period</Label>
                    <Input
                      id="fast-ma"
                      type="number"
                      value={params.fast_ma_period}
                      onChange={(e) => setParams({ ...params, fast_ma_period: parseInt(e.target.value) })}
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slow-ma">Slow MA Period</Label>
                    <Input
                      id="slow-ma"
                      type="number"
                      value={params.slow_ma_period}
                      onChange={(e) => setParams({ ...params, slow_ma_period: parseInt(e.target.value) })}
                      min="1"
                      max="200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stop-loss">Stop Loss (%)</Label>
                    <Input
                      id="stop-loss"
                      type="number"
                      step="0.1"
                      value={params.stop_loss}
                      onChange={(e) => setParams({ ...params, stop_loss: parseFloat(e.target.value) })}
                      min="0.1"
                      max="50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="take-profit">Take Profit (%)</Label>
                    <Input
                      id="take-profit"
                      type="number"
                      step="0.1"
                      value={params.take_profit}
                      onChange={(e) => setParams({ ...params, take_profit: parseFloat(e.target.value) })}
                      min="0.1"
                      max="100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initial-capital">Initial Capital ($)</Label>
                  <Input
                    id="initial-capital"
                    type="number"
                    value={params.initial_capital}
                    onChange={(e) => setParams({ ...params, initial_capital: parseInt(e.target.value) })}
                    min="1000"
                    max="1000000"
                    step="1000"
                  />
                </div>

                <Button 
                  onClick={handleRunBacktest} 
                  disabled={backtestMutation.isPending}
                  className="w-full"
                >
                  {backtestMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Running Backtest...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Backtest
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="lg:col-span-2 space-y-6">
              {result ? (
                <>
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-600">Net Profit</span>
                        </div>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(result.net_profit)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatPercentage(result.net_profit / params.initial_capital)} return
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-600">Win Rate</span>
                        </div>
                        <p className="text-xl font-bold text-blue-600">
                          {formatPercentage(result.win_rate)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {result.total_trades} total trades
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-gray-600">Max Drawdown</span>
                        </div>
                        <p className={`text-xl font-bold ${getRiskLevel(result.max_drawdown).color}`}>
                          {formatPercentage(result.max_drawdown / 100)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getRiskLevel(result.max_drawdown).level} risk
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-purple-500" />
                          <span className="text-sm text-gray-600">Sharpe Ratio</span>
                        </div>
                        <p className="text-xl font-bold text-purple-600">
                          {result.sharpe_ratio.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Risk-adjusted return
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Equity Curve */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Equity Curve</CardTitle>
                      <CardDescription>
                        Portfolio value over time using {params.strategy_type.replace('_', ' ')} strategy
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={result.equity_curve}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <YAxis 
                              tickFormatter={(value) => formatCurrency(value)}
                            />
                            <Tooltip 
                              labelFormatter={(value) => new Date(value).toLocaleDateString()}
                              formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="equity" 
                              stroke="#8884d8" 
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="h-96 flex items-center justify-center">
                  <CardContent className="text-center">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Ready to Test Your Strategy</h3>
                    <p className="text-sm text-gray-500">
                      Configure your strategy parameters and click "Run Backtest" to see how it would have performed historically.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}