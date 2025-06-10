import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  AlertTriangle,
  Settings,
  Bell,
  Zap,
  Target,
  Shield,
  BarChart3,
  Brain,
  Cloud
} from 'lucide-react';
import { Link } from 'wouter';
import { useTradingQueries, useTradingMutations, tradingAPI, type Position, type Trade, type SentimentData } from '@/lib/trading-api';
import { queryClient } from '@/lib/queryClient';

const userId = 1; // Current user ID

export default function Dashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Fetch data using React Query with real-time updates
  const portfolioQuery = useQuery(useTradingQueries.portfolio(userId));
  const positionsQuery = useQuery(useTradingQueries.positions(userId));
  const tradesQuery = useQuery(useTradingQueries.trades(userId, 10));
  const sentimentQuery = useQuery(useTradingQueries.sentiment());
  const settingsQuery = useQuery(useTradingQueries.settings(userId));
  const notificationsQuery = useQuery(useTradingQueries.notifications(userId));

  // Mutations for user actions
  const toggleTradingMutation = useMutation(useTradingMutations.toggleTrading(userId));
  const emergencyStopMutation = useMutation(useTradingMutations.emergencyStop(userId));

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = tradingAPI.connectWebSocket(userId, (data) => {
      setLastUpdate(new Date().toLocaleTimeString());
      
      // Invalidate queries to refresh data
      if (data.type === 'portfolio-update') {
        queryClient.invalidateQueries({ queryKey: ['/api/portfolio', userId] });
      } else if (data.type === 'position-update') {
        queryClient.invalidateQueries({ queryKey: ['/api/positions', userId] });
      } else if (data.type === 'trade-executed') {
        queryClient.invalidateQueries({ queryKey: ['/api/trades', userId] });
        queryClient.invalidateQueries({ queryKey: ['/api/portfolio', userId] });
      }
    });

    if (ws) {
      setIsConnected(true);
      return () => {
        ws.close();
        setIsConnected(false);
      };
    }
  }, []);

  const portfolio = portfolioQuery.data;
  const positions = positionsQuery.data || [];
  const trades = tradesQuery.data || [];
  const sentiment = sentimentQuery.data || [];
  const settings = settingsQuery.data;
  const notifications = notificationsQuery.data || [];

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const handleToggleTrading = async () => {
    if (settings) {
      await toggleTradingMutation.mutateAsync(!settings.autoTradingEnabled);
    }
  };

  const handleEmergencyStop = async () => {
    if (confirm('Are you sure you want to execute an emergency stop? This will close all open positions.')) {
      await emergencyStopMutation.mutateAsync();
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(num);
  };

  const formatPercent = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Meme Coin Trading Dashboard
            </h1>
            <p className="text-slate-400 mt-1">
              Automated trading with social sentiment analysis
              {isConnected && (
                <span className="ml-2 inline-flex items-center text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                  Live
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {lastUpdate && (
              <span className="text-sm text-slate-400">
                Last update: {lastUpdate}
              </span>
            )}
            
            <Link href="/ai-insights">
              <Button variant="outline" size="sm">
                <Brain className="w-4 h-4 mr-1" />
                AI Insights
              </Button>
            </Link>
            
            <Button
              variant="outline"
              size="sm"
              className="relative"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                  {unreadNotifications}
                </Badge>
              )}
            </Button>

            <Button
              variant={settings?.autoTradingEnabled ? "default" : "secondary"}
              size="sm"
              onClick={handleToggleTrading}
              disabled={toggleTradingMutation.isPending}
            >
              <Activity className="w-4 h-4 mr-1" />
              {settings?.autoTradingEnabled ? 'Trading ON' : 'Trading OFF'}
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleEmergencyStop}
              disabled={emergencyStopMutation.isPending}
            >
              <Shield className="w-4 h-4 mr-1" />
              Emergency Stop
            </Button>

            <Link href="/deploy">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-1" />
                Deploy to Production
              </Button>
            </Link>
          </div>
        </div>

        {/* Portfolio Overview */}
        {portfolio && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">
                  {formatCurrency(portfolio.totalValue)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Available: {formatCurrency(portfolio.availableBalance)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
                {parseFloat(portfolio.dailyPnL) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  parseFloat(portfolio.dailyPnL) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatCurrency(portfolio.dailyPnL)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Unrealized: {formatCurrency(portfolio.unrealizedPnL)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
                <Target className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">
                  {portfolio.activePositions}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Margin used: {formatCurrency(portfolio.marginUsed)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Realized P&L</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  parseFloat(portfolio.realizedPnL) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatCurrency(portfolio.realizedPnL)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  All-time performance
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="positions" className="space-y-6">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="sentiment">Market Sentiment</TabsTrigger>
            <TabsTrigger value="trades">Trade History</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Positions Tab */}
          <TabsContent value="positions">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Open Positions</CardTitle>
                <CardDescription>
                  Currently holding {positions.length} positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {positions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    No open positions. The system is monitoring for trading opportunities.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {positions.map((position: Position) => (
                      <div
                        key={position.id}
                        className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600"
                      >
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline" className="font-mono">
                            {position.symbol}
                          </Badge>
                          <div>
                            <p className="font-medium">{position.side}</p>
                            <p className="text-sm text-slate-400">
                              Size: {position.size}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-medium">
                            Entry: {formatCurrency(position.entryPrice)}
                          </p>
                          <p className="text-sm text-slate-400">
                            Current: {formatCurrency(position.currentPrice)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className={`font-bold ${
                            parseFloat(position.pnl) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(position.pnl)}
                          </p>
                          <p className={`text-sm ${
                            parseFloat(position.pnlPercent) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatPercent(position.pnlPercent)}
                          </p>
                        </div>

                        <div className="text-right text-sm text-slate-400">
                          <p>SL: {position.stopLoss ? formatCurrency(position.stopLoss) : 'N/A'}</p>
                          <p>TP: {position.takeProfit ? formatCurrency(position.takeProfit) : 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sentiment Tab */}
          <TabsContent value="sentiment">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Social Media Sentiment</CardTitle>
                <CardDescription>
                  Real-time sentiment analysis from crypto influencers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sentiment.map((item: SentimentData) => (
                    <div
                      key={item.symbol}
                      className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600"
                    >
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="font-mono">
                          {item.symbol}
                        </Badge>
                        <div>
                          <p className="font-medium">Market Cap: {formatCurrency(item.marketCap)}</p>
                          <p className="text-sm text-slate-400">
                            {item.mentions} mentions • {item.influencerCount} influencers
                          </p>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-400">Sentiment</span>
                          <Progress 
                            value={parseFloat(item.sentimentScore) * 100} 
                            className="w-20"
                          />
                          <span className="text-sm font-medium">
                            {(parseFloat(item.sentimentScore) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`font-medium ${
                          parseFloat(item.volumeChange) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercent(item.volumeChange)}
                        </p>
                        <p className="text-xs text-slate-400">24h change</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
                <CardDescription>
                  Latest trading activity and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trades.map((trade: Trade) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={trade.type === 'BUY' ? 'default' : 'secondary'}
                          className="font-mono"
                        >
                          {trade.type}
                        </Badge>
                        <div>
                          <p className="font-medium">{trade.symbol}</p>
                          <p className="text-xs text-slate-400">
                            Size: {trade.size}
                          </p>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-sm">
                          Price: {formatCurrency(trade.entryPrice || trade.exitPrice || '0')}
                        </p>
                        {trade.trigger && (
                          <p className="text-xs text-slate-400">{trade.trigger}</p>
                        )}
                      </div>

                      <div className="text-right">
                        {trade.pnl && (
                          <p className={`font-medium ${
                            parseFloat(trade.pnl) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(trade.pnl)}
                          </p>
                        )}
                        <p className="text-xs text-slate-400">
                          {new Date(trade.executedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>System Notifications</CardTitle>
                <CardDescription>
                  Trading alerts and system messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <Alert key={notification.id} className="bg-slate-700/30 border-slate-600">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          {notification.type === 'success' && <Zap className="h-4 w-4 text-green-400 mt-0.5" />}
                          {notification.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />}
                          {notification.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />}
                          <div>
                            <h4 className="font-medium">{notification.title}</h4>
                            <AlertDescription className="text-sm">
                              {notification.message}
                            </AlertDescription>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {!notification.read && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}