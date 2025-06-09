import asyncio
import json
import logging
import os
from decimal import Decimal
from typing import Dict, List, Optional
import redis
from datetime import datetime, timedelta

# Nautilus Trader imports
from nautilus_trader.adapters.binance.common.enums import BinanceAccountType
from nautilus_trader.adapters.binance.config import BinanceExecClientConfig
from nautilus_trader.adapters.binance.factories import BinanceLiveExecClientFactory
from nautilus_trader.adapters.bybit.config import BybitExecClientConfig
from nautilus_trader.adapters.bybit.factories import BybitLiveExecClientFactory
from nautilus_trader.config import LiveExecEngineConfig, TradingNodeConfig
from nautilus_trader.core.datetime import dt_to_unix_nanos
from nautilus_trader.core.uuid import UUID4
from nautilus_trader.live.node import TradingNode
from nautilus_trader.model.currencies import USDT
from nautilus_trader.model.enums import OrderSide, TimeInForce
from nautilus_trader.model.identifiers import InstrumentId, Symbol, Venue
from nautilus_trader.model.objects import Money, Price, Quantity
from nautilus_trader.model.orders import MarketOrder
from nautilus_trader.portfolio.portfolio import Portfolio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TradingEngine:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            decode_responses=True
        )
        self.node: Optional[TradingNode] = None
        self.portfolio: Optional[Portfolio] = None
        self.active_positions: Dict[str, Dict] = {}
        self.risk_limits = {
            'max_position_size': Decimal('100.00'),
            'max_positions': 5,
            'daily_loss_limit': Decimal('200.00'),
            'stop_loss_percent': Decimal('15.00'),
            'take_profit_percent': Decimal('30.00')
        }
        
    async def initialize(self):
        """Initialize trading node with exchange configurations"""
        try:
            # Binance configuration
            binance_config = BinanceExecClientConfig(
                api_key=os.getenv('BINANCE_API_KEY'),
                api_secret=os.getenv('BINANCE_SECRET'),
                account_type=BinanceAccountType.SPOT,
                base_url_http=None,
                base_url_ws=None,
                us=False,
            )
            
            # Bybit configuration
            bybit_config = BybitExecClientConfig(
                api_key=os.getenv('BYBIT_API_KEY'),
                api_secret=os.getenv('BYBIT_SECRET'),
                base_url_http=None,
                base_url_ws=None,
                demo=False,
            )
            
            # Trading node configuration
            config = TradingNodeConfig(
                trader_id="MEMETRADER-001",
                exec_engine=LiveExecEngineConfig(
                    reconciliation=True,
                    reconciliation_lookback_mins=1440,
                ),
                exec_clients={
                    "BINANCE": BinanceLiveExecClientFactory.create(binance_config),
                    "BYBIT": BybitLiveExecClientFactory.create(bybit_config),
                },
            )
            
            # Create and start trading node
            self.node = TradingNode(config=config)
            await self.node.start_async()
            
            self.portfolio = self.node.portfolio
            logger.info("Trading engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize trading engine: {e}")
            raise
    
    async def execute_trade(self, signal: Dict) -> bool:
        """Execute a trade based on social sentiment signal"""
        try:
            symbol = signal['symbol']
            action = signal['action']  # 'buy' or 'sell'
            reason = signal.get('reason', 'social_sentiment')
            
            # Validate risk limits
            if not await self._validate_risk_limits(symbol, action):
                logger.warning(f"Trade rejected due to risk limits: {symbol}")
                return False
            
            # Get instrument
            instrument_id = InstrumentId(
                symbol=Symbol(symbol),
                venue=Venue(signal.get('exchange', 'BINANCE'))
            )
            
            # Calculate position size
            position_size = await self._calculate_position_size(symbol)
            
            if action == 'buy':
                await self._execute_buy_order(instrument_id, position_size, reason)
            elif action == 'sell':
                await self._execute_sell_order(instrument_id, position_size, reason)
                
            return True
            
        except Exception as e:
            logger.error(f"Trade execution failed: {e}")
            return False
    
    async def _execute_buy_order(self, instrument_id: InstrumentId, size: Decimal, reason: str):
        """Execute a buy order"""
        try:
            order = MarketOrder(
                trader_id=self.node.trader_id,
                strategy_id=self.node.trader_id,
                instrument_id=instrument_id,
                order_side=OrderSide.BUY,
                quantity=Quantity.from_str(str(size)),
                time_in_force=TimeInForce.IOC,
                order_id=UUID4(),
                ts_init=dt_to_unix_nanos(datetime.utcnow()),
            )
            
            self.node.submit_order(order)
            
            # Store position data
            self.active_positions[str(instrument_id)] = {
                'symbol': str(instrument_id.symbol),
                'side': 'buy',
                'size': float(size),
                'entry_time': datetime.utcnow().isoformat(),
                'reason': reason,
                'order_id': str(order.order_id)
            }
            
            logger.info(f"Buy order submitted: {instrument_id} for {size}")
            
        except Exception as e:
            logger.error(f"Buy order execution failed: {e}")
            raise
    
    async def _execute_sell_order(self, instrument_id: InstrumentId, size: Decimal, reason: str):
        """Execute a sell order"""
        try:
            order = MarketOrder(
                trader_id=self.node.trader_id,
                strategy_id=self.node.trader_id,
                instrument_id=instrument_id,
                order_side=OrderSide.SELL,
                quantity=Quantity.from_str(str(size)),
                time_in_force=TimeInForce.IOC,
                order_id=UUID4(),
                ts_init=dt_to_unix_nanos(datetime.utcnow()),
            )
            
            self.node.submit_order(order)
            
            # Remove from active positions if closing
            if str(instrument_id) in self.active_positions:
                del self.active_positions[str(instrument_id)]
            
            logger.info(f"Sell order submitted: {instrument_id} for {size}")
            
        except Exception as e:
            logger.error(f"Sell order execution failed: {e}")
            raise
    
    async def _validate_risk_limits(self, symbol: str, action: str) -> bool:
        """Validate trade against risk management rules"""
        try:
            # Check maximum positions
            if len(self.active_positions) >= self.risk_limits['max_positions'] and action == 'buy':
                return False
            
            # Check daily loss limit
            daily_pnl = await self._calculate_daily_pnl()
            if daily_pnl <= -self.risk_limits['daily_loss_limit']:
                return False
            
            # Check position size limits
            total_exposure = sum(pos['size'] for pos in self.active_positions.values())
            max_total_exposure = self.risk_limits['max_position_size'] * self.risk_limits['max_positions']
            
            if total_exposure >= max_total_exposure and action == 'buy':
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Risk validation failed: {e}")
            return False
    
    async def _calculate_position_size(self, symbol: str) -> Decimal:
        """Calculate appropriate position size based on risk management"""
        # For meme coins, use fixed position size
        return self.risk_limits['max_position_size']
    
    async def _calculate_daily_pnl(self) -> Decimal:
        """Calculate daily P&L from portfolio"""
        try:
            if not self.portfolio:
                return Decimal('0')
            
            # This would calculate actual P&L from portfolio positions
            # For now, return 0 as placeholder
            return Decimal('0')
            
        except Exception as e:
            logger.error(f"Daily P&L calculation failed: {e}")
            return Decimal('0')
    
    async def monitor_positions(self):
        """Monitor active positions for stop-loss and take-profit"""
        try:
            for instrument_id, position_data in list(self.active_positions.items()):
                symbol = position_data['symbol']
                
                # Get current price from Redis cache
                current_price_str = self.redis_client.get(f"price:{symbol}")
                if not current_price_str:
                    continue
                
                current_price = Decimal(current_price_str)
                entry_price = Decimal(position_data.get('entry_price', '0'))
                
                if entry_price == 0:
                    continue
                
                # Calculate P&L percentage
                pnl_percent = ((current_price - entry_price) / entry_price) * 100
                
                # Check stop-loss
                if pnl_percent <= -self.risk_limits['stop_loss_percent']:
                    await self._close_position(instrument_id, 'stop_loss')
                    continue
                
                # Check take-profit
                if pnl_percent >= self.risk_limits['take_profit_percent']:
                    await self._close_position(instrument_id, 'take_profit')
                    continue
                
                # Check social volume drop (60% from peak)
                social_volume = self.redis_client.get(f"social_volume:{symbol}")
                if social_volume and float(social_volume) < 0.4:  # 60% drop means 40% remaining
                    await self._close_position(instrument_id, 'social_volume_drop')
                
        except Exception as e:
            logger.error(f"Position monitoring failed: {e}")
    
    async def _close_position(self, instrument_id: str, reason: str):
        """Close a position"""
        try:
            if instrument_id not in self.active_positions:
                return
            
            position_data = self.active_positions[instrument_id]
            
            # Execute sell order
            await self._execute_sell_order(
                InstrumentId.from_str(instrument_id),
                Decimal(str(position_data['size'])),
                reason
            )
            
            logger.info(f"Position closed: {instrument_id} due to {reason}")
            
        except Exception as e:
            logger.error(f"Position closing failed: {e}")
    
    async def get_portfolio_status(self) -> Dict:
        """Get current portfolio status"""
        try:
            if not self.portfolio:
                return {}
            
            total_value = sum(pos['size'] for pos in self.active_positions.values())
            total_pnl = await self._calculate_daily_pnl()
            
            return {
                'total_value': float(total_value),
                'daily_pnl': float(total_pnl),
                'active_positions': len(self.active_positions),
                'max_positions': self.risk_limits['max_positions'],
                'available_funds': float(
                    self.risk_limits['max_position_size'] * self.risk_limits['max_positions'] - Decimal(str(total_value))
                )
            }
            
        except Exception as e:
            logger.error(f"Portfolio status retrieval failed: {e}")
            return {}
    
    async def emergency_stop(self):
        """Emergency stop all trading activities"""
        try:
            logger.warning("Emergency stop initiated!")
            
            # Close all active positions
            for instrument_id in list(self.active_positions.keys()):
                await self._close_position(instrument_id, 'emergency_stop')
            
            # Clear active positions
            self.active_positions.clear()
            
            # Set emergency flag in Redis
            self.redis_client.set('emergency_stop', '1', ex=3600)  # 1 hour
            
            logger.info("Emergency stop completed")
            
        except Exception as e:
            logger.error(f"Emergency stop failed: {e}")
    
    async def run(self):
        """Main trading engine loop"""
        logger.info("Starting trading engine...")
        
        await self.initialize()
        
        while True:
            try:
                # Check for emergency stop
                if self.redis_client.get('emergency_stop'):
                    await asyncio.sleep(60)  # Wait 1 minute before checking again
                    continue
                
                # Monitor existing positions
                await self.monitor_positions()
                
                # Check for new trading signals
                signals = self.redis_client.lrange('trading_signals', 0, -1)
                for signal_json in signals:
                    signal = json.loads(signal_json)
                    await self.execute_trade(signal)
                    
                # Clear processed signals
                if signals:
                    self.redis_client.delete('trading_signals')
                
                await asyncio.sleep(5)  # Check every 5 seconds
                
            except Exception as e:
                logger.error(f"Trading engine error: {e}")
                await asyncio.sleep(10)  # Wait longer on error

if __name__ == "__main__":
    engine = TradingEngine()
    asyncio.run(engine.run())
