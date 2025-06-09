import { 
  users, 
  tradingPositions, 
  tradeHistory, 
  socialSentiment, 
  tradingSettings, 
  notifications,
  type User, 
  type InsertUser,
  type TradingPosition,
  type InsertTradingPosition,
  type TradeHistory,
  type InsertTradeHistory,
  type SocialSentiment,
  type InsertSocialSentiment,
  type TradingSettings,
  type InsertTradingSettings,
  type Notification,
  type InsertNotification
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Trading position methods
  getActivePositions(userId: number): Promise<TradingPosition[]>;
  getPosition(id: number): Promise<TradingPosition | undefined>;
  createPosition(position: InsertTradingPosition): Promise<TradingPosition>;
  updatePosition(id: number, updates: Partial<TradingPosition>): Promise<TradingPosition | undefined>;
  closePosition(id: number): Promise<boolean>;

  // Trade history methods
  getTradeHistory(userId: number, limit?: number): Promise<TradeHistory[]>;
  createTrade(trade: InsertTradeHistory): Promise<TradeHistory>;

  // Social sentiment methods
  getSocialSentiment(symbols?: string[]): Promise<SocialSentiment[]>;
  updateSocialSentiment(sentiment: InsertSocialSentiment): Promise<SocialSentiment>;

  // Trading settings methods
  getTradingSettings(userId: number): Promise<TradingSettings | undefined>;
  updateTradingSettings(userId: number, updates: Partial<TradingSettings>): Promise<TradingSettings>;

  // Notification methods
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private positions: Map<number, TradingPosition>;
  private trades: Map<number, TradeHistory>;
  private sentiments: Map<string, SocialSentiment>;
  private settings: Map<number, TradingSettings>;
  private notifications: Map<number, Notification>;
  
  private currentUserId: number;
  private currentPositionId: number;
  private currentTradeId: number;
  private currentSentimentId: number;
  private currentSettingsId: number;
  private currentNotificationId: number;

  constructor() {
    this.users = new Map();
    this.positions = new Map();
    this.trades = new Map();
    this.sentiments = new Map();
    this.settings = new Map();
    this.notifications = new Map();
    
    this.currentUserId = 1;
    this.currentPositionId = 1;
    this.currentTradeId = 1;
    this.currentSentimentId = 1;
    this.currentSettingsId = 1;
    this.currentNotificationId = 1;

    // Initialize default user and settings
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default user
    const defaultUser: User = {
      id: 1,
      username: "trader",
      password: "hashed_password",
      walletAddress: null,
      createdAt: new Date(),
    };
    this.users.set(1, defaultUser);
    this.currentUserId = 2;

    // Create default trading settings
    const defaultSettings: TradingSettings = {
      id: 1,
      userId: 1,
      maxPositionSize: "100.00",
      maxPositions: 5,
      dailyLossLimit: "200.00",
      stopLossPercent: "15.00",
      takeProfitPercent: "30.00",
      autoTradingEnabled: true,
      sentimentThreshold: "0.8000",
      influencerThreshold: 5,
      updatedAt: new Date(),
    };
    this.settings.set(1, defaultSettings);
    this.currentSettingsId = 2;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
      walletAddress: insertUser.walletAddress || null,
    };
    this.users.set(id, user);
    return user;
  }

  // Trading position methods
  async getActivePositions(userId: number): Promise<TradingPosition[]> {
    return Array.from(this.positions.values()).filter(
      pos => pos.userId === userId && pos.status === "open"
    );
  }

  async getPosition(id: number): Promise<TradingPosition | undefined> {
    return this.positions.get(id);
  }

  async createPosition(position: InsertTradingPosition): Promise<TradingPosition> {
    const id = this.currentPositionId++;
    const newPosition: TradingPosition = {
      id,
      userId: position.userId,
      symbol: position.symbol,
      exchange: position.exchange,
      side: position.side,
      entryPrice: position.entryPrice,
      currentPrice: position.currentPrice || null,
      size: position.size,
      pnl: position.pnl || null,
      pnlPercent: position.pnlPercent || null,
      status: "open",
      stopLoss: position.stopLoss || null,
      takeProfit: position.takeProfit || null,
      createdAt: new Date(),
      closedAt: null,
    };
    this.positions.set(id, newPosition);
    return newPosition;
  }

  async updatePosition(id: number, updates: Partial<TradingPosition>): Promise<TradingPosition | undefined> {
    const position = this.positions.get(id);
    if (!position) return undefined;

    const updatedPosition = { ...position, ...updates };
    this.positions.set(id, updatedPosition);
    return updatedPosition;
  }

  async closePosition(id: number): Promise<boolean> {
    const position = this.positions.get(id);
    if (!position) return false;

    const closedPosition = {
      ...position,
      status: "closed" as const,
      closedAt: new Date(),
    };
    this.positions.set(id, closedPosition);
    
    // Create trade history record
    await this.createTrade({
      userId: position.userId,
      positionId: id,
      symbol: position.symbol,
      exchange: position.exchange,
      type: position.side === "buy" ? "sell" : "buy",
      entryPrice: position.entryPrice,
      exitPrice: position.currentPrice,
      size: position.size,
      pnl: position.pnl,
      trigger: "manual",
      metadata: null,
    });

    return true;
  }

  // Trade history methods
  async getTradeHistory(userId: number, limit: number = 50): Promise<TradeHistory[]> {
    return Array.from(this.trades.values())
      .filter(trade => trade.userId === userId)
      .sort((a, b) => new Date(b.executedAt!).getTime() - new Date(a.executedAt!).getTime())
      .slice(0, limit);
  }

  async createTrade(trade: InsertTradeHistory): Promise<TradeHistory> {
    const id = this.currentTradeId++;
    const newTrade: TradeHistory = {
      id,
      userId: trade.userId,
      positionId: trade.positionId || null,
      symbol: trade.symbol,
      exchange: trade.exchange,
      type: trade.type,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice || null,
      size: trade.size,
      pnl: trade.pnl || null,
      trigger: trade.trigger || null,
      metadata: trade.metadata || null,
      executedAt: new Date(),
    };
    this.trades.set(id, newTrade);
    return newTrade;
  }

  // Social sentiment methods
  async getSocialSentiment(symbols?: string[]): Promise<SocialSentiment[]> {
    const allSentiments = Array.from(this.sentiments.values());
    if (!symbols || symbols.length === 0) {
      return allSentiments.slice(0, 10); // Return latest 10
    }
    return allSentiments.filter(sentiment => symbols.includes(sentiment.symbol));
  }

  async updateSocialSentiment(sentiment: InsertSocialSentiment): Promise<SocialSentiment> {
    const key = sentiment.symbol;
    const existing = this.sentiments.get(key);
    
    const newSentiment: SocialSentiment = {
      id: existing?.id || this.currentSentimentId++,
      symbol: sentiment.symbol,
      sentimentScore: sentiment.sentimentScore,
      mentions: sentiment.mentions || null,
      influencerCount: sentiment.influencerCount || null,
      marketCap: sentiment.marketCap || null,
      volumeChange: sentiment.volumeChange || null,
      metadata: sentiment.metadata || null,
      timestamp: new Date(),
    };
    
    this.sentiments.set(key, newSentiment);
    return newSentiment;
  }

  // Trading settings methods
  async getTradingSettings(userId: number): Promise<TradingSettings | undefined> {
    return Array.from(this.settings.values()).find(setting => setting.userId === userId);
  }

  async updateTradingSettings(userId: number, updates: Partial<TradingSettings>): Promise<TradingSettings> {
    const existing = await this.getTradingSettings(userId);
    
    if (existing) {
      const updated = { ...existing, ...updates, updatedAt: new Date() };
      this.settings.set(existing.id, updated);
      return updated;
    } else {
      // Create new settings
      const id = this.currentSettingsId++;
      const newSettings: TradingSettings = {
        id,
        userId,
        maxPositionSize: "100.00",
        maxPositions: 5,
        dailyLossLimit: "200.00",
        stopLossPercent: "15.00",
        takeProfitPercent: "30.00",
        autoTradingEnabled: true,
        sentimentThreshold: "0.8000",
        influencerThreshold: 5,
        ...updates,
        updatedAt: new Date(),
      };
      this.settings.set(id, newSettings);
      return newSettings;
    }
  }

  // Notification methods
  async getNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 20);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const newNotification: Notification = {
      id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority || null,
      read: notification.read || null,
      metadata: notification.metadata || null,
      createdAt: new Date(),
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;

    const updated = { ...notification, read: true };
    this.notifications.set(id, updated);
    return true;
  }
}

export const storage = new MemStorage();
