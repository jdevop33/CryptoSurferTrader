import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Rocket, User } from "lucide-react";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useQuery } from "@tanstack/react-query";

export function TradingHeader() {
  const { isConnected, account, connect } = useMetaMask();
  
  const { data: portfolio } = useQuery({
    queryKey: ['/api/portfolio/1'],
  });

  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-full px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Rocket className="text-primary text-2xl" />
              <h1 className="text-xl font-bold text-white">MemeTrader Pro</h1>
            </div>
            <div className="hidden md:flex items-center space-x-1 bg-slate-700 rounded-lg p-1">
              <Button variant="secondary" size="sm" className="bg-primary text-white">
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                Strategies
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                History
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* MetaMask Connection Status */}
            <div className="flex items-center space-x-2 bg-slate-700 px-3 py-2 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {isConnected ? 'MetaMask Connected' : 'MetaMask Disconnected'}
              </span>
              {!isConnected && (
                <Button size="sm" variant="outline" onClick={connect}>
                  Connect
                </Button>
              )}
            </div>
            
            {/* Portfolio Value */}
            <div className="text-right">
              <div className="text-sm text-gray-400">Total Portfolio</div>
              <div className="text-lg font-bold text-green-400">
                ${portfolio?.totalValue || '0.00'}
              </div>
            </div>
            
            {/* Profile Menu */}
            <Avatar className="w-10 h-10 bg-primary">
              <AvatarFallback>
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
