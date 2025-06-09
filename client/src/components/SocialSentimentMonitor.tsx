import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Users, MessageCircle, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function SocialSentimentMonitor() {
  const { data: sentimentData = [] } = useQuery({
    queryKey: ['/api/sentiment'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Mock chart data - in production this would come from your API
  const chartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'PEPE',
        data: [12, 19, 3, 17, 28, 24, 31],
        borderColor: '#EAB308',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        tension: 0.4,
      },
      {
        label: 'BONK',
        data: [8, 14, 22, 19, 15, 29, 23],
        borderColor: '#A855F7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.4,
      },
      {
        label: 'SHIB',
        data: [15, 8, 12, 9, 6, 4, 8],
        borderColor: '#F97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#9CA3AF',
        },
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
        },
        grid: {
          color: '#374151',
        },
      },
    },
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSentimentBgColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-400';
    if (score >= 0.6) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Social Sentiment Monitor</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-gray-400">Live Feed Active</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Sentiment Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {sentimentData.length > 0 ? (
            sentimentData.map((token: any) => (
              <Card key={token.symbol} className="bg-slate-700 border-slate-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {token.symbol.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold">{token.symbol}</div>
                        <div className="text-xs text-gray-400">{token.symbol} Token</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${getSentimentColor(token.sentiment_score)}`}>
                        {token.sentiment_score.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400">Sentiment</div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Mentions (30min)</span>
                      <span className={token.mentions > 20 ? 'text-green-400' : 'text-gray-400'}>
                        {token.mentions}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Influencers</span>
                      <span className={token.influencer_count >= 5 ? 'text-yellow-400' : 'text-gray-400'}>
                        {token.influencer_count}/5
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Market Cap</span>
                      <span>{token.market_cap ? `$${(token.market_cap / 1000000).toFixed(1)}M` : 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <Progress 
                      value={token.sentiment_score * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Show empty state when no data
            <div className="col-span-full text-center py-8">
              <TrendingUp className="w-12 h-12 mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">No Sentiment Data</h3>
              <p className="text-gray-500">
                Waiting for social media monitoring to start collecting data...
              </p>
            </div>
          )}
        </div>

        {/* Social Volume Chart */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-lg">Social Volume Trends (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
