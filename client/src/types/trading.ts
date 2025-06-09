export interface TradingPosition {
  id: number;
  userId: number;
  symbol: string;
  exchange: string;
  side: 'buy' | 'sell';
  entryPrice: string;
  currentPrice?: string;
  size: string;
  pnl?: string;
  pnlPercent?: string;
  status: 'open' | 'closed' | 'pending';
  stopLoss?: string;
  takeProfit?: string;
  createdAt: string;
  closedAt?: string;
}

export interface TradeHistory {
  id: number;
  userId: number;
  positionId?: number;
  symbol: string;
  exchange: string;
  type: 'buy' | 'sell';
  entryPrice: string;
  exitPrice?: string;
  size: string;
  pnl?: string;
  trigger?: 'social' | 'stop_loss' | 'take_profit' | 'manual';
  metadata?: any;
  executedAt: string;
}

export interface SocialSentiment {
  id: number;
  symbol: string;
  sentimentScore: number;
  mentions: number;
  influencerCount: number;
  marketCap?: number;
  volumeChange?: number;
  metadata?: any;
  timestamp: string;
}

export interface TradingSettings {
  id: number;
  userId: number;
  maxPositionSize: string;
  maxPositions: number;
  dailyLossLimit: string;
  stopLossPercent: string;
  takeProfitPercent: string;
  autoTradingEnabled: boolean;
  sentimentThreshold: string;
  influencerThreshold: number;
  updatedAt: string;
}

export interface Portfolio {
  totalValue: string;
  dailyPnL: string;
  activePositions: number;
  maxPositions: number;
  availableFunds: string;
  positions: TradingPosition[];
}

export interface Notification {
  id: number;
  userId: number;
  type: 'trade' | 'alert' | 'risk' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  read: boolean;
  metadata?: any;
  createdAt: string;
}

export interface TradingSignal {
  symbol: string;
  action: 'buy' | 'sell';
  reason: string;
  sentimentScore?: number;
  influencerCount?: number;
  mentionCount?: number;
  timestamp: string;
  exchange: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  timestamp: string;
}

export interface RiskMetrics {
  dailyLossUsed: number;
  dailyLossLimit: number;
  positionExposure: number;
  maxExposure: number;
  riskLevel: 'low' | 'moderate' | 'high';
}

export interface SentimentToken {
  symbol: string;
  name: string;
  sentimentScore: number;
  mentions: number;
  influencers: number;
  marketCap?: number;
  change24h?: number;
  isQualified: boolean; // Meets buy criteria
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  volume?: number;
}

export interface PortfolioStats {
  totalReturn: number;
  winRate: number;
  avgHoldTime: string;
  totalTrades: number;
  profitableTrades: number;
  maxDrawdown: number;
  sharpeRatio?: number;
}

export interface ExchangeConfig {
  name: string;
  apiKey: string;
  apiSecret: string;
  sandbox?: boolean;
  fees: {
    maker: number;
    taker: number;
  };
}

export interface TradingEngineStatus {
  isRunning: boolean;
  autoTradingEnabled: boolean;
  lastUpdate: string;
  connectedExchanges: string[];
  activeStrategies: string[];
  systemHealth: 'healthy' | 'warning' | 'error';
}

export interface WebSocketMessage {
  type: 'portfolio_update' | 'position_update' | 'sentiment_update' | 'trade_alert' | 'notification' | 'price_update';
  data: any;
  timestamp: string;
  userId?: number;
}

export interface MetaMaskAccount {
  address: string;
  chainId: string;
  balance?: string;
  isConnected: boolean;
}

export interface DEXTrade {
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  amountIn: string;
  amountOut: string;
  slippage: number;
  gasPrice: string;
  gasLimit: string;
}

export interface InfluencerMention {
  username: string;
  tweetId: string;
  timestamp: string;
  engagement: number;
  text: string;
  marketCap?: number;
}

export interface SocialVolumeData {
  symbol: string;
  volume24h: number;
  volumeChange: number;
  peakVolume: number;
  mentions: InfluencerMention[];
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Trading Engine Events
export type TradingEvent = 
  | { type: 'position_opened'; payload: TradingPosition }
  | { type: 'position_closed'; payload: TradingPosition }
  | { type: 'stop_loss_triggered'; payload: TradingPosition }
  | { type: 'take_profit_triggered'; payload: TradingPosition }
  | { type: 'social_signal_detected'; payload: TradingSignal }
  | { type: 'risk_limit_exceeded'; payload: RiskMetrics }
  | { type: 'emergency_stop'; payload: { reason: string } };
