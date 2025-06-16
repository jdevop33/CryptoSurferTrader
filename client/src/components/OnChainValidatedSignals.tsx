import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnChainValidation {
  tokenName: string;
  tokenSymbol: string;
  totalHolders: number;
  recentVolumeUsd: number;
  top5LargeTransactions: number[];
  whaleActivity: {
    whaleThreshold: number;
    whaleCount: number;
    averageTransaction: number;
  };
  transactionCount: number;
  validationStatus: "STRONG_VALIDATION" | "MODERATE_VALIDATION" | "WEAK_VALIDATION" | "NO_VALIDATION";
}

interface EnhancedSignal {
  symbol: string;
  originalSignal: {
    signal: string;
    confidence: number;
    risk: string;
  };
  onChainValidation: OnChainValidation | null;
  enhancedAnalysis: {
    originalSignal: string;
    originalConfidence: number;
    onChainValidation: OnChainValidation | null;
    enhancedSignal: string;
    enhancedConfidence: number;
    recommendation: string;
  };
  finalRecommendation: {
    signal: string;
    confidence: number;
    risk: string;
    recommendation: string;
  };
}

interface ApiResponse {
  enhancedSignals: EnhancedSignal[];
  metadata: {
    totalSignals: number;
    validatedSignals: number;
    strongBuySignals: number;
    timestamp: string;
  };
}

const getSignalIcon = (signal: string) => {
  switch (signal) {
    case "STRONG_BUY":
    case "BUY":
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case "STRONG_SELL":
    case "SELL":
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-yellow-500" />;
  }
};

const getSignalColor = (signal: string) => {
  switch (signal) {
    case "STRONG_BUY":
      return "bg-green-100 text-green-800 border-green-200";
    case "BUY":
      return "bg-green-50 text-green-700 border-green-100";
    case "STRONG_SELL":
      return "bg-red-100 text-red-800 border-red-200";
    case "SELL":
      return "bg-red-50 text-red-700 border-red-100";
    default:
      return "bg-yellow-50 text-yellow-700 border-yellow-100";
  }
};

const getValidationIcon = (status: string) => {
  switch (status) {
    case "STRONG_VALIDATION":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "MODERATE_VALIDATION":
      return <Shield className="h-4 w-4 text-blue-500" />;
    case "WEAK_VALIDATION":
      return <Info className="h-4 w-4 text-yellow-500" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
  }
};

const getValidationColor = (status: string) => {
  switch (status) {
    case "STRONG_VALIDATION":
      return "text-green-600 bg-green-50";
    case "MODERATE_VALIDATION":
      return "text-blue-600 bg-blue-50";
    case "WEAK_VALIDATION":
      return "text-yellow-600 bg-yellow-50";
    default:
      return "text-red-600 bg-red-50";
  }
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const SignalCard = ({ signal }: { signal: EnhancedSignal }) => {
  const validation = signal.onChainValidation;
  const enhanced = signal.enhancedAnalysis;
  const final = signal.finalRecommendation;

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">{signal.symbol}</CardTitle>
            {validation && (
              <Badge variant="outline" className={cn("text-xs", getValidationColor(validation.validationStatus))}>
                {getValidationIcon(validation.validationStatus)}
                <span className="ml-1">
                  {validation.validationStatus.replace('_', ' ')}
                </span>
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getSignalIcon(final.signal)}
            <Badge className={cn("font-medium", getSignalColor(final.signal))}>
              {final.signal}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Confidence Comparison */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Original Confidence</span>
            <span className="font-medium">{(signal.originalSignal.confidence * 100).toFixed(1)}%</span>
          </div>
          <Progress value={signal.originalSignal.confidence * 100} className="h-2" />
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Enhanced Confidence</span>
            <span className="font-medium text-blue-600">{(final.confidence * 100).toFixed(1)}%</span>
          </div>
          <Progress value={final.confidence * 100} className="h-2 bg-blue-100" />
        </div>

        {/* On-Chain Metrics */}
        {validation && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-gray-500">Holders</div>
              <div className="font-semibold text-sm">{formatNumber(validation.totalHolders)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">24h Volume</div>
              <div className="font-semibold text-sm">${formatNumber(validation.recentVolumeUsd)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Transactions</div>
              <div className="font-semibold text-sm">{validation.transactionCount}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Whale Activity</div>
              <div className="font-semibold text-sm">{validation.whaleActivity.whaleCount} whales</div>
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-600 font-medium mb-1">AI Recommendation</div>
          <div className="text-sm text-blue-800">{final.recommendation}</div>
        </div>

        {/* Risk Assessment */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Risk Level:</span>
            <Badge variant="outline" className={cn(
              final.risk === "LOW" ? "text-green-600 border-green-300" :
              final.risk === "MEDIUM" ? "text-yellow-600 border-yellow-300" :
              "text-red-600 border-red-300"
            )}>
              {final.risk}
            </Badge>
          </div>
          
          {validation && (
            <Button variant="ghost" size="sm" className="text-xs">
              View Details <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function OnChainValidatedSignals() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading, error, refetch } = useQuery<ApiResponse>({
    queryKey: ['/api/trading/enhanced-signals', refreshKey],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">On-Chain Validated Signals</h2>
          <Button variant="outline" disabled>
            <Activity className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">On-Chain Validated Signals</h2>
          <Button variant="outline" onClick={handleRefresh}>
            <Activity className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Failed to load enhanced signals. Please check your API configuration.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || !data.enhancedSignals) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">On-Chain Validated Signals</h2>
          <Button variant="outline" onClick={handleRefresh}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            No enhanced signals available at this time.
          </CardContent>
        </Card>
      </div>
    );
  }

  const metadata = data.metadata;

  return (
    <div className="space-y-6">
      {/* Header with Metrics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">On-Chain Validated Signals</h2>
          <p className="text-sm text-gray-600 mt-1">
            AI signals enhanced with authentic blockchain data validation
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{metadata.totalSignals}</div>
            <div className="text-xs text-gray-500">Total Signals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-green-600">{metadata.validatedSignals}</div>
            <div className="text-xs text-gray-500">On-Chain Validated</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{metadata.strongBuySignals}</div>
            <div className="text-xs text-gray-500">Strong Buy Signals</div>
          </CardContent>
        </Card>
      </div>

      {/* Signal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.enhancedSignals.map((signal) => (
          <SignalCard key={signal.symbol} signal={signal} />
        ))}
      </div>

      {/* Footer Info */}
      <div className="text-xs text-gray-500 text-center">
        Last updated: {new Date(metadata.timestamp).toLocaleString()}
      </div>
    </div>
  );
}