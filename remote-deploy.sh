#!/bin/bash
set -e

echo "Starting 8Trader8Panda deployment on ECS..."

# Update system
yum update -y

# Install Node.js 20
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Install system dependencies
yum install -y redis postgresql postgresql-server nginx

# Start services
systemctl enable redis postgresql nginx
systemctl start redis
if [ ! -f /var/lib/pgsql/data/postgresql.conf ]; then
    postgresql-setup initdb
fi
systemctl start postgresql

# Setup application directory
mkdir -p /opt/trading-app
cd /opt/trading-app

# Clone or update repository
if [ ! -d ".git" ]; then
    git clone https://github.com/jdevop33/panda_trader.git .
else
    git pull origin main
fi

# Install dependencies
npm install

# Setup database
sudo -u postgres psql << 'SQLEOF'
CREATE USER IF NOT EXISTS trading_user WITH PASSWORD 'trading_password';
CREATE DATABASE IF NOT EXISTS trading_db OWNER trading_user;
GRANT ALL PRIVILEGES ON DATABASE trading_db TO trading_user;
\q
SQLEOF

# Build application
npm run build

# Setup environment
cp .env.production .env

# Configure Nginx
cat > /etc/nginx/conf.d/8trader8panda.conf << 'NGINXEOF'
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
    }
}
NGINXEOF

systemctl reload nginx

# Start application with PM2
pm2 delete 8trader8panda 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure firewall
firewall-cmd --permanent --add-port=3000/tcp --add-port=80/tcp --add-port=443/tcp
firewall-cmd --reload

echo "✅ Deployment completed!"
echo "🌐 Application: http://8.222.177.208:3000"
echo "📊 Status: pm2 status"
