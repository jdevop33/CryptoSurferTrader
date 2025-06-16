import { Button } from "@/components/ui/button";
import { ExternalLink, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface UniswapTradeButtonProps {
  tokenAddress: string;
  tokenSymbol: string;
  inputCurrency?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

export function UniswapTradeButton({
  tokenAddress,
  tokenSymbol,
  inputCurrency = "ETH",
  size = "default",
  variant = "default",
  className = ""
}: UniswapTradeButtonProps) {
  // Fetch secure Uniswap link
  const { data: linkData } = useQuery({
    queryKey: ["/api/alchemy/uniswap-link", tokenAddress, inputCurrency],
    enabled: !!tokenAddress,
    retry: false
  });

  const handleTradeClick = () => {
    if (linkData?.uniswapLink) {
      // Open Uniswap in new tab - completely non-custodial
      window.open(linkData.uniswapLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Button
      onClick={handleTradeClick}
      size={size}
      variant={variant}
      className={`inline-flex items-center gap-2 ${className}`}
      disabled={!linkData?.uniswapLink}
    >
      <Shield className="h-4 w-4" />
      Trade {tokenSymbol} on Uniswap
      <ExternalLink className="h-4 w-4" />
    </Button>
  );
}

// Security compliance component
export function SecurityNotice() {
  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
      <div className="flex items-start gap-3">
        <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-green-800 dark:text-green-300">
            Secure, Non-Custodial Trading
          </h4>
          <p className="text-sm text-green-700 dark:text-green-400">
            This platform only has read-only access to your wallet. All trades are executed through Uniswap's interface. 
            Your private keys never leave your wallet.
          </p>
        </div>
      </div>
    </div>
  );
}