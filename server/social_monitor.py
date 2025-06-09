import asyncio
import json
import logging
import os
import re
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Set
import redis
import tweepy
import requests
from textblob import TextBlob

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SocialSentimentMonitor:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            decode_responses=True
        )
        
        # Twitter API setup
        self.twitter_bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
        if not self.twitter_bearer_token:
            raise ValueError("TWITTER_BEARER_TOKEN environment variable is required")
        
        self.twitter_client = tweepy.Client(
            bearer_token=self.twitter_bearer_token,
            wait_on_rate_limit=True
        )
        
        # Crypto influencers to monitor (50K+ followers)
        self.crypto_influencers = [
            'elonmusk',
            'saylor',
            'VitalikButerin',
            'aantonop',
            'naval',
            'Bitcoin',
            'ethereum',
            'binance',
            'cz_binance',
            'coinbase',
            'KuCoincom',
            'BitMEXdotcom',
            'APompliano',
            'DocumentingBTC',
            'woonomic',
            'PeterSchiff',
            'RaoulGMI',
            'novogratz',
            'Pentosh1',
            'TyCobb3',
            'hsaka',
            'santimentfeed',
            'CryptoHayes',
            'CryptoWendyO',
            'CryptoBirb',
            'CryptoCred',
            'CryptoMichNL',
            'CryptoCapo_',
            'CryptoKaleo',
            'CryptoFaceoff',
            'Altcoingordon',
            'ImBagsy',
            'CryptoDonAlt',
            'CryptoYoda1338',
            'IncomeSharks',
            'scottmelker',
            'CryptoWelson',
            'trader1sz',
            'CryptoHamster',
            'CryptoVizArt',
            'CryptoCobain'
        ]
        
        # Meme coin patterns to detect
        self.meme_coin_patterns = [
            r'\$[A-Z]{3,10}(?![A-Z])',  # $PEPE, $SHIB, etc.
            r'(?:^|\s)([A-Z]{3,10})(?=\s|$)',  # PEPE, SHIB as separate words
        ]
        
        # Token mention tracking
        self.token_mentions = defaultdict(list)
        self.influencer_mentions = defaultdict(set)
        self.sentiment_scores = {}
        
        # Market cap verification
        self.coingecko_url = "https://api.coingecko.com/api/v3"
        
    async def start_monitoring(self):
        """Start the social sentiment monitoring"""
        logger.info("Starting social sentiment monitoring...")
        
        while True:
            try:
                await self.monitor_influencers()
                await self.process_mentions()
                await self.update_sentiment_cache()
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Social monitoring error: {e}")
                await asyncio.sleep(120)  # Wait longer on error
    
    async def monitor_influencers(self):
        """Monitor crypto influencers for token mentions"""
        try:
            for username in self.crypto_influencers:
                try:
                    # Get user's recent tweets
                    user = self.twitter_client.get_user(username=username)
                    if not user.data:
                        continue
                    
                    tweets = self.twitter_client.get_users_tweets(
                        user.data.id,
                        max_results=10,
                        tweet_fields=['created_at', 'public_metrics', 'context_annotations']
                    )
                    
                    if not tweets.data:
                        continue
                    
                    for tweet in tweets.data:
                        await self.process_tweet(tweet, username)
                        
                except tweepy.TweepyException as e:
                    logger.warning(f"Twitter API error for {username}: {e}")
                    continue
                    
                await asyncio.sleep(1)  # Rate limiting
                
        except Exception as e:
            logger.error(f"Influencer monitoring failed: {e}")
    
    async def process_tweet(self, tweet, username: str):
        """Process a tweet for token mentions and sentiment"""
        try:
            tweet_text = tweet.text.upper()
            tweet_time = tweet.created_at
            
            # Skip old tweets (older than 30 minutes)
            if datetime.now(tweet_time.tzinfo) - tweet_time > timedelta(minutes=30):
                return
            
            # Extract token mentions
            tokens = self.extract_tokens(tweet_text)
            
            for token in tokens:
                # Verify token exists and get market cap
                market_cap = await self.get_token_market_cap(token)
                if not market_cap or market_cap > 10_000_000:  # Only <$10M market cap
                    continue
                
                # Calculate engagement velocity
                engagement = self.calculate_engagement(tweet)
                
                # Only consider high engagement tweets
                if engagement < 100:  # Less than 100 likes/retweets in first 10 min
                    continue
                
                # Record mention
                mention_data = {
                    'username': username,
                    'tweet_id': tweet.id,
                    'timestamp': tweet_time.isoformat(),
                    'engagement': engagement,
                    'text': tweet.text[:200],  # First 200 chars
                    'market_cap': market_cap
                }
                
                self.token_mentions[token].append(mention_data)
                self.influencer_mentions[token].add(username)
                
                # Calculate sentiment
                sentiment = self.analyze_sentiment(tweet.text)
                self.update_sentiment_score(token, sentiment, engagement)
                
                logger.info(f"Token mention detected: {token} by @{username} (engagement: {engagement})")
                
        except Exception as e:
            logger.error(f"Tweet processing failed: {e}")
    
    def extract_tokens(self, text: str) -> Set[str]:
        """Extract token symbols from tweet text"""
        tokens = set()
        
        for pattern in self.meme_coin_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                token = match.replace('$', '').strip()
                if len(token) >= 3 and len(token) <= 10:
                    tokens.add(token)
        
        return tokens
    
    def calculate_engagement(self, tweet) -> int:
        """Calculate tweet engagement (likes + retweets + replies)"""
        try:
            metrics = tweet.public_metrics
            return (
                metrics.get('like_count', 0) +
                metrics.get('retweet_count', 0) +
                metrics.get('reply_count', 0)
            )
        except:
            return 0
    
    def analyze_sentiment(self, text: str) -> float:
        """Analyze sentiment of tweet text"""
        try:
            blob = TextBlob(text)
            # Convert polarity from [-1, 1] to [0, 1]
            sentiment = (blob.sentiment.polarity + 1) / 2
            return max(0, min(1, sentiment))
        except:
            return 0.5  # Neutral sentiment
    
    def update_sentiment_score(self, token: str, sentiment: float, engagement: int):
        """Update weighted sentiment score for token"""
        if token not in self.sentiment_scores:
            self.sentiment_scores[token] = {
                'total_weighted_sentiment': 0,
                'total_weight': 0,
                'mention_count': 0
            }
        
        # Weight sentiment by engagement
        weight = max(1, engagement / 10)  # Min weight of 1
        
        self.sentiment_scores[token]['total_weighted_sentiment'] += sentiment * weight
        self.sentiment_scores[token]['total_weight'] += weight
        self.sentiment_scores[token]['mention_count'] += 1
    
    async def get_token_market_cap(self, token: str) -> float:
        """Get token market cap from CoinGecko"""
        try:
            # Check cache first
            cached_cap = self.redis_client.get(f"market_cap:{token}")
            if cached_cap:
                return float(cached_cap)
            
            # Search for token on CoinGecko
            search_url = f"{self.coingecko_url}/search"
            response = requests.get(search_url, params={'query': token}, timeout=10)
            
            if response.status_code != 200:
                return None
            
            data = response.json()
            coins = data.get('coins', [])
            
            # Find exact match
            for coin in coins:
                if coin['symbol'].upper() == token.upper():
                    coin_id = coin['id']
                    
                    # Get market data
                    market_url = f"{self.coingecko_url}/simple/price"
                    market_response = requests.get(
                        market_url,
                        params={
                            'ids': coin_id,
                            'vs_currencies': 'usd',
                            'include_market_cap': 'true'
                        },
                        timeout=10
                    )
                    
                    if market_response.status_code == 200:
                        market_data = market_response.json()
                        if coin_id in market_data:
                            market_cap = market_data[coin_id].get('usd_market_cap', 0)
                            
                            # Cache for 5 minutes
                            self.redis_client.setex(f"market_cap:{token}", 300, str(market_cap))
                            return market_cap
            
            return None
            
        except Exception as e:
            logger.error(f"Market cap lookup failed for {token}: {e}")
            return None
    
    async def process_mentions(self):
        """Process accumulated mentions and generate trading signals"""
        try:
            current_time = datetime.now()
            
            for token, mentions in list(self.token_mentions.items()):
                # Filter mentions from last 30 minutes
                recent_mentions = [
                    m for m in mentions
                    if current_time - datetime.fromisoformat(m['timestamp'].replace('Z', '+00:00')) < timedelta(minutes=30)
                ]
                
                # Check if we have enough influencer mentions
                recent_influencers = len(set(m['username'] for m in recent_mentions))
                
                if recent_influencers >= 5:  # 5+ influencers threshold
                    # Calculate overall sentiment
                    if token in self.sentiment_scores:
                        sentiment_data = self.sentiment_scores[token]
                        if sentiment_data['total_weight'] > 0:
                            avg_sentiment = sentiment_data['total_weighted_sentiment'] / sentiment_data['total_weight']
                            
                            if avg_sentiment > 0.8:  # High sentiment threshold
                                # Generate buy signal
                                signal = {
                                    'symbol': f"{token}USDT",
                                    'action': 'buy',
                                    'reason': 'social_sentiment',
                                    'sentiment_score': avg_sentiment,
                                    'influencer_count': recent_influencers,
                                    'mention_count': len(recent_mentions),
                                    'timestamp': current_time.isoformat(),
                                    'exchange': 'BINANCE'
                                }
                                
                                # Send signal to trading engine
                                self.redis_client.lpush('trading_signals', json.dumps(signal))
                                
                                logger.info(f"Buy signal generated for {token}: sentiment={avg_sentiment:.3f}, influencers={recent_influencers}")
                
                # Clean old mentions (keep last 24 hours)
                cutoff_time = current_time - timedelta(hours=24)
                self.token_mentions[token] = [
                    m for m in mentions
                    if datetime.fromisoformat(m['timestamp'].replace('Z', '+00:00')) > cutoff_time
                ]
                
        except Exception as e:
            logger.error(f"Mention processing failed: {e}")
    
    async def update_sentiment_cache(self):
        """Update sentiment data in Redis cache"""
        try:
            for token, score_data in self.sentiment_scores.items():
                if score_data['total_weight'] > 0:
                    avg_sentiment = score_data['total_weighted_sentiment'] / score_data['total_weight']
                    
                    recent_mentions = len([
                        m for m in self.token_mentions[token]
                        if datetime.now() - datetime.fromisoformat(m['timestamp'].replace('Z', '+00:00')) < timedelta(minutes=30)
                    ])
                    
                    recent_influencers = len(self.influencer_mentions[token])
                    
                    sentiment_data = {
                        'symbol': token,
                        'sentiment_score': round(avg_sentiment, 4),
                        'mentions': recent_mentions,
                        'influencer_count': recent_influencers,
                        'market_cap': 0,  # Will be updated when available
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    # Cache with 60-second TTL
                    self.redis_client.setex(
                        f"sentiment:{token}",
                        60,
                        json.dumps(sentiment_data)
                    )
                    
                    # Update social volume for position monitoring
                    volume_score = min(1.0, (recent_mentions + recent_influencers) / 20)
                    self.redis_client.setex(f"social_volume:{token}", 60, str(volume_score))
                    
        except Exception as e:
            logger.error(f"Sentiment cache update failed: {e}")
    
    async def get_current_sentiment(self, symbols: List[str] = None) -> List[Dict]:
        """Get current sentiment data for specified symbols"""
        try:
            sentiment_data = []
            
            if not symbols:
                # Get all cached sentiment data
                keys = self.redis_client.keys('sentiment:*')
                symbols = [key.replace('sentiment:', '') for key in keys]
            
            for symbol in symbols:
                cached_data = self.redis_client.get(f"sentiment:{symbol}")
                if cached_data:
                    data = json.loads(cached_data)
                    sentiment_data.append(data)
            
            return sentiment_data
            
        except Exception as e:
            logger.error(f"Sentiment retrieval failed: {e}")
            return []

if __name__ == "__main__":
    monitor = SocialSentimentMonitor()
    asyncio.run(monitor.start_monitoring())
