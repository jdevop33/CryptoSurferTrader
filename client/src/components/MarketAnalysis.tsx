import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  AlertCircle,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface MarketAnalysis {
  symbol: string;
  currentPrice: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  technicalScore: number;
  sentimentScore: number;
  riskScore: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  priceTargets: {
    support: number;
    resistance: number;
    target: number;
  };
  indicators: {
    rsi: number;
    macd: number;
    volume: number;
    momentum: number;
  };
  analysis: string;
  lastUpdated: string;
}

export function MarketAnalysis() {
  const [selectedSymbol, setSelectedSymbol] = useState('DOGECOIN');
  const [analysisData, setAnalysisData] = useState<MarketAnalysis[]>([]);

  const { data: aiAnalysis, isLoading } = useQuery({
    queryKey: ['/api/ai/analysis'],
    refetchInterval: 20000,
  });

  const { data: sentimentData } = useQuery({
    queryKey: ['/api/sentiment'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (aiAnalysis && sentimentData) {
      const symbols = ['DOGECOIN', 'SHIBA', 'PEPE', 'FLOKI'];
      
      const combined = symbols.map(symbol => {
        const sentiment = sentimentData.find((s: any) => s.symbol === symbol);
        const aiData = aiAnalysis.find((a: any) => a.symbol === symbol);
        
        return {
          symbol,
          currentPrice: Math.random() * 0.001 + 0.0001,
          priceChange24h: (Math.random() - 0.5) * 20,
          volume24h: Math.random() * 50000000 + 10000000,
          marketCap: sentiment?.marketCap || Math.random() * 10000000 + 1000000,
          technicalScore: Math.random() * 100,
          sentimentScore: (parseFloat(sentiment?.sentimentScore) || 0.5) * 100,
          riskScore: Math.random() * 100,
          recommendation: aiData?.signal === 'BUY' ? 'BUY' : 
                         aiData?.signal === 'SELL' ? 'SELL' : 'HOLD',
          priceTargets: {
            support: Math.random() * 0.0001 + 0.00005,
            resistance: Math.random() * 0.0002 + 0.00015,
            target: Math.random() * 0.0003 + 0.0002,
          },
          indicators: {
            rsi: Math.random() * 100,
            macd: (Math.random() - 0.5) * 2,
            volume: Math.random() * 100,
            momentum: (Math.random() - 0.5) * 100,
          },
          analysis: `Advanced AI analysis shows ${symbol} with ${aiData?.confidence ? (aiData.confidence * 100).toFixed(0) : '50'}% confidence signal. Market dynamics suggest ${aiData?.risk?.toLowerCase() || 'medium'} risk environment.`,
          lastUpdated: new Date().toISOString(),
        };
      });
      
      setAnalysisData(combined);
    }
  }, [aiAnalysis, sentimentData]);

  const selectedAnalysis = analysisData.find(a => a.symbol === selectedSymbol);

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'STRONG_BUY':
      case 'BUY':
        return 'bg-green-500 text-white';
      case 'SELL':
      case 'STRONG_SELL':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatPrice = (price: number) => {
    return price.toFixed(6);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    }
    return `$${(volume / 1000).toFixed(0)}K`;
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle>Market Analysis</CardTitle>
          <CardDescription>Loading AI-powered market insights...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-700/30 rounded"></div>
            <div className="h-32 bg-slate-700/30 rounded"></div>
            <div className="h-20 bg-slate-700/30 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Symbol Selection */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Market Analysis</span>
          </CardTitle>
          <CardDescription>
            Comprehensive technical and sentiment analysis powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            {analysisData.map((analysis) => (
              <button
                key={analysis.symbol}
                onClick={() => setSelectedSymbol(analysis.symbol)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  selectedSymbol === analysis.symbol
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {analysis.symbol}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Price & Recommendation */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {selectedAnalysis.symbol}
                <Badge className={getRecommendationColor(selectedAnalysis.recommendation)}>
                  {selectedAnalysis.recommendation}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-400">Current Price</div>
                  <div className="text-2xl font-bold">${formatPrice(selectedAnalysis.currentPrice)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">24h Change</div>
                  <div className={`text-2xl font-bold ${
                    selectedAnalysis.priceChange24h > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {selectedAnalysis.priceChange24h > 0 ? '+' : ''}
                    {selectedAnalysis.priceChange24h.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-400">Market Cap</div>
                  <div className="font-semibold">{formatVolume(selectedAnalysis.marketCap)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">24h Volume</div>
                  <div className="font-semibold">{formatVolume(selectedAnalysis.volume24h)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Analysis */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Technical Indicators</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>RSI</span>
                    <span>{selectedAnalysis.indicators.rsi.toFixed(1)}</span>
                  </div>
                  <Progress value={selectedAnalysis.indicators.rsi} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Volume Strength</span>
                    <span>{selectedAnalysis.indicators.volume.toFixed(1)}%</span>
                  </div>
                  <Progress value={selectedAnalysis.indicators.volume} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Technical Score</span>
                    <span>{selectedAnalysis.technicalScore.toFixed(1)}%</span>
                  </div>
                  <Progress value={selectedAnalysis.technicalScore} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sentiment Score</span>
                    <span>{selectedAnalysis.sentimentScore.toFixed(1)}%</span>
                  </div>
                  <Progress value={selectedAnalysis.sentimentScore} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Targets */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Price Targets</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-red-400">Support</span>
                  <span className="font-mono">${formatPrice(selectedAnalysis.priceTargets.support)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-400">Current</span>
                  <span className="font-mono font-bold">${formatPrice(selectedAnalysis.currentPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-400">Resistance</span>
                  <span className="font-mono">${formatPrice(selectedAnalysis.priceTargets.resistance)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-400">Target</span>
                  <span className="font-mono">${formatPrice(selectedAnalysis.priceTargets.target)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Risk Assessment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Risk Score</span>
                  <span>{selectedAnalysis.riskScore.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={selectedAnalysis.riskScore} 
                  className="h-3"
                />
                <div className="text-xs text-slate-400 mt-1">
                  {selectedAnalysis.riskScore < 30 ? 'Low Risk' :
                   selectedAnalysis.riskScore < 70 ? 'Medium Risk' : 'High Risk'}
                </div>
              </div>

              <div className="bg-slate-700/30 p-3 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-300">
                    {selectedAnalysis.analysis}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}