import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Pause, Settings, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function TradingSidebar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: portfolio } = useQuery({
    queryKey: ['/api/portfolio/1'],
  });

  const { data: settings } = useQuery({
    queryKey: ['/api/settings/1'],
  });

  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications/1'],
    select: (data) => data?.slice(0, 3) || [], // Show latest 3
  });

  const toggleTradingMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiRequest('POST', '/api/trading/toggle/1', { enabled });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/1'] });
      toast({
        title: "Trading Status Updated",
        description: "Auto trading has been toggled",
      });
    },
  });

  const emergencyStopMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/trading/emergency-stop/1');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/1'] });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/1'] });
      toast({
        title: "Emergency Stop Executed",
        description: "All positions have been closed and trading stopped",
        variant: "destructive",
      });
    },
  });

  const dailyLossUsed = parseFloat(portfolio?.dailyPnL || '0');
  const dailyLossLimit = parseFloat(settings?.dailyLossLimit || '200');
  const dailyLossPercent = Math.abs(dailyLossUsed) / dailyLossLimit * 100;

  const totalExposure = parseFloat(portfolio?.totalValue || '0');
  const maxExposure = parseFloat(settings?.maxPositionSize || '100') * (settings?.maxPositions || 5);
  const exposurePercent = (totalExposure / maxExposure) * 100;

  return (
    <aside className="w-80 bg-slate-800 border-r border-slate-700 p-6 space-y-6">
      {/* Quick Portfolio Stats */}
      <Card className="bg-slate-700 border-slate-600">
        <CardHeader>
          <CardTitle className="text-lg">Portfolio Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Today's P&L</div>
              <div className={`text-lg font-bold ${parseFloat(portfolio?.dailyPnL || '0') >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {parseFloat(portfolio?.dailyPnL || '0') >= 0 ? '+' : ''}${portfolio?.dailyPnL || '0.00'}
              </div>
              <div className={`text-xs ${parseFloat(portfolio?.dailyPnL || '0') >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {parseFloat(portfolio?.dailyPnL || '0') >= 0 ? '+' : ''}
                {((parseFloat(portfolio?.dailyPnL || '0') / parseFloat(portfolio?.totalValue || '1')) * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Active Positions</div>
              <div className="text-lg font-bold">
                {portfolio?.activePositions || 0}/{settings?.maxPositions || 5}
              </div>
              <div className="text-xs text-gray-400">Max: {settings?.maxPositions || 5}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Available</div>
              <div className="text-lg font-bold">${portfolio?.availableFunds || '0.00'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Risk Level</div>
              <div className="text-lg font-bold text-yellow-400">
                {exposurePercent > 80 ? 'High' : exposurePercent > 50 ? 'Moderate' : 'Low'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Controls */}
      <Card className="bg-slate-700 border-slate-600">
        <CardHeader>
          <CardTitle className="text-lg">Trading Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className={`w-full py-3 font-medium transition-colors ${
              settings?.autoTradingEnabled 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
            onClick={() => toggleTradingMutation.mutate(!settings?.autoTradingEnabled)}
            disabled={toggleTradingMutation.isPending}
          >
            <Play className="w-4 h-4 mr-2" />
            Auto Trading: {settings?.autoTradingEnabled ? 'ON' : 'OFF'}
          </Button>
          
          <Button
            className="w-full bg-red-600 hover:bg-red-700 py-2 font-medium transition-colors"
            onClick={() => emergencyStopMutation.mutate()}
            disabled={emergencyStopMutation.isPending}
          >
            <Square className="w-4 h-4 mr-2" />
            Emergency Stop
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" className="bg-slate-600 hover:bg-slate-500">
              <Pause className="w-3 h-3 mr-1" />
              Pause
            </Button>
            <Button variant="secondary" size="sm" className="bg-slate-600 hover:bg-slate-500">
              <Settings className="w-3 h-3 mr-1" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Risk Management */}
      <Card className="bg-slate-700 border-slate-600">
        <CardHeader>
          <CardTitle className="text-lg">Risk Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Daily Loss Limit</span>
              <span>${Math.abs(dailyLossUsed).toFixed(2)} / ${dailyLossLimit.toFixed(2)}</span>
            </div>
            <Progress value={Math.min(dailyLossPercent, 100)} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Position Exposure</span>
              <span>${totalExposure.toFixed(2)} / ${maxExposure.toFixed(2)}</span>
            </div>
            <Progress value={Math.min(exposurePercent, 100)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card className="bg-slate-700 border-slate-600">
        <CardHeader>
          <CardTitle className="text-lg">Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification: any) => (
              <div key={notification.id} className="flex items-start space-x-3 p-2 bg-slate-600 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  notification.type === 'trade' ? 'bg-green-400' :
                  notification.type === 'alert' ? 'bg-yellow-400' :
                  notification.type === 'risk' ? 'bg-red-400' : 'bg-blue-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${
                    notification.type === 'trade' ? 'text-green-400' :
                    notification.type === 'alert' ? 'text-yellow-400' :
                    notification.type === 'risk' ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {notification.title}
                  </div>
                  <div className="text-xs text-gray-400">{notification.message}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-4">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent alerts</p>
            </div>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
