import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMetaMask } from '@/hooks/useMetaMask';
import { Wallet, TrendingUp, Shield, Brain, Zap } from 'lucide-react';

export default function Home() {
  const [, navigate] = useLocation();
  const { isConnected, connect, isInstalled } = useMetaMask();

  // Auto-redirect to dashboard if already connected
  useEffect(() => {
    if (isConnected) {
      navigate('/dashboard');
    }
  }, [isConnected, navigate]);

  const handleConnectAndView = async () => {
    if (isConnected) {
      navigate('/dashboard');
    } else {
      await connect();
      // The useEffect will handle navigation after connection
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              8Trader8Panda
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 font-light">
              AI-Powered Cryptocurrency Trading Platform
            </p>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Connect your wallet and start trading with institutional-grade AI insights, 
              real-time market analysis, and automated risk management.
            </p>
          </div>

          {/* One-Click Connect Button */}
          <div className="space-y-4">
            <Button
              onClick={handleConnectAndView}
              size="lg"
              className="text-xl px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300"
            >
              <Wallet className="w-6 h-6 mr-3" />
              {isConnected ? 'View Your Dashboard' : 'Connect Wallet & View Dashboard'}
            </Button>
            
            {!isInstalled && (
              <p className="text-sm text-slate-400">
                Don't have MetaMask? We'll help you install it.
              </p>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="flex justify-center items-center space-x-8 text-slate-400 text-sm">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Real-time Trading</span>
            </div>
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>AI-Powered</span>
            </div>
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-6xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold">Smart Trading Signals</h3>
              <p className="text-slate-400 text-sm">
                AI analyzes market sentiment and social media to generate high-confidence trading signals
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold">Risk Management</h3>
              <p className="text-slate-400 text-sm">
                Professional portfolio risk analysis with Goldman Sachs quantitative models
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto">
                <Brain className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold">Market Intelligence</h3>
              <p className="text-slate-400 text-sm">
                Real-time sentiment analysis from social media and institutional-grade market data
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-slate-500 text-sm">
          <p>Trusted by traders worldwide • Professional-grade tools • Start trading in seconds</p>
        </div>
      </div>
    </div>
  );
}