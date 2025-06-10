import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Circle, Play, Settings, Wallet, Brain, TrendingUp, Shield } from 'lucide-react';
import { Link } from 'wouter';

export default function GettingStarted() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (stepIndex: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepIndex) 
        ? prev.filter(i => i !== stepIndex)
        : [...prev, stepIndex]
    );
  };

  const steps = [
    {
      title: "Understand What This Platform Does",
      description: "This is an AI-powered meme coin trading bot that watches social media sentiment and makes automatic trades.",
      action: "Read this explanation",
      details: [
        "Monitors Twitter/X for crypto influencer sentiment",
        "Analyzes mentions of DOGE, SHIB, PEPE, FLOKI coins",
        "Makes buy/sell decisions based on social buzz",
        "Manages risk with stop-losses and position sizing"
      ]
    },
    {
      title: "Check Your Starting Balance",
      description: "You start with $10,000 in virtual money to practice trading.",
      action: "Go to Dashboard to see your portfolio",
      link: "/dashboard",
      details: [
        "Your balance shows in the Portfolio section",
        "Daily P&L shows today's gains/losses",
        "This is paper trading - no real money at risk"
      ]
    },
    {
      title: "Turn On Auto-Trading",
      description: "Enable the AI to start making trades for you automatically.",
      action: "Click 'Trading ON' button in Dashboard",
      link: "/dashboard",
      details: [
        "The AI will start monitoring social sentiment",
        "It will make trades when confidence is high",
        "You can turn it off anytime with Emergency Stop"
      ]
    },
    {
      title: "Watch the AI Work",
      description: "Monitor how the AI analyzes market sentiment and makes trading decisions.",
      action: "Check the 'Market Sentiment' tab",
      link: "/dashboard",
      details: [
        "See real-time sentiment scores for each coin",
        "Watch AI recommendations (BUY/SELL/HOLD)",
        "Track social media mentions and influencer activity"
      ]
    },
    {
      title: "Review Your Trades",
      description: "See what trades the AI made and how they performed.",
      action: "Check 'Positions' and 'Trade History' tabs",
      link: "/dashboard",
      details: [
        "Active positions show current open trades",
        "Trade history shows completed trades",
        "P&L shows profit/loss for each trade"
      ]
    },
    {
      title: "Try Manual Trading (Optional)",
      description: "Connect your crypto wallet to make real trades on decentralized exchanges.",
      action: "Go to Web3 Trading page",
      link: "/web3-trading",
      details: [
        "Connect MetaMask or other Web3 wallet",
        "Trade real cryptocurrencies on DEXs",
        "Use real money - higher risk but real profits"
      ]
    }
  ];

  const completionRate = (completedSteps.length / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Getting Started with AI Trading
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Your AI-powered meme coin trading bot is ready. Follow these steps to start making profitable trades.
          </p>
          
          <div className="flex justify-center items-center space-x-4">
            <div className="text-2xl font-bold text-blue-400">
              {completedSteps.length}/{steps.length} Complete
            </div>
            <div className="w-32 bg-slate-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        <Alert className="bg-blue-500/10 border-blue-500/50">
          <Brain className="h-4 w-4" />
          <AlertDescription className="text-blue-200">
            <strong>Important:</strong> This platform uses AI to automatically trade meme coins based on social media sentiment. 
            Start with paper trading (virtual money) to learn how it works before risking real funds.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => toggleStep(index)}
                      className="mt-1 text-2xl"
                    >
                      {completedSteps.includes(index) ? (
                        <CheckCircle className="h-6 w-6 text-green-400" />
                      ) : (
                        <Circle className="h-6 w-6 text-slate-400" />
                      )}
                    </button>
                    <div>
                      <CardTitle className="text-lg">
                        Step {index + 1}: {step.title}
                      </CardTitle>
                      <CardDescription className="text-slate-300 mt-1">
                        {step.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-4">
                    {completedSteps.includes(index) ? 'Done' : 'Pending'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {step.details.map((detail, i) => (
                      <li key={i}>{detail}</li>
                    ))}
                  </ul>
                  
                  <div className="flex items-center space-x-3">
                    {step.link ? (
                      <Link href={step.link}>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Play className="w-4 h-4 mr-2" />
                          {step.action}
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        variant="outline"
                        onClick={() => toggleStep(index)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {step.action}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
              Quick Start Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-400 mb-2">What Happens When You Turn On Auto-Trading:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>AI monitors Twitter for meme coin sentiment</li>
                  <li>When sentiment is very positive/negative, it trades</li>
                  <li>Risk management keeps losses small</li>
                  <li>You can stop anytime with Emergency Stop</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-400 mb-2">Safety Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>Starts with virtual $10,000 (no real money)</li>
                  <li>Stop-loss limits on every trade</li>
                  <li>Position size limits prevent big losses</li>
                  <li>Emergency stop closes all positions instantly</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold">Ready to Start Trading?</h3>
          <div className="flex justify-center space-x-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Play className="w-5 h-5 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/web3-trading">
              <Button size="lg" variant="outline">
                <Wallet className="w-5 h-5 mr-2" />
                Web3 Trading
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}