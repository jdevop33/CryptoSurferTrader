import OnChainValidatedSignals from "@/components/OnChainValidatedSignals";
import WebhookManager from "@/components/WebhookManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Activity, TrendingUp, Database } from "lucide-react";

export default function OnChainSignals() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">On-Chain Signal Validator</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Enhanced trading signals validated with authentic blockchain transaction data from CryptoAPIs.io. 
          Our AI combines social sentiment analysis with real on-chain activity to provide more reliable trading insights.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-800">Authentic Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700">
              Real blockchain transaction data from CryptoAPIs.io validates social media sentiment spikes 
              with actual on-chain activity.
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg text-green-800">Whale Detection</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700">
              Advanced whale activity analysis identifies large transactions and holder patterns 
              to validate market sentiment shifts.
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg text-purple-800">Enhanced Confidence</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-700">
              AI confidence scores are dynamically adjusted based on on-chain validation, 
              providing more accurate signal strength assessment.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Validation Methodology
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">On-Chain Metrics</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Token holder count and growth</li>
                <li>• 24-hour transaction volume</li>
                <li>• Whale activity (large transactions)</li>
                <li>• Transaction frequency patterns</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Validation Levels</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200">STRONG</Badge>
                  <span className="text-sm">30+ transactions, 2+ whales, $1000+ volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">MODERATE</Badge>
                  <span className="text-sm">20+ transactions, 1+ whale, $500+ volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">WEAK</Badge>
                  <span className="text-sm">10+ transactions, $100+ volume</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Component */}
      <OnChainValidatedSignals />

      {/* Real-Time Event Monitor */}
      <WebhookManager />

      {/* Technical Note */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> On-chain validation requires CRYPTOAPIS_API_KEY environment variable.
              Contact your administrator to configure API access for authentic blockchain data.
            </p>
            <p className="text-xs text-gray-500">
              Supported networks: Ethereum, Polygon, Binance Smart Chain, Avalanche
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}