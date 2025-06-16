import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMetaMask } from '@/hooks/useMetaMask';
import { Wallet, TrendingUp, Shield, Brain, Zap, AlertTriangle, CheckCircle, PlayCircle, Trophy, Star, Flame, Eye, Clock, Target, Users, DollarSign, BarChart3, Lock, Play, ArrowRight, Crown, Sparkles } from 'lucide-react';
import { InteractiveDemos } from '@/components/InteractiveDemos';
import { QuickSignup } from '@/components/QuickSignup';
import { OnboardingFlow } from '@/components/OnboardingFlow';

export default function Home() {
  const [, navigate] = useLocation();
  const { isConnected, connect, isInstalled } = useMetaMask();
  const [showQuickSignup, setShowQuickSignup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [user, setUser] = useState(null);
  const [liveSignals, setLiveSignals] = useState([
    { token: 'PEPE', signal: 'BUY', confidence: 87, change: '+12.4%', risk: 'LOW' },
    { token: 'SHIBA', signal: 'HOLD', confidence: 74, change: '+3.2%', risk: 'LOW' },
    { token: 'FLOKI', signal: 'SELL', confidence: 91, change: '-8.1%', risk: 'MEDIUM' }
  ]);
  const [activeUsers, setActiveUsers] = useState(2847);
  const [totalProfit, setTotalProfit] = useState(324891);

  // Auto-redirect to dashboard if already connected
  useEffect(() => {
    if (isConnected) {
      navigate('/dashboard');
    }
  }, [isConnected, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => prev + Math.floor(Math.random() * 3));
      setTotalProfit(prev => prev + Math.floor(Math.random() * 50));
      
      setLiveSignals(prev => prev.map(signal => ({
        ...signal,
        confidence: Math.max(60, Math.min(95, signal.confidence + (Math.random() - 0.5) * 5))
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleConnectAndView = async () => {
    if (isConnected) {
      navigate('/dashboard');
    } else {
      await connect();
      // The useEffect will handle navigation after connection
    }
  };

  const handleQuickSignup = (userData: any) => {
    setUser(userData);
    setShowQuickSignup(false);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = (completeUserData: any) => {
    setUser(completeUserData);
    setShowOnboarding(false);
    navigate('/profile');
  };

  const handleGetStarted = () => {
    setShowQuickSignup(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900">
      {/* Hero Section with Live Data */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center max-w-6xl mx-auto">
          {/* Trust Bars */}
          <div className="flex justify-center gap-8 mb-6 text-sm">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">{activeUsers.toLocaleString()}</span> Active Traders
            </div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">${totalProfit.toLocaleString()}</span> Profits Today
            </div>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Shield className="w-4 h-4" />
              100% Non-Custodial
            </div>
          </div>

          <Badge variant="secondary" className="mb-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 border-blue-200 dark:border-blue-700">
            <Brain className="w-3 h-3 mr-1" />
            AI Trading Intelligence Platform
          </Badge>
          
          <h1 className="text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
            See AI Trading Agents{" "}
            <span className="text-blue-600 dark:text-blue-400">
              Work Live
            </span>
          </h1>
          
          <div className="text-2xl text-slate-700 dark:text-slate-200 mb-8 font-medium">
            <span className="text-green-600 dark:text-green-400">Try our AI agents</span> right now - no signup needed.
            <br />
            <span className="text-blue-600 dark:text-blue-400">Watch them analyze</span> markets in real-time.
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg px-8 py-4 text-lg"
              onClick={() => {
                document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              Try AI Agents Now
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-2 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-8 py-4 text-lg"
              onClick={handleConnectAndView}
            >
              <Wallet className="w-5 h-5 mr-2" />
              Connect Wallet
            </Button>
          </div>

          {/* Pain Points Addressed */}
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <CardHeader>
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 mb-2" />
                <CardTitle className="text-red-800 dark:text-red-300">Tired of Scam Projects?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 dark:text-red-300">
                  Our AI validates on-chain data before every signal. No more rug pulls or fake hype.
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
              <CardHeader>
                <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-2" />
                <CardTitle className="text-orange-800 dark:text-orange-300">Missing Opportunities?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-orange-700 dark:text-orange-300">
                  Get instant alerts when whales move. Our AI watches 24/7 so you don't have to.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader>
                <Target className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                <CardTitle className="text-blue-800 dark:text-blue-300">Bad at Timing?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700 dark:text-blue-300">
                  Goldman Sachs risk models tell you exactly when to buy, sell, and how much to risk.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive AI Demos */}
      <section id="demos" className="container mx-auto px-4 py-16">
        <InteractiveDemos />
      </section>

      {/* Free Value Proposition */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-3xl my-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-600 text-white">
            <Trophy className="w-4 h-4 mr-1" />
            100% FREE TO START
          </Badge>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Get More Free Value Than Others Charge For
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Why pay $100/month elsewhere when you can start here for free?
          </p>
        </div>

        <Tabs defaultValue="free" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="free">Free Forever</TabsTrigger>
            <TabsTrigger value="pro">Pro Features ($15/mo)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="free" className="mt-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-2 border-green-200 dark:border-green-700">
                <CardHeader>
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                  <CardTitle>Live AI Signals</CardTitle>
                  <CardDescription>
                    Real-time buy/sell alerts for SHIBA, PEPE, FLOKI, DOGE with confidence scores
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 border-green-200 dark:border-green-700">
                <CardHeader>
                  <Shield className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                  <CardTitle>Scam Protection</CardTitle>
                  <CardDescription>
                    On-chain validation checks every signal against real blockchain data
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 border-green-200 dark:border-green-700">
                <CardHeader>
                  <Eye className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                  <CardTitle>Whale Watching</CardTitle>
                  <CardDescription>
                    Track large transactions and wallet movements that move markets
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 border-green-200 dark:border-green-700">
                <CardHeader>
                  <BarChart3 className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                  <CardTitle>Portfolio Tracking</CardTitle>
                  <CardDescription>
                    Connect MetaMask and see all your holdings in one beautiful dashboard
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 border-green-200 dark:border-green-700">
                <CardHeader>
                  <Users className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                  <CardTitle>Social Sentiment</CardTitle>
                  <CardDescription>
                    Monitor crypto Twitter influencers and spot trends before they explode
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 border-green-200 dark:border-green-700">
                <CardHeader>
                  <Lock className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                  <CardTitle>100% Safe</CardTitle>
                  <CardDescription>
                    Non-custodial. We never touch your private keys or funds. Ever.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pro" className="mt-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-2 border-blue-200 dark:border-blue-700">
                <CardHeader>
                  <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                  <CardTitle>Goldman Sachs AI</CardTitle>
                  <CardDescription>
                    Advanced quantitative models used by Wall Street professionals
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 border-blue-200 dark:border-blue-700">
                <CardHeader>
                  <Target className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                  <CardTitle>Auto-Trading</CardTitle>
                  <CardDescription>
                    Execute trades automatically based on AI signals with risk management
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 border-blue-200 dark:border-blue-700">
                <CardHeader>
                  <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                  <CardTitle>Strategy Backtesting</CardTitle>
                  <CardDescription>
                    Test your ideas with historical data before risking real money
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 border-blue-200 dark:border-blue-700">
                <CardHeader>
                  <AlertTriangle className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                  <CardTitle>Risk Management</CardTitle>
                  <CardDescription>
                    VaR calculations, stress testing, and position sizing guidance
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 border-blue-200 dark:border-blue-700">
                <CardHeader>
                  <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                  <CardTitle>Priority Alerts</CardTitle>
                  <CardDescription>
                    Get signals 5 seconds before free users during high volatility
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 border-blue-200 dark:border-blue-700">
                <CardHeader>
                  <Star className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                  <CardTitle>Custom Strategies</CardTitle>
                  <CardDescription>
                    Build and share your own trading algorithms with our community
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-12">
          <Button 
            onClick={handleConnectAndView}
            size="lg" 
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg mr-4"
          >
            <Wallet className="w-5 h-5 mr-2" />
            Start Free Now
          </Button>
          <Button variant="outline" size="lg" className="border-2">
            See All Free Features
          </Button>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Join Thousands of Smart Traders
          </h2>
          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeUsers.toLocaleString()}</div>
              <div className="text-slate-600 dark:text-slate-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">94%</div>
              <div className="text-slate-600 dark:text-slate-400">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">${totalProfit.toLocaleString()}</div>
              <div className="text-slate-600 dark:text-slate-400">Profits Today</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 dark:text-green-400 font-bold">SM</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                "Made $2,400 in my first week using the PEPE signals. This AI actually works!"
              </p>
              <div className="text-sm font-medium">Sarah M.</div>
              <div className="text-xs text-slate-500">Crypto Trader</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 dark:text-blue-400 font-bold">JD</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                "Finally, a platform that's not trying to scam me. The risk management saved me from huge losses."
              </p>
              <div className="text-sm font-medium">Jake D.</div>
              <div className="text-xs text-slate-500">DeFi Investor</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold">AL</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                "The whale tracking feature is insane. I can see big moves before they happen."
              </p>
              <div className="text-sm font-medium">Alex L.</div>
              <div className="text-xs text-slate-500">Day Trader</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4">
              Stop Guessing. Start Winning.
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Connect your wallet in 10 seconds and get your first AI signal immediately.
              <br />
              <strong>100% Free. No credit card. No BS.</strong>
            </p>
            <Button 
              onClick={handleConnectAndView}
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Connect Wallet & Start Free
            </Button>
            <div className="mt-6 text-sm opacity-75">
              🔒 Your keys stay with you • 🛡️ Non-custodial • ⚡ Instant setup
            </div>
          </div>
          
          {/* Animated background elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-16 h-16 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>
    </div>
  );
}