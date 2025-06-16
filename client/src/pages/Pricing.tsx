import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const pricingPlans = [
  {
    id: "free",
    name: "Free Tier",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with crypto trading",
    features: [
      { name: "Basic Trading Dashboard", included: true },
      { name: "Real-time Market Data", included: true },
      { name: "Trading Performance Story", included: true },
      { name: "Social Sentiment Monitoring", included: true },
      { name: "Strategy Simulator", included: false },
      { name: "Portfolio Risk Dashboard", included: false },
      { name: "Advanced GS Quant Analytics", included: false },
      { name: "Real-time Trading Alerts", included: false },
      { name: "Institutional-grade Risk Management", included: false },
    ],
    icon: Zap,
    popular: false,
    priceId: null,
  },
  {
    id: "pro",
    name: "Pro Trader",
    price: "$15",
    period: "month",
    description: "Unlock institutional-grade trading capabilities",
    features: [
      { name: "Everything in Free", included: true },
      { name: "Strategy Simulator", included: true },
      { name: "Portfolio Risk Dashboard", included: true },
      { name: "Advanced GS Quant Analytics", included: true },
      { name: "Real-time Trading Alerts", included: true },
      { name: "Institutional-grade Risk Management", included: true },
      { name: "VaR & Stress Testing", included: true },
      { name: "Portfolio Optimization", included: true },
      { name: "Priority Support", included: true },
    ],
    icon: Crown,
    popular: true,
    priceId: "price_1234567890", // Replace with actual Stripe price ID
  },
];

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubscribe = async (priceId: string) => {
    if (!priceId) return;

    setLoading(priceId);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe failed to load");

      // Create checkout session
      const response = await apiRequest("POST", "/api/subscriptions/create-checkout-session", {
        priceId,
        userId: "demo-user", // In real app, get from auth context
      });

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription Error",
        description: error instanceof Error ? error.message : "Failed to start subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Choose Your Trading Edge
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            From free basic trading to institutional-grade analytics powered by Goldman Sachs GS Quant.
            Scale your trading with professional tools and AI-driven insights.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? "ring-2 ring-purple-500 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/50"
                    : "bg-slate-800/50 border-slate-700"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-400 ml-2">/{plan.period}</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features List */}
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included ? "text-gray-200" : "text-gray-500"
                          }`}
                        >
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <div className="pt-6">
                    {plan.id === "free" ? (
                      <Button
                        className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
                        size="lg"
                      >
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                        size="lg"
                        onClick={() => handleSubscribe(plan.priceId!)}
                        disabled={loading === plan.priceId}
                      >
                        {loading === plan.priceId ? "Processing..." : "Upgrade to Pro"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Upgrade to Pro?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Goldman Sachs GS Quant
              </h3>
              <p className="text-gray-400">
                Access institutional-grade quantitative finance tools including VaR calculation, 
                portfolio optimization, and stress testing used by Wall Street professionals.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Strategy Simulator
              </h3>
              <p className="text-gray-400">
                Backtest your trading strategies with historical data and AI-powered 
                simulations before risking real capital.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Advanced Risk Management
              </h3>
              <p className="text-gray-400">
                Professional portfolio risk dashboard with real-time monitoring, 
                correlation analysis, and automated risk alerts.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I cancel my Pro subscription anytime?
              </h3>
              <p className="text-gray-400">
                Yes, you can cancel your subscription at any time. You'll continue to have 
                access to Pro features until the end of your billing period.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-2">
                What makes the GS Quant integration special?
              </h3>
              <p className="text-gray-400">
                Our platform integrates Goldman Sachs' institutional-grade quantitative 
                finance toolkit, giving retail traders access to the same risk management 
                and portfolio optimization tools used by professional traders.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-2">
                Is my trading data secure?
              </h3>
              <p className="text-gray-400">
                Absolutely. We use enterprise-grade encryption and security measures. 
                Your trading data is never shared with third parties and is stored securely 
                in compliance with financial industry standards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}