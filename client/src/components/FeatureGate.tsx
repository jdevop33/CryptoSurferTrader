import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";
import { Link } from "wouter";

interface FeatureGateProps {
  feature: 'strategySimulator' | 'portfolioRiskDashboard' | 'advancedAnalytics' | 'realTimeAlerts' | 'marketIntelligence';
  children: ReactNode;
  tier?: 'FREE' | 'PRO';
  fallback?: ReactNode;
}

const featureInfo = {
  strategySimulator: {
    title: "Strategy Simulator",
    description: "Backtest your trading strategies with historical data and AI-powered simulations",
    icon: "📊"
  },
  portfolioRiskDashboard: {
    title: "Portfolio Risk Dashboard",
    description: "Professional risk management with VaR calculations and correlation analysis",
    icon: "⚠️"
  },
  advancedAnalytics: {
    title: "Advanced GS Quant Analytics",
    description: "Institutional-grade quantitative finance tools from Goldman Sachs",
    icon: "📈"
  },
  realTimeAlerts: {
    title: "Real-time Trading Alerts",
    description: "Get instant notifications for market opportunities and risk events",
    icon: "🔔"
  },
  marketIntelligence: {
    title: "NicheSignal AI Market Intelligence",
    description: "Discover emerging crypto communities and predict market sentiment with Qwen AI models",
    icon: "🧠"
  }
};

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { features, isPro, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // If user has access to this feature, render children
  if (features[feature]) {
    return <>{children}</>;
  }

  // If fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  const info = featureInfo[feature];
  
  return (
    <Card className="bg-slate-800/50 border-slate-700 mx-auto max-w-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
          <Lock className="h-8 w-8 text-purple-400" />
        </div>
        <CardTitle className="text-xl text-white flex items-center justify-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          {info.title} - Pro Feature
        </CardTitle>
        <CardDescription className="text-gray-400">
          {info.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
          <h4 className="text-white font-medium mb-2">Unlock with Pro Subscription</h4>
          <p className="text-sm text-gray-400 mb-4">
            Get access to institutional-grade trading tools and advanced analytics
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
            <span>✓ Goldman Sachs GS Quant Integration</span>
            <span>•</span>
            <span>✓ Advanced Risk Management</span>
            <span>•</span>
            <span>✓ Strategy Backtesting</span>
          </div>
        </div>
        
        <Link href="/pricing">
          <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Pro - $15/month
          </Button>
        </Link>
        
        <p className="text-xs text-gray-500">
          Cancel anytime • 30-day money-back guarantee
        </p>
      </CardContent>
    </Card>
  );
}

// Convenience wrapper for Pro-only sections
export function ProFeature({ children, feature }: { children: ReactNode; feature: FeatureGateProps['feature'] }) {
  return (
    <FeatureGate feature={feature}>
      {children}
    </FeatureGate>
  );
}