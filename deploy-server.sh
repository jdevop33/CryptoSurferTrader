#!/bin/bash

# 8Trader8Panda Production Deployment Script
# For Alibaba Cloud ECS Instance

set -e

echo "🐼 Starting 8Trader8Panda deployment..."

# Create application directory
sudo mkdir -p /opt/trading-app
cd /opt/trading-app

# Install Node.js 20 if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Set up Git if not configured
if [ ! -f ~/.gitconfig ]; then
    git config --global user.name "8trader8panda"
    git config --global user.email "deploy@8trader8panda.com"
fi

# Clone or update repository
if [ ! -d ".git" ]; then
    echo "Cloning repository..."
    git clone https://github.com/jdevop33/panda_trader.git .
else
    echo "Updating repository..."
    git pull origin main
fi

# Install production dependencies
echo "Installing dependencies..."
npm ci --production

# Build the application
echo "Building application..."
npm run build

# Stop existing PM2 process if running
pm2 stop 8trader8panda 2>/dev/null || true
pm2 delete 8trader8panda 2>/dev/null || true

# Start the application with PM2
echo "Starting application..."
pm2 start dist/index.js --name "8trader8panda" --env production

# Configure PM2 startup
pm2 startup systemd -u root --hp /root 2>/dev/null || true
pm2 save

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

echo "✅ Deployment complete!"
echo "🌐 Application running at: http://8.222.177.208:3000"
echo "📊 PM2 status:"
pm2 list
echo "📝 Logs: pm2 logs 8trader8panda"