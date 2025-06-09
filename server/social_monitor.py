#!/usr/bin/env python3
"""
Social Sentiment Monitor for Meme Coin Trading
Monitors 50K+ follower crypto influencers on Twitter/X for token mentions
Integrates with Nautilus Trader for automated trading signals
"""

import asyncio
import json
import re
import redis.asyncio as redis
from datetime import datetime, timedelta
from typing import Dict, List, Set, Optional
import tweepy
import requests
from textblob import TextBlob
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SocialSentimentMonitor:
    """
    Monitors crypto influencers on Twitter for meme coin mentions
    Analyzes sentiment and generates trading signals
    """
    
    def __init__(self):
        self.redis_client = None
        self.twitter_api = None
        self.coingecko_base = "https://api.coingecko.com/api/v3"
        
        # Crypto influencers to monitor (50K+ followers)
        self.influencers = [
            "elonmusk", "VitalikButerin", "cz_binance", "saylor", "DocumentingBTC",
            "tyler", "naval", "APompliano", "RaoulGMI", "woonomic",
            "PlanB", "100trillionUSD", "mskvsk", "maxkeiser", "stacyherbert",
            "MMCrypto", "CryptoCred", "DeFiPulse", "DegenSpartan", "GiganticRebirth",
            "hsaka", "DeFi_Dad", "CryptoWendyO", "CryptoCobain", "nebraskangooner",
            "koroush_ak", "TheCryptoDog", "CryptoKaleo", "AltcoinDailyio", "CryptoMichNL",
            "coin_shark", "crypto_birb", "pentosh1", "CryptoCred", "TechDev_52",
            "SmartContracter", "CryptoBull2020", "TraderSZ", "MacroScope17", "CryptoHornHairs",
            "EmperorBTC", "CryptoDonAlt", "ThinkingUSD", "CryptoBusy", "Mr_Oops_"
        ]
        
        # Token patterns to detect in tweets
        self.token_patterns = {
            'DOGE': r'\b(?:DOGE|dogecoin)\b',
            'SHIB': r'\b(?:SHIB|shiba)\b',
            'PEPE': r'\b(?:PEPE|pepecoin)\b',
            'FLOKI': r'\b(?:FLOKI|flokiinu)\b',
            'BONK': r'\b(?:BONK|bonkcoin)\b',
            'WIF': r'\b(?:WIF|dogwifhat)\b',
            'POPCAT': r'\b(?:POPCAT|popcatcoin)\b',
            'BRETT': r'\b(?:BRETT|basedpepe)\b',
            'WOJAK': r'\b(?:WOJAK|wojaktoken)\b',
            'MEME': r'\b(?:MEME|memecoin)\b',
            'BABYDOGE': r'\b(?:BABYDOGE|babydogecoin)\b',
            'KISHU': r'\b(?:KISHU|kishuinu)\b',
            'AKITA': r'\b(?:AKITA|akitainu)\b',
            'HOKK': r'\b(?:HOKK|hokkaidu)\b',
            'ELON': r'\b(?:ELON|elontoken)\b'
        }
        
        # Sentiment tracking
        self.sentiment_data = {}
        self.mention_windows = {}  # Track mentions in 30-min windows
        self.last_cleanup = datetime.now()
        
    async def initialize(self):
        """Initialize connections to Redis and Twitter API"""
        try:
            # Initialize Redis
            self.redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
            
            # Check if Twitter API credentials are available
            await self._check_twitter_credentials()
            
            logger.info("Social sentiment monitor initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize social monitor: {e}")
            raise
    
    async def _check_twitter_credentials(self):
        """Check if Twitter API credentials are configured"""
        try:
            # Try to get credentials from environment or config
            # For now, we'll simulate Twitter data until real credentials are provided
            logger.warning("Twitter API credentials not configured - using simulation mode")
            self.twitter_api = None
            
        except Exception as e:
            logger.error(f"Twitter API setup failed: {e}")
            self.twitter_api = None
    
    async def start_monitoring(self):
        """Start the social sentiment monitoring"""
        logger.info("Starting social sentiment monitoring...")
        
        # Start monitoring tasks
        tasks = [
            self.monitor_influencers(),
            self.process_mentions(),
            self.cleanup_old_data(),
            self.simulate_tweet_stream()  # Simulation until real API
        ]
        
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def simulate_tweet_stream(self):
        """Simulate Twitter data for development/testing"""
        while True:
            try:
                # Simulate influential tweets about meme coins
                simulated_tweets = [
                    {
                        "user": "elonmusk",
                        "text": "DOGE to the moon! 🚀 #cryptocurrency",
                        "followers": 150000000,
                        "likes": 50000,
                        "retweets": 25000,
                        "replies": 10000
                    },
                    {
                        "user": "VitalikButerin", 
                        "text": "Interesting developments in PEPE ecosystem lately",
                        "followers": 5000000,
                        "likes": 15000,
                        "retweets": 8000,
                        "replies": 3000
                    },
                    {
                        "user": "CryptoCobain",
                        "text": "SHIB showing strong momentum, watching closely",
                        "followers": 800000,
                        "likes": 5000,
                        "retweets": 2000,
                        "replies": 1000
                    },
                    {
                        "user": "DeFi_Dad",
                        "text": "FLOKI partnerships are game-changing for the space",
                        "followers": 600000,
                        "likes": 3000,
                        "retweets": 1500,
                        "replies": 800
                    },
                    {
                        "user": "TheCryptoDog",
                        "text": "BONK on Solana is gaining serious traction",
                        "followers": 1200000,
                        "likes": 8000,
                        "retweets": 4000,
                        "replies": 2000
                    }
                ]
                
                # Process simulated tweets
                for tweet_data in simulated_tweets:
                    await self.process_tweet(tweet_data, tweet_data["user"])
                
                # Wait 5 minutes before next batch
                await asyncio.sleep(300)
                
            except Exception as e:
                logger.error(f"Error in tweet simulation: {e}")
                await asyncio.sleep(60)
    
    async def monitor_influencers(self):
        """Monitor crypto influencers for token mentions"""
        while True:
            try:
                if self.twitter_api:
                    # Real Twitter API monitoring would go here
                    # For now, we rely on simulation
                    pass
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Error monitoring influencers: {e}")
                await asyncio.sleep(60)
    
    async def process_tweet(self, tweet_data: Dict, username: str):
        """Process a tweet for token mentions and sentiment"""
        try:
            text = tweet_data.get("text", "")
            followers = tweet_data.get("followers", 0)
            engagement = self.calculate_engagement(tweet_data)
            
            # Only process tweets from accounts with 50K+ followers
            if followers < 50000:
                return
            
            # Extract token mentions
            tokens = self.extract_tokens(text)
            
            for token in tokens:
                # Analyze sentiment
                sentiment_score = self.analyze_sentiment(text)
                
                # Update sentiment tracking
                await self.update_sentiment_score(token, sentiment_score, engagement, followers)
                
                logger.info(f"Processed mention: {username} -> {token} (sentiment: {sentiment_score:.2f})")
                
        except Exception as e:
            logger.error(f"Error processing tweet from {username}: {e}")
    
    def extract_tokens(self, text: str) -> Set[str]:
        """Extract token symbols from tweet text"""
        tokens = set()
        text_upper = text.upper()
        
        for token, pattern in self.token_patterns.items():
            if re.search(pattern, text_upper, re.IGNORECASE):
                tokens.add(token)
        
        return tokens
    
    def calculate_engagement(self, tweet_data: Dict) -> int:
        """Calculate tweet engagement (likes + retweets + replies)"""
        likes = tweet_data.get("likes", 0)
        retweets = tweet_data.get("retweets", 0)
        replies = tweet_data.get("replies", 0)
        
        return likes + (retweets * 2) + replies  # Weight retweets more heavily
    
    def analyze_sentiment(self, text: str) -> float:
        """Analyze sentiment of tweet text"""
        try:
            blob = TextBlob(text)
            
            # TextBlob returns polarity between -1 (negative) and 1 (positive)
            # Convert to 0-1 scale for easier processing
            polarity = blob.sentiment.polarity
            sentiment_score = (polarity + 1) / 2
            
            # Boost sentiment for certain positive keywords
            positive_keywords = ['moon', 'bullish', 'pump', 'rocket', 'gem', 'breakout', 'surge']
            negative_keywords = ['dump', 'crash', 'bearish', 'sell', 'exit', 'dead']
            
            text_lower = text.lower()
            
            for keyword in positive_keywords:
                if keyword in text_lower:
                    sentiment_score = min(1.0, sentiment_score + 0.1)
            
            for keyword in negative_keywords:
                if keyword in text_lower:
                    sentiment_score = max(0.0, sentiment_score - 0.1)
            
            return sentiment_score
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return 0.5  # Neutral sentiment as fallback
    
    async def update_sentiment_score(self, token: str, sentiment: float, engagement: int, followers: int):
        """Update weighted sentiment score for token"""
        try:
            current_time = datetime.now()
            
            # Initialize token data if not exists
            if token not in self.sentiment_data:
                self.sentiment_data[token] = {
                    'mentions': [],
                    'total_sentiment': 0.0,
                    'total_weight': 0.0,
                    'influencer_count': 0,
                    'last_updated': current_time
                }
            
            # Calculate weight based on followers and engagement
            weight = (followers / 1000000) + (engagement / 1000)  # Normalize weights
            
            # Add mention to tracking
            mention = {
                'timestamp': current_time,
                'sentiment': sentiment,
                'weight': weight,
                'engagement': engagement,
                'followers': followers
            }
            
            self.sentiment_data[token]['mentions'].append(mention)
            
            # Remove mentions older than 30 minutes
            cutoff_time = current_time - timedelta(minutes=30)
            self.sentiment_data[token]['mentions'] = [
                m for m in self.sentiment_data[token]['mentions'] 
                if m['timestamp'] > cutoff_time
            ]
            
            # Recalculate weighted sentiment for 30-minute window
            mentions = self.sentiment_data[token]['mentions']
            if mentions:
                total_weighted_sentiment = sum(m['sentiment'] * m['weight'] for m in mentions)
                total_weight = sum(m['weight'] for m in mentions)
                
                if total_weight > 0:
                    weighted_sentiment = total_weighted_sentiment / total_weight
                    influencer_count = len(set(m['timestamp'].minute for m in mentions))
                    
                    self.sentiment_data[token].update({
                        'total_sentiment': weighted_sentiment,
                        'total_weight': total_weight,
                        'influencer_count': len(mentions),
                        'last_updated': current_time
                    })
                    
                    # Get market cap data
                    market_cap = await self.get_token_market_cap(token)
                    
                    # Update Redis cache
                    await self.update_sentiment_cache(token, weighted_sentiment, len(mentions), market_cap)
            
        except Exception as e:
            logger.error(f"Error updating sentiment for {token}: {e}")
    
    async def get_token_market_cap(self, token: str) -> float:
        """Get token market cap from CoinGecko"""
        try:
            # Map token symbols to CoinGecko IDs
            coingecko_ids = {
                'DOGE': 'dogecoin',
                'SHIB': 'shiba-inu',
                'PEPE': 'pepe',
                'FLOKI': 'floki',
                'BONK': 'bonk',
                'WIF': 'dogwifcoin',
                'POPCAT': 'popcat',
                'BRETT': 'based-pepe',
                'WOJAK': 'wojak',
                'MEME': 'memecoin',
                'BABYDOGE': 'baby-doge-coin',
                'KISHU': 'kishu-inu',
                'AKITA': 'akita-inu',
                'HOKK': 'hokkaidu-inu',
                'ELON': 'dogelon-mars'
            }
            
            coin_id = coingecko_ids.get(token)
            if not coin_id:
                return 0.0
            
            url = f"{self.coingecko_base}/coins/{coin_id}"
            
            # Use asyncio to make the request non-blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: requests.get(url, timeout=10)
            )
            
            if response.status_code == 200:
                data = response.json()
                market_cap = data.get('market_data', {}).get('market_cap', {}).get('usd', 0)
                return float(market_cap)
            
        except Exception as e:
            logger.error(f"Error fetching market cap for {token}: {e}")
        
        return 0.0
    
    async def update_sentiment_cache(self, token: str, sentiment_score: float, mention_count: int, market_cap: float):
        """Update sentiment data in Redis cache"""
        try:
            sentiment_data = {
                'symbol': token,
                'score': sentiment_score,
                'influencer_count': mention_count,
                'market_cap': market_cap,
                'last_updated': datetime.now().isoformat(),
                'timestamp': datetime.now().isoformat()
            }
            
            # Store in Redis
            await self.redis_client.hset(f"sentiment:{token}", mapping=sentiment_data)
            
            # Also store in global sentiment list
            await self.redis_client.lpush('sentiment_updates', json.dumps(sentiment_data))
            await self.redis_client.ltrim('sentiment_updates', 0, 99)  # Keep last 100 updates
            
            # Publish to WebSocket subscribers
            await self.redis_client.publish('sentiment_updates', json.dumps(sentiment_data))
            
            # Check if this triggers a trading signal
            await self._check_trading_signal(token, sentiment_score, mention_count, market_cap)
            
        except Exception as e:
            logger.error(f"Error updating sentiment cache for {token}: {e}")
    
    async def _check_trading_signal(self, token: str, sentiment_score: float, mention_count: int, market_cap: float):
        """Check if sentiment data triggers a trading signal"""
        try:
            # Trading signal conditions:
            # 1. Sentiment score >= 0.8
            # 2. 5+ influencers mentioning in 30min window
            # 3. Market cap <= $10M
            
            if (sentiment_score >= 0.8 and 
                mention_count >= 5 and 
                market_cap <= 10_000_000):
                
                signal_data = {
                    'type': 'BUY_SIGNAL',
                    'symbol': token,
                    'sentiment_score': sentiment_score,
                    'influencer_count': mention_count,
                    'market_cap': market_cap,
                    'timestamp': datetime.now().isoformat(),
                    'confidence': min(1.0, sentiment_score * (mention_count / 10))
                }
                
                # Store signal in Redis for trading engine
                await self.redis_client.lpush('trading_signals', json.dumps(signal_data))
                
                # Publish signal
                await self.redis_client.publish('trading_signals', json.dumps(signal_data))
                
                logger.info(f"🚨 TRADING SIGNAL: BUY {token} (sentiment: {sentiment_score:.2f}, mentions: {mention_count}, mcap: ${market_cap:,.0f})")
                
        except Exception as e:
            logger.error(f"Error checking trading signal for {token}: {e}")
    
    async def process_mentions(self):
        """Process accumulated mentions and generate trading signals"""
        while True:
            try:
                # Clean up old data every hour
                if datetime.now() - self.last_cleanup > timedelta(hours=1):
                    await self.cleanup_old_data()
                    self.last_cleanup = datetime.now()
                
                await asyncio.sleep(60)  # Process every minute
                
            except Exception as e:
                logger.error(f"Error in process_mentions: {e}")
                await asyncio.sleep(60)
    
    async def cleanup_old_data(self):
        """Clean up old sentiment data"""
        try:
            current_time = datetime.now()
            cutoff_time = current_time - timedelta(hours=2)
            
            for token in list(self.sentiment_data.keys()):
                if self.sentiment_data[token]['last_updated'] < cutoff_time:
                    del self.sentiment_data[token]
                    
                    # Remove from Redis as well
                    await self.redis_client.delete(f"sentiment:{token}")
            
            logger.info("Cleaned up old sentiment data")
            
        except Exception as e:
            logger.error(f"Error cleaning up data: {e}")
    
    async def get_current_sentiment(self, symbols: List[str] = None) -> List[Dict]:
        """Get current sentiment data for specified symbols"""
        try:
            if symbols is None:
                symbols = list(self.sentiment_data.keys())
            
            results = []
            for symbol in symbols:
                data = await self.redis_client.hgetall(f"sentiment:{symbol}")
                if data:
                    results.append({
                        'symbol': symbol,
                        'sentimentScore': float(data.get('score', 0)),
                        'mentions': int(data.get('influencer_count', 0)),
                        'marketCap': float(data.get('market_cap', 0)),
                        'lastUpdated': data.get('last_updated'),
                        'volumeChange': None  # Could be added later
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting current sentiment: {e}")
            return []


# Global monitor instance
social_monitor = SocialSentimentMonitor()


async def run_social_monitor():
    """Run the social sentiment monitor"""
    try:
        await social_monitor.initialize()
        await social_monitor.start_monitoring()
    except KeyboardInterrupt:
        logger.info("Received interrupt signal, stopping social monitor...")
    except Exception as e:
        logger.error(f"Social monitor error: {e}")


if __name__ == "__main__":
    asyncio.run(run_social_monitor())