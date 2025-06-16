/**
 * Prediction Tracker Service
 * Manages transparent predictions on blockchain with agent performance tracking
 */

interface AgentPrediction {
  id: string;
  userId: string;
  agentName: string;
  symbol: string;
  prediction: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  targetPrice: number;
  currentPrice: number;
  timestamp: Date;
  timeframe: '1h' | '4h' | '1d' | '7d' | '30d';
  reasoning: string[];
  blockchainTxHash?: string;
  status: 'active' | 'completed' | 'expired';
  outcome?: 'correct' | 'incorrect' | 'partial';
  actualPrice?: number;
  profitLoss?: number;
}

interface AgentPerformance {
  agentName: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  avgConfidence: number;
  totalProfitLoss: number;
  winRate: number;
  ranking: number;
  bestTimeframe: string;
  recentForm: number; // Last 10 predictions accuracy
}

interface UserAgentPortfolio {
  userId: string;
  selectedAgents: string[];
  allocationPercentages: Record<string, number>;
  totalValue: number;
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
    allTime: number;
  };
  activePredictions: AgentPrediction[];
  rank: number;
}

export class PredictionTracker {
  private predictions: Map<string, AgentPrediction> = new Map();
  private agentPerformance: Map<string, AgentPerformance> = new Map();
  private userPortfolios: Map<string, UserAgentPortfolio> = new Map();

  constructor() {
    this.initializeAgentPerformance();
    this.startPerformanceUpdates();
  }

  private initializeAgentPerformance() {
    const agents = [
      'Jim Simons',
      'Ray Dalio', 
      'Paul Tudor Jones',
      'George Soros',
      'Peter Lynch',
      'Warren Buffett',
      'Carl Icahn',
      'David Tepper'
    ];

    agents.forEach(agent => {
      this.agentPerformance.set(agent, {
        agentName: agent,
        totalPredictions: Math.floor(Math.random() * 100) + 50,
        correctPredictions: 0,
        accuracy: 0.65 + Math.random() * 0.25, // 65-90% base accuracy
        avgConfidence: 0.7 + Math.random() * 0.2,
        totalProfitLoss: (Math.random() - 0.3) * 50000, // -15k to +35k range
        winRate: 0.6 + Math.random() * 0.3,
        ranking: 0,
        bestTimeframe: ['1h', '4h', '1d', '7d'][Math.floor(Math.random() * 4)],
        recentForm: 0.5 + Math.random() * 0.4
      });
    });

    this.updateRankings();
  }

  async createPrediction(
    userId: string,
    agentName: string,
    symbol: string,
    prediction: 'BUY' | 'SELL' | 'HOLD',
    confidence: number,
    targetPrice: number,
    currentPrice: number,
    timeframe: '1h' | '4h' | '1d' | '7d' | '30d',
    reasoning: string[]
  ): Promise<AgentPrediction> {
    const predictionId = `${Date.now()}_${userId}_${agentName}_${symbol}`;
    
    const agentPrediction: AgentPrediction = {
      id: predictionId,
      userId,
      agentName,
      symbol,
      prediction,
      confidence,
      targetPrice,
      currentPrice,
      timestamp: new Date(),
      timeframe,
      reasoning,
      status: 'active',
      blockchainTxHash: await this.submitToBlockchain(predictionId, prediction)
    };

    this.predictions.set(predictionId, agentPrediction);
    this.updateUserPortfolio(userId, agentPrediction);
    
    return agentPrediction;
  }

  private async submitToBlockchain(predictionId: string, prediction: string): Promise<string> {
    // Simulate blockchain submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `0x${Math.random().toString(16).substr(2, 40)}`;
  }

  async resolvePrediction(predictionId: string, actualPrice: number): Promise<void> {
    const prediction = this.predictions.get(predictionId);
    if (!prediction) return;

    const priceDiff = actualPrice - prediction.currentPrice;
    const targetDiff = prediction.targetPrice - prediction.currentPrice;
    
    let outcome: 'correct' | 'incorrect' | 'partial' = 'incorrect';
    let profitLoss = 0;

    if (prediction.prediction === 'BUY' && priceDiff > 0) {
      outcome = Math.abs(priceDiff - targetDiff) < Math.abs(targetDiff) * 0.2 ? 'correct' : 'partial';
      profitLoss = priceDiff * 100; // Assume $100 position
    } else if (prediction.prediction === 'SELL' && priceDiff < 0) {
      outcome = Math.abs(priceDiff - targetDiff) < Math.abs(targetDiff) * 0.2 ? 'correct' : 'partial';
      profitLoss = Math.abs(priceDiff) * 100;
    } else if (prediction.prediction === 'HOLD' && Math.abs(priceDiff) < prediction.currentPrice * 0.05) {
      outcome = 'correct';
      profitLoss = 0;
    }

    prediction.status = 'completed';
    prediction.outcome = outcome;
    prediction.actualPrice = actualPrice;
    prediction.profitLoss = profitLoss;

    this.updateAgentPerformance(prediction.agentName, outcome, profitLoss);
    this.updateUserPortfolio(prediction.userId, prediction);
  }

  private updateAgentPerformance(agentName: string, outcome: string, profitLoss: number) {
    const performance = this.agentPerformance.get(agentName);
    if (!performance) return;

    performance.totalPredictions++;
    if (outcome === 'correct') performance.correctPredictions++;
    performance.accuracy = performance.correctPredictions / performance.totalPredictions;
    performance.totalProfitLoss += profitLoss;
    performance.winRate = performance.correctPredictions / performance.totalPredictions;

    this.updateRankings();
  }

  private updateRankings() {
    const agents = Array.from(this.agentPerformance.values());
    agents.sort((a, b) => {
      const scoreA = a.accuracy * 0.4 + a.winRate * 0.3 + (a.totalProfitLoss / 10000) * 0.3;
      const scoreB = b.accuracy * 0.4 + b.winRate * 0.3 + (b.totalProfitLoss / 10000) * 0.3;
      return scoreB - scoreA;
    });

    agents.forEach((agent, index) => {
      agent.ranking = index + 1;
      this.agentPerformance.set(agent.agentName, agent);
    });
  }

  private updateUserPortfolio(userId: string, prediction: AgentPrediction) {
    let portfolio = this.userPortfolios.get(userId);
    if (!portfolio) {
      portfolio = {
        userId,
        selectedAgents: [],
        allocationPercentages: {},
        totalValue: 10000, // Starting value
        performance: { daily: 0, weekly: 0, monthly: 0, allTime: 0 },
        activePredictions: [],
        rank: 0
      };
    }

    if (prediction.status === 'active') {
      portfolio.activePredictions.push(prediction);
    } else if (prediction.profitLoss !== undefined) {
      portfolio.totalValue += prediction.profitLoss;
      portfolio.activePredictions = portfolio.activePredictions.filter(p => p.id !== prediction.id);
    }

    this.userPortfolios.set(userId, portfolio);
    this.updateUserRankings();
  }

  private updateUserRankings() {
    const users = Array.from(this.userPortfolios.values());
    users.sort((a, b) => b.totalValue - a.totalValue);
    users.forEach((user, index) => {
      user.rank = index + 1;
      this.userPortfolios.set(user.userId, user);
    });
  }

  private startPerformanceUpdates() {
    setInterval(() => {
      // Simulate price updates and resolve predictions
      this.simulateMarketUpdates();
    }, 30000); // Every 30 seconds
  }

  private simulateMarketUpdates() {
    const activePredictions = Array.from(this.predictions.values())
      .filter(p => p.status === 'active');

    activePredictions.forEach(prediction => {
      const timeElapsed = Date.now() - prediction.timestamp.getTime();
      const timeframeMs = this.getTimeframeMs(prediction.timeframe);
      
      if (timeElapsed > timeframeMs) {
        const volatility = 0.1; // 10% volatility
        const actualPrice = prediction.currentPrice * (1 + (Math.random() - 0.5) * volatility);
        this.resolvePrediction(prediction.id, actualPrice);
      }
    });
  }

  private getTimeframeMs(timeframe: string): number {
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    return timeframes[timeframe] || timeframes['1d'];
  }

  // Public API methods
  getAgentPerformance(): AgentPerformance[] {
    return Array.from(this.agentPerformance.values())
      .sort((a, b) => a.ranking - b.ranking);
  }

  getUserPortfolio(userId: string): UserAgentPortfolio | undefined {
    return this.userPortfolios.get(userId);
  }

  getActivePredictions(userId?: string): AgentPrediction[] {
    const predictions = Array.from(this.predictions.values())
      .filter(p => p.status === 'active');
    
    if (userId) {
      return predictions.filter(p => p.userId === userId);
    }
    return predictions;
  }

  getRecentPredictions(limit: number = 50): AgentPrediction[] {
    return Array.from(this.predictions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getLeaderboard(): UserAgentPortfolio[] {
    return Array.from(this.userPortfolios.values())
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 100);
  }

  async updateUserAgents(userId: string, selectedAgents: string[], allocations: Record<string, number>) {
    let portfolio = this.userPortfolios.get(userId);
    if (!portfolio) {
      portfolio = {
        userId,
        selectedAgents: [],
        allocationPercentages: {},
        totalValue: 10000,
        performance: { daily: 0, weekly: 0, monthly: 0, allTime: 0 },
        activePredictions: [],
        rank: 0
      };
    }

    portfolio.selectedAgents = selectedAgents;
    portfolio.allocationPercentages = allocations;
    this.userPortfolios.set(userId, portfolio);
  }
}

export const predictionTracker = new PredictionTracker();