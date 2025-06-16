import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { SecurityNotice } from "./UniswapTradeButton";

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  gasUsed: string;
  gasPrice: string;
  status: number;
}

interface TransactionHistoryProps {
  walletAddress: string;
  limit?: number;
  className?: string;
}

export function TransactionHistory({ 
  walletAddress, 
  limit = 10, 
  className = "" 
}: TransactionHistoryProps) {
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ["/api/alchemy/history", walletAddress, limit],
    enabled: !!walletAddress,
    retry: false
  });

  if (!walletAddress) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to view transaction history
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-400">
            Unable to load transaction history. Please check your wallet address.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatValue = (value: string) => {
    const numValue = parseFloat(value);
    if (numValue === 0) return "0 ETH";
    if (numValue < 0.001) return "<0.001 ETH";
    return `${numValue.toFixed(4)} ETH`;
  };

  const openEtherscan = (hash: string) => {
    window.open(`https://etherscan.io/tx/${hash}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No transactions found for this address
            </p>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx: Transaction) => (
                <div
                  key={tx.hash}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {tx.from.toLowerCase() === walletAddress.toLowerCase() ? (
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-green-500" />
                      )}
                      <span className="font-mono text-sm">
                        {formatAddress(tx.from)} → {formatAddress(tx.to)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatTimestamp(tx.timestamp)}</span>
                      <Badge variant="outline" className="text-xs">
                        Block {tx.blockNumber}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-medium">
                      {formatValue(tx.value)}
                    </div>
                    <button
                      onClick={() => openEtherscan(tx.hash)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      View on Etherscan <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <SecurityNotice />
    </div>
  );
}