import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, TrendingDown, BarChart3, Info } from 'lucide-react';
import { FeatureGate } from '@/components/FeatureGate';

interface RiskData {
  portfolioValue: number;
  var95: number;
  riskPercentage: number;
  riskLevel: string;
  riskColor: string;
  confidenceLevel: number;
  message: string;
}

const RiskGauge = ({ riskPercentage, riskColor }: { riskPercentage: number; riskColor: string }) => {
  const gaugeValue = Math.min(riskPercentage * 10, 100); // Scale to 0-100 for display
  
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke={riskColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(gaugeValue / 100) * 314.16} 314.16`}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: riskColor }}>
            {riskPercentage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Risk Level</div>
        </div>
      </div>
    </div>
  );
};

export default function PortfolioRisk() {
  const { data: riskData, isLoading, error } = useQuery<RiskData>({
    queryKey: ['/api/portfolio/risk/1'], // Using default user ID
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return <Shield className="h-5 w-5 text-green-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'high':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <BarChart3 className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRiskDescription = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return "Your portfolio has conservative risk exposure. Daily losses are expected to be minimal under normal market conditions.";
      case 'medium':
        return "Your portfolio has moderate risk exposure. Daily fluctuations may be noticeable but within acceptable ranges for most investors.";
      case 'high':
        return "Your portfolio has elevated risk exposure. Consider diversification or position sizing adjustments to manage potential losses.";
      default:
        return "Risk analysis is being calculated based on your current portfolio composition.";
    }
  };

  if (isLoading) {
    return (
      <FeatureGate feature="portfolioRiskDashboard" tier="PRO">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </FeatureGate>
    );
  }

  if (error || !riskData) {
    return (
      <FeatureGate feature="portfolioRiskDashboard" tier="PRO">
        <div className="container mx-auto px-6 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Portfolio Risk Analysis Unavailable</h3>
              <p className="text-gray-600">
                Unable to calculate portfolio risk. Please ensure you have assets in your portfolio and try again.
              </p>
            </CardContent>
          </Card>
        </div>
      </FeatureGate>
    );
  }

  return (
    <FeatureGate feature="portfolioRiskDashboard" tier="PRO">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Portfolio Risk Dashboard</h1>
            <span className="text-sm text-gray-500">Powered by GS Quant</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getRiskIcon(riskData.riskLevel)}
                  Value at Risk (VaR)
                </CardTitle>
                <CardDescription>
                  95% confidence level - 1 day horizon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <RiskGauge 
                    riskPercentage={riskData.riskPercentage} 
                    riskColor={riskData.riskColor} 
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Risk Assessment
                      </p>
                      <p className="text-sm text-gray-600">
                        {riskData.message}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Portfolio Value</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(riskData.portfolioValue)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Maximum Loss</p>
                    <p className="text-lg font-bold" style={{ color: riskData.riskColor }}>
                      {formatCurrency(riskData.var95)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Risk Analysis
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of your portfolio risk profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Risk Level</span>
                    <span 
                      className="text-sm font-bold"
                      style={{ color: riskData.riskColor }}
                    >
                      {riskData.riskLevel}
                    </span>
                  </div>
                  <Progress 
                    value={riskData.riskPercentage * 10} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {riskData.riskPercentage.toFixed(2)}% of portfolio value at risk
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">What is Value at Risk (VaR)?</h4>
                    <p className="text-sm text-gray-600">
                      VaR estimates the maximum amount your portfolio could lose over a specific time period 
                      with a given confidence level. A 95% VaR means there's only a 5% chance your losses 
                      will exceed this amount in normal market conditions.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Risk Assessment</h4>
                    <p className="text-sm text-gray-600">
                      {getRiskDescription(riskData.riskLevel)}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Methodology</h4>
                    <p className="text-sm text-gray-600">
                      This analysis uses institutional-grade risk models to calculate your portfolio's 
                      Value at Risk based on historical volatility and correlation patterns. The calculation 
                      assumes normal market conditions and may not capture extreme tail risks.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Management Recommendations
              </CardTitle>
              <CardDescription>
                Actionable steps to optimize your portfolio risk profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <h4 className="font-medium">Diversification</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Spread risk across different asset classes and cryptocurrencies to reduce overall portfolio volatility.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <h4 className="font-medium">Position Sizing</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Limit individual position sizes to manage concentration risk and prevent outsized losses from single assets.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <h4 className="font-medium">Stop Losses</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Set automatic stop-loss orders to limit downside risk and preserve capital during market downturns.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FeatureGate>
  );
}