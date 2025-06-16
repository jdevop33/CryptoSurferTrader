import { 
  type User, 
  type UpsertUser,
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
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User>;
  updateUserSubscription(userId: string, subscription: {
    subscriptionStatus: string;
    stripeSubscriptionId: string | null;
    subscriptionExpiresAt: Date | null;
  }): Promise<User>;

  // Trading position methods
  getActivePositions(userId: string): Promise<TradingPosition[]>;
  getPosition(id: number): Promise<TradingPosition | undefined>;
  createPosition(position: InsertTradingPosition): Promise<TradingPosition>;
  updatePosition(id: number, updates: Partial<TradingPosition>): Promise<TradingPosition | undefined>;
  closePosition(id: number): Promise<boolean>;

  // Trade history methods
  getTradeHistory(userId: string, limit?: number): Promise<TradeHistory[]>;
  createTrade(trade: InsertTradeHistory): Promise<TradeHistory>;

  // Social sentiment methods
  getSocialSentiment(symbols?: string[]): Promise<SocialSentiment[]>;
  updateSocialSentiment(sentiment: InsertSocialSentiment): Promise<SocialSentiment>;

  // Trading settings methods
  getTradingSettings(userId: string): Promise<TradingSettings | undefined>;
  updateTradingSettings(userId: string, updates: Partial<TradingSettings>): Promise<TradingSettings>;

  // Notification methods
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<boolean>;

  // Portfolio methods
  getPortfolio(userId: string): Promise<{ totalValue: string; dailyPnL: string; assets: any[] } | null>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private positions: Map<number, TradingPosition>;
  private trades: Map<number, TradeHistory>;
  private sentiments: Map<string, SocialSentiment>;
  private settings: Map<string, TradingSettings>;
  private notifications: Map<number, Notification>;

  private currentPositionId: number;
  private currentTradeId: number;
  private currentSentimentId: number;
  private currentNotificationId: number;

  constructor() {
    this.users = new Map();
    this.positions = new Map();
    this.trades = new Map();
    this.sentiments = new Map();
    this.settings = new Map();
    this.notifications = new Map();

    this.currentPositionId = 1;
    this.currentTradeId = 1;
    this.currentSentimentId = 1;
    this.currentNotificationId = 1;

    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default user for testing
    const defaultUser: User = {
      id: "user_1",
      email: "demo@trading.com",
      password: null,
      firstName: "Demo",
      lastName: "User",
      profileImageUrl: null,
      walletAddress: "0x742d35Cc6634C0532925a3b8D6Ac0C8F1234567",
      subscriptionStatus: "free",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionExpiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create default trading settings
    const defaultSettings: TradingSettings = {
      id: 1,
      userId: "user_1",
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
    this.settings.set("user_1", defaultSettings);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: UpsertUser): Promise<User> {
    const user: User = { 
      id: insertUser.id,
      email: insertUser.email || null,
      password: insertUser.password || null,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      profileImageUrl: insertUser.profileImageUrl || null,
      walletAddress: insertUser.walletAddress || null,
      subscriptionStatus: insertUser.subscriptionStatus || "free",
      stripeCustomerId: insertUser.stripeCustomerId || null,
      stripeSubscriptionId: insertUser.stripeSubscriptionId || null,
      subscriptionExpiresAt: insertUser.subscriptionExpiresAt || null,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, stripeCustomerId, updatedAt: new Date() };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserSubscription(userId: string, subscription: {
    subscriptionStatus: string;
    stripeSubscriptionId: string | null;
    subscriptionExpiresAt: Date | null;
  }): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { 
      ...user, 
      ...subscription,
      updatedAt: new Date() 
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Trading position methods
  async getActivePositions(userId: string): Promise<TradingPosition[]> {
    return Array.from(this.positions.values()).filter(
      position => position.userId === userId && position.status === "open"
    );
  }

  async getPosition(id: number): Promise<TradingPosition | undefined> {
    return this.positions.get(id);
  }

  async createPosition(position: InsertTradingPosition): Promise<TradingPosition> {
    const id = this.currentPositionId++;
    const newPosition: TradingPosition = {
      id,
      symbol: position.symbol,
      userId: position.userId,
      exchange: position.exchange,
      side: position.side,
      entryPrice: position.entryPrice,
      currentPrice: position.currentPrice || null,
      size: position.size,
      pnl: position.pnl || "0",
      pnlPercent: position.pnlPercent || "0",
      status: position.status || "open",
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

    const closedPosition = { ...position, status: "closed" as const, closedAt: new Date() };
    this.positions.set(id, closedPosition);
    return true;
  }

  // Trade history methods
  async getTradeHistory(userId: string, limit: number = 50): Promise<TradeHistory[]> {
    return Array.from(this.trades.values())
      .filter(trade => trade.userId === userId)
      .sort((a, b) => b.executedAt!.getTime() - a.executedAt!.getTime())
      .slice(0, limit);
  }

  async createTrade(trade: InsertTradeHistory): Promise<TradeHistory> {
    const id = this.currentTradeId++;
    const newTrade: TradeHistory = {
      id,
      symbol: trade.symbol,
      userId: trade.userId,
      exchange: trade.exchange,
      entryPrice: trade.entryPrice,
      size: trade.size,
      pnl: trade.pnl || null,
      type: trade.type,
      positionId: trade.positionId || null,
      exitPrice: trade.exitPrice || null,
      trigger: trade.trigger || null,
      metadata: trade.metadata || {},
      executedAt: new Date(),
    };
    this.trades.set(id, newTrade);
    return newTrade;
  }

  // Social sentiment methods
  async getSocialSentiment(symbols?: string[]): Promise<SocialSentiment[]> {
    const allSentiments = Array.from(this.sentiments.values());
    if (!symbols) return allSentiments;
    return allSentiments.filter(sentiment => symbols.includes(sentiment.symbol));
  }

  async updateSocialSentiment(sentiment: InsertSocialSentiment): Promise<SocialSentiment> {
    const id = this.currentSentimentId++;
    const newSentiment: SocialSentiment = {
      id,
      symbol: sentiment.symbol,
      sentimentScore: sentiment.sentimentScore,
      metadata: sentiment.metadata || {},
      mentions: sentiment.mentions || null,
      influencerCount: sentiment.influencerCount || null,
      marketCap: sentiment.marketCap || null,
      volumeChange: sentiment.volumeChange || null,
      timestamp: new Date(),
    };
    this.sentiments.set(sentiment.symbol, newSentiment);
    return newSentiment;
  }

  // Trading settings methods
  async getTradingSettings(userId: string): Promise<TradingSettings | undefined> {
    return this.settings.get(userId);
  }

  async updateTradingSettings(userId: string, updates: Partial<TradingSettings>): Promise<TradingSettings> {
    const existing = this.settings.get(userId);
    if (existing) {
      const updated = { ...existing, ...updates, updatedAt: new Date() };
      this.settings.set(userId, updated);
      return updated;
    } else {
      const newSettings: TradingSettings = {
        id: this.currentSentimentId++,
        userId,
        maxPositionSize: "100.00",
        maxPositions: 5,
        dailyLossLimit: "200.00",
        stopLossPercent: "15.00",
        takeProfitPercent: "30.00",
        autoTradingEnabled: true,
        sentimentThreshold: "0.8000",
        influencerThreshold: 5,
        updatedAt: new Date(),
        ...updates,
      };
      this.settings.set(userId, newSettings);
      return newSettings;
    }
  }

  // Notification methods
  async getNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const newNotification: Notification = {
      id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata || {},
      priority: notification.priority || null,
      read: notification.read || false,
      createdAt: new Date(),
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;

    const updatedNotification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    return true;
  }

  // Portfolio methods
  async getPortfolio(userId: string): Promise<{ totalValue: string; dailyPnL: string; assets: any[] } | null> {
    const positions = await this.getActivePositions(userId);
    const totalValue = positions.reduce((sum, pos) => sum + parseFloat(pos.pnl || "0"), 10000);
    const dailyPnL = positions.reduce((sum, pos) => sum + parseFloat(pos.pnl || "0"), 0);

    return {
      totalValue: totalValue.toFixed(2),
      dailyPnL: dailyPnL.toFixed(2),
      assets: positions.map(pos => ({
        symbol: pos.symbol,
        size: pos.size,
        pnl: pos.pnl,
        pnlPercent: pos.pnlPercent,
      }))
    };
  }
}

export const storage = new MemStorage();