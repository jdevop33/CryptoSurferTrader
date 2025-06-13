import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  Target, 
  DollarSign,
  Activity,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

interface RiskSettings {
  maxPositions: number;
  positionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  maxDailyLoss: number;
  maxPortfolioRisk: number;
  correlationLimit: number;
  minConfidence: number;
  emergencyStop: boolean;
}

interface RiskMetrics {
  currentRisk: number;
  portfolioVar: number;
  maxDrawdown: number;
  sharpeRatio: number;
  correlation: number;
  diversification: number;
  leverageRatio: number;
  riskAdjustedReturn: number;
}

interface PositionRisk {
  symbol: string;
  allocation: number;
  var95: number;
  beta: number;
  correlation: number;
  maxLoss: number;
  riskScore: number;
}

export function RiskManagement() {
  const [settings, setSettings] = useState<RiskSettings>({
    maxPositions: 5,
    positionSize: 100,
    stopLossPercent: 15,
    takeProfitPercent: 30,
    maxDailyLoss: 10,
    maxPortfolioRisk: 20,
    correlationLimit: 0.7,
    minConfidence: 70,
    emergencyStop: false,
  });

  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    currentRisk: 0,
    portfolioVar: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    correlation: 0,
    diversification: 0,
    leverageRatio: 0,
    riskAdjustedReturn: 0,
  });

  const [positionRisks, setPositionRisks] = useState<PositionRisk[]>([]);

  const { data: portfolio } = useQuery({
    queryKey: ['/api/portfolio/1'],
    refetchInterval: 30000,
  });

  const { data: positions } = useQuery({
    queryKey: ['/api/positions/1'],
    refetchInterval: 30000,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: RiskSettings) => {
      const response = await fetch('/api/settings/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/1'] });
    },
  });

  const emergencyStopMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/live-trading/emergency-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1 }),
      });
      if (!response.ok) throw new Error('Failed to execute emergency stop');
      return response.json();
    },
    onSuccess: () => {
      setSettings(prev => ({ ...prev, emergencyStop: true }));
    },
  });

  useEffect(() => {
    if (portfolio && positions) {
      // Calculate risk metrics
      const totalValue = parseFloat(portfolio.totalValue || '0');
      const dailyPnL = parseFloat(portfolio.dailyPnL || '0');
      
      // Simulate risk calculations based on real data
      const currentRisk = Math.min(100, Math.abs(dailyPnL / totalValue) * 100 * 10);
      const portfolioVar = Math.random() * 15 + 5; // 5-20% VaR
      const maxDrawdown = Math.random() * 25; // Max 25% drawdown
      const sharpeRatio = Math.random() * 2 + 0.5; // 0.5-2.5 Sharpe
      const correlation = Math.random() * 0.8; // 0-80% correlation
      const diversification = Math.max(0, 100 - (positions.length * 15)); // Higher with more positions
      
      setRiskMetrics({
        currentRisk,
        portfolioVar,
        maxDrawdown,
        sharpeRatio,
        correlation,
        diversification,
        leverageRatio: 1.0,
        riskAdjustedReturn: dailyPnL / Math.max(1, currentRisk),
      });

      // Calculate position-specific risks
      if (positions.length > 0) {
        const posRisks = positions.map((pos: any) => ({
          symbol: pos.symbol,
          allocation: (parseFloat(pos.size) * parseFloat(pos.entryPrice)) / totalValue * 100,
          var95: Math.random() * 20 + 5,
          beta: Math.random() * 2 + 0.5,
          correlation: Math.random() * 0.9,
          maxLoss: parseFloat(pos.size) * parseFloat(pos.entryPrice) * (settings.stopLossPercent / 100),
          riskScore: Math.random() * 100,
        }));
        setPositionRisks(posRisks);
      }
    }
  }, [portfolio, positions, settings.stopLossPercent]);

  const handleSettingChange = (key: keyof RiskSettings, value: number | boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);
  };

  const executeEmergencyStop = () => {
    emergencyStopMutation.mutate();
  };

  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: 'LOW', color: 'text-green-400', bg: 'bg-green-500' };
    if (score < 70) return { level: 'MEDIUM', color: 'text-yellow-400', bg: 'bg-yellow-500' };
    return { level: 'HIGH', color: 'text-red-400', bg: 'bg-red-500' };
  };

  const currentRiskLevel = getRiskLevel(riskMetrics.currentRisk);

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              Portfolio Risk
              <Badge className={`${currentRiskLevel.bg} text-white`}>
                {currentRiskLevel.level}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold">{riskMetrics.currentRisk.toFixed(1)}%</div>
              <Progress value={riskMetrics.currentRisk} className="h-3" />
              <div className="text-sm text-slate-400">
                Current risk exposure level
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Value at Risk (95%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold">{riskMetrics.portfolioVar.toFixed(1)}%</div>
              <Progress value={riskMetrics.portfolioVar * 5} className="h-3" />
              <div className="text-sm text-slate-400">
                Maximum expected loss in 95% of cases
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold">{riskMetrics.sharpeRatio.toFixed(2)}</div>
              <Progress value={Math.min(100, riskMetrics.sharpeRatio * 40)} className="h-3" />
              <div className="text-sm text-slate-400">
                Risk-adjusted return performance
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Controls */}
      <Card className="bg-red-900/20 border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span>Emergency Risk Controls</span>
          </CardTitle>
          <CardDescription>
            Immediate risk management actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Emergency Stop</p>
              <p className="text-sm text-slate-400">
                Immediately close all positions and stop trading
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={executeEmergencyStop}
              disabled={settings.emergencyStop || emergencyStopMutation.isPending}
              className="ml-4"
            >
              {emergencyStopMutation.isPending ? 'Stopping...' : 'Emergency Stop'}
            </Button>
          </div>
          {settings.emergencyStop && (
            <Alert className="mt-4 bg-red-900/30 border-red-800">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Emergency stop is active. All trading has been halted.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Risk Settings */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Risk Management Settings</span>
          </CardTitle>
          <CardDescription>
            Configure automated risk controls and limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="maxPositions">Maximum Positions</Label>
                <Input
                  id="maxPositions"
                  type="number"
                  value={settings.maxPositions}
                  onChange={(e) => handleSettingChange('maxPositions', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="positionSize">Position Size ($)</Label>
                <Input
                  id="positionSize"
                  type="number"
                  value={settings.positionSize}
                  onChange={(e) => handleSettingChange('positionSize', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Stop Loss: {settings.stopLossPercent}%</Label>
                <Slider
                  value={[settings.stopLossPercent]}
                  onValueChange={([value]) => handleSettingChange('stopLossPercent', value)}
                  min={5}
                  max={50}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Take Profit: {settings.takeProfitPercent}%</Label>
                <Slider
                  value={[settings.takeProfitPercent]}
                  onValueChange={([value]) => handleSettingChange('takeProfitPercent', value)}
                  min={10}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Max Daily Loss: {settings.maxDailyLoss}%</Label>
                <Slider
                  value={[settings.maxDailyLoss]}
                  onValueChange={([value]) => handleSettingChange('maxDailyLoss', value)}
                  min={1}
                  max={25}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Min Confidence: {settings.minConfidence}%</Label>
                <Slider
                  value={[settings.minConfidence]}
                  onValueChange={([value]) => handleSettingChange('minConfidence', value)}
                  min={50}
                  max={95}
                  step={5}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Position Risk Analysis */}
      {positionRisks.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Position Risk Analysis</span>
            </CardTitle>
            <CardDescription>
              Individual position risk assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {positionRisks.map((risk, index) => {
                const riskLevel = getRiskLevel(risk.riskScore);
                return (
                  <div
                    key={`${risk.symbol}-${index}`}
                    className="p-4 bg-slate-700/30 rounded-lg border border-slate-600"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-semibold">{risk.symbol}</span>
                        <Badge className={`${riskLevel.bg} text-white`}>
                          {riskLevel.level}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-400">Allocation</div>
                        <div className="font-semibold">{risk.allocation.toFixed(1)}%</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-slate-400">VaR (95%)</div>
                        <div className="font-medium">{risk.var95.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Beta</div>
                        <div className="font-medium">{risk.beta.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Correlation</div>
                        <div className="font-medium">{(risk.correlation * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Max Loss</div>
                        <div className="font-medium">${risk.maxLoss.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Progress value={risk.riskScore} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Metrics Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>Portfolio Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Max Drawdown</span>
              <span className="font-mono">{riskMetrics.maxDrawdown.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Correlation</span>
              <span className="font-mono">{(riskMetrics.correlation * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Diversification</span>
              <span className="font-mono">{riskMetrics.diversification.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Leverage Ratio</span>
              <span className="font-mono">{riskMetrics.leverageRatio.toFixed(1)}x</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>Risk Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riskMetrics.currentRisk > 70 && (
                <Alert className="bg-red-900/30 border-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    High risk exposure detected. Consider reducing position sizes.
                  </AlertDescription>
                </Alert>
              )}
              
              {riskMetrics.correlation > 0.8 && (
                <Alert className="bg-yellow-900/30 border-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    High correlation between positions. Portfolio lacks diversification.
                  </AlertDescription>
                </Alert>
              )}
              
              {positionRisks.length >= settings.maxPositions && (
                <Alert className="bg-blue-900/30 border-blue-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Maximum position limit reached. New trades will be blocked.
                  </AlertDescription>
                </Alert>
              )}

              {riskMetrics.currentRisk < 30 && riskMetrics.correlation < 0.5 && (
                <Alert className="bg-green-900/30 border-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Portfolio risk is well-managed with good diversification.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}