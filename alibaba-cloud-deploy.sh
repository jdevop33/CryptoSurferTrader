#!/bin/bash

# 8Trader8Panda Production Deployment for Alibaba Cloud ECS
# Execute this in your Alibaba Cloud Shell

echo "🐼 8Trader8Panda Production Deployment Starting..."
echo "📍 Target Server: 8.222.177.208"
echo "🔑 Using Twitter API Free Tier (100 posts/month limit)"

# Set variables
SERVER_IP="8.222.177.208"
APP_NAME="8trader8panda"

# Create deployment directory
mkdir -p /tmp/8trader8panda-deploy
cd /tmp/8trader8panda-deploy

# Create production environment file
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# API Configuration - Twitter Free Tier
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAMLheAAAAAAA0%2BuSeid%2BULvsea4JtiGRiSDSJSI%3DEUifiRBkKG5E2XzMDjRfl76ZC9Ub0wnz4XsNiRVBChTYbJcE3F
TWITTER_CLIENT_SECRET=eL0666PfNYfAK_S7kNIBBjvSVU44O_a5N2In2fQg04Maye1FK7

# Alibaba Cloud AI
ALIBABA_CLOUD_API_KEY=sk-9f4c8b2a1d3e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2

# Alchemy Web3
ALCHEMY_API_KEY=mXj8k9L2mN3oP4qR5sT6uV7wX8yZ9A0bC1dE2fG3hI4jK5lM6nO7pQ8rS9tU0vW1xY2zA3bC4dE5fG6hI7jK8lM9nO0pQ1rS2tU3vW4xY5z

# Database
DATABASE_URL=postgresql://trading_user:trading_password@localhost:5432/trading_db
REDIS_URL=redis://localhost:6379

# Security
SESSION_SECRET=8trader8panda-super-secure-session-key-2024
JWT_SECRET=8trader8panda-jwt-secret-key-2024

# Trading Configuration
MAX_POSITION_SIZE=1000
STOP_LOSS_PERCENT=5
RISK_MANAGEMENT_ENABLED=true
LIVE_TRADING_ENABLED=false
EOF

# Create PM2 ecosystem configuration
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: '8trader8panda',
    script: 'npm',
    args: 'run dev',
    cwd: '/opt/trading-app',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/8trader8panda-error.log',
    out_file: '/var/log/8trader8panda-out.log',
    log_file: '/var/log/8trader8panda.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
};
EOF

# Create Nginx configuration
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name 8trader8panda8.xin 8.222.177.208;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo "📦 Configuration files created"

# Execute deployment on ECS instance
echo "🚀 Deploying to ECS instance..."

ssh -o StrictHostKeyChecking=no root@${SERVER_IP} << 'EOSSH'
set -e

echo "🔧 Starting deployment on ECS instance..."

# Update system packages
yum update -y

# Install Node.js 20
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 20..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Install system dependencies
echo "📦 Installing system dependencies..."
yum install -y redis postgresql postgresql-server nginx git

# Start and enable services
systemctl enable redis postgresql nginx
systemctl start redis

# Initialize PostgreSQL if needed
if [ ! -f /var/lib/pgsql/data/postgresql.conf ]; then
    echo "🗄️  Initializing PostgreSQL..."
    postgresql-setup initdb
fi
systemctl start postgresql

# Create application directory
echo "📁 Setting up application directory..."
mkdir -p /opt/trading-app
cd /opt/trading-app

# Clone repository
if [ ! -d ".git" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/jdevop33/panda_trader.git .
else
    echo "🔄 Updating repository..."
    git pull origin main
fi

# Install dependencies
echo "📦 Installing application dependencies..."
npm install

# Setup database
echo "🗄️  Setting up database..."
sudo -u postgres psql << 'SQLEOF'
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'trading_user') THEN
        CREATE USER trading_user WITH PASSWORD 'trading_password';
    END IF;
END
$$;

SELECT 'CREATE DATABASE trading_db OWNER trading_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'trading_db')\gexec

GRANT ALL PRIVILEGES ON DATABASE trading_db TO trading_user;
\q
SQLEOF

# Build application
echo "🏗️  Building application..."
npm run build

echo "✅ ECS deployment completed!"
echo "🌐 Application will be available at: http://8.222.177.208:3000"
echo "📊 Monitor with: pm2 status"

EOSSH

# Transfer configuration files
echo "📤 Transferring configuration files..."
scp .env.production root@${SERVER_IP}:/opt/trading-app/.env
scp ecosystem.config.js root@${SERVER_IP}:/opt/trading-app/
scp nginx.conf root@${SERVER_IP}:/etc/nginx/conf.d/8trader8panda.conf

# Start the application
echo "🚀 Starting application..."
ssh root@${SERVER_IP} << 'EOSSH'
cd /opt/trading-app

# Start application with PM2
pm2 delete 8trader8panda 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure firewall
firewall-cmd --permanent --add-port=3000/tcp --add-port=80/tcp --add-port=443/tcp 2>/dev/null || true
firewall-cmd --reload 2>/dev/null || true

# Reload Nginx
systemctl reload nginx

echo "✅ Application started successfully!"
echo "🌐 Access your platform: http://8.222.177.208:3000"
echo "📊 Check status: pm2 status"
echo "📋 View logs: pm2 logs 8trader8panda"

EOSSH

echo ""
echo "🎉 8Trader8Panda Production Deployment Complete!"
echo ""
echo "📍 Your trading platform is now live at:"
echo "   🌐 http://8.222.177.208:3000"
echo "   🌐 http://8trader8panda8.xin (after DNS configuration)"
echo ""
echo "📊 Management Commands:"
echo "   ssh root@8.222.177.208 'pm2 status'"
echo "   ssh root@8.222.177.208 'pm2 logs 8trader8panda'"
echo "   ssh root@8.222.177.208 'pm2 restart 8trader8panda'"
echo ""
echo "🔧 Next Steps:"
echo "   1. Point 8trader8panda8.xin DNS to 8.222.177.208"
echo "   2. Configure SSL certificate for HTTPS"
echo "   3. Monitor application performance"
echo ""

# Cleanup
cd /
rm -rf /tmp/8trader8panda-deploy

echo "🧹 Cleanup complete"