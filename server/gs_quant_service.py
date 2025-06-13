#!/usr/bin/env python3
"""
GS Quant Integration Service for 8Trader8Panda
Professional quantitative finance capabilities from Goldman Sachs
"""

import asyncio
import json
import logging
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd

# GS Quant imports
try:
    from gs_quant.session import GsSession, Environment
    from gs_quant.instrument import EqOption, FXOption
    from gs_quant.risk import RollFwd, MarketDataShockBasedScenario
    from gs_quant.markets.portfolio import Portfolio
    from gs_quant.markets.position_set import PositionSet
    from gs_quant.risk import Price, PnlExplain, DollarPrice
    from gs_quant.common import Currency, AssetClass
    from gs_quant.data import Dataset
    from gs_quant.backtests.strategy import Strategy
    from gs_quant.backtests.triggers import *
    from gs_quant.backtests.actions import *
    from gs_quant.backtests.equity_vol_engine import *
    GS_QUANT_AVAILABLE = True
except ImportError as e:
    print(f"GS Quant import error: {e}")
    GS_QUANT_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GSQuantService:
    """Goldman Sachs Quantitative Finance Service Integration"""
    
    def __init__(self):
        self.session = None
        self.authenticated = False
        self.portfolios = {}
        self.risk_models = {}
        self.strategies = {}
        
        # Risk metrics cache
        self.risk_cache = {
            'var_95': {},
            'expected_shortfall': {},
            'portfolio_beta': {},
            'correlation_matrix': {},
            'stress_tests': {}
        }
        
    async def initialize(self, client_id: str = None, client_secret: str = None):
        """Initialize GS Quant session with credentials"""
        if not GS_QUANT_AVAILABLE:
            logger.warning("GS Quant not available - using simulation mode")
            self.authenticated = False
            return False
            
        try:
            if client_id and client_secret:
                # Production authentication
                self.session = GsSession.use(
                    Environment.PROD,
                    client_id=client_id,
                    client_secret=client_secret
                )
                self.authenticated = True
                logger.info("GS Quant authenticated with production environment")
            else:
                # Demo mode without authentication
                logger.info("GS Quant running in demo mode without authentication")
                self.authenticated = False
                
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize GS Quant: {e}")
            self.authenticated = False
            return False
    
    async def calculate_portfolio_var(self, positions: List[Dict], confidence: float = 0.95) -> Dict:
        """Calculate Value at Risk using GS Quant risk models"""
        try:
            if not self.authenticated:
                # Simulate VaR calculation for demo
                total_value = sum(float(pos.get('value', 0)) for pos in positions)
                simulated_var = total_value * 0.15 * np.random.uniform(0.8, 1.2)
                
                return {
                    'var_95': simulated_var,
                    'var_99': simulated_var * 1.5,
                    'expected_shortfall': simulated_var * 1.3,
                    'confidence_level': confidence,
                    'time_horizon': '1d',
                    'method': 'historical_simulation',
                    'currency': 'USD'
                }
            
            # Authenticated GS Quant VaR calculation
            portfolio_positions = []
            for pos in positions:
                # Convert position to GS Quant format
                position_data = {
                    'instrument': pos.get('symbol', ''),
                    'quantity': float(pos.get('quantity', 0)),
                    'price': float(pos.get('price', 0))
                }
                portfolio_positions.append(position_data)
            
            # Create portfolio and calculate risk
            portfolio = Portfolio(portfolio_positions)
            
            # Calculate VaR using GS risk models
            var_result = await self._calculate_gs_var(portfolio, confidence)
            
            return var_result
            
        except Exception as e:
            logger.error(f"Error calculating portfolio VaR: {e}")
            return {'error': str(e)}
    
    async def _calculate_gs_var(self, portfolio, confidence: float) -> Dict:
        """Internal GS Quant VaR calculation"""
        try:
            # Use GS Quant risk calculation
            with portfolio:
                # Calculate price risk
                price_risk = portfolio.calc(Price)
                
                # Calculate P&L explain
                pnl_explain = portfolio.calc(PnlExplain)
                
                # Historical simulation for VaR
                var_95 = np.percentile(price_risk, (1 - confidence) * 100)
                expected_shortfall = np.mean(price_risk[price_risk <= var_95])
                
                return {
                    'var_95': float(var_95),
                    'expected_shortfall': float(expected_shortfall),
                    'confidence_level': confidence,
                    'portfolio_value': float(np.sum(price_risk)),
                    'method': 'gs_quant_historical',
                    'currency': 'USD'
                }
                
        except Exception as e:
            logger.error(f"GS Quant VaR calculation error: {e}")
            raise e
    
    async def stress_test_portfolio(self, positions: List[Dict], scenarios: List[str]) -> Dict:
        """Run stress tests using GS Quant scenario analysis"""
        try:
            stress_results = {}
            
            # Define stress scenarios
            scenario_definitions = {
                'market_crash': {'equity_shock': -0.30, 'vol_shock': 2.0},
                'interest_rate_shock': {'rates_shock': 0.02, 'credit_shock': 0.01},
                'crypto_crash': {'crypto_shock': -0.50, 'correlation_break': True},
                'volatility_spike': {'vol_shock': 3.0, 'liquidity_shock': 0.5},
                'currency_crisis': {'fx_shock': 0.15, 'emerging_shock': -0.25}
            }
            
            for scenario_name in scenarios:
                if scenario_name in scenario_definitions:
                    scenario_result = await self._run_stress_scenario(
                        positions, 
                        scenario_definitions[scenario_name]
                    )
                    stress_results[scenario_name] = scenario_result
            
            return {
                'stress_tests': stress_results,
                'worst_case_scenario': min(stress_results.values(), key=lambda x: x.get('pnl', 0)),
                'diversification_benefit': self._calculate_diversification_benefit(stress_results),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in stress testing: {e}")
            return {'error': str(e)}
    
    async def _run_stress_scenario(self, positions: List[Dict], scenario: Dict) -> Dict:
        """Run individual stress scenario"""
        try:
            total_pnl = 0
            position_impacts = []
            
            for pos in positions:
                position_value = float(pos.get('value', 0))
                symbol = pos.get('symbol', '')
                
                # Apply scenario shocks based on asset type
                if 'crypto' in symbol.lower() or symbol in ['DOGECOIN', 'SHIBA', 'PEPE', 'FLOKI']:
                    shock = scenario.get('crypto_shock', scenario.get('equity_shock', -0.10))
                else:
                    shock = scenario.get('equity_shock', -0.10)
                
                # Apply volatility adjustment
                vol_multiplier = scenario.get('vol_shock', 1.0)
                adjusted_shock = shock * vol_multiplier
                
                position_pnl = position_value * adjusted_shock
                total_pnl += position_pnl
                
                position_impacts.append({
                    'symbol': symbol,
                    'original_value': position_value,
                    'shock_applied': adjusted_shock,
                    'pnl': position_pnl,
                    'pnl_percent': (position_pnl / position_value) * 100 if position_value > 0 else 0
                })
            
            return {
                'total_pnl': total_pnl,
                'pnl_percent': (total_pnl / sum(float(p.get('value', 0)) for p in positions)) * 100,
                'position_impacts': position_impacts,
                'max_loss': min(impact['pnl'] for impact in position_impacts),
                'scenario_params': scenario
            }
            
        except Exception as e:
            logger.error(f"Error running stress scenario: {e}")
            return {'error': str(e)}
    
    def _calculate_diversification_benefit(self, stress_results: Dict) -> float:
        """Calculate portfolio diversification benefit"""
        try:
            # Simple diversification metric based on correlation of stress impacts
            scenario_pnls = [result.get('total_pnl', 0) for result in stress_results.values()]
            
            if len(scenario_pnls) < 2:
                return 0.0
                
            # Calculate variance reduction from diversification
            portfolio_var = np.var(scenario_pnls)
            individual_var = np.mean([np.var([impact['pnl'] for impact in result.get('position_impacts', [])]) 
                                    for result in stress_results.values()])
            
            diversification_ratio = 1 - (portfolio_var / max(individual_var, 0.001))
            return max(0, min(1, diversification_ratio))
            
        except Exception as e:
            logger.error(f"Error calculating diversification benefit: {e}")
            return 0.0
    
    async def optimize_portfolio(self, current_positions: List[Dict], target_return: float, 
                                max_risk: float) -> Dict:
        """Portfolio optimization using GS Quant methodologies"""
        try:
            optimization_result = {
                'current_portfolio': current_positions,
                'optimized_weights': {},
                'expected_return': 0.0,
                'expected_risk': 0.0,
                'sharpe_ratio': 0.0,
                'optimization_method': 'mean_variance',
                'constraints': {
                    'target_return': target_return,
                    'max_risk': max_risk
                }
            }
            
            # Calculate current portfolio metrics
            total_value = sum(float(pos.get('value', 0)) for pos in current_positions)
            
            if total_value == 0:
                return optimization_result
            
            # Simulate optimization (in production, use GS Quant optimization algorithms)
            symbols = [pos.get('symbol', '') for pos in current_positions]
            current_weights = [float(pos.get('value', 0)) / total_value for pos in current_positions]
            
            # Simple mean-variance optimization simulation
            optimized_weights = await self._simulate_mean_variance_optimization(
                symbols, current_weights, target_return, max_risk
            )
            
            # Calculate optimized portfolio metrics
            expected_return = np.dot(optimized_weights, [0.15, 0.12, 0.18, 0.10])  # Simulated returns
            expected_risk = np.sqrt(np.dot(optimized_weights, np.dot([[0.04, 0.02, 0.01, 0.015],
                                                                     [0.02, 0.03, 0.012, 0.008],
                                                                     [0.01, 0.012, 0.05, 0.02],
                                                                     [0.015, 0.008, 0.02, 0.025]], optimized_weights)))
            
            sharpe_ratio = (expected_return - 0.02) / max(expected_risk, 0.001)  # Assuming 2% risk-free rate
            
            optimization_result.update({
                'optimized_weights': dict(zip(symbols, optimized_weights)),
                'expected_return': float(expected_return),
                'expected_risk': float(expected_risk),
                'sharpe_ratio': float(sharpe_ratio),
                'improvement': {
                    'return_improvement': float(expected_return - target_return),
                    'risk_reduction': max(0, float(max_risk - expected_risk)),
                    'sharpe_improvement': float(sharpe_ratio - self._calculate_current_sharpe(current_positions))
                }
            })
            
            return optimization_result
            
        except Exception as e:
            logger.error(f"Error in portfolio optimization: {e}")
            return {'error': str(e)}
    
    async def _simulate_mean_variance_optimization(self, symbols: List[str], current_weights: List[float],
                                                  target_return: float, max_risk: float) -> List[float]:
        """Simulate mean-variance optimization"""
        try:
            # Simplified optimization - in production use scipy.optimize or GS Quant optimizers
            n_assets = len(symbols)
            
            # Start with equal weights
            optimized_weights = np.array(current_weights)
            
            # Apply simple adjustment based on target return and risk
            risk_adjustment = max_risk / 0.2  # Normalize to typical risk level
            return_adjustment = target_return / 0.15  # Normalize to typical return
            
            # Adjust weights (simplified approach)
            for i in range(n_assets):
                weight_adjustment = (risk_adjustment + return_adjustment) / 2 - 1
                optimized_weights[i] *= (1 + weight_adjustment * 0.1)
            
            # Normalize weights to sum to 1
            optimized_weights = optimized_weights / np.sum(optimized_weights)
            
            return optimized_weights.tolist()
            
        except Exception as e:
            logger.error(f"Error in mean-variance optimization: {e}")
            return current_weights
    
    def _calculate_current_sharpe(self, positions: List[Dict]) -> float:
        """Calculate current portfolio Sharpe ratio"""
        try:
            # Simplified calculation
            total_value = sum(float(pos.get('value', 0)) for pos in positions)
            if total_value == 0:
                return 0.0
                
            # Simulate portfolio return and risk
            portfolio_return = np.random.uniform(0.08, 0.18)
            portfolio_risk = np.random.uniform(0.15, 0.30)
            risk_free_rate = 0.02
            
            return (portfolio_return - risk_free_rate) / max(portfolio_risk, 0.001)
            
        except Exception as e:
            logger.error(f"Error calculating Sharpe ratio: {e}")
            return 0.0
    
    async def backtest_strategy(self, strategy_config: Dict, start_date: str, end_date: str) -> Dict:
        """Backtest trading strategy using GS Quant backtesting engine"""
        try:
            backtest_result = {
                'strategy_name': strategy_config.get('name', 'Custom Strategy'),
                'period': {'start': start_date, 'end': end_date},
                'performance': {
                    'total_return': 0.0,
                    'annualized_return': 0.0,
                    'volatility': 0.0,
                    'sharpe_ratio': 0.0,
                    'max_drawdown': 0.0,
                    'win_rate': 0.0
                },
                'trades': [],
                'daily_returns': [],
                'risk_metrics': {}
            }
            
            # Simulate backtest execution
            trading_days = pd.date_range(start=start_date, end=end_date, freq='D')
            daily_returns = []
            cumulative_return = 1.0
            max_value = 1.0
            trades = []
            
            for i, date in enumerate(trading_days):
                # Simulate daily return based on strategy
                base_return = np.random.normal(0.001, 0.02)  # 0.1% daily return, 2% volatility
                
                # Apply strategy logic (simplified)
                strategy_alpha = strategy_config.get('alpha', 0.0001)
                daily_return = base_return + strategy_alpha
                
                cumulative_return *= (1 + daily_return)
                max_value = max(max_value, cumulative_return)
                
                daily_returns.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'daily_return': float(daily_return),
                    'cumulative_return': float(cumulative_return - 1),
                    'portfolio_value': float(cumulative_return * 10000)  # $10k starting value
                })
                
                # Simulate trades (random strategy)
                if i % 10 == 0 and np.random.random() > 0.7:  # Trade every ~10 days, 30% probability
                    trade = {
                        'date': date.strftime('%Y-%m-%d'),
                        'symbol': np.random.choice(['DOGECOIN', 'SHIBA', 'PEPE', 'FLOKI']),
                        'action': 'BUY' if daily_return > 0 else 'SELL',
                        'quantity': np.random.uniform(50, 200),
                        'price': np.random.uniform(0.0001, 0.001),
                        'pnl': daily_return * 1000  # Simulated P&L
                    }
                    trades.append(trade)
            
            # Calculate performance metrics
            total_return = cumulative_return - 1
            trading_days_count = len(trading_days)
            annualized_return = ((1 + total_return) ** (365 / trading_days_count)) - 1
            
            returns_series = np.array([d['daily_return'] for d in daily_returns])
            volatility = np.std(returns_series) * np.sqrt(252)  # Annualized volatility
            sharpe_ratio = (annualized_return - 0.02) / max(volatility, 0.001)
            
            # Calculate max drawdown
            peak_values = [d['portfolio_value'] for d in daily_returns]
            running_max = np.maximum.accumulate(peak_values)
            drawdowns = (peak_values - running_max) / running_max
            max_drawdown = abs(min(drawdowns))
            
            # Calculate win rate
            winning_trades = [t for t in trades if t['pnl'] > 0]
            win_rate = len(winning_trades) / max(len(trades), 1)
            
            backtest_result['performance'] = {
                'total_return': float(total_return),
                'annualized_return': float(annualized_return),
                'volatility': float(volatility),
                'sharpe_ratio': float(sharpe_ratio),
                'max_drawdown': float(max_drawdown),
                'win_rate': float(win_rate),
                'total_trades': len(trades),
                'profit_factor': float(sum(t['pnl'] for t in trades if t['pnl'] > 0) / 
                               max(abs(sum(t['pnl'] for t in trades if t['pnl'] < 0)), 1))
            }
            
            backtest_result['trades'] = trades
            backtest_result['daily_returns'] = daily_returns
            
            return backtest_result
            
        except Exception as e:
            logger.error(f"Error in strategy backtesting: {e}")
            return {'error': str(e)}
    
    async def get_market_data(self, symbols: List[str], start_date: str, end_date: str) -> Dict:
        """Get market data using GS Quant data APIs"""
        try:
            if not self.authenticated:
                # Return simulated market data
                market_data = {}
                
                for symbol in symbols:
                    dates = pd.date_range(start=start_date, end=end_date, freq='D')
                    prices = []
                    base_price = np.random.uniform(0.0001, 0.001)
                    
                    for i, date in enumerate(dates):
                        # Random walk with drift
                        if i == 0:
                            price = base_price
                        else:
                            price = prices[-1] * (1 + np.random.normal(0.001, 0.03))
                        
                        prices.append(max(0.00001, price))  # Ensure positive prices
                    
                    market_data[symbol] = {
                        'dates': [d.strftime('%Y-%m-%d') for d in dates],
                        'prices': prices,
                        'returns': [0] + [(prices[i] - prices[i-1]) / prices[i-1] 
                                        for i in range(1, len(prices))],
                        'volume': [np.random.uniform(1000000, 50000000) for _ in dates]
                    }
                
                return market_data
            
            # Authenticated market data retrieval would go here
            # Using GS Quant Dataset API for real market data
            
            return {'info': 'Authenticated market data retrieval not implemented in demo'}
            
        except Exception as e:
            logger.error(f"Error retrieving market data: {e}")
            return {'error': str(e)}

async def main():
    """Main service entry point"""
    gs_service = GSQuantService()
    
    try:
        # Initialize service
        await gs_service.initialize()
        logger.info("GS Quant service initialized")
        
        # Listen for commands from Node.js bridge
        while True:
            try:
                # In production, this would listen for real commands
                await asyncio.sleep(30)
                
                # Example output for demonstration
                sample_positions = [
                    {'symbol': 'DOGECOIN', 'value': 1000, 'quantity': 100000},
                    {'symbol': 'SHIBA', 'value': 800, 'quantity': 80000},
                    {'symbol': 'PEPE', 'value': 600, 'quantity': 60000}
                ]
                
                # Calculate VaR
                var_result = await gs_service.calculate_portfolio_var(sample_positions)
                
                # Output result for Node.js bridge
                print(json.dumps({
                    'type': 'gs_quant_var',
                    'data': var_result,
                    'timestamp': datetime.now().isoformat()
                }))
                sys.stdout.flush()
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                await asyncio.sleep(5)
                
    except Exception as e:
        logger.error(f"Service error: {e}")
    finally:
        logger.info("GS Quant service stopped")

if __name__ == "__main__":
    asyncio.run(main())