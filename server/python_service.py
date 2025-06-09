#!/usr/bin/env python3
"""
Python Trading Service
Integrates social monitoring and trading engine with the Express server
"""

import asyncio
import json
import redis.asyncio as redis
import subprocess
import sys
from datetime import datetime
from typing import Dict, List, Optional
import logging
import threading
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class TradingService:
    """
    Main trading service that coordinates all Python components
    """
    
    def __init__(self):
        self.redis_client = None
        self.is_running = False
        self.social_monitor = None
        self.portfolio_data = {
            'totalValue': '0.00',
            'dailyPnL': '0.00',
            'activePositions': 0,
            'todayTrades': 0
        }
        self.positions = []
        self.trades = []
        self.sentiment_data = []
        self.notifications = []
        
    async def initialize(self):
        """Initialize all trading components"""
        try:
            # Initialize Redis connection
            self.redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
            await self.redis_client.ping()
            logger.info("Connected to Redis successfully")
            
            # Initialize default data
            await self._initialize_default_data()
            
            # Start social monitoring
            await self._start_social_monitoring()
            
            logger.info("Trading service initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing trading service: {e}")
            raise
    
    async def _initialize_default_data(self):
        """Initialize default trading data in Redis"""
        try:
            # Set up default portfolio
            await self.redis_client.hset('portfolio:1', mapping={
                'totalValue': '10000.00',
                'dailyPnL': '0.00',
                'unrealizedPnL': '0.00',
                'realizedPnL': '0.00',
                'availableBalance': '10000.00',
                'marginUsed': '0.00',
                'lastUpdated': datetime.now().isoformat()
            })
            
            # Set up default trading settings
            await self.redis_client.hset('settings:1', mapping={
                'maxPositionSize': '100.00',
                'stopLossPercent': '15.0',
                'takeProfitPercent': '30.0',
                'maxConcurrentPositions': '5',
                'autoTradingEnabled': 'true',
                'riskLevel': 'medium',
                'lastUpdated': datetime.now().isoformat()
            })
            
            # Clear old data
            await self.redis_client.delete('positions:1')
            await self.redis_client.delete('trades:1')
            await self.redis_client.delete('notifications:1')
            
            logger.info("Default trading data initialized")
            
        except Exception as e:
            logger.error(f"Error initializing default data: {e}")
    
    async def _start_social_monitoring(self):
        """Start social sentiment monitoring"""
        try:
            # Create background task for social monitoring
            asyncio.create_task(self._social_monitoring_loop())
            logger.info("Social monitoring started")
            
        except Exception as e:
            logger.error(f"Error starting social monitoring: {e}")
    
    async def _social_monitoring_loop(self):
        """Main social monitoring loop"""
        while self.is_running:
            try:
                # Simulate sentiment updates for demo
                await self._simulate_sentiment_data()
                await asyncio.sleep(30)  # Update every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in social monitoring loop: {e}")
                await asyncio.sleep(10)
    
    async def _simulate_sentiment_data(self):
        """Simulate real-time sentiment data for demonstration"""
        try:
            import random
            
            tokens = ['DOGE', 'PEPE', 'SHIB', 'FLOKI', 'BONK']
            
            for token in tokens:
                sentiment_score = 0.3 + (random.random() * 0.7)  # 0.3 to 1.0
                mentions = random.randint(1, 15)
                market_cap = random.randint(1_000_000, 50_000_000)
                
                sentiment_data = {
                    'symbol': token,
                    'sentimentScore': str(round(sentiment_score, 2)),
                    'mentions': str(mentions),
                    'influencerCount': str(mentions),
                    'marketCap': str(market_cap),
                    'volumeChange': str(round(random.uniform(-20, 50), 1)),
                    'timestamp': datetime.now().isoformat()
                }
                
                # Store in Redis
                await self.redis_client.hset(f'sentiment:{token}', mapping=sentiment_data)
                
                # Check for trading signals
                await self._check_trading_signal(token, sentiment_score, mentions, market_cap)
            
        except Exception as e:
            logger.error(f"Error simulating sentiment data: {e}")
    
    async def _check_trading_signal(self, token: str, sentiment: float, mentions: int, market_cap: int):
        """Check if conditions trigger a trading signal"""
        try:
            # Trading signal conditions
            if sentiment >= 0.8 and mentions >= 5 and market_cap <= 10_000_000:
                
                # Check if we don't already have a position
                existing_positions = await self.redis_client.lrange('positions:1', 0, -1)
                has_position = any(token in pos for pos in existing_positions)
                
                if not has_position and len(existing_positions) < 5:
                    await self._execute_simulated_trade(token, sentiment, market_cap)
                    
        except Exception as e:
            logger.error(f"Error checking trading signal: {e}")
    
    async def _execute_simulated_trade(self, token: str, sentiment: float, market_cap: int):
        """Execute a simulated trade for demonstration"""
        try:
            import random
            
            # Simulate trade execution
            entry_price = random.uniform(0.0001, 0.1)
            position_size = 100.00 / entry_price  # $100 position
            
            position_data = {
                'id': len(await self.redis_client.lrange('positions:1', 0, -1)) + 1,
                'symbol': token,
                'side': 'BUY',
                'size': str(round(position_size, 4)),
                'entryPrice': str(round(entry_price, 6)),
                'currentPrice': str(round(entry_price, 6)),
                'pnl': '0.00',
                'pnlPercent': '0.00',
                'status': 'open',
                'stopLoss': str(round(entry_price * 0.85, 6)),  # 15% stop loss
                'takeProfit': str(round(entry_price * 1.30, 6)),  # 30% take profit
                'createdAt': datetime.now().isoformat(),
                'userId': '1',
                'exchange': 'DEX'
            }
            
            # Store position
            await self.redis_client.lpush('positions:1', json.dumps(position_data))
            
            # Create trade history entry
            trade_data = {
                'id': len(await self.redis_client.lrange('trades:1', 0, -1)) + 1,
                'symbol': token,
                'type': 'BUY',
                'size': str(round(position_size, 4)),
                'entryPrice': str(round(entry_price, 6)),
                'executedAt': datetime.now().isoformat(),
                'userId': '1',
                'exchange': 'DEX',
                'trigger': f'Social sentiment: {sentiment:.2f}'
            }
            
            await self.redis_client.lpush('trades:1', json.dumps(trade_data))
            
            # Create notification
            notification_data = {
                'id': len(await self.redis_client.lrange('notifications:1', 0, -1)) + 1,
                'type': 'success',
                'title': 'Trade Executed',
                'message': f'Bought {token} at ${entry_price:.6f} based on social sentiment',
                'userId': '1',
                'read': False,
                'createdAt': datetime.now().isoformat(),
                'priority': 'high'
            }
            
            await self.redis_client.lpush('notifications:1', json.dumps(notification_data))
            
            # Update portfolio
            portfolio = await self.redis_client.hgetall('portfolio:1')
            current_balance = float(portfolio.get('availableBalance', 10000))
            new_balance = current_balance - 100.00
            
            await self.redis_client.hset('portfolio:1', mapping={
                'availableBalance': str(round(new_balance, 2)),
                'marginUsed': str(round(float(portfolio.get('marginUsed', 0)) + 100.00, 2)),
                'lastUpdated': datetime.now().isoformat()
            })
            
            logger.info(f"🚀 Executed trade: BUY {token} at ${entry_price:.6f} (sentiment: {sentiment:.2f})")
            
        except Exception as e:
            logger.error(f"Error executing simulated trade: {e}")
    
    async def start(self):
        """Start the trading service"""
        try:
            self.is_running = True
            logger.info("Trading service started")
            
            # Start background tasks
            await asyncio.gather(
                self._portfolio_update_loop(),
                self._position_monitoring_loop(),
                self._social_monitoring_loop()
            )
            
        except Exception as e:
            logger.error(f"Error starting trading service: {e}")
    
    async def _portfolio_update_loop(self):
        """Update portfolio metrics periodically"""
        while self.is_running:
            try:
                await self._update_portfolio_metrics()
                await asyncio.sleep(10)  # Update every 10 seconds
                
            except Exception as e:
                logger.error(f"Error in portfolio update loop: {e}")
                await asyncio.sleep(10)
    
    async def _position_monitoring_loop(self):
        """Monitor positions for stop-loss and take-profit"""
        while self.is_running:
            try:
                await self._monitor_positions()
                await asyncio.sleep(5)  # Check every 5 seconds
                
            except Exception as e:
                logger.error(f"Error in position monitoring: {e}")
                await asyncio.sleep(5)
    
    async def _update_portfolio_metrics(self):
        """Update portfolio metrics"""
        try:
            import random
            
            positions = await self.redis_client.lrange('positions:1', 0, -1)
            portfolio = await self.redis_client.hgetall('portfolio:1')
            
            total_unrealized_pnl = 0.0
            active_positions = 0
            
            # Update position prices and calculate PnL
            for i, pos_json in enumerate(positions):
                position = json.loads(pos_json)
                if position.get('status') == 'open':
                    active_positions += 1
                    
                    # Simulate price movement
                    current_price = float(position['currentPrice'])
                    price_change = random.uniform(-0.05, 0.05)  # -5% to +5%
                    new_price = current_price * (1 + price_change)
                    
                    entry_price = float(position['entryPrice'])
                    size = float(position['size'])
                    pnl = (new_price - entry_price) * size
                    pnl_percent = ((new_price - entry_price) / entry_price) * 100
                    
                    # Update position
                    position['currentPrice'] = str(round(new_price, 6))
                    position['pnl'] = str(round(pnl, 2))
                    position['pnlPercent'] = str(round(pnl_percent, 2))
                    
                    # Replace in Redis
                    await self.redis_client.lset('positions:1', i, json.dumps(position))
                    
                    total_unrealized_pnl += pnl
            
            # Update portfolio totals
            available_balance = float(portfolio.get('availableBalance', 10000))
            margin_used = float(portfolio.get('marginUsed', 0))
            total_value = available_balance + margin_used + total_unrealized_pnl
            
            await self.redis_client.hset('portfolio:1', mapping={
                'totalValue': str(round(total_value, 2)),
                'unrealizedPnL': str(round(total_unrealized_pnl, 2)),
                'dailyPnL': str(round(total_unrealized_pnl, 2)),  # Simplified
                'activePositions': str(active_positions),
                'lastUpdated': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error updating portfolio metrics: {e}")
    
    async def _monitor_positions(self):
        """Monitor positions for exit conditions"""
        try:
            import random
            
            positions = await self.redis_client.lrange('positions:1', 0, -1)
            
            for i, pos_json in enumerate(positions):
                position = json.loads(pos_json)
                
                if position.get('status') == 'open':
                    current_price = float(position['currentPrice'])
                    stop_loss = float(position['stopLoss'])
                    take_profit = float(position['takeProfit'])
                    
                    # Check exit conditions
                    if current_price <= stop_loss:
                        await self._close_position(position, i, 'stop_loss')
                    elif current_price >= take_profit:
                        await self._close_position(position, i, 'take_profit')
                    elif random.random() < 0.001:  # Random exit for demo
                        await self._close_position(position, i, 'manual')
                        
        except Exception as e:
            logger.error(f"Error monitoring positions: {e}")
    
    async def _close_position(self, position: Dict, index: int, reason: str):
        """Close a position"""
        try:
            position['status'] = 'closed'
            position['closedAt'] = datetime.now().isoformat()
            position['exitReason'] = reason
            
            # Update position in Redis
            await self.redis_client.lset('positions:1', index, json.dumps(position))
            
            # Create closing trade
            trade_data = {
                'id': len(await self.redis_client.lrange('trades:1', 0, -1)) + 1,
                'symbol': position['symbol'],
                'type': 'SELL',
                'size': position['size'],
                'exitPrice': position['currentPrice'],
                'pnl': position['pnl'],
                'executedAt': datetime.now().isoformat(),
                'userId': '1',
                'exchange': 'DEX',
                'trigger': f'Exit: {reason}'
            }
            
            await self.redis_client.lpush('trades:1', json.dumps(trade_data))
            
            # Update portfolio
            portfolio = await self.redis_client.hgetall('portfolio:1')
            margin_used = float(portfolio.get('marginUsed', 0)) - 100.00
            available_balance = float(portfolio.get('availableBalance', 0)) + 100.00 + float(position['pnl'])
            realized_pnl = float(portfolio.get('realizedPnL', 0)) + float(position['pnl'])
            
            await self.redis_client.hset('portfolio:1', mapping={
                'availableBalance': str(round(available_balance, 2)),
                'marginUsed': str(round(max(0, margin_used), 2)),
                'realizedPnL': str(round(realized_pnl, 2)),
                'lastUpdated': datetime.now().isoformat()
            })
            
            # Create notification
            pnl_str = f"+${position['pnl']}" if float(position['pnl']) >= 0 else f"-${abs(float(position['pnl']))}"
            notification_data = {
                'id': len(await self.redis_client.lrange('notifications:1', 0, -1)) + 1,
                'type': 'success' if float(position['pnl']) >= 0 else 'warning',
                'title': 'Position Closed',
                'message': f'Closed {position["symbol"]} position ({reason}): {pnl_str}',
                'userId': '1',
                'read': False,
                'createdAt': datetime.now().isoformat(),
                'priority': 'medium'
            }
            
            await self.redis_client.lpush('notifications:1', json.dumps(notification_data))
            
            logger.info(f"📈 Closed position: {position['symbol']} ({reason}) PnL: {position['pnl']}")
            
        except Exception as e:
            logger.error(f"Error closing position: {e}")
    
    async def stop(self):
        """Stop the trading service"""
        self.is_running = False
        if self.redis_client:
            await self.redis_client.close()
        logger.info("Trading service stopped")


# Global service instance
trading_service = TradingService()


async def run_service():
    """Run the trading service"""
    try:
        await trading_service.initialize()
        await trading_service.start()
    except KeyboardInterrupt:
        logger.info("Received interrupt signal, stopping service...")
        await trading_service.stop()
    except Exception as e:
        logger.error(f"Service error: {e}")
        await trading_service.stop()


if __name__ == "__main__":
    asyncio.run(run_service())