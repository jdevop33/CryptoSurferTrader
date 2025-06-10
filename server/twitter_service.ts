import { TwitterApi } from 'twitter-api-v2';

interface InfluencerAccount {
  username: string;
  followers: number;
  verified: boolean;
  category: 'whale' | 'analyst' | 'founder' | 'influencer';
}

interface TweetData {
  id: string;
  text: string;
  author: string;
  followers: number;
  engagement: number;
  timestamp: Date;
  tokens: string[];
  sentiment: number;
}

export class TwitterService {
  private client: TwitterApi | null = null;
  private isInitialized = false;
  private streamingRules: any[] = [];
  
  // High-value crypto influencers with 50K+ followers
  private readonly CRYPTO_INFLUENCERS: InfluencerAccount[] = [
    // Whales & Major Investors
    { username: 'elonmusk', followers: 100000000, verified: true, category: 'whale' },
    { username: 'VitalikButerin', followers: 5000000, verified: true, category: 'founder' },
    { username: 'novogratz', followers: 500000, verified: true, category: 'whale' },
    { username: 'APompliano', followers: 1800000, verified: true, category: 'analyst' },
    
    // Crypto Analysts & Researchers
    { username: 'WClementeIII', followers: 800000, verified: true, category: 'analyst' },
    { username: 'PlanB', followers: 2000000, verified: true, category: 'analyst' },
    { username: 'Pentosh1', followers: 600000, verified: true, category: 'analyst' },
    { username: 'RaoulGMI', followers: 1200000, verified: true, category: 'analyst' },
    
    // DeFi & Meme Coin Specialists
    { username: 'DegenSpartan', followers: 300000, verified: true, category: 'influencer' },
    { username: 'hsaka', followers: 250000, verified: true, category: 'analyst' },
    { username: 'DeFianceCapital', followers: 400000, verified: true, category: 'whale' },
    { username: 'alistairmilne', followers: 180000, verified: true, category: 'analyst' },
    
    // Meme Coin Focused
    { username: 'shibainuhodler', followers: 150000, verified: false, category: 'influencer' },
    { username: 'pepecoineth', followers: 120000, verified: false, category: 'influencer' },
    { username: 'flokiinu', followers: 800000, verified: true, category: 'founder' },
    { username: 'dogecoin', followers: 2000000, verified: true, category: 'founder' },
    
    // Trading & Technical Analysis
    { username: 'CryptoCred', followers: 400000, verified: true, category: 'analyst' },
    { username: 'crypto_birb', followers: 300000, verified: true, category: 'analyst' },
    { username: 'TechDev_52', followers: 250000, verified: true, category: 'analyst' },
    { username: 'InvestAnswers', followers: 500000, verified: true, category: 'analyst' },
    
    // Venture Capital & Institutional
    { username: 'Jelle', followers: 200000, verified: true, category: 'whale' },
    { username: 'VentureCoinist', followers: 180000, verified: true, category: 'analyst' },
    { username: 'KyleSamani', followers: 150000, verified: true, category: 'whale' },
    { username: 'ljxie', followers: 100000, verified: true, category: 'whale' }
  ];

  // Target meme coin tokens to monitor
  private readonly TARGET_TOKENS = [
    'DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BABYDOGE', 'SAFEMOON',
    'ELON', 'KISHU', 'AKITA', 'DOGELON', 'HOGE', 'CATGIRL'
  ];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const bearerToken = process.env.TWITTER_BEARER_TOKEN;
      if (!bearerToken) {
        console.warn('Twitter Bearer Token not found. Social sentiment monitoring disabled.');
        return;
      }

      this.client = new TwitterApi(bearerToken);
      await this.setupStreamingRules();
      this.isInitialized = true;
      console.log('🐦 Twitter Service initialized with', this.CRYPTO_INFLUENCERS.length, 'influencers');
    } catch (error) {
      console.error('Twitter Service initialization failed:', error);
    }
  }

  private async setupStreamingRules() {
    if (!this.client) return;

    try {
      // Create rules for monitoring influencer tweets mentioning target tokens
      const rules = [];
      
      // Rule for each influencer mentioning any target token
      for (const influencer of this.CRYPTO_INFLUENCERS) {
        const tokenMentions = this.TARGET_TOKENS.map(token => `$${token}`).join(' OR ');
        rules.push({
          value: `from:${influencer.username} (${tokenMentions})`,
          tag: `influencer_${influencer.username}`
        });
      }

      // General meme coin mentions with high engagement
      rules.push({
        value: `(${this.TARGET_TOKENS.map(t => `$${t}`).join(' OR ')}) has:links -is:retweet`,
        tag: 'high_engagement_tokens'
      });

      // Set up streaming rules
      await this.client.v2.updateStreamRules({
        add: rules.slice(0, 25) // Twitter limits to 25 rules for essential access
      });

      this.streamingRules = rules;
      console.log('🔗 Twitter streaming rules configured for', rules.length, 'patterns');
    } catch (error) {
      console.error('Failed to setup Twitter streaming rules:', error);
    }
  }

  async startStreaming(onTweetCallback: (tweet: TweetData) => void) {
    if (!this.client || !this.isInitialized) {
      console.warn('Twitter service not initialized. Using simulated data.');
      this.startSimulatedStream(onTweetCallback);
      return;
    }

    try {
      const stream = await this.client.v2.searchStream({
        'tweet.fields': ['public_metrics', 'created_at', 'author_id'],
        'user.fields': ['public_metrics', 'verified'],
        expansions: ['author_id']
      });

      stream.on('data', async (data: any) => {
        try {
          const tweet = await this.processTweet(data);
          if (tweet) {
            onTweetCallback(tweet);
          }
        } catch (error) {
          console.error('Error processing tweet:', error);
        }
      });

      stream.on('error', (error: any) => {
        console.error('Twitter stream error:', error);
        // Restart stream after delay
        setTimeout(() => this.startStreaming(onTweetCallback), 30000);
      });

      console.log('🚀 Twitter streaming started');
    } catch (error) {
      console.error('Failed to start Twitter stream:', error);
      this.startSimulatedStream(onTweetCallback);
    }
  }

  private async processTweet(data: any): Promise<TweetData | null> {
    try {
      const tweet = data.data;
      const author = data.includes?.users?.[0];
      
      if (!tweet || !author) return null;

      const tokens = this.extractTokens(tweet.text);
      if (tokens.length === 0) return null;

      const sentiment = this.analyzeSentiment(tweet.text);
      const engagement = this.calculateEngagement(tweet.public_metrics);

      return {
        id: tweet.id,
        text: tweet.text,
        author: author.username,
        followers: author.public_metrics?.followers_count || 0,
        engagement,
        timestamp: new Date(tweet.created_at),
        tokens,
        sentiment
      };
    } catch (error) {
      console.error('Error processing tweet data:', error);
      return null;
    }
  }

  private extractTokens(text: string): string[] {
    const tokens: string[] = [];
    const upperText = text.toUpperCase();
    
    for (const token of this.TARGET_TOKENS) {
      if (upperText.includes(`$${token}`) || upperText.includes(token)) {
        tokens.push(token);
      }
    }
    
    return [...new Set(tokens)]; // Remove duplicates
  }

  private analyzeSentiment(text: string): number {
    // Simple sentiment analysis - in production, use Alibaba Cloud NLP
    const positiveWords = ['moon', 'rocket', 'pump', 'bull', 'buy', 'hodl', 'diamond', 'gem'];
    const negativeWords = ['dump', 'crash', 'bear', 'sell', 'rip', 'dead', 'scam'];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 1;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 1;
    });
    
    // Normalize to -1 to 1 range
    return Math.max(-1, Math.min(1, score / 5));
  }

  private calculateEngagement(metrics: any): number {
    if (!metrics) return 0;
    return (metrics.like_count || 0) + 
           (metrics.retweet_count || 0) * 2 + 
           (metrics.reply_count || 0);
  }

  // Fallback simulation for development/testing
  private startSimulatedStream(onTweetCallback: (tweet: TweetData) => void) {
    console.log('📊 Starting simulated Twitter stream for development');
    
    setInterval(() => {
      const randomInfluencer = this.CRYPTO_INFLUENCERS[Math.floor(Math.random() * this.CRYPTO_INFLUENCERS.length)];
      const randomToken = this.TARGET_TOKENS[Math.floor(Math.random() * this.TARGET_TOKENS.length)];
      
      const simulatedTweet: TweetData = {
        id: Date.now().toString(),
        text: this.generateSimulatedTweet(randomToken),
        author: randomInfluencer.username,
        followers: randomInfluencer.followers,
        engagement: Math.floor(Math.random() * 1000) + 50,
        timestamp: new Date(),
        tokens: [randomToken],
        sentiment: (Math.random() - 0.5) * 2 // -1 to 1
      };
      
      onTweetCallback(simulatedTweet);
    }, 15000); // Every 15 seconds
  }

  private generateSimulatedTweet(token: string): string {
    const templates = [
      `Just saw some interesting movement in $${token}. Market looking bullish 🚀`,
      `$${token} showing strong support levels. Could be a good entry point.`,
      `Volume spike in $${token} - something big might be brewing`,
      `Technical analysis on $${token} suggests potential breakout incoming`,
      `Whales accumulating $${token}. Smart money moving in?`,
      `$${token} sentiment shifting positive. Community growth impressive`,
      `Market makers pushing $${token} lower. Good buying opportunity?`,
      `$${token} correlation with BTC weakening. Alt season vibes`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  getMonitoredInfluencers(): InfluencerAccount[] {
    return this.CRYPTO_INFLUENCERS;
  }

  getTargetTokens(): string[] {
    return this.TARGET_TOKENS;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export const twitterService = new TwitterService();