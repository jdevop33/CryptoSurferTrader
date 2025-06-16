import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet,
  RefreshCw
} from 'lucide-react';
import { useMetaMask } from '@/hooks/useMetaMask';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UniswapTradeButton, SecurityNotice } from '@/components/UniswapTradeButton';
import { TransactionHistory } from '@/components/TransactionHistory';

export default function Dashboard() {
  const { isConnected, account, connect } = useMetaMask();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch wallet token balances from Alchemy service
  const { data: tokenBalances, isLoading: balancesLoading, refetch } = useQuery({
    queryKey: ['/api/alchemy/wallet', account, 'tokens'],
    enabled: !!account && account.length === 42,
    refetchInterval: 30000
  });

  // Fetch top tokens for reference
  const { data: topTokens } = useQuery({
    queryKey: ['/api/alchemy/tokens/top'],
    refetchInterval: 60000
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Calculate portfolio value from real token balances
  const portfolioValue = tokenBalances ? 
    tokenBalances.reduce((total: number, token: any) => total + (parseFloat(token.balance || '0') * (token.price || 0)), 0) : 
    0;

  // Mock performance data for demonstration (would come from historical API)
  const performanceData = [
    { day: 'Mon', value: portfolioValue * 0.85 },
    { day: 'Tue', value: portfolioValue * 0.90 },
    { day: 'Wed', value: portfolioValue * 0.95 },
    { day: 'Thu', value: portfolioValue * 0.88 },
    { day: 'Fri', value: portfolioValue * 0.92 },
    { day: 'Sat', value: portfolioValue * 0.96 },
    { day: 'Sun', value: portfolioValue }
  ];

  const dailyChange = portfolioValue > 0 ? 
    ((portfolioValue - performanceData[performanceData.length - 2]?.value) / performanceData[performanceData.length - 2]?.value * 100) : 
    0;

  // Prepare asset allocation data from real balances
  const assetAllocationData = tokenBalances?.slice(0, 5).map((token: any, index: number) => ({
    name: token.symbol || 'Unknown',
    value: parseFloat(token.balance || '0') * (token.price || 0),
    color: ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'][index]
  })) || [];

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center space-y-8 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold">Connect Your Wallet</h1>
            <p className="text-xl text-slate-300">
              Connect your MetaMask wallet to view your portfolio and start trading
            </p>
            <Button
              onClick={connect}
              size="lg"
              className="text-xl px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Wallet className="w-6 h-6 mr-3" />
              Connect MetaMask Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Portfolio</h1>
            <p className="text-slate-300">
              Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Large Portfolio Value Display */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h2 className="text-lg text-slate-400">Total Portfolio Value</h2>
                <div className="text-5xl font-bold">
                  ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2">
                {dailyChange >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
                <span className={`text-xl font-semibold ${dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {dailyChange >= 0 ? '+' : ''}{dailyChange.toFixed(2)}%
                </span>
                <span className="text-slate-400">24h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Asset Allocation Pie Chart */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Asset Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {assetAllocationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetAllocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {assetAllocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    No assets found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Bar Chart */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                7-Day Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="day" 
                      stroke="#64748b"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#64748b"
                      fontSize={12}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Portfolio Value']}
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    />
                    <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assets List */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="w-5 h-5 mr-2" />
              Your Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balancesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-400">Loading your assets...</p>
              </div>
            ) : tokenBalances && tokenBalances.length > 0 ? (
              <div className="space-y-4">
                {tokenBalances.map((token: any, index: number) => {
                  const value = parseFloat(token.balance || '0') * (token.price || 0);
                  return (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold">
                            {token.symbol?.slice(0, 2) || '??'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{token.symbol || 'Unknown'}</h3>
                          <p className="text-sm text-slate-400">{token.name || 'Unknown Token'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">
                            ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-slate-400">
                            {parseFloat(token.balance || '0').toLocaleString()} {token.symbol}
                          </p>
                        </div>
                        {token.contractAddress && (
                          <UniswapTradeButton
                            tokenAddress={token.contractAddress}
                            tokenSymbol={token.symbol || 'Token'}
                            size="sm"
                            variant="outline"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">No tokens found in your wallet</p>
                <p className="text-sm text-slate-500">
                  Make sure your wallet has tokens and try refreshing
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        {isConnected && account && (
          <TransactionHistory 
            walletAddress={account} 
            limit={10}
            className="mt-6"
          />
        )}
      </div>
      
      {/* Security Notice */}
      {isConnected && (
        <div className="mt-6">
          <SecurityNotice />
        </div>
      )}
    </div>
  );
}