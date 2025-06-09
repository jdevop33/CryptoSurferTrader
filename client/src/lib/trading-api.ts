import { queryClient } from './queryClient';

export interface Portfolio {
  totalValue: string;
  dailyPnL: string;
  unrealizedPnL: string;
  realizedPnL: string;
  availableBalance: string;
  marginUsed: string;
  activePositions: number;
  lastUpdated: string;
}

export interface Position {
  id: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  size: string;
  entryPrice: string;
  currentPrice: string;
  pnl: string;
  pnlPercent: string;
  status: 'open' | 'closed';
  stopLoss?: string;
  takeProfit?: string;
  createdAt: string;
  userId: number;
  exchange: string;
}

export interface Trade {
  id: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  size: string;
  entryPrice?: string;
  exitPrice?: string;
  pnl?: string;
  executedAt: string;
  userId: number;
  exchange: string;
  trigger?: string;
}

export interface SentimentData {
  symbol: string;
  sentimentScore: string;
  mentions: number;
  influencerCount: number;
  marketCap: string;
  volumeChange: string;
  timestamp: string;
}

export interface TradingSettings {
  maxPositionSize: string;
  stopLossPercent: string;
  takeProfitPercent: string;
  maxConcurrentPositions: string;
  autoTradingEnabled: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdated: string;
}

export interface NotificationItem {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  userId: number;
  read: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

// Trading API client for authenticated market data
export class TradingAPI {
  private baseUrl = '/api';

  async getPortfolio(userId: number): Promise<Portfolio> {
    const response = await fetch(`${this.baseUrl}/portfolio/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch portfolio');
    }
    return response.json();
  }

  async getPositions(userId: number): Promise<Position[]> {
    const response = await fetch(`${this.baseUrl}/positions/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch positions');
    }
    return response.json();
  }

  async getTrades(userId: number, limit = 50): Promise<Trade[]> {
    const response = await fetch(`${this.baseUrl}/trades/${userId}?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch trades');
    }
    return response.json();
  }

  async getSentiment(symbols?: string[]): Promise<SentimentData[]> {
    const url = symbols && symbols.length > 0 
      ? `${this.baseUrl}/sentiment?symbols=${symbols.join(',')}`
      : `${this.baseUrl}/sentiment`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch sentiment data');
    }
    return response.json();
  }

  async getSettings(userId: number): Promise<TradingSettings> {
    const response = await fetch(`${this.baseUrl}/settings/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch trading settings');
    }
    return response.json();
  }

  async updateSettings(userId: number, settings: Partial<TradingSettings>): Promise<TradingSettings> {
    const response = await fetch(`${this.baseUrl}/settings/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update settings');
    }
    return response.json();
  }

  async getNotifications(userId: number): Promise<NotificationItem[]> {
    const response = await fetch(`${this.baseUrl}/notifications/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    return response.json();
  }

  async markNotificationRead(notificationId: number): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
    return response.json();
  }

  async toggleTrading(userId: number, enabled: boolean): Promise<TradingSettings> {
    const response = await fetch(`${this.baseUrl}/trading/toggle/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to toggle trading');
    }
    return response.json();
  }

  async emergencyStop(userId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/trading/emergency-stop/${userId}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to execute emergency stop');
    }
    return response.json();
  }

  // Real-time WebSocket connection for live updates
  connectWebSocket(userId: number, onMessage: (data: any) => void): WebSocket | null {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        // Subscribe to user-specific updates
        ws.send(JSON.stringify({ type: 'subscribe', userId }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      return null;
    }
  }
}

// Export singleton instance
export const tradingAPI = new TradingAPI();

// React Query hooks for data fetching
export const useTradingQueries = {
  portfolio: (userId: number) => ({
    queryKey: ['/api/portfolio', userId],
    queryFn: () => tradingAPI.getPortfolio(userId),
    refetchInterval: 5000, // Refresh every 5 seconds
  }),

  positions: (userId: number) => ({
    queryKey: ['/api/positions', userId],
    queryFn: () => tradingAPI.getPositions(userId),
    refetchInterval: 3000, // Refresh every 3 seconds
  }),

  trades: (userId: number, limit?: number) => ({
    queryKey: ['/api/trades', userId, limit],
    queryFn: () => tradingAPI.getTrades(userId, limit),
    refetchInterval: 10000, // Refresh every 10 seconds
  }),

  sentiment: (symbols?: string[]) => ({
    queryKey: ['/api/sentiment', symbols],
    queryFn: () => tradingAPI.getSentiment(symbols),
    refetchInterval: 15000, // Refresh every 15 seconds
  }),

  settings: (userId: number) => ({
    queryKey: ['/api/settings', userId],
    queryFn: () => tradingAPI.getSettings(userId),
  }),

  notifications: (userId: number) => ({
    queryKey: ['/api/notifications', userId],
    queryFn: () => tradingAPI.getNotifications(userId),
    refetchInterval: 30000, // Refresh every 30 seconds
  }),
};

// Mutations for updating data
export const useTradingMutations = {
  updateSettings: (userId: number) => ({
    mutationFn: (settings: Partial<TradingSettings>) => 
      tradingAPI.updateSettings(userId, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings', userId] });
    },
  }),

  toggleTrading: (userId: number) => ({
    mutationFn: (enabled: boolean) => 
      tradingAPI.toggleTrading(userId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio', userId] });
    },
  }),

  emergencyStop: (userId: number) => ({
    mutationFn: () => tradingAPI.emergencyStop(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/positions', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/trades', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', userId] });
    },
  }),

  markNotificationRead: (userId: number) => ({
    mutationFn: (notificationId: number) => 
      tradingAPI.markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', userId] });
    },
  }),
};