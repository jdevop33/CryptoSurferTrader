#!/usr/bin/env python3
"""
Automated Meme Coin Trading Engine using Nautilus Trader
Integrates with social sentiment monitoring for high-frequency trading
"""

import asyncio
import json
import redis.asyncio as redis
from decimal import Decimal
from typing import Dict, List, Optional, Set
from datetime import datetime, timedelta
import logging

from nautilus_trader.core.uuid import UUID4
from nautilus_trader.model.identifiers import (
    InstrumentId, ClientOrderId, StrategyId, TraderId, 
    AccountId, Venue, Symbol
)
from nautilus_trader.model.orders import MarketOrder, StopMarketOrder, LimitOrder
from nautilus_trader.model.enums import (
    OrderSide, TimeInForce, OrderType, OrderStatus,
    AccountType, OmsType
)
from nautilus_trader.trading.node import TradingNode
from nautilus_trader.config import (
    TradingNodeConfig, LoggingConfig, DatabaseConfig,
    CacheConfig, MessageBusConfig, RiskEngineConfig
)
from nautilus_trader.adapters.sandbox.config import (
    SandboxExecutionClientConfig, SandboxDataClientConfig
)
from nautilus_trader.model.data import QuoteTick, TradeTick, Bar
from nautilus_trader.model.instruments import CryptoCurrency, CurrencyPair
from nautilus_trader.core.message import Event
from nautilus_trader.model.events import OrderFilled, PositionOpened, PositionClosed
from nautilus_trader.model.objects import Price, Quantity, Money
from nautilus_trader.model.currencies import USD, BTC, ETH
from nautilus_trader.model.position import Position
from nautilus_trader.trading.strategy import Strategy
from nautilus_trader.indicators.average.sma import SimpleMovingAverage


class MemeTrader(Strategy):
    """
    Social sentiment-driven meme coin trading strategy
    """
    
    def __init__(self, config=None):
        super().__init__(config)
        self.redis_client = None
        self.active_positions: Dict[str, Position] = {}
        self.sentiment_cache: Dict[str, Dict] = {}
        self.max_positions = 5
        self.position_size_usd = Decimal('100.00')
        self.stop_loss_pct = Decimal('0.15')  # 15% stop loss
        self.take_profit_pct = Decimal('0.30')  # 30% take profit
        self.min_sentiment_score = 0.8
        self.min_influencer_count = 5
        self.max_market_cap = 10_000_000  # $10M max market cap
        
    async def on_start(self):
        """Initialize Redis connection and start monitoring"""
        self.redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
        self.log.info("MemeTrader strategy started")
        
        # Subscribe to instruments we want to trade
        await self._subscribe_to_instruments()
        
    async def on_stop(self):
        """Cleanup on strategy stop"""
        if self.redis_client:
            await self.redis_client.close()
        self.log.info("MemeTrader strategy stopped")
        
    async def _subscribe_to_instruments(self):
        """Subscribe to cryptocurrency pairs for trading"""
        # Common meme coin pairs
        pairs = [
            "DOGE-USD", "SHIB-USD", "PEPE-USD", "FLOKI-USD",
            "BONK-USD", "WIF-USD", "POPCAT-USD", "BRETT-USD"
        ]
        
        for pair in pairs:
            try:
                instrument_id = InstrumentId.from_str(pair)
                self.subscribe_quote_ticks(instrument_id)
                self.subscribe_trade_ticks(instrument_id)
            except Exception as e:
                self.log.error(f"Failed to subscribe to {pair}: {e}")
    
    async def on_quote_tick(self, tick: QuoteTick):
        """Handle incoming quote tick data"""
        symbol = str(tick.instrument_id.symbol)
        
        # Check if we should execute trade based on sentiment
        await self._check_trading_signal(symbol, tick.bid_price)
        
    async def on_trade_tick(self, tick: TradeTick):
        """Handle incoming trade tick data"""
        symbol = str(tick.instrument_id.symbol)
        
        # Update position tracking with latest price
        await self._update_position_tracking(symbol, tick.price)
        
    async def _check_trading_signal(self, symbol: str, current_price: Price):
        """Check if we should execute a trade based on sentiment data"""
        try:
            # Get sentiment data from Redis
            sentiment_key = f"sentiment:{symbol}"
            sentiment_data = await self.redis_client.hgetall(sentiment_key)
            
            if not sentiment_data:
                return
                
            sentiment_score = float(sentiment_data.get('score', 0))
            influencer_count = int(sentiment_data.get('influencer_count', 0))
            market_cap = float(sentiment_data.get('market_cap', 0))
            last_updated = sentiment_data.get('last_updated')
            
            # Check if sentiment data is recent (within 30 minutes)
            if last_updated:
                update_time = datetime.fromisoformat(last_updated)
                if datetime.now() - update_time > timedelta(minutes=30):
                    return
            
            # Check trading conditions
            if (sentiment_score >= self.min_sentiment_score and 
                influencer_count >= self.min_influencer_count and
                market_cap <= self.max_market_cap and
                len(self.active_positions) < self.max_positions):
                
                # Execute buy order
                await self._execute_buy_order(symbol, current_price)
                
        except Exception as e:
            self.log.error(f"Error checking trading signal for {symbol}: {e}")
    
    async def _execute_buy_order(self, symbol: str, current_price: Price):
        """Execute a buy order for the given symbol"""
        try:
            instrument_id = InstrumentId.from_str(f"{symbol}-USD")
            
            # Calculate position size
            position_value = Money(self.position_size_usd, USD)
            quantity = Quantity(float(position_value.as_decimal() / current_price.as_decimal()), 8)
            
            # Create market buy order
            order = MarketOrder(
                trader_id=self.trader_id,
                strategy_id=self.id,
                instrument_id=instrument_id,
                client_order_id=self.generate_order_id(),
                order_side=OrderSide.BUY,
                quantity=quantity,
                time_in_force=TimeInForce.IOC,
                init_id=UUID4(),
                ts_init=self.clock.timestamp_ns(),
            )
            
            # Submit order
            self.submit_order(order)
            
            # Set up stop loss and take profit orders
            await self._setup_risk_orders(instrument_id, current_price, quantity)
            
            self.log.info(f"Executed BUY order for {symbol} at {current_price} (size: {quantity})")
            
        except Exception as e:
            self.log.error(f"Error executing buy order for {symbol}: {e}")
    
    async def _setup_risk_orders(self, instrument_id: InstrumentId, entry_price: Price, quantity: Quantity):
        """Set up stop loss and take profit orders"""
        try:
            # Calculate stop loss price (15% below entry)
            stop_loss_price = Price(
                float(entry_price.as_decimal() * (1 - self.stop_loss_pct)), 
                entry_price.precision
            )
            
            # Calculate take profit price (30% above entry)
            take_profit_price = Price(
                float(entry_price.as_decimal() * (1 + self.take_profit_pct)),
                entry_price.precision
            )
            
            # Create stop loss order
            stop_order = StopMarketOrder(
                trader_id=self.trader_id,
                strategy_id=self.id,
                instrument_id=instrument_id,
                client_order_id=self.generate_order_id(),
                order_side=OrderSide.SELL,
                quantity=quantity,
                trigger_price=stop_loss_price,
                time_in_force=TimeInForce.GTC,
                init_id=UUID4(),
                ts_init=self.clock.timestamp_ns(),
            )
            
            # Create take profit limit order
            limit_order = LimitOrder(
                trader_id=self.trader_id,
                strategy_id=self.id,
                instrument_id=instrument_id,
                client_order_id=self.generate_order_id(),
                order_side=OrderSide.SELL,
                quantity=quantity,
                price=take_profit_price,
                time_in_force=TimeInForce.GTC,
                init_id=UUID4(),
                ts_init=self.clock.timestamp_ns(),
            )
            
            # Submit risk management orders
            self.submit_order(stop_order)
            self.submit_order(limit_order)
            
        except Exception as e:
            self.log.error(f"Error setting up risk orders: {e}")
    
    async def _update_position_tracking(self, symbol: str, current_price: Price):
        """Update position tracking with current price"""
        try:
            # Get position for this symbol
            positions = self.cache.positions_open()
            
            for position in positions:
                if str(position.instrument_id.symbol) == symbol:
                    # Update position in Redis for WebSocket clients
                    position_data = {
                        'symbol': symbol,
                        'side': str(position.side),
                        'size': str(position.quantity),
                        'entry_price': str(position.avg_px_open),
                        'current_price': str(current_price),
                        'unrealized_pnl': str(position.unrealized_pnl(current_price)),
                        'realized_pnl': str(position.realized_pnl),
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    await self.redis_client.hset(f"position:{symbol}", mapping=position_data)
                    
                    # Publish update to WebSocket subscribers
                    await self.redis_client.publish('position_updates', json.dumps(position_data))
                    
        except Exception as e:
            self.log.error(f"Error updating position tracking: {e}")
    
    async def on_event(self, event: Event):
        """Handle trading events"""
        if isinstance(event, OrderFilled):
            await self._handle_order_filled(event)
        elif isinstance(event, PositionOpened):
            await self._handle_position_opened(event)
        elif isinstance(event, PositionClosed):
            await self._handle_position_closed(event)
    
    async def _handle_order_filled(self, event: OrderFilled):
        """Handle order filled event"""
        self.log.info(f"Order filled: {event.client_order_id} for {event.instrument_id}")
        
        # Update portfolio metrics in Redis
        portfolio_data = {
            'total_value': str(self.portfolio.net_liquidation_value()),
            'unrealized_pnl': str(self.portfolio.unrealized_pnl()),
            'realized_pnl': str(self.portfolio.realized_pnl()),
            'timestamp': datetime.now().isoformat()
        }
        
        await self.redis_client.hset('portfolio', mapping=portfolio_data)
        await self.redis_client.publish('portfolio_updates', json.dumps(portfolio_data))
    
    async def _handle_position_opened(self, event: PositionOpened):
        """Handle position opened event"""
        position = event.position
        self.active_positions[str(position.instrument_id.symbol)] = position
        self.log.info(f"Position opened: {position.instrument_id} - {position.quantity}")
    
    async def _handle_position_closed(self, event: PositionClosed):
        """Handle position closed event"""
        position = event.position
        symbol = str(position.instrument_id.symbol)
        
        if symbol in self.active_positions:
            del self.active_positions[symbol]
            
        self.log.info(f"Position closed: {position.instrument_id} - PnL: {position.realized_pnl}")
        
        # Log trade to Redis
        trade_data = {
            'symbol': symbol,
            'side': str(position.side),
            'entry_price': str(position.avg_px_open),
            'exit_price': str(position.avg_px_close),
            'quantity': str(position.quantity),
            'realized_pnl': str(position.realized_pnl),
            'duration': str(position.duration_ns / 1_000_000_000),  # seconds
            'timestamp': datetime.now().isoformat()
        }
        
        await self.redis_client.lpush('trade_history', json.dumps(trade_data))
        await self.redis_client.publish('trade_updates', json.dumps(trade_data))


class TradingEngine:
    """
    Main trading engine that coordinates Nautilus Trader with social sentiment
    """
    
    def __init__(self):
        self.node = None
        self.redis_client = None
        self.is_running = False
        
    async def initialize(self):
        """Initialize the trading engine"""
        try:
            # Configure logging
            logging_config = LoggingConfig(
                log_level="INFO",
                log_file_format="json",
                log_component_levels={
                    "nautilus_trader.live": "DEBUG",
                    "nautilus_trader.trading": "DEBUG"
                }
            )
            
            # Configure trading node
            config = TradingNodeConfig(
                trader_id=TraderId("MEME_TRADER-001"),
                logging=logging_config,
                cache=CacheConfig(),
                message_bus=MessageBusConfig(),
                risk_engine=RiskEngineConfig(),
                # Use sandbox for safe testing
                data_clients={
                    "SANDBOX": SandboxDataClientConfig()
                },
                exec_clients={
                    "SANDBOX": SandboxExecutionClientConfig()
                },
                strategies=[
                    {
                        "strategy_path": "server.trading_engine:MemeTrader",
                        "config_path": "strategies.meme_trader",
                        "config": {}
                    }
                ]
            )
            
            # Create and build trading node
            self.node = TradingNode(config=config)
            self.node.build()
            
            # Initialize Redis connection
            self.redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
            
            print("Trading engine initialized successfully")
            
        except Exception as e:
            print(f"Error initializing trading engine: {e}")
            raise
    
    async def start(self):
        """Start the trading engine"""
        try:
            if not self.node:
                await self.initialize()
            
            # Start the trading node
            self.node.start()
            self.is_running = True
            
            print("Trading engine started")
            
            # Start monitoring loop
            await self._monitoring_loop()
            
        except Exception as e:
            print(f"Error starting trading engine: {e}")
            await self.stop()
    
    async def stop(self):
        """Stop the trading engine"""
        try:
            self.is_running = False
            
            if self.node:
                self.node.stop()
                self.node.dispose()
            
            if self.redis_client:
                await self.redis_client.close()
            
            print("Trading engine stopped")
            
        except Exception as e:
            print(f"Error stopping trading engine: {e}")
    
    async def _monitoring_loop(self):
        """Main monitoring loop"""
        while self.is_running:
            try:
                # Check system health
                await self._check_system_health()
                
                # Sleep for 10 seconds
                await asyncio.sleep(10)
                
            except Exception as e:
                print(f"Error in monitoring loop: {e}")
                await asyncio.sleep(5)
    
    async def _check_system_health(self):
        """Check system health and log metrics"""
        try:
            if self.node and self.node.trader:
                # Get portfolio summary
                portfolio = self.node.trader.portfolio
                
                health_data = {
                    'timestamp': datetime.now().isoformat(),
                    'total_equity': str(portfolio.net_liquidation_value()),
                    'unrealized_pnl': str(portfolio.unrealized_pnl()),
                    'realized_pnl': str(portfolio.realized_pnl()),
                    'open_positions': len(portfolio.positions_open()),
                    'orders_working': len(portfolio.orders_working()),
                    'is_connected': True
                }
                
                # Store in Redis
                await self.redis_client.hset('system_health', mapping=health_data)
                
        except Exception as e:
            print(f"Error checking system health: {e}")
    
    async def emergency_stop(self):
        """Emergency stop all trading activities"""
        try:
            if self.node and self.node.trader:
                # Cancel all open orders
                for order in self.node.trader.portfolio.orders_working():
                    self.node.trader.cancel_order(order)
                
                # Close all positions
                for position in self.node.trader.portfolio.positions_open():
                    # Create market order to close position
                    close_order = MarketOrder(
                        trader_id=self.node.trader.id,
                        strategy_id=StrategyId("EMERGENCY"),
                        instrument_id=position.instrument_id,
                        client_order_id=ClientOrderId(f"EMERGENCY-{UUID4()}"),
                        order_side=OrderSide.SELL if position.side == OrderSide.BUY else OrderSide.BUY,
                        quantity=position.quantity,
                        time_in_force=TimeInForce.IOC,
                        init_id=UUID4(),
                        ts_init=self.node.clock.timestamp_ns(),
                    )
                    
                    self.node.trader.submit_order(close_order)
            
            print("Emergency stop executed - all positions and orders cancelled")
            return True
            
        except Exception as e:
            print(f"Error during emergency stop: {e}")
            return False


# Global trading engine instance
trading_engine = TradingEngine()


async def run_trading_engine():
    """Run the trading engine"""
    try:
        await trading_engine.start()
    except KeyboardInterrupt:
        print("Received interrupt signal, stopping trading engine...")
        await trading_engine.stop()
    except Exception as e:
        print(f"Trading engine error: {e}")
        await trading_engine.stop()


if __name__ == "__main__":
    asyncio.run(run_trading_engine())