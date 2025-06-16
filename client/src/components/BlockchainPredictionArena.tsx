import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Shield, 
  ExternalLink, 
  Trophy, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Coins,
  Lock
} from 'lucide-react';

interface BlockchainPrediction {
  id: string;
  agentName: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  targetPrice?: number;
  timeframe: string;
  reasoning: string;
  timestamp: number;
  expiryTimestamp: number;
  ipfsHash?: string;
  blockchainTxHash?: string;
  status: 'PENDING' | 'RESOLVED' | 'EXPIRED';
  outcome?: 'WIN' | 'LOSS';
  actualPrice?: number;
}

interface BettingContract {
  contractAddress: string;
  predictionId: string;
  creator: string;
  betAmount: string;
  odds: number;
  totalPool: string;
  participants: string[];
  resolved: boolean;
  winner?: string;
}

export default function BlockchainPredictionArena() {
  const [predictions, setPredictions] = useState<BlockchainPrediction[]>([]);
  const [activeBets, setActiveBets] = useState<BettingContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [userWallet, setUserWallet] = useState<string>('');
  const [betAmount, setBetAmount] = useState<string>('0.1');
  const { toast } = useToast();

  useEffect(() => {
    loadVerifiedPredictions();
    loadActiveBets();
    // Simulate wallet connection for demo
    setUserWallet('0x742d35cc6634C0532925a3b8D4f87C73f6e6c6e1');
  }, []);

  const loadVerifiedPredictions = async () => {
    try {
      const response = await apiRequest('GET', '/api/blockchain/predictions/verified');
      const data = await response.json();
      setPredictions(data.predictions || []);
    } catch (error) {
      console.error('Failed to load verified predictions:', error);
    }
  };

  const loadActiveBets = async () => {
    try {
      const response = await apiRequest('GET', '/api/blockchain/betting/active');
      const data = await response.json();
      setActiveBets(data.activeBets || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load active bets:', error);
      setLoading(false);
    }
  };

  const createBlockchainPrediction = async (predictionData: any) => {
    try {
      const response = await apiRequest('POST', '/api/blockchain/predictions/create', predictionData);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Prediction Created on Blockchain",
          description: `IPFS: ${data.prediction.ipfsHash?.substring(0, 20)}...`,
        });
        loadVerifiedPredictions();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create blockchain prediction",
        variant: "destructive",
      });
    }
  };

  const createBettingContract = async (predictionId: string) => {
    try {
      const response = await apiRequest('POST', '/api/blockchain/betting/create', {
        predictionId,
        creatorAddress: userWallet,
        betAmount: (parseFloat(betAmount) * 1e18).toString() // Convert to wei
      });
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Betting Contract Created",
          description: `Contract: ${data.contractAddress.substring(0, 20)}...`,
        });
        loadActiveBets();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create betting contract",
        variant: "destructive",
      });
    }
  };

  const joinBet = async (predictionId: string, supportsPrediction: boolean) => {
    try {
      const response = await apiRequest('POST', '/api/blockchain/betting/join', {
        predictionId,
        userAddress: userWallet,
        betAmount: (parseFloat(betAmount) * 1e18).toString(),
        supportsPrediction
      });
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Bet Placed Successfully",
          description: `${betAmount} ETH bet ${supportsPrediction ? 'supporting' : 'against'} prediction`,
        });
        loadActiveBets();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join bet",
        variant: "destructive",
      });
    }
  };

  const getVerificationProof = async (predictionId: string) => {
    try {
      const response = await apiRequest('GET', `/api/blockchain/predictions/${predictionId}/proof`);
      const proof = await response.json();
      
      if (proof.verificationUrl) {
        window.open(proof.verificationUrl, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get verification proof",
        variant: "destructive",
      });
    }
  };

  const formatTimeRemaining = (expiryTimestamp: number): string => {
    const remaining = expiryTimestamp - Date.now();
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Blockchain Prediction Arena
          </h1>
        </div>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Immutable predictions stored on blockchain with IPFS. Peer-to-peer betting with smart contracts.
          <br />
          No platform-held funds - direct user-to-user settlements.
        </p>
      </div>

      {/* Wallet Status */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm">Connected Wallet:</span>
              <code className="text-xs bg-slate-800 px-2 py-1 rounded">
                {userWallet.substring(0, 20)}...
              </code>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="betAmount">Bet Amount (ETH):</Label>
              <Input
                id="betAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-24"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="predictions">
            <Shield className="w-4 h-4 mr-2" />
            Verified Predictions
          </TabsTrigger>
          <TabsTrigger value="betting">
            <Trophy className="w-4 h-4 mr-2" />
            Active Betting
          </TabsTrigger>
          <TabsTrigger value="create">
            <TrendingUp className="w-4 h-4 mr-2" />
            Create Prediction
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4">
            {predictions.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-8 text-center">
                  <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">No verified predictions yet</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Predictions will appear here once stored on blockchain
                  </p>
                </CardContent>
              </Card>
            ) : (
              predictions.map((prediction) => (
                <Card key={prediction.id} className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <span>{prediction.agentName}</span>
                        <Badge variant={prediction.action === 'BUY' ? 'default' : prediction.action === 'SELL' ? 'destructive' : 'secondary'}>
                          {prediction.action}
                        </Badge>
                        <Badge variant="outline">{prediction.symbol}</Badge>
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        {prediction.blockchainTxHash && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => getVerificationProof(prediction.id)}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                        )}
                        <Badge 
                          variant={prediction.status === 'RESOLVED' ? 'default' : 'secondary'}
                        >
                          {prediction.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs text-slate-400">Confidence</Label>
                          <div className="flex items-center space-x-2">
                            <div className="w-full bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${prediction.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-sm">{Math.round(prediction.confidence * 100)}%</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-400">Target Price</Label>
                          <p className="text-sm font-mono">
                            {prediction.targetPrice ? `$${prediction.targetPrice.toFixed(4)}` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-400">Timeframe</Label>
                          <p className="text-sm">{prediction.timeframe}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-400">Time Remaining</Label>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span className="text-sm">{formatTimeRemaining(prediction.expiryTimestamp)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-slate-400">Reasoning</Label>
                        <p className="text-sm text-slate-300 mt-1">{prediction.reasoning}</p>
                      </div>

                      {prediction.status === 'RESOLVED' && (
                        <div className="grid grid-cols-2 gap-4 p-3 bg-slate-800 rounded-lg">
                          <div>
                            <Label className="text-xs text-slate-400">Outcome</Label>
                            <div className="flex items-center space-x-2">
                              {prediction.outcome === 'WIN' ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                              <span className={`text-sm font-semibold ${
                                prediction.outcome === 'WIN' ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {prediction.outcome}
                              </span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400">Actual Price</Label>
                            <p className="text-sm font-mono">
                              {prediction.actualPrice ? `$${prediction.actualPrice.toFixed(4)}` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      )}

                      {prediction.status === 'PENDING' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => createBettingContract(prediction.id)}
                          >
                            <Coins className="w-4 h-4 mr-1" />
                            Create Bet
                          </Button>
                        </div>
                      )}

                      {prediction.blockchainTxHash && (
                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                          <Lock className="w-3 h-3" />
                          <span>Blockchain verified:</span>
                          <code className="bg-slate-800 px-1 rounded">
                            {prediction.blockchainTxHash.substring(0, 20)}...
                          </code>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="betting" className="space-y-4">
          <div className="grid gap-4">
            {activeBets.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-8 text-center">
                  <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">No active betting contracts</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Create a bet on any verified prediction to start
                  </p>
                </CardContent>
              </Card>
            ) : (
              activeBets.map((bet) => {
                const prediction = predictions.find(p => p.id === bet.predictionId);
                return (
                  <Card key={bet.contractAddress} className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Trophy className="w-5 h-5 text-yellow-500" />
                          <span>Betting Contract</span>
                        </div>
                        <Badge variant="outline">
                          {bet.participants.length} participants
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {prediction && (
                          <div className="p-3 bg-slate-800 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant={prediction.action === 'BUY' ? 'default' : prediction.action === 'SELL' ? 'destructive' : 'secondary'}>
                                {prediction.action}
                              </Badge>
                              <Badge variant="outline">{prediction.symbol}</Badge>
                              <span className="text-sm text-slate-400">by {prediction.agentName}</span>
                            </div>
                            <p className="text-sm text-slate-300">{prediction.reasoning}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs text-slate-400">Total Pool</Label>
                            <p className="text-lg font-bold">
                              {(parseFloat(bet.totalPool) / 1e18).toFixed(4)} ETH
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400">Current Odds</Label>
                            <p className="text-lg font-bold">{bet.odds.toFixed(2)}x</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400">Participants</Label>
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span className="text-lg font-bold">{bet.participants.length}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => joinBet(bet.predictionId, true)}
                            className="flex-1"
                          >
                            Bet FOR ({betAmount} ETH)
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => joinBet(bet.predictionId, false)}
                            className="flex-1"
                          >
                            Bet AGAINST ({betAmount} ETH)
                          </Button>
                        </div>

                        <div className="text-xs text-slate-400">
                          <div className="flex items-center space-x-1">
                            <Lock className="w-3 h-3" />
                            <span>Contract:</span>
                            <code className="bg-slate-800 px-1 rounded">
                              {bet.contractAddress.substring(0, 20)}...
                            </code>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle>Create Blockchain Prediction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Agent Name</Label>
                    <Input placeholder="Warren Buffett" />
                  </div>
                  <div>
                    <Label>Symbol</Label>
                    <Input placeholder="BTC" />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Action</Label>
                    <select className="w-full p-2 bg-slate-800 border border-slate-700 rounded">
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                      <option value="HOLD">HOLD</option>
                    </select>
                  </div>
                  <div>
                    <Label>Target Price</Label>
                    <Input type="number" step="0.0001" placeholder="65000" />
                  </div>
                  <div>
                    <Label>Timeframe</Label>
                    <select className="w-full p-2 bg-slate-800 border border-slate-700 rounded">
                      <option value="1h">1 Hour</option>
                      <option value="24h">24 Hours</option>
                      <option value="7d">7 Days</option>
                      <option value="30d">30 Days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Reasoning</Label>
                  <textarea 
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded h-24"
                    placeholder="Technical analysis shows..."
                  />
                </div>

                <Button className="w-full">
                  <Shield className="w-4 h-4 mr-2" />
                  Create Blockchain Prediction
                </Button>

                <div className="text-xs text-slate-400 space-y-1">
                  <p>• Prediction will be stored immutably on IPFS</p>
                  <p>• Blockchain hash provides timestamped proof</p>
                  <p>• Cannot be altered after creation</p>
                  <p>• Available for peer-to-peer betting</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}