import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function ActivePositions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: positions = [] } = useQuery({
    queryKey: ['/api/positions/1'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const closPositionMutation = useMutation({
    mutationFn: async (positionId: number) => {
      const response = await apiRequest('DELETE', `/api/positions/${positionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/positions/1'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/1'] });
      toast({
        title: "Position Closed",
        description: "Position has been successfully closed",
      });
    },
  });

  const getPnLColor = (pnl: string) => {
    const value = parseFloat(pnl || '0');
    return value >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getExchangeBadgeColor = (exchange: string) => {
    switch (exchange.toLowerCase()) {
      case 'binance':
        return 'bg-yellow-600';
      case 'bybit':
        return 'bg-orange-600';
      case 'uniswap v3':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Active Positions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {positions.length > 0 ? (
            positions.map((position: any) => (
              <Card key={position.id} className="bg-slate-700 border-slate-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {position.symbol.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold">{position.symbol}</div>
                        <Badge 
                          className={`text-xs ${getExchangeBadgeColor(position.exchange)}`}
                        >
                          {position.exchange}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getPnLColor(position.pnl)}`}>
                        {parseFloat(position.pnl || '0') >= 0 ? '+' : ''}${position.pnl || '0.00'}
                      </div>
                      <div className={`text-sm ${getPnLColor(position.pnlPercent)}`}>
                        {parseFloat(position.pnlPercent || '0') >= 0 ? '+' : ''}
                        {position.pnlPercent || '0.00'}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Entry Price</div>
                      <div className="font-medium">${position.entryPrice}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Current Price</div>
                      <div className={`font-medium ${getPnLColor(position.pnl)}`}>
                        ${position.currentPrice || position.entryPrice}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Size</div>
                      <div className="font-medium">${position.size}</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex space-x-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                      size="sm"
                    >
                      <Target className="w-3 h-3 mr-1" />
                      Take Profit (30%)
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                      size="sm"
                      onClick={() => closPositionMutation.mutate(position.id)}
                      disabled={closPositionMutation.isPending}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Close Position
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">No Active Positions</h3>
              <p className="text-gray-500">
                Your active trading positions will appear here when you have open trades.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
