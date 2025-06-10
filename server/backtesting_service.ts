interface BacktestConfig {
  startDate: string;
  endDate: string;
  initialCapital: number;
  symbols: string[];
  strategy: 'sentiment' | 'technical' | 'hybrid';
  riskManagement: {
    maxPositionSize: number;
    stopLossPercent: number;
    takeProfitPercent: number;
    maxDrawdown: number;
  };
}

interface BacktestResult {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  trades: TradeResult[];
  dailyReturns: DailyReturn[];
  riskMetrics: RiskMetrics;
}

interface TradeResult {
  symbol: string;
  entryTime: Date;
  exitTime: Date;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  signal: 'BUY' | 'SELL';
  exitReason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'SIGNAL_CHANGE' | 'TIME_LIMIT';
}

interface DailyReturn {
  date: string;
  portfolioValue: number;
  dailyReturn: number;
  cumulativeReturn: number;
}

interface RiskMetrics {
  volatility: number;
  calmarRatio: number;
  sortinoRatio: number;
  var95: number;
  skewness: number;
  kurtosis: number;
}

export class BacktestingService {
  private historicalData: Map<string, any[]> = new Map();
  private sentimentData: Map<string, any[]> = new Map();

  async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    console.log('Starting backtesting for period:', config.startDate, 'to', config.endDate);
    
    // Load historical market data
    await this.loadHistoricalData(config.symbols, config.startDate, config.endDate);
    
    // Load historical sentiment data
    await this.loadSentimentData(config.symbols, config.startDate, config.endDate);
    
    // Run simulation
    const trades = await this.simulateTrading(config);
    
    // Calculate performance metrics
    const metrics = this.calculatePerformanceMetrics(trades, config.initialCapital);
    
    return metrics;
  }

  private async loadHistoricalData(symbols: string[], startDate: string, endDate: string) {
    const coinGeckoApiKey = process.env.COINGECKO_API_KEY;
    const baseUrl = coinGeckoApiKey 
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';
    
    const headers = coinGeckoApiKey 
      ? { 'x-cg-pro-api-key': coinGeckoApiKey }
      : {};

    const symbolToId = {
      'DOGE': 'dogecoin',
      'SHIB': 'shiba-inu', 
      'PEPE': 'pepe',
      'FLOKI': 'floki'
    };

    for (const symbol of symbols) {
      try {
        const coinId = symbolToId[symbol];
        if (!coinId) continue;

        const fromTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
        const toTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

        const response = await fetch(
          `${baseUrl}/coins/${coinId}/market_chart/range?vs_currency=usd&from=${fromTimestamp}&to=${toTimestamp}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        const processedData = data.prices.map((price: [number, number], index: number) => ({
          timestamp: new Date(price[0]),
          price: price[1],
          volume: data.total_volumes[index]?.[1] || 0,
          marketCap: data.market_caps[index]?.[1] || 0
        }));

        this.historicalData.set(symbol, processedData);
        console.log(`Loaded ${processedData.length} data points for ${symbol}`);

        // Rate limiting for free tier
        if (!coinGeckoApiKey) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to load historical data for ${symbol}:`, error);
      }
    }
  }

  private async loadSentimentData(symbols: string[], startDate: string, endDate: string) {
    // Simulate historical sentiment data since we don't have historical Twitter data
    for (const symbol of symbols) {
      const sentimentHistory = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        sentimentHistory.push({
          timestamp: new Date(d),
          sentiment: (Math.random() - 0.5) * 2, // -1 to 1
          mentions: Math.floor(Math.random() * 100) + 10,
          engagement: Math.floor(Math.random() * 1000) + 100
        });
      }
      
      this.sentimentData.set(symbol, sentimentHistory);
    }
  }

  private async simulateTrading(config: BacktestConfig): Promise<TradeResult[]> {
    const trades: TradeResult[] = [];
    const positions: Map<string, any> = new Map();
    let portfolioValue = config.initialCapital;

    // Get all unique dates across all symbols
    const allDates = this.getAllTradingDates(config.symbols);
    
    for (const date of allDates) {
      for (const symbol of config.symbols) {
        const marketData = this.getMarketDataForDate(symbol, date);
        const sentimentData = this.getSentimentDataForDate(symbol, date);
        
        if (!marketData || !sentimentData) continue;

        // Generate trading signal
        const signal = this.generateTradingSignal(marketData, sentimentData, config.strategy);
        
        // Check if we have a position
        const currentPosition = positions.get(symbol);
        
        if (signal === 'BUY' && !currentPosition) {
          // Open long position
          const positionSize = Math.min(
            config.riskManagement.maxPositionSize,
            portfolioValue * 0.1 // Max 10% per position
          );
          
          const shares = positionSize / marketData.price;
          positions.set(symbol, {
            symbol,
            entryTime: date,
            entryPrice: marketData.price,
            quantity: shares,
            stopLoss: marketData.price * (1 - config.riskManagement.stopLossPercent / 100),
            takeProfit: marketData.price * (1 + config.riskManagement.takeProfitPercent / 100)
          });
          
          portfolioValue -= positionSize;
          
        } else if (signal === 'SELL' && currentPosition) {
          // Close position
          const trade = this.closePosition(currentPosition, marketData, 'SIGNAL_CHANGE');
          trades.push(trade);
          portfolioValue += trade.quantity * marketData.price;
          positions.delete(symbol);
        }
        
        // Check stop loss and take profit for existing positions
        if (currentPosition) {
          let shouldClose = false;
          let exitReason: any = '';
          
          if (marketData.price <= currentPosition.stopLoss) {
            shouldClose = true;
            exitReason = 'STOP_LOSS';
          } else if (marketData.price >= currentPosition.takeProfit) {
            shouldClose = true;
            exitReason = 'TAKE_PROFIT';
          }
          
          if (shouldClose) {
            const trade = this.closePosition(currentPosition, marketData, exitReason);
            trades.push(trade);
            portfolioValue += trade.quantity * marketData.price;
            positions.delete(symbol);
          }
        }
      }
    }
    
    // Close any remaining positions
    for (const [symbol, position] of positions) {
      const finalMarketData = this.getLatestMarketData(symbol);
      if (finalMarketData) {
        const trade = this.closePosition(position, finalMarketData, 'TIME_LIMIT');
        trades.push(trade);
      }
    }
    
    return trades;
  }

  private generateTradingSignal(marketData: any, sentimentData: any, strategy: string): 'BUY' | 'SELL' | 'HOLD' {
    switch (strategy) {
      case 'sentiment':
        return sentimentData.sentiment > 0.3 ? 'BUY' : 
               sentimentData.sentiment < -0.3 ? 'SELL' : 'HOLD';
               
      case 'technical':
        // Simple momentum strategy
        const priceChange = marketData.priceChange24h || 0;
        return priceChange > 5 ? 'BUY' : 
               priceChange < -5 ? 'SELL' : 'HOLD';
               
      case 'hybrid':
        const sentimentScore = sentimentData.sentiment;
        const momentumScore = (marketData.priceChange24h || 0) / 100;
        const combinedScore = (sentimentScore + momentumScore) / 2;
        
        return combinedScore > 0.2 ? 'BUY' : 
               combinedScore < -0.2 ? 'SELL' : 'HOLD';
               
      default:
        return 'HOLD';
    }
  }

  private closePosition(position: any, marketData: any, exitReason: string): TradeResult {
    const pnl = (marketData.price - position.entryPrice) * position.quantity;
    const pnlPercent = ((marketData.price - position.entryPrice) / position.entryPrice) * 100;
    
    return {
      symbol: position.symbol,
      entryTime: position.entryTime,
      exitTime: new Date(),
      entryPrice: position.entryPrice,
      exitPrice: marketData.price,
      quantity: position.quantity,
      pnl,
      pnlPercent,
      signal: 'BUY', // Assuming we only do long positions for now
      exitReason: exitReason as any
    };
  }

  private calculatePerformanceMetrics(trades: TradeResult[], initialCapital: number): BacktestResult {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    
    const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    const totalReturn = (totalPnL / initialCapital) * 100;
    
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
    const avgWin = winningTrades.length > 0 ? 
      winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? 
      Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length) : 0;
    
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;
    
    // Calculate daily returns for risk metrics
    const dailyReturns = this.calculateDailyReturns(trades, initialCapital);
    const riskMetrics = this.calculateRiskMetrics(dailyReturns);
    
    const returns = dailyReturns.map(d => d.dailyReturn);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const returnStd = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    
    const sharpeRatio = returnStd > 0 ? (avgReturn / returnStd) * Math.sqrt(252) : 0;
    const maxDrawdown = this.calculateMaxDrawdown(dailyReturns);
    
    return {
      totalReturn,
      sharpeRatio,
      maxDrawdown,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      trades,
      dailyReturns,
      riskMetrics
    };
  }

  private calculateDailyReturns(trades: TradeResult[], initialCapital: number): DailyReturn[] {
    const dailyReturns: DailyReturn[] = [];
    let portfolioValue = initialCapital;
    
    // Group trades by date and calculate daily portfolio values
    const tradesByDate = new Map<string, TradeResult[]>();
    trades.forEach(trade => {
      const dateStr = trade.exitTime.toISOString().split('T')[0];
      if (!tradesByDate.has(dateStr)) {
        tradesByDate.set(dateStr, []);
      }
      tradesByDate.get(dateStr)!.push(trade);
    });
    
    let previousValue = initialCapital;
    for (const [dateStr, dayTrades] of tradesByDate) {
      const dayPnL = dayTrades.reduce((sum, trade) => sum + trade.pnl, 0);
      portfolioValue += dayPnL;
      
      const dailyReturn = ((portfolioValue - previousValue) / previousValue) * 100;
      const cumulativeReturn = ((portfolioValue - initialCapital) / initialCapital) * 100;
      
      dailyReturns.push({
        date: dateStr,
        portfolioValue,
        dailyReturn,
        cumulativeReturn
      });
      
      previousValue = portfolioValue;
    }
    
    return dailyReturns;
  }

  private calculateRiskMetrics(dailyReturns: DailyReturn[]): RiskMetrics {
    const returns = dailyReturns.map(d => d.dailyReturn);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized
    
    // Sortino ratio (downside deviation)
    const downsideReturns = returns.filter(r => r < 0);
    const downsideVariance = downsideReturns.length > 0 ? 
      downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downsideReturns.length : 0;
    const downsideDeviation = Math.sqrt(downsideVariance);
    const sortinoRatio = downsideDeviation > 0 ? avgReturn / downsideDeviation : 0;
    
    // VaR 95% (5th percentile)
    const sortedReturns = returns.sort((a, b) => a - b);
    const var95Index = Math.floor(returns.length * 0.05);
    const var95 = sortedReturns[var95Index] || 0;
    
    // Skewness and kurtosis
    const skewness = this.calculateSkewness(returns, avgReturn, Math.sqrt(variance));
    const kurtosis = this.calculateKurtosis(returns, avgReturn, Math.sqrt(variance));
    
    const maxDrawdown = this.calculateMaxDrawdown(dailyReturns);
    const calmarRatio = maxDrawdown > 0 ? (avgReturn * 252) / Math.abs(maxDrawdown) : 0;
    
    return {
      volatility,
      calmarRatio,
      sortinoRatio,
      var95,
      skewness,
      kurtosis
    };
  }

  private calculateMaxDrawdown(dailyReturns: DailyReturn[]): number {
    let maxDrawdown = 0;
    let peak = dailyReturns[0]?.portfolioValue || 0;
    
    for (const day of dailyReturns) {
      if (day.portfolioValue > peak) {
        peak = day.portfolioValue;
      }
      
      const drawdown = ((day.portfolioValue - peak) / peak) * 100;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }

  private calculateSkewness(values: number[], mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    const skewness = values.reduce((sum, value) => {
      return sum + Math.pow((value - mean) / stdDev, 3);
    }, 0) / values.length;
    return skewness;
  }

  private calculateKurtosis(values: number[], mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    const kurtosis = values.reduce((sum, value) => {
      return sum + Math.pow((value - mean) / stdDev, 4);
    }, 0) / values.length;
    return kurtosis - 3; // Excess kurtosis
  }

  private getAllTradingDates(symbols: string[]): Date[] {
    const allDates = new Set<string>();
    
    for (const symbol of symbols) {
      const data = this.historicalData.get(symbol) || [];
      data.forEach(point => {
        allDates.add(point.timestamp.toISOString().split('T')[0]);
      });
    }
    
    return Array.from(allDates)
      .sort()
      .map(dateStr => new Date(dateStr));
  }

  private getMarketDataForDate(symbol: string, date: Date): any {
    const data = this.historicalData.get(symbol) || [];
    const dateStr = date.toISOString().split('T')[0];
    
    return data.find(point => 
      point.timestamp.toISOString().split('T')[0] === dateStr
    );
  }

  private getSentimentDataForDate(symbol: string, date: Date): any {
    const data = this.sentimentData.get(symbol) || [];
    const dateStr = date.toISOString().split('T')[0];
    
    return data.find(point => 
      point.timestamp.toISOString().split('T')[0] === dateStr
    );
  }

  private getLatestMarketData(symbol: string): any {
    const data = this.historicalData.get(symbol) || [];
    return data[data.length - 1];
  }
}

export const backtestingService = new BacktestingService();