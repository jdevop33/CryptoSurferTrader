import { TwitterApi, ETwitterStreamEvent, TweetV2SingleStreamResult } from 'twitter-api-v2';

interface EnhancedTweetData {
  id: string;
  text: string;
  authorId: string;
  authorUsername: string;
  publicMetrics: {
    retweetCount: number;
    likeCount: number;
    replyCount: number;
    quoteCount: number;
  };
  contextAnnotations?: any[];
  entities?: {
    hashtags?: Array<{ tag: string }>;
    mentions?: Array<{ username: string }>;
    cashtags?: Array<{ tag: string }>;
  };
  createdAt: string;
  sentiment: number;
  relevanceScore: number;
}

interface StreamingRule {
  value: string;
  tag: string;
  id?: string;
}

export class EnhancedTwitterService {
  private client: TwitterApi | null = null;
  private stream: any = null;
  private isStreaming = false;
  private activeRules: StreamingRule[] = [];
  
  // High-impact crypto influencers for targeted monitoring
  private readonly CRYPTO_INFLUENCERS = [
    'elonmusk', 'VitalikButerin', 'novogratz', 'APompliano',
    'WClementeIII', 'PlanB', 'Pentosh1', 'RaoulGMI',
    'DegenSpartan', 'hsaka', 'DeFianceCapital', 'alistairmilne'
  ];
  
  // Target meme coins for sentiment analysis
  private readonly TARGET_TOKENS = ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'WIF', 'BONK'];

  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    try {
      const bearerToken = process.env.TWITTER_BEARER_TOKEN;
      const clientSecret = process.env.TWITTER_CLIENT_SECRET;
      
      if (!bearerToken) {
        console.warn('Twitter API credentials missing. Real-time sentiment disabled.');
        return;
      }

      // Use App-Only OAuth 2.0 for filtered streaming (best for real-time data)
      this.client = new TwitterApi(bearerToken);
      
      console.log('🔗 Twitter API v2 initialized with OAuth 2.0 App-Only authentication');
      console.log('📊 Available endpoints: Filtered Stream, Recent Search, User Lookup');
      
      await this.setupStreamingRules();
      await this.startRealTimeStream();
      
    } catch (error) {
      console.error('Enhanced Twitter service initialization failed:', error);
    }
  }

  private async setupStreamingRules() {
    if (!this.client) return;

    try {
      // Clear existing rules
      const existingRules = await this.client.v2.streamRules();
      if (existingRules.data?.length) {
        await this.client.v2.updateStreamRules({
          delete: { ids: existingRules.data.map(rule => rule.id) }
        });
      }

      // Create optimized rules for meme coin sentiment tracking
      const rules: StreamingRule[] = [
        // High-impact influencer mentions of target tokens
        {
          value: `from:${this.CRYPTO_INFLUENCERS.slice(0, 8).join(' OR from:')} (${this.TARGET_TOKENS.map(t => `$${t}`).join(' OR ')})`,
          tag: 'influencer_tokens'
        },
        
        // General high-engagement meme coin mentions
        {
          value: `(${this.TARGET_TOKENS.map(t => `$${t} OR #${t}`).join(' OR ')}) has:links -is:retweet lang:en`,
          tag: 'meme_coin_buzz'
        },
        
        // Breaking news and major announcements
        {
          value: `("breaking" OR "announced" OR "partnership" OR "listing") (${this.TARGET_TOKENS.map(t => `$${t}`).join(' OR ')}) -is:retweet`,
          tag: 'breaking_news'
        },
        
        // Whale activity indicators
        {
          value: `("whale" OR "bought" OR "sold" OR "million") (${this.TARGET_TOKENS.map(t => `$${t}`).join(' OR ')}) -is:retweet`,
          tag: 'whale_activity'
        },
        
        // Price action mentions
        {
          value: `("pump" OR "moon" OR "dump" OR "crash") (${this.TARGET_TOKENS.slice(0, 3).map(t => `$${t}`).join(' OR ')}) -is:retweet`,
          tag: 'price_action'
        }
      ];

      // Add rules to Twitter API
      const response = await this.client.v2.updateStreamRules({
        add: rules
      });

      this.activeRules = rules;
      console.log(`✅ Configured ${rules.length} streaming rules for real-time sentiment analysis`);
      
    } catch (error) {
      console.error('Failed to setup Twitter streaming rules:', error);
    }
  }

  private async startRealTimeStream() {
    if (!this.client || this.isStreaming) return;

    try {
      // Configure stream with enhanced tweet fields
      this.stream = await this.client.v2.searchStream({
        'tweet.fields': [
          'public_metrics',
          'context_annotations', 
          'entities',
          'created_at',
          'author_id'
        ],
        'user.fields': ['username', 'public_metrics', 'verified'],
        'expansions': ['author_id']
      });

      this.isStreaming = true;
      console.log('🌊 Real-time Twitter stream active for meme coin sentiment analysis');

      // Process incoming tweets
      this.stream.on(ETwitterStreamEvent.Data, (tweet: TweetV2SingleStreamResult) => {
        this.processTweet(tweet);
      });

      this.stream.on(ETwitterStreamEvent.Error, (error: any) => {
        console.error('Twitter stream error:', error);
        this.reconnectStream();
      });

    } catch (error) {
      console.error('Failed to start Twitter stream:', error);
      this.isStreaming = false;
    }
  }

  private processTweet(streamResult: TweetV2SingleStreamResult) {
    try {
      const tweet = streamResult.data;
      const includes = streamResult.includes;
      const author = includes?.users?.[0];

      if (!tweet || !author) return;

      // Calculate sentiment score based on text analysis
      const sentiment = this.analyzeSentiment(tweet.text);
      
      // Calculate relevance score based on engagement and author influence
      const relevanceScore = this.calculateRelevanceScore(tweet, author);
      
      // Extract mentioned tokens
      const mentionedTokens = this.extractTokenMentions(tweet.text);
      
      const enhancedTweet: EnhancedTweetData = {
        id: tweet.id,
        text: tweet.text,
        authorId: tweet.author_id!,
        authorUsername: author.username,
        publicMetrics: tweet.public_metrics || {
          retweetCount: 0,
          likeCount: 0,
          replyCount: 0,
          quoteCount: 0
        },
        contextAnnotations: tweet.context_annotations,
        entities: tweet.entities,
        createdAt: tweet.created_at!,
        sentiment,
        relevanceScore
      };

      // Emit to trading system for signal generation
      this.emitTradingSignal(enhancedTweet, mentionedTokens);
      
      console.log(`📈 Processed tweet from @${author.username}: ${sentiment > 0.6 ? 'BULLISH' : sentiment < 0.4 ? 'BEARISH' : 'NEUTRAL'} (${Math.round(relevanceScore * 100)}% relevance)`);
      
    } catch (error) {
      console.error('Error processing tweet:', error);
    }
  }

  private analyzeSentiment(text: string): number {
    // Advanced sentiment analysis
    const bullishWords = ['moon', 'pump', 'bullish', 'buy', 'hodl', 'diamond', 'rocket', 'green', 'up', 'gain'];
    const bearishWords = ['dump', 'crash', 'bearish', 'sell', 'red', 'down', 'loss', 'fear', 'panic', 'drop'];
    
    const words = text.toLowerCase().split(/\s+/);
    let bullishScore = 0;
    let bearishScore = 0;
    
    words.forEach(word => {
      if (bullishWords.some(bw => word.includes(bw))) bullishScore++;
      if (bearishWords.some(bw => word.includes(bw))) bearishScore++;
    });
    
    const totalScore = bullishScore + bearishScore;
    if (totalScore === 0) return 0.5; // Neutral
    
    return bullishScore / (bullishScore + bearishScore);
  }

  private calculateRelevanceScore(tweet: any, author: any): number {
    let score = 0.1; // Base score
    
    // Author influence (0-0.4)
    const followerCount = author.public_metrics?.followers_count || 0;
    if (followerCount > 1000000) score += 0.4;
    else if (followerCount > 100000) score += 0.3;
    else if (followerCount > 10000) score += 0.2;
    else score += 0.1;
    
    // Engagement metrics (0-0.3)
    const engagement = (tweet.public_metrics?.like_count || 0) + 
                     (tweet.public_metrics?.retweet_count || 0) * 2 +
                     (tweet.public_metrics?.reply_count || 0);
    if (engagement > 1000) score += 0.3;
    else if (engagement > 100) score += 0.2;
    else if (engagement > 10) score += 0.1;
    
    // Token mention density (0-0.3)
    const tokenMentions = this.extractTokenMentions(tweet.text).length;
    score += Math.min(tokenMentions * 0.1, 0.3);
    
    return Math.min(score, 1.0);
  }

  private extractTokenMentions(text: string): string[] {
    const mentions: string[] = [];
    this.TARGET_TOKENS.forEach(token => {
      if (text.toLowerCase().includes(token.toLowerCase()) || 
          text.toLowerCase().includes(`$${token.toLowerCase()}`) ||
          text.toLowerCase().includes(`#${token.toLowerCase()}`)) {
        mentions.push(token);
      }
    });
    return mentions;
  }

  private emitTradingSignal(tweet: EnhancedTweetData, tokens: string[]) {
    // Emit to trading system
    tokens.forEach(token => {
      const signal = {
        source: 'twitter',
        token,
        sentiment: tweet.sentiment,
        relevance: tweet.relevanceScore,
        author: tweet.authorUsername,
        engagement: tweet.publicMetrics.likeCount + tweet.publicMetrics.retweetCount,
        timestamp: new Date(tweet.createdAt),
        text: tweet.text.substring(0, 100) + '...'
      };
      
      // This would integrate with your trading signal processor
      // tradingSignalProcessor.processSocialSignal(signal);
    });
  }

  private async reconnectStream() {
    if (this.stream) {
      this.stream.destroy();
      this.isStreaming = false;
    }
    
    console.log('🔄 Reconnecting Twitter stream in 30 seconds...');
    setTimeout(() => {
      this.startRealTimeStream();
    }, 30000);
  }

  // Public API methods
  async getInfluencerActivity(timeframe = '24h'): Promise<any[]> {
    if (!this.client) return [];

    try {
      const activity = [];
      for (const influencer of this.CRYPTO_INFLUENCERS.slice(0, 5)) {
        const tweets = await this.client.v2.userTimeline(influencer, {
          max_results: 10,
          'tweet.fields': ['public_metrics', 'created_at'],
          start_time: new Date(Date.now() - 24*60*60*1000).toISOString()
        });

        if (tweets.data?.data) {
          tweets.data.data.forEach(tweet => {
            const mentions = this.extractTokenMentions(tweet.text);
            if (mentions.length > 0) {
              activity.push({
                influencer,
                tweet: tweet.text,
                tokens: mentions,
                sentiment: this.analyzeSentiment(tweet.text),
                engagement: tweet.public_metrics?.like_count || 0,
                createdAt: tweet.created_at
              });
            }
          });
        }
      }
      
      return activity.sort((a, b) => b.engagement - a.engagement);
    } catch (error) {
      console.error('Error fetching influencer activity:', error);
      return [];
    }
  }

  getStreamStatus() {
    return {
      isStreaming: this.isStreaming,
      activeRules: this.activeRules.length,
      monitoredInfluencers: this.CRYPTO_INFLUENCERS.length,
      targetTokens: this.TARGET_TOKENS
    };
  }

  async stopStream() {
    if (this.stream) {
      this.stream.destroy();
      this.isStreaming = false;
      console.log('🛑 Twitter stream stopped');
    }
  }
}

export const enhancedTwitterService = new EnhancedTwitterService();