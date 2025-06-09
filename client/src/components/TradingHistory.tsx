import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function TradingHistory() {
  const { data: trades = [] } = useQuery({
    queryKey: ['/api/trades/1'],
    select: (data) => (data || []).slice(0, 10), // Show latest 10 trades
  });

  const getPnLColor = (pnl: string) => {
    const value = parseFloat(pnl || '0');
    return value >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getTypeColor = (type: string, pnl: string) => {
    const value = parseFloat(pnl || '0');
    if (type.toLowerCase() === 'buy') {
      return 'bg-green-900 text-green-400';
    } else {
      return value >= 0 ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTriggerDescription = (trigger: string) => {
    switch (trigger) {
      case 'social_sentiment':
        return 'Social sentiment';
      case 'stop_loss':
        return 'Stop Loss';
      case 'take_profit':
        return 'Take Profit';
      case 'manual':
        return 'Manual';
      default:
        return trigger || 'Unknown';
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Recent Trades</CardTitle>
          <div className="flex space-x-2">
            <Button variant="secondary" size="sm" className="bg-slate-700 hover:bg-slate-600">
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Eye className="w-4 h-4 mr-1" />
              View All
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {trades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-slate-700">
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Pair</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Entry</th>
                  <th className="pb-3">Exit</th>
                  <th className="pb-3">Size</th>
                  <th className="pb-3">P&L</th>
                  <th className="pb-3">Trigger</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {trades.map((trade: any) => (
                  <tr key={trade.id} className="border-b border-slate-700">
                    <td className="py-3 text-gray-400">
                      {formatTime(trade.executedAt)}
                    </td>
                    <td className="py-3 font-medium">{trade.symbol}</td>
                    <td className="py-3">
                      <Badge className={`text-xs ${getTypeColor(trade.type, trade.pnl)}`}>
                        {trade.type.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3">${trade.entryPrice}</td>
                    <td className="py-3">
                      {trade.exitPrice ? `$${trade.exitPrice}` : '-'}
                    </td>
                    <td className="py-3">${trade.size}</td>
                    <td className={`py-3 font-bold ${getPnLColor(trade.pnl)}`}>
                      {parseFloat(trade.pnl || '0') >= 0 ? '+' : ''}${trade.pnl || '0.00'}
                    </td>
                    <td className="py-3 text-xs text-gray-400">
                      {getTriggerDescription(trade.trigger)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No Trading History</h3>
            <p className="text-gray-500">
              Your completed trades will appear here once you start trading.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
