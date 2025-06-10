import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, ArrowRightLeft, TrendingUp, Activity, ExternalLink } from 'lucide-react';

interface TokenData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance?: string;
  price?: number;
  logo?: string;
}

interface SwapQuote {
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  gasEstimate: string;
  route: string[];
}

export default function Web3Trading() {
  const [walletAddress, setWalletAddress] = useState('');
  const [tokenIn, setTokenIn] = useState('');
  const [tokenOut, setTokenOut] = useState('');
  const [amountIn, setAmountIn] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState('');
  const queryClient = useQueryClient();

  // Fetch Alchemy service status
  const { data: alchemyStatus } = useQuery({
    queryKey: ['/api/alchemy/status'],
    refetchInterval: 30000
  });

  // Fetch wallet token balances
  const { data: tokenBalances, isLoading: balancesLoading } = useQuery({
    queryKey: ['/api/alchemy/wallet', walletAddress, 'tokens'],
    enabled: !!walletAddress && walletAddress.length === 42,
    refetchInterval: 15000
  });

  // Fetch top trading tokens
  const { data: topTokens } = useQuery({
    queryKey: ['/api/alchemy/tokens/top'],
    refetchInterval: 60000
  });

  // Fetch gas price
  const { data: gasData } = useQuery({
    queryKey: ['/api/alchemy/gas-price'],
    refetchInterval: 10000
  });

  // Get swap quote mutation
  const swapQuoteMutation = useMutation({
    mutationFn: async (params: { tokenIn: string; tokenOut: string; amountIn: string; walletAddress: string }) => {
      const response = await fetch('/api/alchemy/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return response.json();
    }
  });

  // Execute swap mutation
  const executeSwapMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await fetch('/api/alchemy/swap/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alchemy/wallet'] });
    }
  });

  // Monitor transaction
  const { data: transactionStatus } = useQuery({
    queryKey: ['/api/alchemy/transaction', selectedTransaction],
    enabled: !!selectedTransaction,
    refetchInterval: 5000
  });

  const handleGetQuote = () => {
    if (tokenIn && tokenOut && amountIn && walletAddress) {
      swapQuoteMutation.mutate({ tokenIn, tokenOut, amountIn, walletAddress });
    }
  };

  const handleExecuteSwap = (quote: SwapQuote) => {
    const minAmountOut = (parseFloat(quote.amountOut) * 0.95).toString(); // 5% slippage
    executeSwapMutation.mutate({
      tokenIn,
      tokenOut,
      amountIn: quote.amountIn,
      minAmountOut,
      walletAddress
    });
  };

  const formatBalance = (balance: string, decimals: number) => {
    const num = parseFloat(balance);
    return num.toFixed(Math.min(6, decimals));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Web3 DEX Trading</h1>
        <p className="text-muted-foreground">
          Professional decentralized exchange trading powered by Alchemy infrastructure
        </p>
      </div>

      {/* Service Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Alchemy Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={alchemyStatus?.ready ? "default" : "destructive"}>
              {alchemyStatus?.ready ? "Online" : "Offline"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {alchemyStatus?.service || "Alchemy Web3 Infrastructure"}
            </span>
            {gasData?.gasPrice && (
              <Badge variant="outline">
                Gas: {(parseInt(gasData.gasPrice) / 1e9).toFixed(1)} Gwei
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="wallet" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="swap">Swap</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
        </TabsList>

        {/* Wallet Tab */}
        <TabsContent value="wallet">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Wallet Address
                </label>
                <Input
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
              </div>

              {walletAddress && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Token Balances</h3>
                  {balancesLoading ? (
                    <div className="text-center py-8">Loading balances...</div>
                  ) : tokenBalances?.length > 0 ? (
                    <div className="grid gap-3">
                      {tokenBalances.map((token: TokenData) => (
                        <div
                          key={token.address}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {token.logo && (
                              <img
                                src={token.logo}
                                alt={token.symbol}
                                className="w-8 h-8 rounded-full"
                              />
                            )}
                            <div>
                              <div className="font-medium">{token.symbol}</div>
                              <div className="text-sm text-muted-foreground">
                                {token.name}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatBalance(token.balance || '0', token.decimals)}
                            </div>
                            {token.price && (
                              <div className="text-sm text-muted-foreground">
                                ${(parseFloat(token.balance || '0') * token.price).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        No tokens found or invalid address
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Swap Tab */}
        <TabsContent value="swap">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Token Swap
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">From Token</label>
                  <Input
                    placeholder="Token address"
                    value={tokenIn}
                    onChange={(e) => setTokenIn(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">To Token</label>
                  <Input
                    placeholder="Token address"
                    value={tokenOut}
                    onChange={(e) => setTokenOut(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Amount</label>
                <Input
                  placeholder="0.0"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                />
              </div>

              <Button
                onClick={handleGetQuote}
                disabled={!tokenIn || !tokenOut || !amountIn || !walletAddress || swapQuoteMutation.isPending}
                className="w-full"
              >
                {swapQuoteMutation.isPending ? "Getting Quote..." : "Get Quote"}
              </Button>

              {swapQuoteMutation.data && (
                <div className="p-4 border rounded-lg space-y-3">
                  <h3 className="font-semibold">Swap Quote</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>You Pay:</span>
                      <span>{swapQuoteMutation.data.amountIn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>You Receive:</span>
                      <span>{swapQuoteMutation.data.amountOut}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price Impact:</span>
                      <span className={swapQuoteMutation.data.priceImpact > 0.05 ? "text-red-500" : ""}>
                        {(swapQuoteMutation.data.priceImpact * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gas Estimate:</span>
                      <span>{swapQuoteMutation.data.gasEstimate}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleExecuteSwap(swapQuoteMutation.data)}
                    disabled={executeSwapMutation.isPending}
                    className="w-full"
                  >
                    {executeSwapMutation.isPending ? "Executing..." : "Execute Swap"}
                  </Button>
                </div>
              )}

              {executeSwapMutation.data?.transactionHash && (
                <Alert>
                  <AlertDescription>
                    Transaction submitted: {executeSwapMutation.data.transactionHash}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tokens Tab */}
        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Trading Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topTokens?.length > 0 ? (
                <div className="grid gap-3">
                  {topTokens.map((token: TokenData) => (
                    <div
                      key={token.address}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        if (!tokenIn) setTokenIn(token.address);
                        else if (!tokenOut) setTokenOut(token.address);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {token.logo && (
                          <img
                            src={token.logo}
                            alt={token.symbol}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-medium">{token.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {token.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {token.price && (
                          <div className="font-medium">${token.price.toFixed(6)}</div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          Click to select
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>Loading top tokens...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitor Tab */}
        <TabsContent value="monitor">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Transaction Monitor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Transaction Hash
                </label>
                <Input
                  placeholder="0x..."
                  value={selectedTransaction}
                  onChange={(e) => setSelectedTransaction(e.target.value)}
                />
              </div>

              {transactionStatus && (
                <div className="p-4 border rounded-lg space-y-2">
                  <h3 className="font-semibold">Transaction Status</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={transactionStatus.status === 'success' ? "default" : "destructive"}>
                        {transactionStatus.status}
                      </Badge>
                    </div>
                    {transactionStatus.blockNumber && (
                      <div className="flex justify-between">
                        <span>Block:</span>
                        <span>{transactionStatus.blockNumber}</span>
                      </div>
                    )}
                    {transactionStatus.gasUsed && (
                      <div className="flex justify-between">
                        <span>Gas Used:</span>
                        <span>{transactionStatus.gasUsed}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}