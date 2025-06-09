import { TradingHeader } from "@/components/TradingHeader";
import { TradingSidebar } from "@/components/TradingSidebar";
import { SocialSentimentMonitor } from "@/components/SocialSentimentMonitor";
import { ActivePositions } from "@/components/ActivePositions";
import { PortfolioChart } from "@/components/PortfolioChart";
import { TradingHistory } from "@/components/TradingHistory";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export default function Dashboard() {
  const { socket, isConnected } = useWebSocket();
  
  // Subscribe to real-time updates
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('subscribe', { userId: 1 }); // Default user ID
    }
  }, [socket, isConnected]);

  const { data: portfolio } = useQuery({
    queryKey: ['/api/portfolio/1'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: sentiment } = useQuery({
    queryKey: ['/api/sentiment'],
    refetchInterval: 60000, // Refetch every minute
  });

  return (
    <div className="min-h-screen bg-slate-900">
      <TradingHeader />
      
      <div className="flex">
        <TradingSidebar />
        
        <main className="flex-1 p-6 space-y-6">
          <SocialSentimentMonitor />
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ActivePositions />
            <PortfolioChart />
          </div>
          
          <TradingHistory />
        </main>
      </div>
    </div>
  );
}
