# Live Trading Deployment Checklist

## CRITICAL: API Keys Required for Real Money Trading

### Essential Services (Required for Basic Operation)
```bash
# Twitter/X API for social sentiment monitoring
export TWITTER_BEARER_TOKEN="your_twitter_bearer_token"

# CoinGecko Pro for real-time price data
export COINGECKO_API_KEY="your_coingecko_pro_key"

# Ethereum RPC for DEX access
export ETHEREUM_RPC_URL="https://mainnet.infura.io/v3/your_project_id"

# Trading wallet private key (SECURE THIS!)
export WALLET_PRIVATE_KEY="your_ethereum_wallet_private_key"

# Alibaba Cloud AI (already configured)
export ALIBABA_CLOUD_API_KEY="your_alibaba_key"
```

### Professional Services (Recommended for Profit Maximization)
```bash
# Enhanced APIs for competitive edge
export INFURA_PROJECT_ID="your_infura_project_id"
export MORALIS_API_KEY="your_moralis_api_key"
export MESSARI_API_KEY="your_messari_api_key"
```

## VALIDATION ENDPOINTS NOW AVAILABLE

### Test System Readiness
```bash
# Check all services status
GET /api/system/health

# Run comprehensive production validation
GET /api/testing/validation

# Get production readiness score
GET /api/system/production-readiness

# Check required API keys
GET /api/testing/required-apis
```

### Test Trading Capabilities
```bash
# Test DEX price feeds
GET /api/dex/prices

# Simulate a trade (no real money)
POST /api/dex/simulate-trade
{
  "tokenIn": "ETH",
  "tokenOut": "DOGE", 
  "amountIn": "0.1",
  "slippageTolerance": 5,
  "deadline": 300
}

# Test AI analysis
POST /api/ai/analyze
{
  "symbol": "DOGE",
  "price": 0.08,
  "volume": 400000000,
  "marketCap": 11000000000,
  "sentiment": 0.5,
  "socialMentions": 1000,
  "influencerCount": 5
}
```

### Backtesting for Strategy Validation
```bash
# Run 6-month historical backtest
POST /api/backtest/run
{
  "startDate": "2024-01-01",
  "endDate": "2024-06-01", 
  "initialCapital": 10000,
  "symbols": ["DOGE", "SHIB", "PEPE", "FLOKI"],
  "strategy": "hybrid",
  "riskManagement": {
    "maxPositionSize": 1000,
    "stopLossPercent": 15,
    "takeProfitPercent": 30,
    "maxDrawdown": 20
  }
}
```

## REAL MONEY TRADING ACTIVATION

### Start Live Trading (After Validation)
```bash
# Activate live trading with real money
POST /api/live-trading/start
{
  "userId": 1,
  "strategy": "hybrid",
  "riskLevel": "MEDIUM"
}

# Emergency stop all trading
POST /api/live-trading/stop
{
  "userId": 1
}
```

### Execute Real Trades
```bash
# Execute actual DEX trade (REAL MONEY!)
POST /api/dex/execute-trade
{
  "tokenIn": "ETH",
  "tokenOut": "DOGE",
  "amountIn": "0.1", 
  "slippageTolerance": 5,
  "deadline": 300
}
```

## PROFITABILITY REQUIREMENTS

### Minimum Performance Thresholds
- Backtest Win Rate: >60%
- Sharpe Ratio: >1.5
- Maximum Drawdown: <15%
- Expected Monthly Return: >5%
- System Latency: <2 seconds
- API Uptime: >99%

### Risk Management Controls
- Maximum position size: 5% of portfolio
- Stop loss: 15% below entry
- Take profit: 30% above entry
- Daily loss limit: 10% of portfolio
- Maximum correlation: 50% between positions

## PRODUCTION DEPLOYMENT STEPS

### 1. Environment Setup
```bash
# Set all required environment variables
# Test each API connection individually
# Verify wallet has sufficient ETH for gas fees
```

### 2. System Validation
```bash
# Run full validation suite
curl http://localhost:5000/api/testing/validation

# Ensure score >75 and no critical issues
# Verify all services show "ready: true"
```

### 3. Paper Trading Phase (RECOMMENDED)
```bash
# Run 7-14 days of paper trading
# Monitor performance metrics
# Validate risk controls
# Test emergency stop procedures
```

### 4. Micro-Investment Phase
```bash
# Start with $100-500 positions
# Monitor execution quality
# Validate slippage and fees
# Confirm P&L tracking accuracy
```

### 5. Gradual Scaling
```bash
# Increase position sizes gradually
# Monitor performance degradation
# Adjust risk parameters based on results
# Document all trades for analysis
```

## MONITORED CRYPTO INFLUENCERS

The system monitors 25+ high-value crypto influencers including:
- Elon Musk (@elonmusk) - 100M followers
- Vitalik Buterin (@VitalikButerin) - 5M followers  
- Anthony Pompliano (@APompliano) - 1.8M followers
- Will Clemente (@WClementeIII) - 800K followers
- Plus 20+ specialized meme coin analysts

## TARGET TOKENS

Primary focus on meme coins <$10M market cap:
- DOGE, SHIB, PEPE, FLOKI
- BABYDOGE, SAFEMOON, ELON
- KISHU, AKITA, DOGELON
- Plus emerging tokens based on social signals

## SUCCESS METRICS DASHBOARD

Real-time monitoring via:
- `/api/streaming/prices` - Enhanced prices with AI signals
- WebSocket connection for live updates
- Portfolio tracking with risk metrics
- Trade execution confirmations
- P&L calculations with fees

## EMERGENCY PROCEDURES

### Circuit Breakers
- Auto-stop if daily loss >10%
- Auto-stop if drawdown >15%
- Manual emergency stop always available
- Position liquidation in 30 seconds

### Risk Alerts
- SMS/Email notifications for large losses
- API rate limit monitoring
- Wallet balance alerts
- System health monitoring

This system is now ready for profitable automated meme coin trading with proper API configuration.