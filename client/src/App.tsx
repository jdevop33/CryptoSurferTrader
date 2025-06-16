import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { Navigation } from "@/components/Navigation";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import GettingStarted from "@/pages/GettingStarted";
import AIInsights from "@/pages/AI-Insights";
import Deploy from "@/pages/Deploy";
import Web3Trading from "@/pages/Web3Trading";
import GSQuant from "@/pages/GSQuant";
import PerformanceStory from "@/pages/PerformanceStory";
import Pricing from "@/pages/Pricing";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import MarketSentiment from "@/pages/MarketSentiment";
import NotFound from "@/pages/not-found";
import { NotificationSystem } from "@/components/NotificationSystem";

function Router() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/getting-started" component={GettingStarted} />
        <Route path="/ai-insights" component={AIInsights} />
        <Route path="/gs-quant" component={GSQuant} />
        <Route path="/performance-story" component={PerformanceStory} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/deploy" component={Deploy} />
        <Route path="/web3-trading" component={Web3Trading} />
        <Route path="/market-sentiment" component={MarketSentiment} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="text-gray-100">
            <Router />
            <NotificationSystem />
            <Toaster />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
