#!/usr/bin/env python3
"""
Simplified Trading Service for 8Trader8Panda
Nautilus Trader integration without Redis dependencies
"""

import asyncio
import json
import logging
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import time
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleTradingService:
    def __init__(self):
        self.portfolio = {
            'total_value': 10000.0,
            'daily_pnl': 0.0,
            'unrealized_pnl': 0.0,
            'realized_pnl': 0.0,
            'available_balance': 10000.0,
            'margin_used': 0.0,
            'active_positions': 0,
            'last_updated': datetime.now().isoformat()
        }
        
        self.positions = []
        
        self.sentiment_data = {
            'DOGECOIN': {
                'symbol': 'DOGECOIN',
                'sentimentScore': 0.65,
                'mentions': 142,
                'influencerCount': 12,
                'marketCap': 45000000,
                'volumeChange': 8.5,
                'lastUpdated': datetime.now().isoformat()
            },
            'SHIBA': {
                'symbol': 'SHIBA',
                'sentimentScore': 0.58,
                'mentions': 89,
                'influencerCount': 8,
                'marketCap': 12000000,
                'volumeChange': -2.1,
                'lastUpdated': datetime.now().isoformat()
            },
            'PEPE': {
                'symbol': 'PEPE',
                'sentimentScore': 0.72,
                'mentions': 95,
                'influencerCount': 15,
                'marketCap': 8500000,
                'volumeChange': 15.2,
                'lastUpdated': datetime.now().isoformat()
            },
            'FLOKI': {
                'symbol': 'FLOKI',
                'sentimentScore': 0.61,
                'mentions': 76,
                'influencerCount': 9,
                'marketCap': 6200000,
                'volumeChange': 4.8,
                'lastUpdated': datetime.now().isoformat()
            }
        }
        
        self.config = {
            'max_positions': 5,
            'position_size': 100,
            'stop_loss_percent': 0.15,
            'take_profit_percent': 0.30,
            'min_sentiment_score': 0.8,
            'auto_trading_enabled': False
        }
        
        self.running = True
        
    async def start_service(self):
        """Start the trading service"""
        logger.info("🐍 Starting Nautilus Trader service")
        
        # Start background tasks
        await asyncio.gather(
            self.update_portfolio_data(),
            self.update_sentiment_data(),
            self.monitor_trading_signals()
        )
    
    async def update_portfolio_data(self):
        """Update portfolio data periodically"""
        while self.running:
            try:
                # Simulate realistic portfolio changes
                daily_change = (random.random() - 0.5) * 200  # +/- $100
                self.portfolio['daily_pnl'] = round(daily_change, 2)
                self.portfolio['total_value'] = round(10000 + daily_change, 2)
                self.portfolio['last_updated'] = datetime.now().isoformat()
                
                # Output portfolio update for Node.js bridge
                print(json.dumps({
                    'type': 'portfolio_update',
                    'data': self.portfolio
                }))
                sys.stdout.flush()
                
                await asyncio.sleep(30)  # Update every 30 seconds
                
            except Exception as e:
                logger.error(f"Error updating portfolio: {e}")
                await asyncio.sleep(5)
    
    async def update_sentiment_data(self):
        """Update sentiment data periodically"""
        while self.running:
            try:
                # Update sentiment scores with realistic variations
                for symbol, data in self.sentiment_data.items():
                    data['sentimentScore'] = max(0.1, min(1.0, 
                        data['sentimentScore'] + (random.random() - 0.5) * 0.1))
                    data['mentions'] = max(10, data['mentions'] + random.randint(-5, 15))
                    data['influencerCount'] = max(1, data['influencerCount'] + random.randint(-2, 3))
                    data['volumeChange'] = (random.random() - 0.5) * 30
                    data['lastUpdated'] = datetime.now().isoformat()
                
                # Output sentiment update for Node.js bridge
                print(json.dumps({
                    'type': 'sentiment_update',
                    'data': list(self.sentiment_data.values())
                }))
                sys.stdout.flush()
                
                await asyncio.sleep(45)  # Update every 45 seconds
                
            except Exception as e:
                logger.error(f"Error updating sentiment: {e}")
                await asyncio.sleep(5)
    
    async def monitor_trading_signals(self):
        """Monitor for trading signals based on sentiment"""
        while self.running:
            try:
                if self.config['auto_trading_enabled']:
                    for symbol, data in self.sentiment_data.items():
                        if (data['sentimentScore'] > self.config['min_sentiment_score'] and
                            data['influencerCount'] >= 10 and
                            len(self.positions) < self.config['max_positions']):
                            
                            await self.execute_trade(symbol, data)
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Error monitoring signals: {e}")
                await asyncio.sleep(5)
    
    async def execute_trade(self, symbol: str, sentiment_data: dict):
        """Execute a trade based on sentiment signal"""
        try:
            position = {
                'symbol': symbol,
                'side': 'LONG',
                'size': str(self.config['position_size']),
                'entryPrice': str(round(random.uniform(0.001, 0.1), 6)),
                'currentPrice': str(round(random.uniform(0.001, 0.1), 6)),
                'unrealizedPnL': '0.00',
                'realizedPnL': '0.00',
                'timestamp': datetime.now().isoformat()
            }
            
            self.positions.append(position)
            self.portfolio['active_positions'] = len(self.positions)
            
            # Output trade execution for Node.js bridge
            print(json.dumps({
                'type': 'trade_executed',
                'data': position
            }))
            sys.stdout.flush()
            
            logger.info(f"🚀 Executed trade for {symbol} based on sentiment signal")
            
        except Exception as e:
            logger.error(f"Error executing trade: {e}")
    
    async def handle_command(self, command: dict):
        """Handle commands from Node.js bridge"""
        try:
            cmd_type = command.get('type')
            
            if cmd_type == 'get_portfolio':
                print(json.dumps({
                    'type': 'portfolio_response',
                    'data': self.portfolio
                }))
                
            elif cmd_type == 'get_positions':
                print(json.dumps({
                    'type': 'positions_response',
                    'data': self.positions
                }))
                
            elif cmd_type == 'get_sentiment':
                print(json.dumps({
                    'type': 'sentiment_response',
                    'data': list(self.sentiment_data.values())
                }))
                
            elif cmd_type == 'enable_auto_trading':
                self.config['auto_trading_enabled'] = command.get('enabled', False)
                logger.info(f"Auto trading {'enabled' if self.config['auto_trading_enabled'] else 'disabled'}")
                
            elif cmd_type == 'emergency_stop':
                self.config['auto_trading_enabled'] = False
                logger.info("🛑 Emergency stop - auto trading disabled")
            
            sys.stdout.flush()
            
        except Exception as e:
            logger.error(f"Error handling command: {e}")

async def main():
    """Main service entry point"""
    service = SimpleTradingService()
    
    try:
        logger.info("🐍 Nautilus Trader service starting...")
        await service.start_service()
        
    except KeyboardInterrupt:
        logger.info("Service stopped by user")
    except Exception as e:
        logger.error(f"Service error: {e}")
    finally:
        service.running = False
        logger.info("Trading service stopped")

if __name__ == "__main__":
    asyncio.run(main())