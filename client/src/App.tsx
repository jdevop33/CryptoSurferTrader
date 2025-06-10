import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import Dashboard from "@/pages/Dashboard";
import GettingStarted from "@/pages/GettingStarted";
import AIInsights from "@/pages/AI-Insights";
import Deploy from "@/pages/Deploy";
import Web3Trading from "@/pages/Web3Trading";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/not-found";
import { NotificationSystem } from "@/components/NotificationSystem";

function Router() {
  return (
    <Switch>
      <Route path="/" component={GettingStarted} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/ai-insights" component={AIInsights} />
      <Route path="/deploy" component={Deploy} />
      <Route path="/web3-trading" component={Web3Trading} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-slate-900 text-gray-100">
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
