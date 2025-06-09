import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

interface MetaMaskState {
  isConnected: boolean;
  account: string | null;
  chainId: string | null;
  isInstalled: boolean;
}

export function useMetaMask() {
  const { toast } = useToast();
  const [state, setState] = useState<MetaMaskState>({
    isConnected: false,
    account: null,
    chainId: null,
    isInstalled: false,
  });

  useEffect(() => {
    // Check if MetaMask is installed
    const isInstalled = typeof window !== 'undefined' && Boolean(window.ethereum);
    setState(prev => ({ ...prev, isInstalled }));

    if (!isInstalled) {
      return;
    }

    // Check if already connected
    checkConnection();

    // Listen for account changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      setState(prev => ({
        ...prev,
        isConnected: accounts.length > 0,
        account: accounts[0] || null,
        chainId,
      }));
    } catch (error) {
      console.error('Error checking MetaMask connection:', error);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    setState(prev => ({
      ...prev,
      isConnected: accounts.length > 0,
      account: accounts[0] || null,
    }));

    if (accounts.length === 0) {
      toast({
        title: "MetaMask Disconnected",
        description: "Your MetaMask wallet has been disconnected.",
        variant: "destructive",
      });
    }
  };

  const handleChainChanged = (chainId: string) => {
    setState(prev => ({ ...prev, chainId }));
    // Reload the page when chain changes
    window.location.reload();
  };

  const connect = async () => {
    if (!state.isInstalled) {
      toast({
        title: "MetaMask Not Installed",
        description: "Please install MetaMask to connect your wallet.",
        variant: "destructive",
      });
      // Open MetaMask installation page
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });

      setState(prev => ({
        ...prev,
        isConnected: true,
        account: accounts[0],
        chainId,
      }));

      toast({
        title: "MetaMask Connected",
        description: `Connected to account ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (error: any) {
      console.error('Error connecting to MetaMask:', error);
      
      if (error.code === 4001) {
        toast({
          title: "Connection Rejected",
          description: "You rejected the connection request.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to MetaMask. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const disconnect = () => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      account: null,
    }));
  };

  const switchToEthereumMainnet = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }], // Ethereum Mainnet
      });
    } catch (error: any) {
      console.error('Error switching network:', error);
      toast({
        title: "Network Switch Failed",
        description: "Failed to switch to Ethereum Mainnet.",
        variant: "destructive",
      });
    }
  };

  const addTokenToWallet = async (tokenAddress: string, tokenSymbol: string, tokenDecimals: number = 18) => {
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
          },
        },
      });
    } catch (error) {
      console.error('Error adding token to wallet:', error);
    }
  };

  return {
    ...state,
    connect,
    disconnect,
    switchToEthereumMainnet,
    addTokenToWallet,
  };
}

// Extend window object for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
