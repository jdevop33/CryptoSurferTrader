import axios from 'axios';

interface PriceData {
  symbol: string;
  price: number;
  priceUsd: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  liquidity: number;
}

interface TokenInfo {
  id: string;
  symbol: string;
  name: string;
  platforms: any;
}

export class FreeMarketDataService {
  private tokenCache: Map<string, TokenInfo> = new Map();
  private priceCache: Map<string, PriceData> = new Map();
  private lastUpdate = 0;
  private updateInterval = 30000; // 30 seconds cache

  constructor() {
    this.initializeTokenMapping();
  }

  private async initializeTokenMapping() {
    // Free CoinGecko API - no key required, 50 calls/minute
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/list?include_platform=true');
      response.data.forEach((token: TokenInfo) => {
        this.tokenCache.set(token.symbol.toUpperCase(), token);
      });
      console.log('Free market data service initialized with', this.tokenCache.size, 'tokens');
    } catch (error) {
      console.error('Failed to initialize token mapping:', error);
    }
  }

  async getRealTimePrices(): Promise<PriceData[]> {
    const now = Date.now();
    if (now - this.lastUpdate < this.updateInterval && this.priceCache.size > 0) {
      return Array.from(this.priceCache.values());
    }

    try {
      // Use multiple free APIs for reliability
      const prices = await this.fetchFromMultipleSources();
      
      prices.forEach(price => {
        this.priceCache.set(price.symbol, price);
      });
      
      this.lastUpdate = now;
      return prices;
    } catch (error) {
      console.error('Failed to fetch real-time prices:', error);
      // Return cached data if available
      return Array.from(this.priceCache.values());
    }
  }

  private async fetchFromMultipleSources(): Promise<PriceData[]> {
    const sources = [
      () => this.fetchFromCoinGecko(),
      () => this.fetchFromCoinCapAPI(),
      () => this.fetchFromCryptoCompare()
    ];

    for (const source of sources) {
      try {
        const data = await source();
        if (data.length > 0) {
          console.log('Successfully fetched prices from source');
          return data;
        }
      } catch (error) {
        console.log('Source failed, trying next...');
        continue;
      }
    }

    throw new Error('All free API sources failed');
  }

  private async fetchFromCoinGecko(): Promise<PriceData[]> {
    const symbols = ['dogecoin', 'shiba-inu', 'pepe', 'floki'];
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbols.join(',')}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
      { timeout: 10000 }
    );

    const data = response.data;
    return [
      {
        symbol: 'DOGE',
        price: data.dogecoin?.usd || 0,
        priceUsd: data.dogecoin?.usd || 0,
        marketCap: data.dogecoin?.usd_market_cap || 0,
        volume24h: data.dogecoin?.usd_24h_vol || 0,
        priceChange24h: data.dogecoin?.usd_24h_change || 0,
        liquidity: (data.dogecoin?.usd_market_cap || 0) * 0.1
      },
      {
        symbol: 'SHIB',
        price: data['shiba-inu']?.usd || 0,
        priceUsd: data['shiba-inu']?.usd || 0,
        marketCap: data['shiba-inu']?.usd_market_cap || 0,
        volume24h: data['shiba-inu']?.usd_24h_vol || 0,
        priceChange24h: data['shiba-inu']?.usd_24h_change || 0,
        liquidity: (data['shiba-inu']?.usd_market_cap || 0) * 0.1
      },
      {
        symbol: 'PEPE',
        price: data.pepe?.usd || 0,
        priceUsd: data.pepe?.usd || 0,
        marketCap: data.pepe?.usd_market_cap || 0,
        volume24h: data.pepe?.usd_24h_vol || 0,
        priceChange24h: data.pepe?.usd_24h_change || 0,
        liquidity: (data.pepe?.usd_market_cap || 0) * 0.1
      },
      {
        symbol: 'FLOKI',
        price: data.floki?.usd || 0,
        priceUsd: data.floki?.usd || 0,
        marketCap: data.floki?.usd_market_cap || 0,
        volume24h: data.floki?.usd_24h_vol || 0,
        priceChange24h: data.floki?.usd_24h_change || 0,
        liquidity: (data.floki?.usd_market_cap || 0) * 0.1
      }
    ].filter(token => token.price > 0);
  }

  private async fetchFromCoinCapAPI(): Promise<PriceData[]> {
    // CoinCap API - completely free, no limits
    const response = await axios.get(
      'https://api.coincap.io/v2/assets?ids=dogecoin,shiba-inu,pepe,floki-inu&limit=10',
      { timeout: 10000 }
    );

    return response.data.data.map((coin: any) => ({
      symbol: this.mapCoinCapSymbol(coin.id),
      price: parseFloat(coin.priceUsd) || 0,
      priceUsd: parseFloat(coin.priceUsd) || 0,
      marketCap: parseFloat(coin.marketCapUsd) || 0,
      volume24h: parseFloat(coin.volumeUsd24Hr) || 0,
      priceChange24h: parseFloat(coin.changePercent24Hr) || 0,
      liquidity: (parseFloat(coin.marketCapUsd) || 0) * 0.1
    })).filter(token => token.price > 0);
  }

  private async fetchFromCryptoCompare(): Promise<PriceData[]> {
    // CryptoCompare API - free tier, 100k calls/month
    const symbols = 'DOGE,SHIB,PEPE,FLOKI';
    const response = await axios.get(
      `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbols}&tsyms=USD`,
      { timeout: 10000 }
    );

    const data = response.data.RAW;
    const results: PriceData[] = [];

    ['DOGE', 'SHIB', 'PEPE', 'FLOKI'].forEach(symbol => {
      if (data[symbol]?.USD) {
        const coinData = data[symbol].USD;
        results.push({
          symbol,
          price: coinData.PRICE || 0,
          priceUsd: coinData.PRICE || 0,
          marketCap: coinData.MKTCAP || 0,
          volume24h: coinData.VOLUME24HOURTO || 0,
          priceChange24h: coinData.CHANGEPCT24HOUR || 0,
          liquidity: (coinData.MKTCAP || 0) * 0.1
        });
      }
    });

    return results.filter(token => token.price > 0);
  }

  private mapCoinCapSymbol(id: string): string {
    const mapping: Record<string, string> = {
      'dogecoin': 'DOGE',
      'shiba-inu': 'SHIB',
      'pepe': 'PEPE',
      'floki-inu': 'FLOKI'
    };
    return mapping[id] || id.toUpperCase();
  }

  async getTokenPrice(symbol: string): Promise<number> {
    const prices = await this.getRealTimePrices();
    const token = prices.find(p => p.symbol === symbol.toUpperCase());
    return token?.price || 0;
  }

  async getMarketDepth(symbol: string): Promise<any> {
    const prices = await this.getRealTimePrices();
    const token = prices.find(p => p.symbol === symbol.toUpperCase());
    
    if (!token) {
      throw new Error(`Token ${symbol} not found`);
    }

    // Generate realistic order book based on market data
    return {
      symbol,
      price: token.price,
      liquidity: token.liquidity,
      buyOrders: this.generateOrderBook(token.price, 'buy', token.volume24h),
      sellOrders: this.generateOrderBook(token.price, 'sell', token.volume24h),
      spread: token.price * 0.002, // 0.2% spread estimate
      volume24h: token.volume24h
    };
  }

  private generateOrderBook(price: number, side: 'buy' | 'sell', volume24h: number): any[] {
    const orders = [];
    const priceStep = price * 0.001; // 0.1% price steps
    const baseVolume = volume24h / 1000; // Distribute volume across orders
    
    for (let i = 1; i <= 10; i++) {
      const orderPrice = side === 'buy' 
        ? price - (priceStep * i) 
        : price + (priceStep * i);
      
      const size = baseVolume * (1 + Math.random()) / i;
      
      orders.push({
        price: orderPrice,
        size: size,
        total: orderPrice * size
      });
    }
    
    return orders;
  }

  // DEX price simulation without requiring actual blockchain calls
  async simulateSwapPrice(tokenIn: string, tokenOut: string, amountIn: number): Promise<any> {
    const prices = await this.getRealTimePrices();
    const tokenInData = prices.find(p => p.symbol === tokenIn.toUpperCase());
    const tokenOutData = prices.find(p => p.symbol === tokenOut.toUpperCase());
    
    if (!tokenInData || !tokenOutData) {
      throw new Error('Token pair not supported');
    }

    const inputValueUSD = amountIn * tokenInData.price;
    const slippage = this.calculateSlippage(inputValueUSD, tokenOutData.liquidity);
    const effectivePrice = tokenOutData.price * (1 + slippage);
    const outputAmount = inputValueUSD / effectivePrice;
    
    return {
      inputAmount: amountIn,
      inputSymbol: tokenIn,
      outputAmount: outputAmount,
      outputSymbol: tokenOut,
      inputValueUSD: inputValueUSD,
      outputValueUSD: outputAmount * tokenOutData.price,
      priceImpact: slippage * 100,
      estimatedGas: 150000,
      gasCostUSD: 12, // Estimate based on current gas prices
      route: [`${tokenIn} → WETH → ${tokenOut}`]
    };
  }

  private calculateSlippage(tradeSize: number, liquidity: number): number {
    // Simplified slippage calculation
    const impactFactor = tradeSize / liquidity;
    return Math.min(impactFactor * 0.1, 0.05); // Max 5% slippage
  }

  // Check if we can access premium features without cost
  async checkFreeTrials(): Promise<any> {
    const trials = {
      coinGeckoPro: false,
      moralis: false,
      infura: false,
      alchemy: false
    };

    // CoinGecko offers 30-day free trial for new accounts
    try {
      const response = await axios.get('https://pro-api.coingecko.com/api/v3/ping', {
        headers: { 'x-cg-pro-api-key': 'test' },
        timeout: 5000
      });
      trials.coinGeckoPro = false; // Would need valid trial key
    } catch (error) {
      // Expected to fail without valid key
    }

    return {
      availableTrials: trials,
      recommendations: [
        'CoinGecko Pro: 30-day free trial available at https://www.coingecko.com/en/api/pricing',
        'Moralis: Free tier with 40k requests/month at https://moralis.io/pricing/',
        'Infura: Free tier with 100k requests/day at https://infura.io/pricing',
        'Alchemy: Free tier with 300M compute units/month at https://alchemy.com/pricing'
      ],
      currentlyUsing: [
        'CoinGecko Free API (50 calls/minute)',
        'CoinCap API (unlimited)',
        'CryptoCompare Free (100k calls/month)'
      ]
    };
  }

  isReady(): boolean {
    return this.tokenCache.size > 0;
  }

  // Rate limiting awareness
  async getRemainingCalls(): Promise<any> {
    // Since we're using free APIs, return conservative estimates
    return {
      coinGeckoFree: 50, // per minute
      coinCap: 'unlimited',
      cryptoCompare: 1000, // per hour estimate
      nextResetTime: new Date(Date.now() + 60000).toISOString()
    };
  }
}

export const freeMarketDataService = new FreeMarketDataService();