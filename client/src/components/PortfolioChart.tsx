import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line } from "react-chartjs-2";
import { useQuery } from "@tanstack/react-query";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function PortfolioChart() {
  const { data: portfolio } = useQuery({
    queryKey: ['/api/portfolio/1'],
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['/api/trades/1'],
    select: (data) => (data || []).slice(0, 20), // Last 20 trades for stats
  });

  // Calculate stats from trades
  const winRate = trades.length > 0 
    ? (trades.filter((trade: any) => parseFloat(trade.pnl || '0') > 0).length / trades.length * 100).toFixed(0)
    : '0';

  const avgHoldTime = trades.length > 0
    ? '2.4h' // This would be calculated from actual trade data
    : '0h';

  const totalReturn = portfolio
    ? ((parseFloat(portfolio.dailyPnL || '0') / parseFloat(portfolio.totalValue || '1')) * 100).toFixed(1)
    : '0.0';

  // Mock portfolio performance data - in production this would come from your API
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Portfolio Value',
        data: [2000, 1850, 2200, 2100, 2300, 2150, parseFloat(portfolio?.totalValue || '2000')],
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9CA3AF',
        },
        grid: {
          color: '#374151',
        },
      },
      y: {
        ticks: {
          color: '#9CA3AF',
          callback: function(value: any) {
            return '$' + value;
          },
        },
        grid: {
          color: '#374151',
        },
      },
    },
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Portfolio Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 mb-6">
          <Line data={chartData} options={chartOptions} />
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-700">
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              parseFloat(totalReturn) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {parseFloat(totalReturn) >= 0 ? '+' : ''}{totalReturn}%
            </div>
            <div className="text-sm text-gray-400">Total Return</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{winRate}%</div>
            <div className="text-sm text-gray-400">Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{avgHoldTime}</div>
            <div className="text-sm text-gray-400">Avg Hold Time</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
