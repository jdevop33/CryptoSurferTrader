import { createClient } from 'redis';

export class RedisClient {
  private client: any;
  private connected = false;

  constructor() {
    this.client = createClient({
      url: 'redis://localhost:6379'
    });

    this.client.on('error', (err: any) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
      this.connected = true;
    });
  }

  async connect() {
    if (!this.connected) {
      await this.client.connect();
    }
  }

  async getPortfolio(userId: number) {
    try {
      await this.connect();
      const data = await this.client.hGetAll(`portfolio:${userId}`);
      return {
        totalValue: data.totalValue || '0.00',
        dailyPnL: data.dailyPnL || '0.00',
        unrealizedPnL: data.unrealizedPnL || '0.00',
        realizedPnL: data.realizedPnL || '0.00',
        availableBalance: data.availableBalance || '0.00',
        marginUsed: data.marginUsed || '0.00',
        activePositions: data.activePositions || '0',
        lastUpdated: data.lastUpdated
      };
    } catch (error) {
      console.error('Error getting portfolio:', error);
      return {
        totalValue: '0.00',
        dailyPnL: '0.00',
        unrealizedPnL: '0.00',
        realizedPnL: '0.00',
        availableBalance: '0.00',
        marginUsed: '0.00',
        activePositions: '0',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async getPositions(userId: number) {
    try {
      await this.connect();
      const positions = await this.client.lRange(`positions:${userId}`, 0, -1);
      return positions.map((pos: string) => JSON.parse(pos)).filter((p: any) => p.status === 'open');
    } catch (error) {
      console.error('Error getting positions:', error);
      return [];
    }
  }

  async getTrades(userId: number, limit = 50) {
    try {
      await this.connect();
      const trades = await this.client.lRange(`trades:${userId}`, 0, limit - 1);
      return trades.map((trade: string) => JSON.parse(trade));
    } catch (error) {
      console.error('Error getting trades:', error);
      return [];
    }
  }

  async getNotifications(userId: number) {
    try {
      await this.connect();
      const notifications = await this.client.lRange(`notifications:${userId}`, 0, 19);
      return notifications.map((notif: string) => JSON.parse(notif));
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async getSentiment(symbols?: string[]) {
    try {
      await this.connect();
      const sentimentData = [];
      
      if (symbols && symbols.length > 0) {
        for (const symbol of symbols) {
          const data = await this.client.hGetAll(`sentiment:${symbol}`);
          if (data && Object.keys(data).length > 0) {
            sentimentData.push({
              symbol: data.symbol,
              sentimentScore: data.sentimentScore,
              mentions: data.mentions,
              influencerCount: data.influencerCount,
              marketCap: data.marketCap,
              volumeChange: data.volumeChange,
              timestamp: data.timestamp
            });
          }
        }
      } else {
        // Get all sentiment data
        const keys = await this.client.keys('sentiment:*');
        for (const key of keys) {
          const data = await this.client.hGetAll(key);
          if (data && Object.keys(data).length > 0) {
            sentimentData.push({
              symbol: data.symbol,
              sentimentScore: data.sentimentScore,
              mentions: data.mentions,
              influencerCount: data.influencerCount,
              marketCap: data.marketCap,
              volumeChange: data.volumeChange,
              timestamp: data.timestamp
            });
          }
        }
      }
      
      return sentimentData;
    } catch (error) {
      console.error('Error getting sentiment:', error);
      return [];
    }
  }

  async getSettings(userId: number) {
    try {
      await this.connect();
      const data = await this.client.hGetAll(`settings:${userId}`);
      return {
        maxPositionSize: data.maxPositionSize || '100.00',
        stopLossPercent: data.stopLossPercent || '15.0',
        takeProfitPercent: data.takeProfitPercent || '30.0',
        maxConcurrentPositions: data.maxConcurrentPositions || '5',
        autoTradingEnabled: data.autoTradingEnabled === 'true',
        riskLevel: data.riskLevel || 'medium',
        lastUpdated: data.lastUpdated
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        maxPositionSize: '100.00',
        stopLossPercent: '15.0',
        takeProfitPercent: '30.0',
        maxConcurrentPositions: '5',
        autoTradingEnabled: true,
        riskLevel: 'medium',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async updateSettings(userId: number, settings: any) {
    try {
      await this.connect();
      const updateData = {
        ...settings,
        autoTradingEnabled: settings.autoTradingEnabled ? 'true' : 'false',
        lastUpdated: new Date().toISOString()
      };
      await this.client.hSet(`settings:${userId}`, updateData);
      return updateData;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  async markNotificationRead(notificationId: number) {
    try {
      await this.connect();
      // For simplicity, we'll just return success
      // In a real implementation, you'd update the specific notification
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async emergencyStop(userId: number) {
    try {
      await this.connect();
      // Signal emergency stop to Python service
      await this.client.publish('emergency_stop', JSON.stringify({ userId, timestamp: new Date().toISOString() }));
      return { success: true, message: 'Emergency stop signal sent' };
    } catch (error) {
      console.error('Error sending emergency stop:', error);
      return { success: false, message: 'Failed to send emergency stop signal' };
    }
  }

  async disconnect() {
    if (this.connected && this.client) {
      await this.client.disconnect();
      this.connected = false;
    }
  }
}

export const redisClient = new RedisClient();