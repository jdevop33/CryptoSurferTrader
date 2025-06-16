import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';
import { UniswapTradeButton } from '@/components/UniswapTradeButton';

interface TradingSignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string;
  priceTarget?: number;
  stopLoss?: number;
  marketCap: number;
  volumeChange: number;
  sentimentScore: number;
  timestamp: string;
}

export function TradingSignals() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isAutoTrading, setIsAutoTrading] = useState(false);

  const { data: aiSignals, isLoading } = useQuery({
    queryKey: ['/api/ai/recommendations'],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const { data: sentimentData } = useQuery({
    queryKey: ['/api/sentiment'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (aiSignals && sentimentData) {
      // Combine AI signals with sentiment data
      const combinedSignals = aiSignals.map((signal: any) => {
        const sentiment = sentimentData.find((s: any) => s.symbol === signal.symbol);
        return {
          ...signal,
          sentimentScore: sentiment?.sentimentScore || 0.5,
          marketCap: sentiment?.marketCap || 0,
          volumeChange: sentiment?.volumeChange || 0,
          timestamp: new Date().toISOString(),
        };
      });
      setSignals(combinedSignals);
    }
  }, [aiSignals, sentimentData]);

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'SELL':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'bg-green-500';
      case 'SELL':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const executeSignal = async (signal: TradingSignal) => {
    try {
      const response = await fetch('/api/trades/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: signal.symbol,
          action: signal.signal,
          amount: 100, // $100 position size
          userId: 1,
          confidence: signal.confidence,
          risk: signal.risk,
        }),
      });

      if (response.ok) {
        console.log(`Executed ${signal.signal} signal for ${signal.symbol}`);
      }
    } catch (error) {
      console.error('Failed to execute signal:', error);
    }
  };

  const toggleAutoTrading = async () => {
    try {
      const endpoint = isAutoTrading ? '/api/live-trading/stop' : '/api/live-trading/start';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 1,
          strategy: 'sentiment',
          riskLevel: 'MEDIUM',
        }),
      });

      if (response.ok) {
        setIsAutoTrading(!isAutoTrading);
      }
    } catch (error) {
      console.error('Failed to toggle auto-trading:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle>AI Trading Signals</CardTitle>
          <CardDescription>Loading real-time analysis...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-700/30 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto Trading Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            AI Trading System
            <div className="flex items-center space-x-2">
              {isAutoTrading ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <Badge variant={isAutoTrading ? 'default' : 'secondary'}>
                {isAutoTrading ? 'ACTIVE' : 'MANUAL'}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Automated trading based on AI analysis and social sentiment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">
                {isAutoTrading 
                  ? 'Auto-trading is enabled. The system will execute high-confidence signals automatically.'
                  : 'Manual mode. Review and execute signals manually for full control.'
                }
              </p>
            </div>
            <Button 
              onClick={toggleAutoTrading}
              variant={isAutoTrading ? 'destructive' : 'default'}
              className="ml-4"
            >
              {isAutoTrading ? 'Stop Auto Trading' : 'Enable Auto Trading'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trading Signals */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle>Real-Time Trading Signals</CardTitle>
          <CardDescription>
            AI-powered analysis combining technical indicators and social sentiment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {signals.map((signal, index) => (
              <div
                key={`${signal.symbol}-${index}`}
                className="p-4 bg-slate-700/30 rounded-lg border border-slate-600 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getSignalIcon(signal.signal)}
                    <span className="font-mono font-semibold text-lg">
                      {signal.symbol}
                    </span>
                    <Badge className={`${getSignalColor(signal.signal)} text-white`}>
                      {signal.signal}
                    </Badge>
                    <Badge variant="outline" className={getRiskColor(signal.risk)}>
                      {signal.risk} RISK
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Confidence</div>
                    <div className="font-semibold">{(signal.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>

                <div className="mb-3">
                  <Progress 
                    value={signal.confidence * 100} 
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-slate-400">Market Cap</div>
                    <div className="font-medium">{formatCurrency(signal.marketCap)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Volume Change</div>
                    <div className={`font-medium ${signal.volumeChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {signal.volumeChange > 0 ? '+' : ''}{signal.volumeChange.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Sentiment</div>
                    <div className="font-medium">{(signal.sentimentScore * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Updated</div>
                    <div className="text-sm">
                      {new Date(signal.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {signal.reasoning && (
                  <div className="mb-3">
                    <div className="text-xs text-slate-400 mb-1">AI Analysis</div>
                    <p className="text-sm text-slate-300 italic">"{signal.reasoning}"</p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {/* Get token address for popular tokens */}
                    {(() => {
                      const tokenAddresses: Record<string, string> = {
                        'DOGECOIN': '0x4206931337dc273a630d328dA6441786BfaD668f',
                        'SHIBA': '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
                        'PEPE': '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
                        'FLOKI': '0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E'
                      };
                      const tokenAddress = tokenAddresses[signal.symbol];
                      return tokenAddress ? (
                        <UniswapTradeButton
                          tokenAddress={tokenAddress}
                          tokenSymbol={signal.symbol}
                          size="sm"
                          variant="outline"
                        />
                      ) : null;
                    })()}
                  </div>
                  {!isAutoTrading && signal.signal !== 'HOLD' && signal.confidence > 0.7 && (
                    <Button
                      size="sm"
                      onClick={() => executeSignal(signal)}
                      variant={signal.signal === 'BUY' ? 'default' : 'destructive'}
                    >
                      Execute {signal.signal} Signal
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {signals.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>No trading signals available</p>
                <p className="text-sm">AI analysis is updating...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}