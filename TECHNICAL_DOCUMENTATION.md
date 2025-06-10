# Technical Documentation - 8Trader8Panda

## System Architecture

### High-Level Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │  Trading Engine │
│   React + TS    │◄──►│   Express + TS   │◄──►│   Python        │
│   WebSocket     │    │   WebSocket.io   │    │   Nautilus      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CDN/Static    │    │   Redis Cache    │    │   Market APIs   │
│   Assets        │    │   Sessions       │    │   CoinGecko     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   PostgreSQL     │    │   Twitter API   │
│   SSL/TLS       │    │   Trading Data   │    │   Sentiment     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Infrastructure Components

#### Frontend Layer
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query v5
- **Real-time**: WebSocket connections
- **Build**: Vite with optimized bundling
- **Hosting**: Static files served via CDN

#### Backend API Layer
- **Runtime**: Node.js 20+ with Express framework
- **Language**: TypeScript with strict mode
- **Authentication**: JWT tokens + OAuth 2.0
- **Session Management**: Redis-backed sessions
- **Real-time**: Socket.io for WebSocket communication
- **Database ORM**: Drizzle with PostgreSQL

#### Trading Engine Layer
- **Runtime**: Python 3.11+
- **Framework**: Nautilus Trader for risk management
- **Market Data**: Multiple API integrations
- **Social Sentiment**: Twitter API v2 streaming
- **AI Analysis**: Alibaba Cloud Model Studio
- **Execution**: DEX integration via Web3

#### Infrastructure Layer
- **Cloud Provider**: Alibaba Cloud (Singapore)
- **Compute**: ECS instances with auto-scaling
- **Database**: Redis + PostgreSQL managed services
- **Networking**: VPC with security groups
- **Load Balancing**: Application Load Balancer with SSL
- **Monitoring**: CloudMonitor + custom metrics

## Database Schema

### Trading Tables

```sql
-- Users and authentication
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE,
  twitter_id VARCHAR(50) UNIQUE,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trading positions
CREATE TABLE positions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  token_symbol VARCHAR(10) NOT NULL,
  token_address VARCHAR(42),
  entry_price DECIMAL(20,8) NOT NULL,
  quantity DECIMAL(20,8) NOT NULL,
  stop_loss DECIMAL(20,8),
  take_profit DECIMAL(20,8),
  status VARCHAR(20) DEFAULT 'OPEN',
  opened_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  pnl DECIMAL(20,8) DEFAULT 0
);

-- Trade executions
CREATE TABLE trades (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  position_id INTEGER REFERENCES positions(id),
  token_symbol VARCHAR(10) NOT NULL,
  action VARCHAR(10) NOT NULL, -- BUY, SELL
  price DECIMAL(20,8) NOT NULL,
  quantity DECIMAL(20,8) NOT NULL,
  fee DECIMAL(20,8) DEFAULT 0,
  tx_hash VARCHAR(66),
  executed_at TIMESTAMP DEFAULT NOW()
);

-- AI analysis results
CREATE TABLE ai_analysis (
  id SERIAL PRIMARY KEY,
  token_symbol VARCHAR(10) NOT NULL,
  signal VARCHAR(10) NOT NULL, -- BUY, SELL, HOLD
  confidence DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
  risk_level VARCHAR(10) NOT NULL, -- LOW, MEDIUM, HIGH
  reasoning TEXT,
  price_target DECIMAL(20,8),
  stop_loss DECIMAL(20,8),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Social sentiment data
CREATE TABLE sentiment_data (
  id SERIAL PRIMARY KEY,
  token_symbol VARCHAR(10) NOT NULL,
  platform VARCHAR(20) NOT NULL, -- TWITTER, REDDIT, etc.
  sentiment_score DECIMAL(3,2) NOT NULL, -- -1.00 to 1.00
  mention_count INTEGER DEFAULT 0,
  influencer_count INTEGER DEFAULT 0,
  collected_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes for Performance

```sql
-- Trading queries
CREATE INDEX idx_positions_user_status ON positions(user_id, status);
CREATE INDEX idx_trades_user_date ON trades(user_id, executed_at DESC);
CREATE INDEX idx_sentiment_symbol_date ON sentiment_data(token_symbol, collected_at DESC);
CREATE INDEX idx_ai_analysis_symbol_date ON ai_analysis(token_symbol, created_at DESC);

-- Real-time queries
CREATE INDEX idx_positions_active ON positions(status) WHERE status = 'OPEN';
CREATE INDEX idx_recent_trades ON trades(executed_at DESC) WHERE executed_at > NOW() - INTERVAL '24 hours';
```

## API Specifications

### Authentication Endpoints

#### POST /api/auth/twitter
Initialize Twitter OAuth flow
```json
{
  "callback_url": "https://8trader8panda8.xin/auth/callback"
}
```
Response:
```json
{
  "auth_url": "https://twitter.com/i/oauth2/authorize?...",
  "state": "random_state_string"
}
```

#### GET /api/auth/twitter/callback
Handle Twitter OAuth callback
Query params: `code`, `state`
Response: JWT token in httpOnly cookie

### Trading Endpoints

#### GET /api/portfolio/:userId
Retrieve user portfolio overview
```json
{
  "totalValue": "12543.67",
  "dailyPnL": "+234.56",
  "dailyPnLPercent": "+1.91",
  "positions": 5,
  "availableBalance": "8756.43",
  "totalInvested": "10000.00"
}
```

#### POST /api/trades/execute
Execute manual trade
```json
{
  "userId": 1,
  "tokenSymbol": "PEPE",
  "action": "BUY",
  "amount": 1000,
  "slippage": 0.05
}
```
Response:
```json
{
  "success": true,
  "tradeId": "trade_123456",
  "txHash": "0x...",
  "executedPrice": "0.00000123",
  "executedQuantity": "813008130.08"
}
```

#### GET /api/positions/:userId
Get active positions
```json
[
  {
    "id": 1,
    "tokenSymbol": "PEPE",
    "entryPrice": "0.00000120",
    "currentPrice": "0.00000134",
    "quantity": "833333333.33",
    "unrealizedPnL": "+116.67",
    "unrealizedPnLPercent": "+11.67",
    "stopLoss": "0.00000102",
    "takeProfit": "0.00000156"
  }
]
```

### AI Analysis Endpoints

#### GET /api/ai/analysis/:symbol
Get latest AI analysis for token
```json
{
  "symbol": "PEPE",
  "signal": "BUY",
  "confidence": 0.87,
  "riskLevel": "MEDIUM",
  "reasoning": "Strong social sentiment surge with 340% mention increase. Technical indicators show oversold bounce potential. Market cap at $8.2M provides significant upside.",
  "priceTarget": "0.00000156",
  "stopLoss": "0.00000102",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### GET /api/ai/recommendations
Get AI recommendations for all monitored tokens
```json
[
  {
    "symbol": "PEPE",
    "signal": "BUY",
    "confidence": 0.87,
    "riskLevel": "MEDIUM"
  },
  {
    "symbol": "SHIB",
    "signal": "HOLD", 
    "confidence": 0.65,
    "riskLevel": "LOW"
  }
]
```

### Market Data Endpoints

#### GET /api/market/prices
Real-time price data for all monitored tokens
```json
[
  {
    "symbol": "PEPE",
    "price": "0.00000134",
    "priceUsd": "0.00000134",
    "marketCap": 8200000,
    "volume24h": 2340000,
    "priceChange24h": "+12.34",
    "liquidity": 890000
  }
]
```

#### GET /api/sentiment/:symbol
Social sentiment data for specific token
```json
{
  "symbol": "PEPE",
  "sentimentScore": "0.73",
  "mentionCount": 1247,
  "influencerCount": 23,
  "trendingRank": 3,
  "platforms": {
    "twitter": {
      "mentions": 1089,
      "sentiment": 0.76
    },
    "reddit": {
      "mentions": 158,
      "sentiment": 0.68
    }
  }
}
```

## Deployment Architecture

### Alibaba Cloud Infrastructure

#### ECS Instance Configuration
- **Instance Type**: ecs.t6-c1m2.large (2 vCPU, 4GB RAM)
- **Operating System**: Ubuntu 24.04 LTS
- **Storage**: 40GB Cloud ESSD
- **Network**: VPC with public subnet
- **Security Group**: Ports 80, 443, 22, 3000, 5000

#### Application Deployment
```bash
# Docker containerization
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS backend
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ .
RUN npm run build

FROM python:3.11-alpine AS trading-engine
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY server/python_service.py .
COPY server/trading_engine.py .

# Production image
FROM ubuntu:24.04
RUN apt-get update && apt-get install -y \
    nginx \
    nodejs \
    npm \
    python3 \
    python3-pip \
    redis-server \
    supervisor
    
COPY --from=frontend /app/dist /var/www/html
COPY --from=backend /app /opt/trading-backend
COPY --from=trading-engine /app /opt/trading-engine

# Configuration files
COPY deploy/nginx.conf /etc/nginx/sites-available/default
COPY deploy/supervisor.conf /etc/supervisor/conf.d/trading.conf

EXPOSE 80 443
CMD ["supervisord", "-n"]
```

#### Load Balancer Configuration
```nginx
upstream backend {
    server 127.0.0.1:5000;
    keepalive 32;
}

server {
    listen 80;
    server_name 8trader8panda8.xin www.8trader8panda8.xin;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 8trader8panda8.xin www.8trader8panda8.xin;
    
    ssl_certificate /etc/ssl/certs/trading.crt;
    ssl_certificate_key /etc/ssl/private/trading.key;
    
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Security Implementation

### Authentication & Authorization
- JWT tokens with 1-hour expiration
- Refresh tokens with 30-day expiration
- Rate limiting: 100 requests/minute per IP
- OAuth 2.0 integration with Twitter
- Hardware wallet support via MetaMask

### Infrastructure Security
- VPC with private subnets for databases
- Security groups with minimal required access
- SSH key-based authentication only
- Automated security updates via unattended-upgrades
- SSL/TLS 1.3 encryption for all traffic

### Application Security
- Input validation with Zod schemas
- SQL injection prevention via parameterized queries
- XSS protection with Content Security Policy
- CSRF protection with SameSite cookies
- Sensitive data encryption at rest

### Trading Security
- Multi-signature wallet requirements for large trades
- Transaction confirmation via hardware wallets
- Automated circuit breakers for unusual activity
- Position size limits based on account balance
- Real-time fraud detection algorithms

## Monitoring & Observability

### Health Checks
```bash
# Application health
GET /api/system/health
{
  "status": "healthy",
  "services": {
    "api": "running",
    "database": "connected",
    "redis": "connected", 
    "trading_engine": "active",
    "ai_service": "connected"
  },
  "metrics": {
    "uptime": "72h 34m",
    "memory_usage": "67%",
    "cpu_usage": "23%",
    "active_positions": 42,
    "daily_volume": "$234,567"
  }
}
```

### Performance Metrics
- API response times (p50, p95, p99)
- Database query performance
- WebSocket connection counts
- Trading execution latency
- Error rates by endpoint

### Business Metrics
- Daily active users
- Trading volume and fees
- Portfolio performance
- AI signal accuracy
- User retention rates

## Troubleshooting Guide

### Common Issues

#### Trading Engine Not Starting
```bash
# Check Python service
sudo systemctl status trading-engine
journalctl -u trading-engine -f

# Common fixes
pip install --upgrade nautilus-trader
export PYTHONPATH=/opt/trading-engine:$PYTHONPATH
```

#### WebSocket Connection Failures
```bash
# Check Socket.io server
curl -s http://localhost:5000/socket.io/
netstat -tlnp | grep :5000

# Debug client connections
# Check browser console for connection errors
# Verify CORS settings in backend
```

#### Database Connection Issues
```bash
# PostgreSQL status
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"

# Redis status  
redis-cli ping
sudo systemctl status redis-server
```

#### Deployment Failures
```bash
# Check Alibaba Cloud credentials
aliyun ecs DescribeRegions
aliyun sts GetCallerIdentity

# Verify network access
curl -s https://ecs.ap-southeast-1.aliyuncs.com
```

### Performance Optimization

#### Database Optimization
```sql
-- Optimize slow queries
EXPLAIN ANALYZE SELECT * FROM trades WHERE user_id = 1 ORDER BY executed_at DESC LIMIT 50;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_trades_user_recent ON trades(user_id, executed_at DESC);

-- Update table statistics
ANALYZE trades;
ANALYZE positions;
```

#### API Performance
```bash
# Monitor API response times
curl -w "@curl-format.txt" -s -o /dev/null https://8trader8panda8.xin/api/portfolio/1

# Check Node.js memory usage
node --inspect server.js
# Connect Chrome DevTools to inspect heap usage
```

#### Frontend Optimization
```bash
# Analyze bundle size
npm run build -- --analyze

# Check Core Web Vitals
lighthouse https://8trader8panda8.xin --output=json
```

## Development Workflow

### Local Setup
```bash
# 1. Clone repository
git clone https://github.com/your-username/8trader8panda.git
cd 8trader8panda

# 2. Install dependencies
npm install
pip install -r requirements.txt

# 3. Set up environment
cp .env.example .env
# Edit .env with your API keys

# 4. Initialize database
npm run db:push
npm run db:seed

# 5. Start development servers
npm run dev:frontend  # Port 3000
npm run dev:backend   # Port 5000
python server/trading_engine.py  # Background service
```

### Testing Strategy
```bash
# Unit tests
npm test -- --coverage

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Load testing
npm run test:load

# Security testing
npm audit
npm run test:security
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:integration

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Alibaba Cloud
        run: |
          curl -X POST "${{ secrets.DEPLOY_WEBHOOK }}" \
            -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"ref": "${{ github.sha }}"}'
```

This technical documentation provides the complete foundation for understanding, deploying, and maintaining the 8Trader8Panda trading system.