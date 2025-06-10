import { spawn, ChildProcess } from 'child_process';
import Redis from 'ioredis';
import { EventEmitter } from 'events';

interface TradingEngineConfig {
  maxPositions: number;
  positionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  minSentimentScore: number;
  autoTradingEnabled: boolean;
}

interface NautilusPosition {
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: string;
  entryPrice: string;
  currentPrice: string;
  unrealizedPnL: string;
  realizedPnL: string;
  timestamp: string;
}

interface NautilusTrade {
  symbol: string;
  side: 'BUY' | 'SELL';
  entryPrice: string;
  exitPrice: string;
  quantity: string;
  realizedPnL: string;
  duration: string;
  timestamp: string;
}

export class PythonTradingBridge extends EventEmitter {
  private pythonProcess: ChildProcess | null = null;
  private redis: Redis;
  private isInitialized = false;
  private config: TradingEngineConfig;

  constructor() {
    super();
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: 1,
      lazyConnect: true
    });
    
    this.config = {
      maxPositions: 5,
      positionSize: 100,
      stopLossPercent: 15,
      takeProfitPercent: 30,
      minSentimentScore: 0.8,
      autoTradingEnabled: false
    };
  }

  async initialize(): Promise<void> {
    try {
      // Start Python trading service
      await this.startPythonService();
      
      // Subscribe to Redis channels for real-time updates
      await this.subscribeToUpdates();
      
      // Initialize trading configuration
      await this.updateTradingConfig();
      
      this.isInitialized = true;
      console.log('🐍 Python trading bridge initialized with Nautilus Trader');
      
    } catch (error) {
      console.error('Failed to initialize Python trading bridge:', error);
      throw error;
    }
  }

  private async startPythonService(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.pythonProcess = spawn('python3', ['server/python_service.py'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.pythonProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        console.log('🐍 Python Service:', output.trim());
        
        // Check for initialization success
        if (output.includes('Trading service started')) {
          resolve();
        }
      });

      this.pythonProcess.stderr?.on('data', (data: Buffer) => {
        const error = data.toString();
        console.error('🐍 Python Service Error:', error.trim());
        
        // Don't reject on Redis connection errors - service can run without Redis
        if (!error.includes('Redis') && !error.includes('Connection')) {
          reject(new Error(error));
        }
      });

      this.pythonProcess.on('error', (error) => {
        console.error('🐍 Python process error:', error);
        reject(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pythonProcess?.exitCode === null) {
          resolve(); // Assume started if still running
        }
      }, 10000);
    });
  }

  private async subscribeToUpdates(): Promise<void> {
    const subscriber = new Redis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: 1,
      lazyConnect: true
    });

    // Subscribe to position updates from Nautilus Trader
    subscriber.subscribe('position_updates', 'portfolio_updates', 'trade_executed', 'sentiment_updates');

    subscriber.on('message', (channel: string, message: string) => {
      try {
        const data = JSON.parse(message);
        
        switch (channel) {
          case 'position_updates':
            this.emit('positionUpdate', this.formatNautilusPosition(data));
            break;
          case 'portfolio_updates':
            this.emit('portfolioUpdate', data);
            break;
          case 'trade_executed':
            this.emit('tradeExecuted', this.formatNautilusTrade(data));
            break;
          case 'sentiment_updates':
            this.emit('sentimentUpdate', data);
            break;
        }
      } catch (error) {
        console.error('Error parsing Redis message:', error);
      }
    });
  }

  private formatNautilusPosition(data: any): NautilusPosition {
    return {
      symbol: data.symbol,
      side: data.side === 'LONG' ? 'LONG' : 'SHORT',
      size: data.size,
      entryPrice: data.entry_price,
      currentPrice: data.current_price,
      unrealizedPnL: data.unrealized_pnl,
      realizedPnL: data.realized_pnl,
      timestamp: data.timestamp
    };
  }

  private formatNautilusTrade(data: any): NautilusTrade {
    return {
      symbol: data.symbol,
      side: data.side === 'BUY' ? 'BUY' : 'SELL',
      entryPrice: data.entry_price,
      exitPrice: data.exit_price,
      quantity: data.quantity,
      realizedPnL: data.realized_pnl,
      duration: data.duration,
      timestamp: data.timestamp
    };
  }

  async updateTradingConfig(): Promise<void> {
    try {
      await this.redis.hset('trading_config', {
        max_positions: this.config.maxPositions,
        position_size: this.config.positionSize,
        stop_loss_percent: this.config.stopLossPercent / 100,
        take_profit_percent: this.config.takeProfitPercent / 100,
        min_sentiment_score: this.config.minSentimentScore,
        auto_trading_enabled: this.config.autoTradingEnabled ? 'true' : 'false',
        last_updated: new Date().toISOString()
      });
      
      console.log('📊 Updated Nautilus Trader configuration');
    } catch (error) {
      console.error('Failed to update trading config:', error);
    }
  }

  async enableAutoTrading(enabled: boolean): Promise<void> {
    this.config.autoTradingEnabled = enabled;
    await this.updateTradingConfig();
    
    // Notify Python service
    await this.redis.publish('trading_commands', JSON.stringify({
      command: enabled ? 'start_trading' : 'stop_trading',
      timestamp: new Date().toISOString()
    }));
    
    console.log(`🤖 Auto-trading ${enabled ? 'enabled' : 'disabled'}`);
  }

  async emergencyStop(): Promise<void> {
    await this.redis.publish('trading_commands', JSON.stringify({
      command: 'emergency_stop',
      timestamp: new Date().toISOString()
    }));
    
    console.log('🛑 Emergency stop executed');
  }

  async getPositions(): Promise<NautilusPosition[]> {
    try {
      const keys = await this.redis.keys('position:*');
      const positions: NautilusPosition[] = [];
      
      for (const key of keys) {
        const data = await this.redis.hgetall(key);
        if (data.symbol) {
          positions.push(this.formatNautilusPosition(data));
        }
      }
      
      return positions;
    } catch (error) {
      console.error('Failed to get positions:', error);
      return [];
    }
  }

  async getPortfolio(): Promise<any> {
    try {
      const portfolio = await this.redis.hgetall('portfolio');
      return {
        totalValue: portfolio.total_value || '10000.00',
        dailyPnL: portfolio.daily_pnl || '0.00',
        unrealizedPnL: portfolio.unrealized_pnl || '0.00',
        realizedPnL: portfolio.realized_pnl || '0.00',
        availableBalance: portfolio.available_balance || '10000.00',
        marginUsed: portfolio.margin_used || '0.00',
        activePositions: await this.getPositionCount(),
        lastUpdated: portfolio.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get portfolio:', error);
      return {
        totalValue: '10000.00',
        dailyPnL: '0.00',
        unrealizedPnL: '0.00',
        realizedPnL: '0.00',
        availableBalance: '10000.00',
        marginUsed: '0.00',
        activePositions: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  private async getPositionCount(): Promise<number> {
    const keys = await this.redis.keys('position:*');
    return keys.length;
  }

  async getSentimentData(): Promise<any[]> {
    try {
      const keys = await this.redis.keys('sentiment:*');
      const sentimentData: any[] = [];
      
      for (const key of keys) {
        const data = await this.redis.hgetall(key);
        if (data.symbol) {
          sentimentData.push({
            symbol: data.symbol,
            sentimentScore: data.score || '0.5',
            mentions: parseInt(data.mention_count || '0'),
            influencerCount: parseInt(data.influencer_count || '0'),
            marketCap: parseFloat(data.market_cap || '0'),
            volumeChange: data.volume_change || '0.0',
            lastUpdated: data.last_updated || new Date().toISOString()
          });
        }
      }
      
      return sentimentData;
    } catch (error) {
      console.error('Failed to get sentiment data:', error);
      return [];
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.pythonProcess) {
        this.pythonProcess.kill('SIGTERM');
        this.pythonProcess = null;
      }
      
      await this.redis.disconnect();
      console.log('🐍 Python trading bridge cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.pythonProcess !== null;
  }
}

export const pythonBridge = new PythonTradingBridge();