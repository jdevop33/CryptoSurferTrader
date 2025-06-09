import { apiRequest } from './queryClient';
import type {
  TradingPosition,
  TradeHistory,
  SocialSentiment,
  TradingSettings,
  Portfolio,
  Notification,
  TradingSignal,
  ApiResponse,
  PaginatedResponse
} from '@/types/trading';

export class TradingAPI {
  // Portfolio endpoints
  static async getPortfolio(userId: number): Promise<Portfolio> {
    const response = await apiRequest('GET', `/api/portfolio/${userId}`);
    return response.json();
  }

  // Position endpoints
  static async getPositions(userId: number): Promise<TradingPosition[]> {
    const response = await apiRequest('GET', `/api/positions/${userId}`);
    return response.json();
  }

  static async createPosition(position: Partial<TradingPosition>): Promise<TradingPosition> {
    const response = await apiRequest('POST', '/api/positions', position);
    return response.json();
  }

  static async updatePosition(id: number, updates: Partial<TradingPosition>): Promise<TradingPosition> {
    const response = await apiRequest('PATCH', `/api/positions/${id}`, updates);
    return response.json();
  }

  static async closePosition(id: number): Promise<{ success: boolean }> {
    const response = await apiRequest('DELETE', `/api/positions/${id}`);
    return response.json();
  }

  // Trade history endpoints
  static async getTradeHistory(userId: number, limit?: number): Promise<TradeHistory[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiRequest('GET', `/api/trades/${userId}${params}`);
    return response.json();
  }

  // Social sentiment endpoints
  static async getSocialSentiment(symbols?: string[]): Promise<SocialSentiment[]> {
    const params = symbols ? `?symbols=${symbols.join(',')}` : '';
    const response = await apiRequest('GET', `/api/sentiment${params}`);
    return response.json();
  }

  // Trading settings endpoints
  static async getTradingSettings(userId: number): Promise<TradingSettings> {
    const response = await apiRequest('GET', `/api/settings/${userId}`);
    return response.json();
  }

  static async updateTradingSettings(userId: number, updates: Partial<TradingSettings>): Promise<TradingSettings> {
    const response = await apiRequest('PATCH', `/api/settings/${userId}`, updates);
    return response.json();
  }

  // Notifications endpoints
  static async getNotifications(userId: number): Promise<Notification[]> {
    const response = await apiRequest('GET', `/api/notifications/${userId}`);
    return response.json();
  }

  static async markNotificationRead(id: number): Promise<{ success: boolean }> {
    const response = await apiRequest('PATCH', `/api/notifications/${id}/read`);
    return response.json();
  }

  // Trading control endpoints
  static async toggleAutoTrading(userId: number, enabled: boolean): Promise<TradingSettings> {
    const response = await apiRequest('POST', `/api/trading/toggle/${userId}`, { enabled });
    return response.json();
  }

  static async emergencyStop(userId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest('POST', `/api/trading/emergency-stop/${userId}`);
    return response.json();
  }

  // Market data endpoints (these would connect to external APIs)
  static async getTokenPrice(symbol: string): Promise<{ price: number; change24h: number }> {
    try {
      // This would typically call CoinGecko or similar API
      // For now, return a placeholder that indicates real data would come from external sources
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_change=true`);
      const data = await response.json();
      return {
        price: data[symbol]?.usd || 0,
        change24h: data[symbol]?.usd_24h_change || 0
      };
    } catch (error) {
      console.error('Error fetching token price:', error);
      return { price: 0, change24h: 0 };
    }
  }

  static async getTokenMarketCap(symbol: string): Promise<number> {
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd&include_market_cap=true`);
      const data = await response.json();
      return data[symbol]?.usd_market_cap || 0;
    } catch (error) {
      console.error('Error fetching market cap:', error);
      return 0;
    }
  }

  // MetaMask / DEX trading helpers
  static async estimateGasPrice(): Promise<string> {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const gasPrice = await window.ethereum.request({ method: 'eth_gasPrice' });
        return gasPrice;
      } catch (error) {
        console.error('Error estimating gas price:', error);
        return '0';
      }
    }
    return '0';
  }

  static async getETHBalance(address: string): Promise<string> {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest']
        });
        return balance;
      } catch (error) {
        console.error('Error getting ETH balance:', error);
        return '0';
      }
    }
    return '0';
  }

  // Utility methods for data transformation
  static formatCurrency(amount: string | number, currency: string = 'USD'): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(num);
  }

  static formatPercentage(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num / 100);
  }

  static formatLargeNumber(value: number): string {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)}B`;
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toString();
  }

  // WebSocket message handlers
  static handleWebSocketMessage(message: any, queryClient: any) {
    switch (message.type) {
      case 'portfolio_update':
        queryClient.setQueryData(['/api/portfolio/1'], message.data);
        break;
      case 'position_update':
        queryClient.invalidateQueries({ queryKey: ['/api/positions/1'] });
        break;
      case 'sentiment_update':
        queryClient.setQueryData(['/api/sentiment'], message.data);
        break;
      case 'trade_alert':
        queryClient.invalidateQueries({ queryKey: ['/api/trades/1'] });
        queryClient.invalidateQueries({ queryKey: ['/api/portfolio/1'] });
        break;
      case 'notification':
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/1'] });
        break;
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  // Risk calculation helpers
  static calculateRiskLevel(
    currentExposure: number,
    maxExposure: number,
    dailyLoss: number,
    dailyLossLimit: number
  ): 'low' | 'moderate' | 'high' {
    const exposurePercent = (currentExposure / maxExposure) * 100;
    const lossPercent = (Math.abs(dailyLoss) / dailyLossLimit) * 100;
    
    if (exposurePercent > 80 || lossPercent > 80) {
      return 'high';
    } else if (exposurePercent > 50 || lossPercent > 50) {
      return 'moderate';
    }
    return 'low';
  }

  static shouldTriggerBuySignal(
    sentimentScore: number,
    influencerCount: number,
    marketCap: number,
    sentimentThreshold: number = 0.8,
    influencerThreshold: number = 5,
    marketCapLimit: number = 10_000_000
  ): boolean {
    return (
      sentimentScore >= sentimentThreshold &&
      influencerCount >= influencerThreshold &&
      marketCap > 0 &&
      marketCap <= marketCapLimit
    );
  }

  static shouldTriggerSellSignal(
    currentPrice: number,
    entryPrice: number,
    takeProfitPercent: number = 30,
    stopLossPercent: number = 15,
    socialVolumeDropPercent: number = 60
  ): { shouldSell: boolean; reason: string } {
    const priceChangePercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    
    if (priceChangePercent >= takeProfitPercent) {
      return { shouldSell: true, reason: 'take_profit' };
    }
    
    if (priceChangePercent <= -stopLossPercent) {
      return { shouldSell: true, reason: 'stop_loss' };
    }
    
    // Social volume drop check would require additional data
    // This is a placeholder for the logic
    
    return { shouldSell: false, reason: '' };
  }
}

// Export individual functions for easier importing
export const {
  getPortfolio,
  getPositions,
  createPosition,
  updatePosition,
  closePosition,
  getTradeHistory,
  getSocialSentiment,
  getTradingSettings,
  updateTradingSettings,
  getNotifications,
  markNotificationRead,
  toggleAutoTrading,
  emergencyStop,
  getTokenPrice,
  getTokenMarketCap,
  formatCurrency,
  formatPercentage,
  formatLargeNumber,
  handleWebSocketMessage,
  calculateRiskLevel,
  shouldTriggerBuySignal,
  shouldTriggerSellSignal
} = TradingAPI;
