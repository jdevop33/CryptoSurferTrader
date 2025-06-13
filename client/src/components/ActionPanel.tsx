import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  Play, 
  Square, 
  Activity, 
  Shield, 
  TrendingUp, 
  Brain, 
  Wallet,
  AlertTriangle,
  CheckCircle,
  Zap,
  BarChart3
} from 'lucide-react';
import { Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { tradingAPI } from '@/lib/trading-api';

interface ActionPanelProps {
  isTrading: boolean;
  portfolio: any;
  onToggleTrading: () => void;
  onEmergencyStop: () => void;
}

export function ActionPanel({ isTrading, portfolio, onToggleTrading, onEmergencyStop }: ActionPanelProps) {
  const [isEmergencyConfirm, setIsEmergencyConfirm] = useState(false);

  const handleEmergencyClick = () => {
    if (!isEmergencyConfirm) {
      setIsEmergencyConfirm(true);
      setTimeout(() => setIsEmergencyConfirm(false), 5000); // Reset after 5 seconds
    } else {
      onEmergencyStop();
      setIsEmergencyConfirm(false);
    }
  };

  const quickActions = [
    {
      title: 'AI Analysis',
      description: 'View real-time trading signals',
      href: '/ai-insights',
      icon: Brain,
      color: 'bg-purple-600 hover:bg-purple-700',
      status: 'Live signals updating every 20 seconds'
    },
    {
      title: 'Professional Analytics',
      description: 'Goldman Sachs quantitative tools',
      href: '/gs-quant',
      icon: BarChart3,
      color: 'bg-blue-600 hover:bg-blue-700',
      badge: 'PRO',
      status: 'VaR, stress testing, optimization'
    },
    {
      title: 'Web3 Trading',
      description: 'Connect wallet for real trading',
      href: '/web3-trading',
      icon: Wallet,
      color: 'bg-green-600 hover:bg-green-700',
      status: 'MetaMask and DEX integration'
    },
    {
      title: 'Production Deploy',
      description: 'Deploy to live environment',
      href: '/deploy',
      icon: Zap,
      color: 'bg-orange-600 hover:bg-orange-700',
      status: 'One-click cloud deployment'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Trading Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-400" />
            Trading Controls
          </CardTitle>
          <CardDescription>
            Start/stop AI trading and monitor system status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Trading Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${isTrading ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              <div>
                <h3 className="font-semibold">
                  AI Auto-Trading {isTrading ? 'ACTIVE' : 'STOPPED'}
                </h3>
                <p className="text-sm text-slate-400">
                  {isTrading 
                    ? 'AI is monitoring markets and making trades' 
                    : 'Click to start AI-powered trading'}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={onToggleTrading}
              className={`min-w-32 ${
                isTrading 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isTrading ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Stop Trading
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Trading
                </>
              )}
            </Button>
          </div>

          {/* Emergency Stop */}
          <div className="flex items-center justify-between p-4 bg-red-900/20 rounded-lg border border-red-700/50">
            <div className="flex items-center space-x-4">
              <Shield className="w-5 h-5 text-red-400" />
              <div>
                <h3 className="font-semibold text-red-400">Emergency Stop</h3>
                <p className="text-sm text-slate-400">
                  Immediately close all positions and stop trading
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="lg"
              onClick={handleEmergencyClick}
              className={`min-w-32 ${isEmergencyConfirm ? 'animate-pulse' : ''}`}
            >
              <Shield className="w-4 h-4 mr-2" />
              {isEmergencyConfirm ? 'Confirm Stop' : 'Emergency Stop'}
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium">Portfolio Value</span>
              </div>
              <p className="text-lg font-bold text-green-400">
                ${portfolio?.totalValue || '10,000.00'}
              </p>
            </div>
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">Daily P&L</span>
              </div>
              <p className={`text-lg font-bold ${
                parseFloat(portfolio?.dailyPnL || '0') >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                ${portfolio?.dailyPnL || '0.00'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Access key features and tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold flex items-center">
                            {action.title}
                            {action.badge && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {action.badge}
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-slate-400">{action.description}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">{action.status}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Status Alert */}
      {isTrading ? (
        <Alert className="bg-green-500/10 border-green-500/50">
          <Activity className="h-4 w-4" />
          <AlertDescription className="text-green-200">
            <strong>Trading Active:</strong> AI is monitoring DOGECOIN, SHIBA, PEPE, and FLOKI. 
            New signals generate every 20 seconds. Your $10,000 virtual portfolio is being managed automatically.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-blue-500/10 border-blue-500/50">
          <Brain className="h-4 w-4" />
          <AlertDescription className="text-blue-200">
            <strong>Ready to Trade:</strong> Click "Start Trading" to begin AI-powered cryptocurrency trading. 
            The system will monitor social sentiment and execute trades automatically.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}